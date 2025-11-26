function getFilialAtual() {
  return sessionStorage.getItem('filial') || 'sao-paulo'
}
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCliente, getClientes, updateCliente } from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../contexts/ToastContext'

export default function Cliente() {
  const navigate = useNavigate();
  const toast = useToast();
  const [abaAtiva, setAbaAtiva] = useState('cadastro'); // 'cadastro' ou 'buscar'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Estados para listagem e edição
  const [clientes, setClientes] = useState([])
  const [todosClientes, setTodosClientes] = useState([]) // Lista completa para sugestões
  const [loadingList, setLoadingList] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [searchCliente, setSearchCliente] = useState('')
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState(null)

  // Carrega todos os clientes ao abrir a aba de busca
  useEffect(() => {
    if (abaAtiva === 'buscar' && todosClientes.length === 0) {
      getClientes().then(setTodosClientes).catch(err => {
        // Silent error
      });
    }
  }, [abaAtiva]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (showClienteSuggestions && !event.target.closest('input[type="text"]')) {
        setShowClienteSuggestions(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showClienteSuggestions]);

  // Lista de clientes filtrados para o dropdown de sugestões
  const filteredClientesSuggestions = todosClientes.filter(c => {
    if (!searchCliente) return false;
    const searchLower = searchCliente.toLowerCase();
    const nomeMatch = c.nome?.toLowerCase().includes(searchLower);
    const cpfMatch = c.cpfCnpj?.replace(/\D/g, '').includes(searchCliente.replace(/\D/g, ''));
    return nomeMatch || cpfMatch;
  }).slice(0, 10); // Limita a 10 sugestões

  function handleSelectClienteSuggestion(cliente) {
    setClienteSelecionado(cliente);
    setSearchCliente(cliente.nome);
    setShowClienteSuggestions(false);
    setClientes([cliente]); // Mostra apenas o cliente selecionado na lista
  }

  async function handlePesquisarCliente() {
    if (!searchCliente.trim()) {
      toast.error('Digite algo para pesquisar');
      return;
    }
    
    setLoadingList(true);
    try {
      const data = await getClientes(searchCliente.trim());
      setClientes(data);
      if (data.length === 0) {
        toast.info('Nenhum cliente encontrado');
      } else {
        toast.success(`${data.length} cliente(s) encontrado(s)`);
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao pesquisar clientes');
    } finally {
      setLoadingList(false);
    }
  }

  function handleLimparPesquisa() {
    setSearchCliente('');
    setClientes([]);
    setClienteSelecionado(null);
    setShowClienteSuggestions(false);
  }

  // Busca CEP usando ViaCEP
  async function buscarCep(cepValue) {
    const cepLimpo = cepValue.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        toast.error('CEP não encontrado.');
        return
      }

      if (clienteEditando) {
        setClienteEditando(prev => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }));
      } else {
        setLogradouro(data.logradouro || '')
        setBairro(data.bairro || '')
        setCidade(data.localidade || '')
        setEstado(data.uf || '')
      }
      toast.success('CEP encontrado!');
    } catch (err) {
      toast.error('Erro ao buscar CEP.');
    } finally {
      setLoadingCep(false)
    }
  }

  function handleEditarCliente(cliente) {
    setClienteEditando({
      ...cliente,
      endereco: cliente.endereco || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      cep: cliente.cep || ''
    });
    setShowEditModal(true);
  }

  async function handleSalvarEdicao() {
    if (!clienteEditando.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    try {
      setSavingEdit(true);
      await updateCliente(clienteEditando._id, clienteEditando);
      toast.success('Cliente atualizado!');
      setShowEditModal(false);
      setClienteEditando(null);
      // Recarrega a pesquisa se houver termo de busca
      if (searchCliente.trim()) {
        handlePesquisarCliente();
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const normalizedTelefone = telefone ? telefone.replace(/\D/g, '') : ''
      const normalizedCpf = cpf ? cpf.replace(/\D/g, '') : ''
      const enderecoCompleto = `${logradouro}${numero ? ', ' + numero : ''}${complemento ? ', ' + complemento : ''} - ${bairro} - ${cidade}/${estado}`
      const filial = getFilialAtual()
      
      const payload = { 
        nome, 
        email, 
        telefone: normalizedTelefone, 
        cpf: normalizedCpf, 
        dataNascimento, 
        endereco: enderecoCompleto, 
        filial,
        consentimentoLGPD: true, // Consentimento implícito ao cadastrar
        dataConsentimento: new Date()
      }
      
      // Cria o cliente
      const clienteResponse = await createCliente(payload)
      
      // Registra o consentimento LGPD automaticamente
      try {
        await fetch('http://localhost:4000/api/lgpd/consentimento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteId: clienteResponse._id,
            cpf: normalizedCpf,
            nomeCliente: nome,
            consentimentoColetaDados: true,
            consentimentoCompartilhamento: false,
            consentimentoMarketing: false,
            filial
          })
        })
      } catch (err) {
        // Não bloqueia o cadastro se falhar o registro de consentimento
      }
      
      toast.success('Cliente criado com sucesso!');
      setNome(''); setEmail(''); setTelefone(''); setCpf(''); setDataNascimento(''); setCep(''); setLogradouro(''); setNumero(''); setComplemento(''); setBairro(''); setCidade(''); setEstado('')
      
      // Redireciona para cadastro de veículos após 1 segundo
      setTimeout(() => {
        navigate('/veiculo');
      }, 1000);
    } catch (err) {
      toast.error(err.message || 'Erro ao criar cliente');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h2 style={{margin: 0}}>
            Gerenciamento de Clientes
          </h2>
          <p style={{margin: '8px 0 0 0', color: '#666', fontSize: 14}}>
            Cadastre novos clientes ou busque para editar
          </p>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e0e0e0' }}>
        <button
          type="button"
          onClick={() => setAbaAtiva('cadastro')}
          style={{
            padding: '12px 24px',
            background: abaAtiva === 'cadastro' ? '#2196f3' : 'transparent',
            color: abaAtiva === 'cadastro' ? '#fff' : '#666',
            border: 'none',
            borderBottom: abaAtiva === 'cadastro' ? '3px solid #1976d2' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 15,
            transition: 'all 0.2s'
          }}
        >
          Cadastrar Cliente
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva('buscar')}
          style={{
            padding: '12px 24px',
            background: abaAtiva === 'buscar' ? '#2196f3' : 'transparent',
            color: abaAtiva === 'buscar' ? '#fff' : '#666',
            border: 'none',
            borderBottom: abaAtiva === 'buscar' ? '3px solid #1976d2' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 15,
            transition: 'all 0.2s'
          }}
        >
          Buscar e Editar
        </button>
      </div>

      {/* Conteúdo da Aba de Cadastro */}
      {abaAtiva === 'cadastro' && (
        <div>
      {/* Aviso LGPD */}
      <div style={{
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #90caf9',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '1.3rem' }}>🔒</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1565c0', fontWeight: 600 }}>
            Proteção de Dados (LGPD)
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#555', lineHeight: '1.4' }}>
            Os dados coletados serão protegidos com criptografia e utilizados apenas para gestão de serviços. 
            O cliente pode solicitar acesso, correção ou exclusão a qualquer momento.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0', marginBottom: 16}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 16, color: '#333'}}>
            Informações Básicas
          </h3>
          <div style={{marginBottom: 12}}>
            <label>Nome Completo <span style={{color: '#c00'}}>*</span></label>
            <input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Nome completo do cliente" style={{width: '100%'}} />
          </div>
          <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
            <div style={{flex: 1}}>
              <label>CPF</label>
              <input
                value={cpf}
                onChange={e => {
                  let raw = e.target.value.replace(/\D/g, '')
                  let formatted = raw
                  if (raw.length > 3) formatted = `${raw.slice(0,3)}.${raw.slice(3)}`
                  if (raw.length > 6) formatted = `${raw.slice(0,3)}.${raw.slice(3,6)}.${raw.slice(6)}`
                  if (raw.length > 9) formatted = `${raw.slice(0,3)}.${raw.slice(3,6)}.${raw.slice(6,9)}-${raw.slice(9,11)}`
                  setCpf(formatted)
                }}
                maxLength={14}
                placeholder="000.000.000-00"
                style={{width: '100%'}}
              />
            </div>
            <div style={{flex: 1}}>
              <label>Data de Nascimento</label>
              <input
                type="date"
                value={dataNascimento}
                onChange={e => setDataNascimento(e.target.value)}
                style={{width: '100%'}}
              />
            </div>
            <div style={{flex: 1}}>
              <label>Telefone</label>
              <input
                value={telefone}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '')
                  let formatted = raw
                  if (raw.length <= 2) formatted = raw
                  else if (raw.length <= 6) formatted = `(${raw.slice(0,2)}) ${raw.slice(2)}`
                  else if (raw.length <= 10) formatted = `(${raw.slice(0,2)}) ${raw.slice(2,6)}-${raw.slice(6)}`
                  else formatted = `(${raw.slice(0,2)}) ${raw.slice(2,3)} ${raw.slice(3,7)}-${raw.slice(7,11)}`
                  setTelefone(formatted)
                }}
                placeholder="(00) 0 0000-0000"
                style={{width: '100%'}}
              />
            </div>
          </div>
          <div style={{marginBottom: 12}}>
            <label>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@exemplo.com" style={{width: '100%'}} />
          </div>
        </div>

        <div style={{background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0', marginBottom: 16}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 16, color: '#333'}}>
            Endereço
          </h3>
          <div style={{marginBottom: 12}}>
            <label>CEP</label>
            <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
              <input
                value={cep}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '')
                  let formatted = raw
                  if (raw.length > 5) formatted = `${raw.slice(0,5)}-${raw.slice(5,8)}`
                  setCep(formatted)
                }}
                onBlur={e => buscarCep(e.target.value)}
                maxLength={9}
                placeholder="00000-000"
                style={{flex: 1}}
              />
              {loadingCep && (
                <span style={{fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 6}}>
                  <div style={{
                    width: 12,
                    height: 12,
                    border: '2px solid #66666640',
                    borderTop: '2px solid #666666',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Buscando...
                </span>
              )}
            </div>
          </div>
          <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
            <div style={{flex: 3}}>
              <label>Logradouro <span style={{color: '#c00'}}>*</span></label>
              <input value={logradouro} onChange={e => setLogradouro(e.target.value)} placeholder="Rua, avenida..." style={{width: '100%'}} required />
            </div>
            <div style={{flex: 1}}>
              <label>Número <span style={{color: '#c00'}}>*</span></label>
              <input value={numero} onChange={e => setNumero(e.target.value)} placeholder="123" style={{width: '100%'}} required />
            </div>
          </div>
          <div style={{marginBottom: 12}}>
            <label>Complemento</label>
            <input value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Apto, sala..." style={{width: '100%'}} />
          </div>
          <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
            <div style={{flex: 2}}>
              <label>Bairro <span style={{color: '#c00'}}>*</span></label>
              <input value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" style={{width: '100%'}} required />
            </div>
            <div style={{flex: 2}}>
              <label>Cidade <span style={{color: '#c00'}}>*</span></label>
              <input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" style={{width: '100%'}} required />
            </div>
            <div style={{flex: 1}}>
              <label>Estado <span style={{color: '#c00'}}>*</span></label>
              <input value={estado} onChange={e => setEstado(e.target.value)} placeholder="SP" maxLength={2} style={{width: '100%', textTransform: 'uppercase'}} required />
            </div>
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
                border: '2px solid #ffffff60',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }} />
            )}
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </form>
        </div>
      )}

      {/* Conteúdo da Aba de Busca */}
      {abaAtiva === 'buscar' && (
      <div>
        <h3 style={{ marginBottom: 16, marginTop: 0 }}>Pesquisar Cliente</h3>
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <input
            type="text"
            placeholder="Digite o nome ou CPF do cliente..."
            value={searchCliente}
            onChange={e => {
              setSearchCliente(e.target.value);
              setShowClienteSuggestions(true);
              if (!e.target.value) {
                setClienteSelecionado(null);
                setClientes([]);
              }
            }}
            onFocus={() => setShowClienteSuggestions(true)}
            onKeyDown={e => e.key === 'Enter' && handlePesquisarCliente()}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 15
            }}
          />
          {showClienteSuggestions && searchCliente && filteredClientesSuggestions.length > 0 && (
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
              {filteredClientesSuggestions.map(c => (
                <div
                  key={c._id}
                  onClick={() => handleSelectClienteSuggestion(c)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f5f5f5',
                    background: clienteSelecionado?._id === c._id ? '#f5f5f5' : '#fff',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background = clienteSelecionado?._id === c._id ? '#f5f5f5' : '#fff'}
                >
                  <div style={{fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 3}}>{c.nome}</div>
                  <div style={{fontSize: 12, color: '#888'}}>
                    CPF: {c.cpfCnpj || 'Não informado'}
                    {c.telefone && ` • ${c.telefone}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={handleLimparPesquisa}
            style={{
              background: '#757575',
              color: '#fff',
              fontWeight: 600,
              padding: '10px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Limpar
          </button>
        </div>

        {loadingList ? (
          <LoadingSpinner text="Pesquisando clientes..." />
        ) : clientes.length === 0 ? (
          <div className="muted">
            {searchCliente ? 'Nenhum cliente encontrado com esse critério.' : 'Digite algo no campo de pesquisa para buscar clientes.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Nome</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>CPF/CNPJ</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Telefone</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Email</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{c.nome}</td>
                  <td style={{ padding: 8 }}>{c.cpfCnpj || '—'}</td>
                  <td style={{ padding: 8 }}>{c.telefone || '—'}</td>
                  <td style={{ padding: 8 }}>{c.email || '—'}</td>
                  <td style={{ padding: 8 }}>
                    <button
                      onClick={() => handleEditarCliente(c)}
                      style={{
                        background: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        borderRadius: 4,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 16
                      }}
                      title="Editar cliente"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && clienteEditando && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, overflow: 'auto' }} onClick={() => setShowEditModal(false)}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 500, maxWidth: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.2)', margin: '20px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Editar Cliente</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Nome</label>
              <input 
                type="text" 
                value={clienteEditando.nome} 
                onChange={e => setClienteEditando(prev => ({ ...prev, nome: e.target.value }))}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>CPF/CNPJ</label>
              <input 
                type="text" 
                value={clienteEditando.cpfCnpj || ''} 
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length <= 11) {
                    v = v.replace(/(\d{3})(\d)/, '$1.$2');
                    v = v.replace(/(\d{3})(\d)/, '$1.$2');
                    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                  } else {
                    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                    v = v.replace(/(\d{4})(\d)/, '$1-$2');
                  }
                  setClienteEditando(prev => ({ ...prev, cpfCnpj: v }));
                }}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                maxLength={18}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Telefone</label>
                <input 
                  type="text" 
                  value={clienteEditando.telefone || ''} 
                  onChange={e => setClienteEditando(prev => ({ ...prev, telefone: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Email</label>
                <input 
                  type="email" 
                  value={clienteEditando.email || ''} 
                  onChange={e => setClienteEditando(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Endereço</label>
              <input 
                type="text" 
                value={clienteEditando.endereco || ''} 
                onChange={e => setClienteEditando(prev => ({ ...prev, endereco: e.target.value }))}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Cidade</label>
                <input 
                  type="text" 
                  value={clienteEditando.bairro || ''} 
                  onChange={e => setClienteEditando(prev => ({ ...prev, bairro: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>CEP</label>
                <input 
                  type="text" 
                  value={clienteEditando.cep || ''} 
                  onChange={e => setClienteEditando(prev => ({ ...prev, cep: e.target.value }))}
                  onBlur={e => buscarCep(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                  placeholder="00000-000"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Cidade</label>
                <input 
                  type="text" 
                  value={clienteEditando.cidade || ''} 
                  onChange={e => setClienteEditando(prev => ({ ...prev, cidade: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Estado</label>
                <input 
                  type="text" 
                  value={clienteEditando.estado || ''} 
                  onChange={e => setClienteEditando(prev => ({ ...prev, estado: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                  maxLength={2}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={handleSalvarEdicao} 
                disabled={savingEdit}
                style={{ flex: 1, background: '#4caf50', color: '#fff', fontWeight: 600, padding: '10px 16px', borderRadius: 6, border: 'none', cursor: savingEdit ? 'not-allowed' : 'pointer' }}
              >
                {savingEdit ? 'Salvando...' : 'Salvar'}
              </button>
              <button 
                onClick={() => setShowEditModal(false)} 
                disabled={savingEdit}
                style={{ flex: 1, background: '#757575', color: '#fff', fontWeight: 600, padding: '10px 16px', borderRadius: 6, border: 'none', cursor: savingEdit ? 'not-allowed' : 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
