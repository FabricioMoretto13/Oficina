function getFilialAtual() {
  return sessionStorage.getItem('filial') || 'sao-paulo'
}
import React, { useEffect, useState } from 'react'
import { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'
import { getOS, createChecklist, getChecklists } from '../api'
import { createChecklistForm } from '../api'
import { gerarChecklistPDF } from '../utils/pdfUtils'
import { useToast } from '../contexts/ToastContext'

// Resize image file in the browser to reduce upload size. Returns a Blob (or the original file if no resize needed).
async function resizeImageFile(file, maxWidth = 1280, quality = 0.7) {
  if (!file || !file.type.startsWith('image/')) return file
  try {
    // use createImageBitmap where available (faster and avoids FileReader data URL)
    const bitmap = await createImageBitmap(file)
    const ratio = bitmap.width / bitmap.height
    let width = bitmap.width
    let height = bitmap.height
    if (width > maxWidth) {
      width = maxWidth
      height = Math.round(maxWidth / ratio)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, width, height)
    return await new Promise((resolve) => canvas.toBlob(resolve, file.type, quality))
  } catch (err) {
    // fallback: return original file
    return file
  }
}

export default function Checklist() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [entregaChecks, setEntregaChecks] = useState([
    { label: 'Foi colocado combustível?', checked: false },
    { label: 'Verificação do protetor de cárter', checked: false },
    { label: 'Aperto de rodas (Torquímetro)', checked: false },
    { label: 'Lavagem realizada', checked: false },
    { label: 'Teste de rodagem realizado', checked: false },
    { label: 'Luzes / alertas no painel ok', checked: false },
    { label: 'Reset de manutenção / óleo', checked: false },
    { label: 'Adesivo de troca de óleo colado', checked: false }
  ]);
  const [funcionarioEntrega, setFuncionarioEntrega] = useState('');
  const [entregaErro, setEntregaErro] = useState('');

  function handleEntregaCheck(idx) {
    setEntregaChecks(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  }
  function validarEntrega() {
    if (entregaChecks.some(item => !item.checked)) {
      setEntregaErro('Todos os itens devem ser marcados.');
      return false;
    }
    if (!funcionarioEntrega.trim()) {
      setEntregaErro('Informe o nome do funcionário que entregou o carro.');
      return false;
    }
    setEntregaErro('');
    return true;
  }
  function handleConfirmarEntrega() {
    if (validarEntrega()) {
      setShowEntregaModal(false);
      // Aqui você pode disparar a ação de encerrar OS
      alert('Entrega validada! OS encerrada.');
    }
  }
  const [oss, setOss] = useState([])
  const [osId, setOsId] = useState('')
  // Itens obrigatórios fixos
  const obrigatoriosFixos = [
    { nome: 'Foto frente do automóvel', ok: false, observacao: '', fotos: [], photoFiles: [] },
    { nome: 'Foto traseira do automóvel', ok: false, observacao: '', fotos: [], photoFiles: [] },
    { nome: 'Foto lateral direita', ok: false, observacao: '', fotos: [], photoFiles: [] },
    { nome: 'Foto lateral esquerda', ok: false, observacao: '', fotos: [], photoFiles: [] },
    { nome: 'Foto painel do automóvel', ok: false, observacao: '', fotos: [], photoFiles: [] },
    { nome: 'Foto interior do automóvel', ok: false, observacao: '', fotos: [], photoFiles: [] },
    { nome: 'Foto cofre do motor', ok: false, observacao: '', fotos: [], photoFiles: [] }
  ];
  const [itens, setItens] = useState([...obrigatoriosFixos]);
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({}) // { [itemIdx]: [percent,...] }
  const [pdfReady, setPdfReady] = useState(false)
  const [lastChecklistData, setLastChecklistData] = useState(null)
  
  // Novos campos condicionais
  const [possuiVazamento, setPossuiVazamento] = useState('nao')
  const [vazamentoDetalhes, setVazamentoDetalhes] = useState({
    arCondicionado: false,
    cambio: false,
    direcao: false,
    freio: false,
    motor: false,
    radiador: false,
    suspensao: false
  })
  const [luzesManutencao, setLuzesManutencao] = useState('nao')
  const [luzesDetalhes, setLuzesDetalhes] = useState({
    abs: false,
    airbag: false,
    bateria: false,
    combustivel: false,
    epc: false,
    esc: false,
    freio: false,
    injecao: false,
    motor: false,
    oleo: false,
    pressaoPneus: false,
    temperatura: false,
    outros: false
  })
  const [luzesOutrosTexto, setLuzesOutrosTexto] = useState('')

  useEffect(() => { 
    getOS().then(osList => {
      // Filtrar apenas OSs abertas
      const osAbertas = osList.filter(os => os.status !== 'encerrada')
      setOss(osAbertas)
    }).catch(err => toast.error(err.message || 'Erro ao carregar ordens de serviço')) 
  }, [])

  // Se veio de uma OS recém-criada, selecionar automaticamente
  useEffect(() => {
    if (location.state?.osId) {
      setOsId(location.state.osId)
    }
  }, [location.state])

  function updateItem(idx, patch) {
    setItens(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  function handleFilesChange(idx, files) {
    const fileArray = Array.from(files || [])
    // store File objects temporarily in state under photoFiles for upload
    updateItem(idx, { photoFiles: fileArray })
  }

  async function handleSubmit(e) {
    e.preventDefault(); 
    setLoading(true)
    try {
      // Nomes obrigatórios para fotos
      const obrigatorios = [
        'Foto frente do automóvel',
        'Foto traseira do automóvel',
        'Foto lateral direita',
        'Foto lateral esquerda',
        'Foto painel do automóvel',
        'Foto interior do automóvel',
        'Foto cofre do motor'
      ];
      // Verifica se todos os itens obrigatórios têm pelo menos uma foto
      for (const nome of obrigatorios) {
        const idx = itens.findIndex(it => it.nome === nome);
        if (idx === -1) throw new Error(`Checklist deve conter o item obrigatório: ${nome}`);
        const it = itens[idx];
        const temFoto = (it.photoFiles && it.photoFiles.length > 0) || (it.fotos && it.fotos.length > 0);
        if (!temFoto) throw new Error(`O item "${nome}" precisa de pelo menos uma foto.`);
      }

      // Build FormData with resized files and items metadata
      const filesToSend = [] // flat list of { originalname, blob }
      const itemsMeta = []
      for (let i = 0; i < itens.length; i++) {
        const it = itens[i]
        const fotos = it.fotos ? [...it.fotos] : []
        if (it.photoFiles && it.photoFiles.length) {
          // process files in parallel for resizing
          const processed = await Promise.all(it.photoFiles.map(async (file, j) => {
            const resizedBlob = await resizeImageFile(file, 1280, 0.75)
            const blobOrFile = resizedBlob instanceof Blob ? resizedBlob : file
            // enforce 2MB limit
            const MAX_BYTES = 2 * 1024 * 1024
            if (blobOrFile.size > MAX_BYTES) throw new Error(`Arquivo "${file.name}" é maior que 2MB após compactação.`)
            setUploadProgress(prev => {
              const copy = { ...prev }
              copy[i] = copy[i] || []
              copy[i].push(0)
              return copy
            })
            filesToSend.push({ originalname: file.name, blob: blobOrFile })
            fotos.push(file.name)
            return true
          }))
        }
        itemsMeta.push({ nome: it.nome, ok: it.ok, observacao: it.observacao, fotos })
      }

      // prepare payload for multipart upload
      const filial = getFilialAtual()
      const verificacoesAdicionais = {
        possuiVazamento,
        vazamentoDetalhes: possuiVazamento === 'sim' ? vazamentoDetalhes : {},
        luzesManutencao,
        luzesDetalhes: luzesManutencao === 'sim' ? luzesDetalhes : {},
        luzesOutrosTexto: luzesManutencao === 'sim' && luzesDetalhes.outros ? luzesOutrosTexto : ''
      }
      const fdPayload = { osId, items: itemsMeta, files: filesToSend, filial, verificacoesAdicionais }
      await createChecklistForm(fdPayload)
      toast.success('Checklist salvo com sucesso!')

      // Aguarda um momento e redireciona para histórico (aba dentro de OS)
      setTimeout(() => {
        navigate('/os?aba=historico')
      }, 1500)
    } catch (err) {
      console.error('Checklist save error', err)
      toast.error(err.message || 'Erro ao salvar checklist')
    } finally { 
      setLoading(false) 
    }
  }


  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h2 style={{margin: 0}}>
            Checklist de Vistoria
          </h2>
          <p style={{margin: '8px 0 0 0', color: '#666', fontSize: 14}}>
            Documente o estado do veículo com fotos e observações
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0', marginBottom: 20}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 16, color: '#333'}}>
            Ordem de Serviço
          </h3>
          <div style={{marginBottom: 0}}>
            <label>Selecione a OS <span style={{color: '#c00'}}>*</span></label>
            <select value={osId} onChange={e => setOsId(e.target.value)} required style={{width: '100%'}}>
              <option value="">-- selecione uma ordem de serviço --</option>
              {oss.map(o => (
                <option key={o._id} value={o._id}>
                  {`OS #${o.numero || o._id.slice(-6)} - ${o.clienteId?.nome || ''} - ${o.veiculoId?.placa || ''} ${o.veiculoId?.modelo || ''}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0', marginBottom: 20}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 16, color: '#333'}}>
            Fotos Obrigatórias
          </h3>
       
          {/* Itens obrigatórios fixos */}
          {itens.map((it, idx) => (
            <div key={idx} style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12
            }}>
              <div style={{display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center'}}>
                <label style={{fontWeight:700, fontSize: '1.1rem', marginBottom: 0, marginRight: 8, alignSelf: 'center'}}>{it.nome} <span style={{color:'#c00'}}>*</span></label>
              </div>
              <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
                <div style={{flex: 1}}>
                  <label>Observação</label>
                  <textarea rows={4} value={it.observacao} onChange={e => updateItem(idx, { observacao: e.target.value })} placeholder="Observações detalhadas..." style={{width: '100%'}} />
                </div>
                <div style={{flex: 1}}>
                  <label>Fotos <span style={{color:'#c00'}}>*</span></label>
                  <label className="file-upload-label">
                    <input type="file" accept="image/*" multiple onChange={e => handleFilesChange(idx, e.target.files)} style={{ display: 'none' }} />
                    <span className="file-upload-btn">Escolher arquivos</span>
                  </label>
                  <div className="photo-previews">
                    {(it.photoFiles || []).map((f, fi) => (
                      <div key={fi} style={{ position: 'relative' }}>
                        <img src={URL.createObjectURL(f)} alt={f.name} />
                        {uploadProgress[idx] && uploadProgress[idx][fi] != null ? (
                          <div style={{ position: 'absolute', left: 6, bottom: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                            {uploadProgress[idx][fi]}%
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {(it.fotos || []).map((url, uidx) => (
                      <img key={uidx} src={url} alt={`foto-${uidx}`} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Não permite remover os itens obrigatórios */}
            </div>
          ))}
        </div>

        {/* Novos campos condicionais - Layout em Grid */}
        <div style={{background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0', marginBottom: 20}}>
          <h3 style={{margin: '0 0 20px 0', fontSize: 16, color: '#333', borderBottom: '2px solid #e0e0e0', paddingBottom: 12}}>
            Verificações Adicionais
          </h3>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20}}>
            {/* Possui algum vazamento? */}
            <div style={{background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e0e0e0'}}>
              <label style={{fontWeight: 600, display: 'block', marginBottom: 12, fontSize: 15, color: '#222'}}>Possui algum vazamento?</label>
              <div style={{display: 'flex', gap: 12, marginBottom: possuiVazamento === 'sim' ? 16 : 0}}>
                <label style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 14px', background: possuiVazamento === 'nao' ? '#f5f5f5' : 'transparent', border: '1px solid', borderColor: possuiVazamento === 'nao' ? '#999' : '#e0e0e0', borderRadius: 6, transition: 'all 0.2s', flex: 1, justifyContent: 'center'}}>
                  <input 
                    type="radio" 
                    name="vazamento"                        
                    value="nao" 
                    checked={possuiVazamento === 'nao'}
                    onChange={(e) => setPossuiVazamento(e.target.value)}
                    style={{width: 16, height: 16, cursor: 'pointer', marginBottom: 2}}
                  />
                  <span style={{fontWeight: 500, fontSize: 14}}>Não</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 14px', background: possuiVazamento === 'sim' ? '#f5f5f5' : 'transparent', border: '1px solid', borderColor: possuiVazamento === 'sim' ? '#999' : '#e0e0e0', borderRadius: 6, transition: 'all 0.2s', flex: 1, justifyContent: 'center'}}>
                  <input 
                    type="radio" 
                    name="vazamento" 
                    value="sim" 
                    checked={possuiVazamento === 'sim'}
                    onChange={(e) => setPossuiVazamento(e.target.value)}
                    style={{width: 16, height: 16, cursor: 'pointer', marginBottom: 2}}
                  />
                  <span style={{fontWeight: 500, fontSize: 14}}>Sim</span>
                </label>
              </div>

              {possuiVazamento === 'sim' && (
                <div style={{borderTop: '1px solid #e0e0e0', paddingTop: 14}}>
                  <p style={{margin: '0 0 12px 0', fontWeight: 600, fontSize: 14, color: '#666'}}>Tipos de vazamento:</p>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8}}>
                    {[
                      { key: 'arCondicionado', label: 'Ar Condicionado' },
                      { key: 'cambio', label: 'Câmbio' },
                      { key: 'direcao', label: 'Direção' },
                      { key: 'freio', label: 'Freio' },
                      { key: 'motor', label: 'Motor' },
                      { key: 'radiador', label: 'Radiador' },
                      { key: 'suspensao', label: 'Suspensão' }
                    ].map(item => (
                      <label key={item.key} style={{display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 4, transition: 'background 0.15s', background: vazamentoDetalhes[item.key] ? '#f5f5f5' : 'transparent'}} onMouseEnter={e => !vazamentoDetalhes[item.key] && (e.currentTarget.style.background = '#fafafa')} onMouseLeave={e => !vazamentoDetalhes[item.key] && (e.currentTarget.style.background = 'transparent')}>
                        <input 
                          type="checkbox" 
                          checked={vazamentoDetalhes[item.key]}
                          onChange={(e) => setVazamentoDetalhes(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          style={{width: 18, height: 18, cursor: 'pointer', flexShrink: 0, marginBottom: 2}}
                        />
                        <span style={{fontSize: 14, color: '#333'}}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Luzes de manutenção no painel */}
            <div style={{background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e0e0e0'}}>
              <label style={{fontWeight: 600, display: 'block', marginBottom: 12, fontSize: 15, color: '#222'}}>Luzes de manutenção no painel</label>
              <div style={{display: 'flex', gap: 12, marginBottom: luzesManutencao === 'sim' ? 16 : 0}}>
                <label style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 14px', background: luzesManutencao === 'nao' ? '#f5f5f5' : 'transparent', border: '1px solid', borderColor: luzesManutencao === 'nao' ? '#999' : '#e0e0e0', borderRadius: 6, transition: 'all 0.2s', flex: 1, justifyContent: 'center'}}>
                  <input 
                    type="radio" 
                    name="luzes" 
                    value="nao" 
                    checked={luzesManutencao === 'nao'}
                    onChange={(e) => setLuzesManutencao(e.target.value)}
                    style={{width: 16, height: 16, cursor: 'pointer', marginBottom: 2}}
                  />
                  <span style={{fontWeight: 500, fontSize: 14}}>Não</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 14px', background: luzesManutencao === 'sim' ? '#f5f5f5' : 'transparent', border: '1px solid', borderColor: luzesManutencao === 'sim' ? '#999' : '#e0e0e0', borderRadius: 6, transition: 'all 0.2s', flex: 1, justifyContent: 'center'}}>
                  <input 
                    type="radio" 
                    name="luzes" 
                    value="sim" 
                    checked={luzesManutencao === 'sim'}
                    onChange={(e) => setLuzesManutencao(e.target.value)}
                    style={{width: 16, height: 16, cursor: 'pointer', marginBottom: 2}}
                  />
                  <span style={{fontWeight: 500, fontSize: 14}}>Sim</span>
                </label>
              </div>

              {luzesManutencao === 'sim' && (
                <div style={{borderTop: '1px solid #e0e0e0', paddingTop: 14}}>
                  <p style={{margin: '0 0 12px 0', fontWeight: 600, fontSize: 14, color: '#666'}}>Luzes acesas:</p>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4}}>
                    {[
                      { key: 'abs', label: 'ABS' },
                      { key: 'airbag', label: 'Airbag' },
                      { key: 'bateria', label: 'Bateria' },
                      { key: 'combustivel', label: 'Combustível' },
                      { key: 'epc', label: 'EPC' },
                      { key: 'esc', label: 'ESC' },
                      { key: 'freio', label: 'Freio' },
                      { key: 'injecao', label: 'Injeção' },
                      { key: 'motor', label: 'Motor (Check Engine)' },
                      { key: 'oleo', label: 'Óleo' },
                      { key: 'pressaoPneus', label: 'Pressão de Pneus' },
                      { key: 'temperatura', label: 'Temperatura' },
                      { key: 'outros', label: 'Outros' }
                    ].map(item => (
                      <label key={item.key} style={{display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 4, transition: 'background 0.15s', background: luzesDetalhes[item.key] ? '#f5f5f5' : 'transparent'}} onMouseEnter={e => !luzesDetalhes[item.key] && (e.currentTarget.style.background = '#fafafa')} onMouseLeave={e => !luzesDetalhes[item.key] && (e.currentTarget.style.background = 'transparent')}>
                        <input 
                          type="checkbox" 
                          checked={luzesDetalhes[item.key]}
                          onChange={(e) => setLuzesDetalhes(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          style={{width: 18, height: 18, cursor: 'pointer', flexShrink: 0, marginBottom: 2}}
                        />
                        <span style={{fontSize: 14, color: '#333'}}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  {luzesDetalhes.outros && (
                    <div style={{marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0'}}>
                      <label style={{display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#333'}}>Especifique:</label>
                      <input 
                        type="text" 
                        value={luzesOutrosTexto}
                        onChange={(e) => setLuzesOutrosTexto(e.target.value)}
                        placeholder="Outras luzes..."
                        style={{width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #d0d0d0', borderRadius: 6, outline: 'none', transition: 'border-color 0.2s'}}
                        onFocus={e => e.target.style.borderColor = '#999'}
                        onBlur={e => e.target.style.borderColor = '#d0d0d0'}
                      />
                    </div>
                  )}
                </div>
              )}
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
                border: '2px solid #22222260',
                borderTop: '2px solid #222222',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }} />
            )}
            {loading ? 'Salvando...' : 'Salvar Checklist'}
          </button>
        </div>
      </form>
      {/* Botão de envio por WhatsApp removido */}
    </div>
  )
}
