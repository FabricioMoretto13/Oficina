function getFilialAtual() {
  return sessionStorage.getItem('filial') || 'sao-paulo'
}
import React, { useEffect, useState, useRef } from 'react'
import { getClientes, getVeiculos, createOS, getOS, updateOS } from '../api'
import { useToast } from '../contexts/ToastContext'
import { useNavigate, useLocation } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import Historico from './Historico'

export default function OSPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [abaAtiva, setAbaAtiva] = useState('criar') // 'criar' ou 'historico'
  const [clientes, setClientes] = useState([])
  const [veiculos, setVeiculos] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [veiculoId, setVeiculoId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchCliente, setSearchCliente] = useState('')
  const [searchVeiculo, setSearchVeiculo] = useState('')
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false)
  const [showVeiculoSuggestions, setShowVeiculoSuggestions] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdOS, setCreatedOS] = useState(null)
  const [osImageUrl, setOsImageUrl] = useState(null)
  const canvasRef = useRef(null)
  const [osAbertas, setOsAbertas] = useState([])
  const [editandoId, setEditandoId] = useState(null)
  const [descricaoEdit, setDescricaoEdit] = useState('')
  const [mostrarAbertas, setMostrarAbertas] = useState(false)

  useEffect(() => {
    getClientes().then(setClientes).catch(err => toast.error(err.message || 'Erro ao carregar clientes'))
    getVeiculos().then(setVeiculos).catch(err => toast.error(err.message || 'Erro ao carregar veículos'))
    carregarOSAbertas()
  }, [])

  // Verifica se há parâmetro 'aba' na URL para abrir a aba correta
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const aba = params.get('aba');
    if (aba === 'historico') {
      setAbaAtiva('historico');
    }
  }, [location.search])

  async function carregarOSAbertas() {
    try {
      const todas = await getOS()
      const abertas = todas.filter(os => os.status !== 'encerrada')
      setOsAbertas(abertas)
    } catch (err) {
      console.error('Erro ao carregar OS abertas:', err)
    }
  }

  function iniciarEdicao(os) {
    setEditandoId(os._id)
    setDescricaoEdit(os.descricao || '')
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setDescricaoEdit('')
  }

  async function salvarEdicao(osId) {
    try {
      await updateOS(osId, { descricao: descricaoEdit })
      toast.success('OS atualizada com sucesso!')
      setEditandoId(null)
      setDescricaoEdit('')
      carregarOSAbertas()
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar OS')
    }
  }

  useEffect(() => {
    // if client selected, keep veiculo selection valid
    if (clienteId && veiculos.length) {
      const exists = veiculos.some(v => v.clienteId && v.clienteId._id ? v.clienteId._id === clienteId : v.clienteId === clienteId)
      if (!exists) setVeiculoId('')
    }
  }, [clienteId, veiculos])

  const filteredVeiculos = clienteId ? veiculos.filter(v => (v.clienteId && (v.clienteId._id || v.clienteId)) && ((v.clienteId._id || v.clienteId) === clienteId)) : veiculos

  // Filtrar clientes pela busca
  const filteredClientes = searchCliente.trim()
    ? clientes.filter(c => {
        const search = searchCliente.toLowerCase().trim();
        const nome = (c.nome || '').toLowerCase().trim();
        const cpf = (c.cpf || '').replace(/\D/g, '');
        const cpfCnpj = (c.cpfCnpj || '').replace(/\D/g, '');
        const searchNum = search.replace(/\D/g, '');
        
        // Se a busca contém apenas números, buscar por CPF/CNPJ
        if (searchNum && searchNum === search) {
          return cpf.includes(searchNum) || cpfCnpj.includes(searchNum);
        }
        
        // Se a busca contém letras, buscar por nome
        return nome.includes(search);
      })
    : [];

  // Filtrar veículos pela busca
  const searchedVeiculos = filteredVeiculos.filter(v => {
    if (!searchVeiculo) return true
    const search = searchVeiculo.toLowerCase()
    return (
      v.placa?.toLowerCase().includes(search) ||
      v.modelo?.toLowerCase().includes(search) ||
      v.montadora?.toLowerCase().includes(search) ||
      v.marca?.toLowerCase().includes(search)
    )
  })

  // Selecionar cliente
  function handleSelectCliente(cliente) {
    setClienteId(cliente._id)
    setSearchCliente(cliente.nome)
    setShowClienteSuggestions(false)
  }

  // Selecionar veículo
  function handleSelectVeiculo(veiculo) {
    setVeiculoId(veiculo._id)
    setSearchVeiculo(`${veiculo.placa} - ${veiculo.montadora || veiculo.marca || ''} ${veiculo.modelo}`)
    setShowVeiculoSuggestions(false)
  }

  // Obter nome do cliente selecionado
  const clienteSelecionado = clientes.find(c => c._id === clienteId)

  // Gerar imagem da OS
  async function generateOSImage(osData) {
    const canvas = canvasRef.current
    if (!canvas) return null

    const ctx = canvas.getContext('2d')
    canvas.width = 800
    canvas.height = 1000

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Header
    ctx.fillStyle = '#39FF14'
    ctx.fillRect(0, 0, canvas.width, 120)

    // Título
    ctx.fillStyle = '#222222'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('ORDEM DE SERVIÇO', canvas.width / 2, 75)

    // Número da OS
    ctx.fillStyle = '#222222'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`OS #${osData.numero}`, 40, 180)

    // Data
    const dataFormatada = new Date(osData.criadoEm).toLocaleDateString('pt-BR')
    ctx.font = '20px Arial'
    ctx.fillStyle = '#666666'
    ctx.fillText(`Data: ${dataFormatada}`, 40, 220)

    // Cliente
    const cliente = clientes.find(c => c._id === osData.clienteId)
    const veiculo = veiculos.find(v => v._id === osData.veiculoId)

    ctx.fillStyle = '#222222'
    ctx.font = 'bold 24px Arial'
    ctx.fillText('Cliente:', 40, 280)
    ctx.font = '20px Arial'
    ctx.fillStyle = '#333333'
    ctx.fillText(cliente?.nome || 'Não informado', 40, 310)

    // Veículo
    ctx.fillStyle = '#222222'
    ctx.font = 'bold 24px Arial'
    ctx.fillText('Veículo:', 40, 370)
    ctx.font = '20px Arial'
    ctx.fillStyle = '#333333'
    const veiculoInfo = veiculo ? `${veiculo.placa} - ${veiculo.montadora || veiculo.marca || ''} ${veiculo.modelo}` : 'Não informado'
    ctx.fillText(veiculoInfo, 40, 400)

    // Descrição
    ctx.fillStyle = '#222222'
    ctx.font = 'bold 24px Arial'
    ctx.fillText('Serviços:', 40, 460)
    ctx.font = '18px Arial'
    ctx.fillStyle = '#333333'
    
    // Quebrar texto da descrição em múltiplas linhas
    const maxWidth = canvas.width - 80
    const words = osData.descricao.split(' ')
    let line = ''
    let y = 490
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, 40, y)
        line = words[i] + ' '
        y += 25
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, 40, y)

    // Status
    ctx.fillStyle = '#222222'
    ctx.font = 'bold 24px Arial'
    ctx.fillText('Status:', 40, y + 60)
    ctx.fillStyle = '#4CAF50'
    ctx.font = '20px Arial'
    ctx.fillText('ABERTA', 40, y + 90)

    // Footer
    ctx.fillStyle = '#e0e0e0'
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80)
    ctx.fillStyle = '#666666'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Alien Engine Tunning', canvas.width / 2, canvas.height - 35)

    return canvas.toDataURL('image/png')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (!descricao || !descricao.trim()) throw new Error('Descrição é obrigatória')
      const filial = getFilialAtual()
      
      // Buscar dados completos antes de criar
      const cliente = clientes.find(c => c._id === clienteId)
      const veiculo = veiculos.find(v => v._id === veiculoId)
      
      const newOS = await createOS({ clienteId, veiculoId, descricao: descricao.trim(), filial })
      
      // Adicionar dados completos ao objeto da OS
      const veiculoMarca = veiculo?.marca || veiculo?.montadora || ''
      const veiculoModelo = veiculo?.modelo || ''
      const veiculoPlaca = veiculo?.placa || ''
      const veiculoTexto = veiculo ? `${veiculoMarca} ${veiculoModelo} - ${veiculoPlaca}`.trim().replace(/\s+/g, ' ') : 'N/A'
      
      const osCompleta = {
        ...newOS,
        clienteNome: cliente?.nome || 'N/A',
        veiculoInfo: veiculoTexto,
        descricaoSalva: descricao.trim()
      }
      
      setCreatedOS(osCompleta)
      setShowSuccessModal(true)
      
      // Gerar imagem da OS em background
      generateOSImage(newOS).then(imageUrl => {
        setOsImageUrl(imageUrl)
      }).catch(err => {
        console.error('Erro ao gerar imagem:', err)
      })
      
      toast.success('Ordem de serviço criada com sucesso!')
      setClienteId(''); setVeiculoId(''); setDescricao(''); setSearchCliente(''); setSearchVeiculo('')
      await carregarOSAbertas()
    } catch (err) {
      toast.error(err.message || 'Erro ao criar ordem de serviço')
    } finally { 
      setLoading(false) 
    }
  }

  function handleCloseModal() {
    setShowSuccessModal(false)
    setCreatedOS(null)
    setOsImageUrl(null)
  }

  function handleGoToChecklist() {
    if (createdOS) {
      navigate('/checklist', { state: { osId: createdOS._id } })
    }
  }

  function handleDownloadImage() {
    if (osImageUrl) {
      const link = document.createElement('a')
      link.download = `OS-${createdOS.numero}.png`
      link.href = osImageUrl
      link.click()
    }
  }

  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h2 style={{margin: 0}}>
            Ordens de Serviço
          </h2>
          <p style={{margin: '8px 0 0 0', color: '#666', fontSize: 14}}>
            Gerencie ordens de serviço e visualize o histórico
          </p>
        </div>
        <div style={{display: 'flex', gap: 8}}>
          <button 
            type="button" 
            onClick={() => window.location.href = '/cliente'}
            style={{padding: '8px 16px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13}}
          >
            + Cliente
          </button>
          <button 
            type="button" 
            onClick={() => window.location.href = '/veiculo'}
            style={{padding: '8px 16px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13}}
          >
            + Veículo
          </button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e0e0e0' }}>
        <button
          type="button"
          onClick={() => setAbaAtiva('criar')}
          style={{
            padding: '12px 24px',
            background: abaAtiva === 'criar' ? '#2196f3' : 'transparent',
            color: abaAtiva === 'criar' ? '#fff' : '#666',
            border: 'none',
            borderBottom: abaAtiva === 'criar' ? '3px solid #1976d2' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 15,
            transition: 'all 0.2s'
          }}
        >
          Criar OS
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva('historico')}
          style={{
            padding: '12px 24px',
            background: abaAtiva === 'historico' ? '#2196f3' : 'transparent',
            color: abaAtiva === 'historico' ? '#fff' : '#666',
            border: 'none',
            borderBottom: abaAtiva === 'historico' ? '3px solid #1976d2' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 15,
            transition: 'all 0.2s'
          }}
        >
          Histórico
        </button>
      </div>

      {/* Conteúdo da Aba Criar OS */}
      {abaAtiva === 'criar' && (
        <div>
      <form onSubmit={handleSubmit}>
        <div style={{background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0', marginBottom: 16}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 16, color: '#333'}}>
            Seleção
          </h3>
          <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
            <div style={{flex: 1, position: 'relative'}}>
            <label>Cliente <span style={{ color: '#c00' }}>*</span></label>
            <input 
              type="text" 
              placeholder="Buscar cliente por nome ou CPF/CNPJ..."
              value={searchCliente}
              onChange={e => {
                setSearchCliente(e.target.value)
                setShowClienteSuggestions(true)
                if (!e.target.value) setClienteId('')
              }}
              onFocus={() => setShowClienteSuggestions(true)}
              style={{width: '100%'}}
              required
            />
            {showClienteSuggestions && searchCliente && filteredClientes.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                maxHeight: 300,
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}>
                {filteredClientes.map(c => (
                  <div
                    key={c._id}
                    onClick={() => handleSelectCliente(c)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f5f5f5',
                      background: clienteId === c._id ? '#f5f5f5' : '#fff',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.background = clienteId === c._id ? '#f5f5f5' : '#fff'}
                  >
                    <div style={{fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 3}}>{c.nome}</div>
                    <div style={{fontSize: 12, color: '#888'}}>
                      CPF: {c.cpf || c.cpfCnpj || 'Não informado'}
                      {c.telefone && ` • ${c.telefone}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
            <div style={{flex: 1}}>
              <label>Veículo <span style={{ color: '#c00' }}>*</span></label>
            <select 
              value={veiculoId} 
              onChange={e => setVeiculoId(e.target.value)} 
              required 
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                background: clienteId ? '#fff' : '#f9f9f9',
                color: clienteId ? '#333' : '#999',
                cursor: clienteId ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              disabled={!clienteId}
              onFocus={e => e.target.style.borderColor = '#999'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            >
              <option value="">-- selecione um veículo --</option>
              {filteredVeiculos.map(v => (
                <option key={v._id} value={v._id}>
                  {v.placa} - {v.montadora || v.marca || ''} {v.modelo}
                </option>
              ))}
            </select>
              {clienteId && filteredVeiculos.length > 0 && (
                <p style={{fontSize: 12, color: '#888', marginTop: 6, fontWeight: 500}}>
                  {filteredVeiculos.length} veículo(s) disponível(is)
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={{background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0', marginBottom: 16}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 16, color: '#333'}}>
            Descrição do Serviço
          </h3>
          <div style={{marginBottom: 0}}>
            <label>Descrição dos Serviços a Realizar <span style={{ color: '#c00' }}>*</span></label>
            <textarea 
              value={descricao} 
              onChange={e => setDescricao(e.target.value)} 
              rows={5} 
              required 
              placeholder="Descreva detalhadamente os serviços que serão realizados..."
              style={{width: '100%'}} 
            />
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'center',
              background: loading ? '#bdbdbd' : '#39FF14',
              color: '#fff',
              minWidth: 180,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 700,
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = '#2ecc11')}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = '#39FF14')}
          >
            {loading && (
              <div style={{
                width: 14,
                height: 14,
                border: '2px solid #22222260',
                borderTop: '2px solid #222222',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }} />
            )}
            {loading ? 'Criando...' : 'Criar Ordem de Serviço'}
          </button>
        </div>
      </form>

      {/* Canvas oculto para gerar a imagem */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Modal de Sucesso */}
      {showSuccessModal && createdOS && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            border: '2px solid #e5e7eb'
          }}>
            {/* Header */}
            <div style={{
              background: '#f9fafb',
              padding: '20px 25px',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#6b7280', 
                fontSize: 20,
                fontWeight: 700,
                textAlign: 'center'
              }}>
                Ordem de Serviço #{createdOS.numero}
              </h2>
            </div>

            {/* Body */}
            <div style={{ padding: '25px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 4 }}>Status:</span>
                  <span style={{ color: '#10b981', fontSize: 14, fontWeight: 700 }}>
                    {createdOS.status === 'aberta' ? 'Aberta' : createdOS.status}
                  </span>
                </div>

                <div style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 4 }}>Cliente:</span>
                  <span style={{ color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>
                    {createdOS.clienteNome}
                  </span>
                </div>

                <div style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 4 }}>Veículo:</span>
                  <span style={{ color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>
                    {createdOS.veiculoInfo}
                  </span>
                </div>

                <div style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 4 }}>Data:</span>
                  <span style={{ color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>
                    {new Date(createdOS.criadoEm).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {createdOS.descricaoSalva && (
                  <div style={{ padding: '12px 0' }}>
                    <span style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 8 }}>
                      Descrição:
                    </span>
                    <p style={{
                      margin: 0,
                      color: '#1a1a1a',
                      fontSize: 14,
                      lineHeight: 1.6,
                      background: '#f9fafb',
                      padding: '12px',
                      borderRadius: 8,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {createdOS.descricaoSalva}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleGoToChecklist}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#39FF14',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 15,
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={e => e.target.style.background = '#2ecc11'}
                  onMouseLeave={e => e.target.style.background = '#39FF14'}
                >
                  Ir para Checklist
                </button>
                <button
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 15,
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={e => e.target.style.background = '#e5e7eb'}
                  onMouseLeave={e => e.target.style.background = '#f3f4f6'}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção de OS Abertas */}
      {osAbertas.length > 0 && (
        <div style={{ marginTop: 40, paddingTop: 30, borderTop: '2px solid #e0e0e0' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>
                Ordens de Serviço Abertas
              </h3>
            </div>
            <button
              onClick={() => setMostrarAbertas(!mostrarAbertas)}
              style={{
                padding: '8px 16px',
                background: mostrarAbertas ? '#f44336' : '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {mostrarAbertas ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {mostrarAbertas && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {osAbertas.map((os) => {
                const editando = editandoId === os._id;
                const clienteNome = os.clienteId?.nome || 'Cliente não encontrado';
                const veiculoInfo = os.veiculoId 
                  ? `${os.veiculoId.marca || ''} ${os.veiculoId.modelo || ''} - ${os.veiculoId.placa || ''}`.trim()
                  : 'Veículo não encontrado';

                return (
                  <div
                    key={os._id}
                    style={{
                      background: os.status === 'pagamento-pendente' ? '#fff3e0' : '#fff',
                      border: os.status === 'pagamento-pendente' ? '2px solid #ff9800' : '1px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #e0e0e0'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#333' }}>
                          OS #{os.numero}
                        </h4>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{
                            background: os.status === 'aberta' ? '#e3f2fd' : '#fff3e0',
                            color: os.status === 'aberta' ? '#1976d2' : '#f57c00',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}>
                            {os.status === 'aberta' ? 'Aberta' : 'Pagamento Pendente'}
                          </span>
                          <span style={{ color: '#999', fontSize: '0.85rem' }}>
                            {new Date(os.criadoEm).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      {!editando && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => iniciarEdicao(os)}
                            style={{
                              background: '#2196f3',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#1976d2'}
                            onMouseLeave={e => e.currentTarget.style.background = '#2196f3'}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => navigate('/checklist', { state: { osId: os._id } })}
                            style={{
                              background: '#39FF14',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#2ecc11'}
                            onMouseLeave={e => e.currentTarget.style.background = '#39FF14'}
                          >
                            Checklist
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '16px',
                      marginBottom: editando ? '16px' : '0'
                    }}>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '0.8rem', 
                          color: '#666',
                          fontWeight: 600,
                          marginBottom: '4px'
                        }}>
                          Cliente
                        </label>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#333' }}>
                          {clienteNome}
                        </p>
                      </div>

                      <div>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '0.8rem', 
                          color: '#666',
                          fontWeight: 600,
                          marginBottom: '4px'
                        }}>
                          Veículo
                        </label>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#333' }}>
                          {veiculoInfo}
                        </p>
                      </div>
                    </div>

                    {!editando && (
                      <div style={{ marginTop: '16px' }}>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '0.8rem', 
                          color: '#666',
                          fontWeight: 700,
                          marginBottom: '8px'
                        }}>
                          <strong>Descrição</strong>
                        </label>
                        <p style={{
                          margin: 0,
                          fontSize: '0.9rem',
                          color: '#555',
                          background: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '6px',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {os.descricao || 'Sem descrição'}
                        </p>
                      </div>
                    )}

                    {editando && (
                      <div style={{ marginTop: '16px' }}>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '0.8rem', 
                          color: '#666',
                          fontWeight: 700,
                          marginBottom: '8px'
                        }}>
                          <strong>Editar Descrição</strong>
                        </label>
                        <textarea
                          value={descricaoEdit}
                          onChange={e => setDescricaoEdit(e.target.value)}
                          rows={5}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '2px solid #2196f3',
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            outline: 'none'
                          }}
                        />

                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          marginTop: '12px',
                          justifyContent: 'flex-end'
                        }}>
                          <button
                            onClick={cancelarEdicao}
                            style={{
                              background: '#fff',
                              color: '#666',
                              border: '1px solid #ddd',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => salvarEdicao(os._id)}
                            style={{
                              background: '#4caf50',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#45a049'}
                            onMouseLeave={e => e.currentTarget.style.background = '#4caf50'}
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
        </div>
      )}

      {/* Conteúdo da Aba Histórico */}
      {abaAtiva === 'historico' && (
        <Historico />
      )}
    </div>
  )
}
