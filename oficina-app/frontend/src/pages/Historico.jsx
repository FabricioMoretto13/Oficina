
import React, { useEffect, useState } from 'react';
import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getOSs, deleteOS, generateOSPdf, getChecklistsByOS, getClientes, getVeiculos, getChecklists, closeOS, sendOSEmail } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';

export default function OrdensServico() {
  const toast = useToast();
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [osParaFinalizar, setOsParaFinalizar] = useState(null);
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
  const [osParaEncerrar, setOsParaEncerrar] = useState(null);
  const [statusPagamento, setStatusPagamento] = useState('pago');

  function handleEntregaCheck(idx) {
    setEntregaChecks(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  }
  function validarEntrega() {
    if (!entregaChecks.some(item => item.checked)) {
      setEntregaErro('Marque pelo menos uma opção de validação.');
      return false;
    }
    if (!funcionarioEntrega.trim()) {
      setEntregaErro('Informe o nome do funcionário que entregou o carro.');
      return false;
    }
    setEntregaErro('');
    return true;
  }
  async function handleConfirmarEntrega() {
    if (validarEntrega() && osParaEncerrar) {
      setShowEntregaModal(false);
      try {
        setClosingOs(prev => ({ ...prev, [osParaEncerrar]: true }));
        const entregaValidacao = {
          checks: entregaChecks.map(item => ({ label: item.label, checked: item.checked })),
          funcionario: funcionarioEntrega.trim()
        };
        const updated = await closeOS(osParaEncerrar, entregaValidacao, statusPagamento);
        // Preserva as referências populadas de clienteId e veiculoId
        setOss(prev => prev.map(p => {
          if (p._id === updated._id) {
            return {
              ...updated,
              clienteId: p.clienteId, // Preserva a referência do cliente
              veiculoId: p.veiculoId   // Preserva a referência do veículo
            };
          }
          return p;
        }));
        if (statusPagamento === 'pago') {
          toast.success('Ordem encerrada com sucesso!');
        } else {
          toast.success('OS marcada como pagamento pendente!');
        }
      } catch (err) {
        toast.error(err.message || 'Erro ao encerrar ordem');
      } finally {
        setClosingOs(prev => ({ ...prev, [osParaEncerrar]: false }));
        setOsParaEncerrar(null);
        setEntregaChecks(entregaChecks.map(item => ({ ...item, checked: false })));
        setFuncionarioEntrega('');
        setStatusPagamento('pago');
      }
    }
  }

  async function handleFinalizarOS() {
    if (osParaFinalizar) {
      setShowFinalizarModal(false);
      try {
        setClosingOs(prev => ({ ...prev, [osParaFinalizar._id]: true }));
        const updated = await closeOS(osParaFinalizar._id, osParaFinalizar.entregaValidacao, 'pago');
        setOss(prev => prev.map(p => {
          if (p._id === updated._id) {
            return {
              ...updated,
              clienteId: p.clienteId,
              veiculoId: p.veiculoId
            };
          }
          return p;
        }));
        toast.success('OS finalizada com sucesso!');
      } catch (err) {
        toast.error(err.message || 'Erro ao finalizar OS');
      } finally {
        setClosingOs(prev => ({ ...prev, [osParaFinalizar._id]: false }));
        setOsParaFinalizar(null);
      }
    }
  }

  const [oss, setOss] = useState([])
  const [clientes, setClientes] = useState([])
  const [veiculos, setVeiculos] = useState([])
  // cache checklists by osId (object map) - agora carrega todos ao abrir
  const [checklistsByOs, setChecklistsByOs] = useState({})
  const [loadingOs, setLoadingOs] = useState({})
  const [closingOs, setClosingOs] = useState({})
  const [sendingEmail, setSendingEmail] = useState({})
  const [clienteId, setClienteId] = useState('')
  const [veiculoId, setVeiculoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const location = useLocation();
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [statusOS, setStatusOS] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [searchVeiculo, setSearchVeiculo] = useState('');
  const [showVeiculoSuggestions, setShowVeiculoSuggestions] = useState(false);


  // resolve relative /uploads/... to backend origin so image requests hit the backend (not the Vite dev server)
  function resolveUploadUrl(url) {
    if (!url) return url
    if (url.startsWith('http')) return url
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const backendOrigin = API_BASE.replace(/\/api\/?$/, '')
    return `${backendOrigin}${url}`
  }

  // robust download helper: fetch the image as blob and trigger a download with a sensible filename
  async function downloadFile(url) {
    try {
      // construct absolute URL when relative path is used
      let absolute = url
      if (!absolute.startsWith('http')) {
        // prefer backend origin so Vite's dev server doesn't respond with index.html
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
        const backendOrigin = API_BASE.replace(/\/api\/?$/, '')
        absolute = `${backendOrigin}${url}`
      }
      const res = await fetch(absolute)
      if (!res.ok) throw new Error(`Falha ao baixar: ${res.status} ${res.statusText}`)
      const contentType = res.headers.get('content-type') || ''
      const blob = await res.blob()
      const blobType = blob.type || contentType || ''
      // if server returned HTML (error page), show helpful message and open the URL for inspection
      if (blobType.includes('html') || blobType.includes('text')) {
        console.error('downloadFile: server returned HTML/text instead of image', { url: absolute, contentType })
        toast.error('Erro: o servidor retornou HTML em vez da imagem. Verifique a URL ou as permissões de arquivo.')
        // open in new tab for debugging
        window.open(absolute, '_blank')
        return
      }

      let filename = decodeURIComponent((new URL(absolute, window.location.origin)).pathname.split('/').pop() || 'image')
      // if filename has no extension, try to append one from the blob MIME type
      if (!/\.[a-zA-Z0-9]{1,5}$/.test(filename)) {
        const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }
        const ext = map[blobType] || ''
        filename = filename + ext
      }
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('downloadFile error', err)
      toast.error(err.message || 'Erro ao baixar arquivo')
    }
  }

  async function load(params) {
    setLoading(true)
    try {
      const list = await getOSs(params)
      setOss(list)
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar ordens');
    } finally { setLoading(false) }
  }

  useEffect(() => {
    // load reference data
    getClientes().then(setClientes).catch(err => toast.error(err.message || 'Erro ao carregar clientes'))
    getVeiculos().then(setVeiculos).catch(err => toast.error(err.message || 'Erro ao carregar veículos'))
    // verifica se há filtro de status na URL
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const osParams = status === 'aberta' ? { status: 'aberta' } : status === 'encerrada' ? { status: 'encerrada' } : undefined;
    load(osParams);
    // carrega todos os checklists ao abrir
    getChecklists().then(list => {
      // agrupa por osId
      const map = {};
      list.forEach(cl => {
        if (cl.osId) {
          map[cl.osId] = map[cl.osId] || [];
          map[cl.osId].push(cl);
        }
      });
      setChecklistsByOs(map);
    }).catch(err => toast.error(err.message || 'Erro ao carregar checklists'));
  }, [location.search])

  function handleSearch(e) {
    e.preventDefault()
    load({ 
      clienteId: clienteId || undefined, 
      veiculoId: veiculoId || undefined,
      dataInicial: dataInicial || undefined,
      dataFinal: dataFinal || undefined,
      status: statusOS || undefined
    })
  }

  function handleLimparFiltros() {
    setClienteId('');
    setSearchCliente('');
    setVeiculoId('');
    setDataInicial('');
    setDataFinal('');
    setStatusOS('');
    load();
  }



  // Enviar checklist por E-mail
  async function handleEnviarEmail(osId) {
    const os = oss.find(o => o._id === osId);
    if (!os) return;
    
    const cliente = os.clienteId;
    if (!cliente || !cliente.email) {
      toast.error('Cliente não possui e-mail cadastrado');
      return;
    }

    const checklists = checklistsByOs[osId] || [];
    if (checklists.length === 0) {
      toast.error('Esta OS não possui checklists');
      return;
    }

    try {
      setSendingEmail(prev => ({ ...prev, [osId]: true }));
      await sendOSEmail(osId, true); // true = incluir termo de aceite
      toast.success(`E-mail enviado com sucesso para ${cliente.email}!`);
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
      toast.error(err.message || 'Erro ao enviar e-mail');
    } finally {
      setSendingEmail(prev => ({ ...prev, [osId]: false }));
    }
  }

  // Enviar checklist por WhatsApp
  function handleEnviarWhatsapp(osId) {
    const os = oss.find(o => o._id === osId);
    if (!os) return;
    
    const cliente = os.clienteId;
    if (!cliente || !cliente.telefone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    const checklists = checklistsByOs[osId] || [];
    if (checklists.length === 0) {
      toast.error('Esta OS não possui checklists');
      return;
    }

    const veiculo = os.veiculoId;
    const checklist = checklists[0];

    // Monta mensagem do checklist
    let mensagem = `*ALIEN ENGINE TUNNING - CHECKLIST DE VISTORIA*\n\n`;
    mensagem += `📋 *OS #${os.numero || osId.slice(-6)}*\n`;
    mensagem += `👤 *Cliente:* ${cliente.nome}\n`;
    mensagem += `🚗 *Veículo:* ${veiculo?.placa || ''} - ${veiculo?.montadora || ''} ${veiculo?.modelo || ''}\n`;
    mensagem += `📅 *Data:* ${new Date(checklist.criadoEm).toLocaleDateString('pt-BR')}\n\n`;
    mensagem += `*ITENS VERIFICADOS:*\n\n`;

    checklist.itens.forEach((item, idx) => {
      const status = item.ok ? '✅' : '❌';
      mensagem += `${idx + 1}. ${status} *${item.nome}*\n`;
      if (item.observacao) {
        mensagem += `   _Obs: ${item.observacao}_\n`;
      }
      mensagem += `\n`;
    });

    // Adiciona verificações adicionais se existirem
    if (checklist.verificacoesAdicionais) {
      const va = checklist.verificacoesAdicionais;
      mensagem += `\n*VERIFICAÇÕES ADICIONAIS:*\n\n`;
      
      if (va.possuiVazamento) {
        mensagem += `🔧 *Vazamento:* ${va.possuiVazamento === 'sim' ? '⚠️ SIM' : '✅ NÃO'}\n`;
        if (va.possuiVazamento === 'sim' && va.vazamentoDetalhes) {
          const tipos = [];
          if (va.vazamentoDetalhes.arCondicionado) tipos.push('Ar Condicionado');
          if (va.vazamentoDetalhes.cambio) tipos.push('Câmbio');
          if (va.vazamentoDetalhes.direcao) tipos.push('Direção');
          if (va.vazamentoDetalhes.freio) tipos.push('Freio');
          if (va.vazamentoDetalhes.motor) tipos.push('Motor');
          if (va.vazamentoDetalhes.radiador) tipos.push('Radiador');
          if (va.vazamentoDetalhes.suspensao) tipos.push('Suspensão');
          if (tipos.length > 0) {
            mensagem += `   _Tipos: ${tipos.join(', ')}_\n`;
          }
        }
      }
      
      if (va.luzesManutencao) {
        mensagem += `💡 *Luzes no painel:* ${va.luzesManutencao === 'sim' ? '⚠️ SIM' : '✅ NÃO'}\n`;
        if (va.luzesManutencao === 'sim' && va.luzesDetalhes) {
          const luzes = [];
          if (va.luzesDetalhes.abs) luzes.push('ABS');
          if (va.luzesDetalhes.airbag) luzes.push('Airbag');
          if (va.luzesDetalhes.bateria) luzes.push('Bateria');
          if (va.luzesDetalhes.combustivel) luzes.push('Combustível');
          if (va.luzesDetalhes.epc) luzes.push('EPC');
          if (va.luzesDetalhes.esc) luzes.push('ESC');
          if (va.luzesDetalhes.freio) luzes.push('Freio');
          if (va.luzesDetalhes.injecao) luzes.push('Injeção');
          if (va.luzesDetalhes.motor) luzes.push('Motor');
          if (va.luzesDetalhes.oleo) luzes.push('Óleo');
          if (va.luzesDetalhes.pressaoPneus) luzes.push('Pressão dos Pneus');
          if (va.luzesDetalhes.temperatura) luzes.push('Temperatura');
          if (va.luzesDetalhes.outros) {
            luzes.push(va.luzesOutrosTexto ? `Outros (${va.luzesOutrosTexto})` : 'Outros');
          }
          if (luzes.length > 0) {
            mensagem += `   _Luzes: ${luzes.join(', ')}_\n`;
          }
        }
      }
    }

    // Adiciona status de pagamento se a OS estiver encerrada
    if (os.status === 'encerrada' || os.status === 'pagamento-pendente') {
      mensagem += `\n*STATUS DO PAGAMENTO:*\n`;
      if (os.statusPagamento === 'pago') {
        mensagem += `*PAGO* - Serviço quitado\n`;
      } else {
        mensagem += `*PENDENTE* - Aguardando pagamento\n`;
      }
    }

    mensagem += `\n---\n_Qualquer dúvida, estamos à disposição!_`;

    // Limpa e formata telefone (remove caracteres não numéricos)
    const telefone = cliente.telefone.replace(/\D/g, '');
    // Adiciona DDI 55 se não tiver
    const telefoneFormatado = telefone.startsWith('55') ? telefone : '55' + telefone;

    // Coleta todas as fotos do checklist
    const API_BASE = 'http://localhost:4000';
    const fotos = [];
    checklist.itens.forEach((item) => {
      if (item.fotos && item.fotos.length > 0) {
        item.fotos.forEach((foto) => {
          const fotoUrl = foto.startsWith('http') ? foto : `${API_BASE}${foto}`;
          fotos.push({ nome: item.nome, url: fotoUrl });
        });
      }
    });

    // Cria URL do WhatsApp com texto
    const mensagemEncoded = encodeURIComponent(mensagem);
    const whatsappUrl = `https://wa.me/${telefoneFormatado}?text=${mensagemEncoded}`;

    // Abre WhatsApp com mensagem de texto
    window.open(whatsappUrl, '_blank');
    
    // Se houver fotos, abre WhatsApp Web para cada foto após um pequeno delay
    if (fotos.length > 0) {
      toast.success(`WhatsApp aberto! Serão abertas ${fotos.length} foto(s) para envio.`);
      
      // Aguarda 2 segundos e depois abre as fotos
      setTimeout(() => {
        fotos.forEach((foto, idx) => {
          setTimeout(() => {
            // Cria mensagem com a foto
            const msgFoto = encodeURIComponent(`📸 ${foto.nome}\n${foto.url}`);
            const whatsappFotoUrl = `https://wa.me/${telefoneFormatado}?text=${msgFoto}`;
            window.open(whatsappFotoUrl, '_blank');
          }, idx * 1000); // 1 segundo de intervalo entre cada foto
        });
      }, 2000);
    } else {
      toast.success('WhatsApp aberto! Envie a mensagem para o cliente.');
    }
  }

  // Filtrar clientes por nome ou CPF apenas quando há texto digitado
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

  function handleSelectCliente(cliente) {
    setClienteId(cliente._id);
    setSearchCliente(cliente.nome);
    setShowClienteSuggestions(false);
  }

  const ossFiltradas = oss;

  // expandir só mostra/oculta, não precisa mais carregar checklists
  function toggleExpand(id) {
    const willExpand = !expanded[id]
    setExpanded(prev => ({ ...prev, [id]: willExpand }))
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { setPreviewVisible(false); setPreviewUrl(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Adiciona função para exportar relatório Excel
  function handleExportExcel() {
    // Exporta todas as ordens de serviço exibidas
    const data = oss.map(o => ({
      Cliente: o.clienteId?.nome || '',
      Veiculo: o.veiculoId?.placa || '',
      Descricao: o.descricao || '',
      Status: o.status,
      Criado: o.criadoEm ? new Date(o.criadoEm).toLocaleString() : '',
      Checklists: (checklistsByOs[o._id]?.length || 0)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OrdensServico');
    XLSX.writeFile(wb, 'relatorio-ordens-servico.xlsx');
  }

  return (
    <>
      <div className="card">
        <h2>Ordens de Serviço</h2>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button 
          type="button" 
          onClick={handleExportExcel} 
          style={{ minWidth: 180, background: '#39FF14', color: '#fff', fontWeight: 600, transition: 'background 0.2s ease' }}
          onMouseEnter={e => e.currentTarget.style.background = '#2ecc11'}
          onMouseLeave={e => e.currentTarget.style.background = '#39FF14'}
        >
          Gerar Relatório
        </button>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 16, background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0' }}>
        <h3 style={{margin: '0 0 16px 0', fontSize: 16, color: '#333'}}>Filtros de Pesquisa</h3>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12}}>
          <div style={{position: 'relative'}}>
            <label style={{fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4}}>Cliente (Nome ou CPF)</label>
            <input
              type="text"
              value={searchCliente}
              onChange={e => {
                setSearchCliente(e.target.value);
                setClienteId('');
                setShowClienteSuggestions(true);
              }}
              onFocus={() => setShowClienteSuggestions(true)}
              onBlur={() => setTimeout(() => setShowClienteSuggestions(false), 200)}
              placeholder="Digite nome ou CPF..."
              style={{width: '100%'}}
            />
            {showClienteSuggestions && filteredClientes.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 6,
                maxHeight: 200,
                overflowY: 'auto',
                zIndex: 100,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                marginTop: 2
              }}>
                {filteredClientes.slice(0, 10).map(c => (
                  <div
                    key={c._id}
                    onClick={() => handleSelectCliente(c)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{fontWeight: 600, fontSize: 14}}>{c.nome}</div>
                    <div style={{fontSize: 12, color: '#666'}}>{c.cpf || c.cpfCnpj || ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4}}>Veículo</label>
            <select value={veiculoId} onChange={e => setVeiculoId(e.target.value)} style={{width: '100%'}}>
              <option value="">Todos</option>
              {veiculos.map(v => <option key={v._id} value={v._id}>{v.placa} — {v.modelo || v.montadora}</option>)}
            </select>
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4}}>Status</label>
            <select value={statusOS} onChange={e => setStatusOS(e.target.value)} style={{width: '100%'}}>
              <option value="">Todas</option>
              <option value="aberta">Abertas</option>
              <option value="encerrada">Encerradas</option>
              <option value="pagamento-pendente">Pagamento Pendente</option>
            </select>
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4}}>Data Inicial</label>
            <input 
              type="date" 
              value={dataInicial} 
              onChange={e => setDataInicial(e.target.value)}
              style={{width: '100%'}}
            />
          </div>

          <div>
            <label style={{fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4}}>Data Final</label>
            <input 
              type="date" 
              value={dataFinal} 
              onChange={e => setDataFinal(e.target.value)}
              style={{width: '100%'}}
            />
          </div>
        </div>

        <div style={{display: 'flex', gap: 12}}>
          <button type="submit" disabled={loading} style={{flex: 1, background: '#2196f3', color: '#fff', fontWeight: 600}}>
            {loading ? 'Buscando...' : 'Pesquisar'}
          </button>
          <button type="button" onClick={handleLimparFiltros} style={{flex: 1, background: '#757575', color: '#fff', fontWeight: 600}}>
            Limpar Filtros
          </button>
        </div>
      </form>

      <div>
        {loading ? (
          <LoadingSpinner text="Carregando ordens de serviço..." />
        ) : ossFiltradas.length === 0 ? <div className="muted">Nenhuma ordem encontrada.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Cliente</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Veículo</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Descrição Serviços</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Criado</th>
                 <th style={{ textAlign: 'left', padding: 8 }}>Entregue em</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Ações</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Checklists</th>
              </tr>
            </thead>
            <tbody>
              {ossFiltradas.map(o => {
                const cls = checklistsByOs[o._id] || []
                const entregaValidacao = o.entregaValidacao;
                return (
                  <React.Fragment key={o._id}>
                    <tr style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: 8 }}>{o.clienteId?.nome || '—'}</td>
                      <td style={{ padding: 8 }}>{o.veiculoId?.placa || '—'}</td>
                      <td style={{ padding: 8 }}>{o.descricao || '—'}</td>
                      <td style={{ padding: 8 }}>
                        {o.status === 'pagamento-pendente' ? (
                          <span style={{color:'#f44336',fontWeight:700,fontSize:'0.95rem'}}>Pagamento Pendente</span>
                        ) : o.status === 'encerrada' ? (
                          <span style={{color:'#4caf50',fontWeight:700,fontSize:'0.95rem'}}>Encerrada</span>
                        ) : (
                          <span style={{color:'#2196f3',fontWeight:700,fontSize:'0.95rem'}}>Aberta</span>
                        )}
                      </td>
                      <td style={{ padding: 8 }}>{new Date(o.criadoEm).toLocaleString()}</td>
                       <td style={{ padding: 8 }}>{o.encerradoEm ? new Date(o.encerradoEm).toLocaleString() : '—'}</td>
                      <td style={{ padding: 8 }}>
                        {(o.status !== 'encerrada' && o.status !== 'pagamento-pendente') && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button 
                              type="button" 
                              disabled={!!closingOs[o._id]} 
                              onClick={() => { 
                                setShowEntregaModal(true); 
                                setOsParaEncerrar(o._id); 
                              }}
                              style={{
                                background: closingOs[o._id] ? '#bdbdbd' : '#ff9800', 
                                color: '#fff', 
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                justifyContent: 'center'
                              }}
                            >
                              {closingOs[o._id] ? (
                                <>
                                  <div style={{
                                    width: 14,
                                    height: 14,
                                    border: '2px solid #ffffff60',
                                    borderTop: '2px solid #ffffff',
                                    borderRadius: '50%',
                                    animation: 'spin 0.6s linear infinite'
                                  }} />
                                  Encerrando...
                                </>
                              ) : (
                                <>Encerrar OS</>
                              )}
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleEnviarWhatsapp(o._id)}
                              style={{
                                background: '#25D366', 
                                color: '#fff', 
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                justifyContent: 'center',
                                fontSize: 13,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#1DA851'}
                              onMouseLeave={(e) => e.target.style.background = '#25D366'}
                            >
                              Enviar WhatsApp
                            </button>
                            <button 
                              type="button" 
                              disabled={!!sendingEmail[o._id]}
                              onClick={() => handleEnviarEmail(o._id)}
                              style={{
                                background: sendingEmail[o._id] ? '#bdbdbd' : '#1976d2', 
                                color: '#fff', 
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                justifyContent: 'center',
                                fontSize: 13,
                                transition: 'all 0.2s ease',
                                cursor: sendingEmail[o._id] ? 'not-allowed' : 'pointer'
                              }}
                              onMouseEnter={(e) => !sendingEmail[o._id] && (e.target.style.background = '#1565c0')}
                              onMouseLeave={(e) => !sendingEmail[o._id] && (e.target.style.background = '#1976d2')}
                            >
                              {sendingEmail[o._id] ? (
                                <>
                                  <div style={{
                                    width: 14,
                                    height: 14,
                                    border: '2px solid #ffffff60',
                                    borderTop: '2px solid #ffffff',
                                    borderRadius: '50%',
                                    animation: 'spin 0.6s linear infinite'
                                  }} />
                                  Enviando...
                                </>
                              ) : (
                                <>📧 Enviar E-mail</>
                              )}
                            </button>
                          </div>
                        )}
                        {o.status === 'pagamento-pendente' && (
                          <button 
                            type="button" 
                            disabled={!!closingOs[o._id]}
                            onClick={() => {
                              setOsParaFinalizar(o);
                              setShowFinalizarModal(true);
                            }}
                            style={{
                              background: closingOs[o._id] ? '#bdbdbd' : '#4caf50', 
                              color: '#fff', 
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              justifyContent: 'center'
                            }}
                          >
                            {closingOs[o._id] ? 'Finalizando...' : 'Finalizar OS (Pago)'}
                          </button>
                        )}
                      </td>

                      <td style={{ padding: 8 }}>
                          <button type="button" onClick={() => toggleExpand(o._id)} style={{ background: '#757575', color: '#fff', fontWeight: 600 }}>
                            {expanded[o._id]
                              ? `Ocultar (${cls.length})`
                              : `Ver (${checklistsByOs[o._id]?.length ?? 0})`}
                          </button>
                      </td>
                    </tr>
                    {expanded[o._id] && (
                      <tr>
                        <td colSpan={7} style={{ padding: 8, background: '#fafafa' }}>
                          {cls.length === 0 ? (
                            <div className="muted">Nenhum checklist para esta OS.</div>
                          ) : (
                            <div>
                              {cls.map(cl => (
                                <div key={cl._id} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8, borderRadius: 6 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 600 }}>Checklist</div>
                                    <div className="muted">{cl.criadoEm ? new Date(cl.criadoEm).toLocaleString() : '-'}</div>
                                  </div>
                                  <div style={{ marginTop: 8 }}>
                                    {Array.isArray(cl.itens) && cl.itens.length > 0 ? (
                                      <div>
                                        {cl.itens.map((it, i) => (
                                          <div key={i} style={{ display: 'flex', gap: 12, padding: 6, borderTop: i === 0 ? 'none' : '1px solid #f0f0f0' }}>
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontWeight: 500 }}>{it.nome} {it.ok ? <span style={{ color: '#0b5fff', fontWeight: 700, marginLeft: 8 }}>OK</span> : null}</div>
                                              {it.observacao ? <div className="muted" style={{ marginTop: 4 }}>{it.observacao}</div> : null}
                                            </div>
                                            <div style={{ width: 120 }}>
                                              {Array.isArray(it.fotos) && it.fotos.length > 0 ? (
                                                <div className="photo-previews">
                                                  {it.fotos.map((url, uidx) => (
                                                    <div key={uidx} style={{ display: 'inline-block', marginRight: 8, textAlign: 'center' }}>
                                                      <img src={resolveUploadUrl(url)} alt={''} style={{ cursor: 'pointer', maxWidth: 120, maxHeight: 90, objectFit: 'cover', borderRadius: 4, display: 'block' }} onClick={() => { setPreviewUrl(resolveUploadUrl(url)); setPreviewVisible(true) }} />
                                                      <div style={{ marginTop: 6, display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                        <button type="button" onClick={() => { setPreviewUrl(resolveUploadUrl(url)); setPreviewVisible(true) }} style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer', background: '#757575', color: '#fff', fontWeight: 600 }}>Ver</button>
                                                        <button type="button" onClick={() => downloadFile(url)} style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer', background: '#757575', color: '#fff', fontWeight: 600 }}>Baixar</button>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>

                                  {/* Verificações Adicionais */}
                                  {cl.verificacoesAdicionais && (cl.verificacoesAdicionais.possuiVazamento || cl.verificacoesAdicionais.luzesManutencao) && (
                                    <div style={{marginTop:'18px',background:'linear-gradient(90deg,#f5f5f5 60%,#fff 100%)',borderRadius:'10px',padding:'20px 18px',boxShadow:'0 4px 16px #bbb',border:'1.5px solid #e0e0e0'}}>
                                      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                                        <span style={{fontWeight:700,fontSize:'1.08rem',color:'#444'}}>Verificações Adicionais</span>
                                      </div>
                                      <ul style={{listStyle:'none',padding:0,margin:0,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 16px'}}>
                                        {/* Vazamento */}
                                        {cl.verificacoesAdicionais.possuiVazamento && (
                                          <li style={{display:'flex',flexDirection:'column',gap:'8px',fontSize:'1rem',background: cl.verificacoesAdicionais.possuiVazamento === 'sim' ? '#ededed' : '#f8f8f8',borderRadius:'6px',padding:'6px 10px',border: cl.verificacoesAdicionais.possuiVazamento === 'sim' ? '1.5px solid #bbb' : '1.5px solid #eee'}}>
                                            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                              <span style={{color: cl.verificacoesAdicionais.possuiVazamento === 'sim' ? '#f44336' : '#4caf50',fontWeight: cl.verificacoesAdicionais.possuiVazamento === 'sim' ? 700 : 400,fontSize:'1.15em',marginRight:'2px'}}>{cl.verificacoesAdicionais.possuiVazamento === 'sim' ? '✗' : '✓'}</span>
                                              <span style={{color: cl.verificacoesAdicionais.possuiVazamento === 'sim' ? '#222' : '#888',fontWeight: cl.verificacoesAdicionais.possuiVazamento === 'sim' ? 600 : 400}}>Vazamento</span>
                                            </div>
                                            {cl.verificacoesAdicionais.possuiVazamento === 'sim' && cl.verificacoesAdicionais.vazamentoDetalhes && (
                                              <div style={{fontSize:'0.92rem',color:'#555',paddingLeft:'24px',fontWeight:600}}>
                                                {[
                                                  cl.verificacoesAdicionais.vazamentoDetalhes.arCondicionado && 'Ar Condicionado',
                                                  cl.verificacoesAdicionais.vazamentoDetalhes.cambio && 'Câmbio',
                                                  cl.verificacoesAdicionais.vazamentoDetalhes.direcao && 'Direção',
                                                  cl.verificacoesAdicionais.vazamentoDetalhes.freio && 'Freio',
                                                  cl.verificacoesAdicionais.vazamentoDetalhes.motor && 'Motor',
                                                  cl.verificacoesAdicionais.vazamentoDetalhes.radiador && 'Radiador',
                                                  cl.verificacoesAdicionais.vazamentoDetalhes.suspensao && 'Suspensão'
                                                ].filter(Boolean).join(', ')}
                                              </div>
                                            )}
                                          </li>
                                        )}
                                        
                                        {/* Luzes no Painel */}
                                        {cl.verificacoesAdicionais.luzesManutencao && (
                                          <li style={{display:'flex',flexDirection:'column',gap:'8px',fontSize:'1rem',background: cl.verificacoesAdicionais.luzesManutencao === 'sim' ? '#ededed' : '#f8f8f8',borderRadius:'6px',padding:'6px 10px',border: cl.verificacoesAdicionais.luzesManutencao === 'sim' ? '1.5px solid #bbb' : '1.5px solid #eee'}}>
                                            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                              <span style={{color: cl.verificacoesAdicionais.luzesManutencao === 'sim' ? '#f44336' : '#4caf50',fontWeight: cl.verificacoesAdicionais.luzesManutencao === 'sim' ? 700 : 400,fontSize:'1.15em',marginRight:'2px'}}>{cl.verificacoesAdicionais.luzesManutencao === 'sim' ? '✗' : '✓'}</span>
                                              <span style={{color: cl.verificacoesAdicionais.luzesManutencao === 'sim' ? '#222' : '#888',fontWeight: cl.verificacoesAdicionais.luzesManutencao === 'sim' ? 600 : 400}}>Luzes no Painel</span>
                                            </div>
                                            {cl.verificacoesAdicionais.luzesManutencao === 'sim' && cl.verificacoesAdicionais.luzesDetalhes && (
                                              <div style={{fontSize:'0.92rem',color:'#555',paddingLeft:'24px',fontWeight:600}}>
                                                {[
                                                  cl.verificacoesAdicionais.luzesDetalhes.abs && 'ABS',
                                                  cl.verificacoesAdicionais.luzesDetalhes.airbag && 'Airbag',
                                                  cl.verificacoesAdicionais.luzesDetalhes.bateria && 'Bateria',
                                                  cl.verificacoesAdicionais.luzesDetalhes.combustivel && 'Combustível',
                                                  cl.verificacoesAdicionais.luzesDetalhes.epc && 'EPC',
                                                  cl.verificacoesAdicionais.luzesDetalhes.esc && 'ESC',
                                                  cl.verificacoesAdicionais.luzesDetalhes.freio && 'Freio',
                                                  cl.verificacoesAdicionais.luzesDetalhes.injecao && 'Injeção',
                                                  cl.verificacoesAdicionais.luzesDetalhes.motor && 'Motor',
                                                  cl.verificacoesAdicionais.luzesDetalhes.oleo && 'Óleo',
                                                  cl.verificacoesAdicionais.luzesDetalhes.pressaoPneus && 'Pressão dos Pneus',
                                                  cl.verificacoesAdicionais.luzesDetalhes.temperatura && 'Temperatura',
                                                  cl.verificacoesAdicionais.luzesDetalhes.outros && (cl.verificacoesAdicionais.luzesOutrosTexto ? `Outros (${cl.verificacoesAdicionais.luzesOutrosTexto})` : 'Outros')
                                                ].filter(Boolean).join(', ')}
                                              </div>
                                            )}
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Informações da entrega do carro */}
                                  {entregaValidacao && entregaValidacao.checks && (
                                    <div style={{marginTop:'18px',background:'linear-gradient(90deg,#f5f5f5 60%,#fff 100%)',borderRadius:'10px',padding:'20px 18px',boxShadow:'0 4px 16px #bbb',border:'1.5px solid #e0e0e0'}}>
                                      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                                        <span style={{fontWeight:700,fontSize:'1.08rem',color:'#444'}}>Validação de Entrega do Veículo</span>
                                      </div>
                                      <ul style={{listStyle:'none',padding:0,margin:0,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 16px'}}>
                                        {entregaValidacao.checks.map((c, idx) => (
                                          <li key={idx} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'1.05rem',background:c.checked?'#ededed':'#f8f8f8',borderRadius:'6px',padding:'6px 10px',border:c.checked?'1.5px solid #bbb':'1.5px solid #eee'}}>
                                            <span style={{color:c.checked?'#4caf50':'#f44336',fontWeight:c.checked?700:700,fontSize:'1.2em',marginRight:'2px'}}>{c.checked ? '✓' : '✗'}</span>
                                            <span style={{color:c.checked?'#222':'#f44336',fontWeight:c.checked?600:700}}>{c.label}</span>
                                          </li>
                                        ))}
                                      </ul>
                                      <div style={{marginTop:'16px',display:'flex',alignItems:'center',gap:'10px',padding:'10px 0 0 0',borderTop:'1px dashed #bbb'}}>
                                        <span style={{fontWeight:600,color:'#444',fontSize:'1.07em'}}>Funcionário:</span>
                                        <span style={{fontWeight:600,color: entregaValidacao.funcionario ? '#222' : '#888', fontSize:'1.05em'}}>{entregaValidacao.funcionario ? entregaValidacao.funcionario : 'Não informado'}</span>
                                      </div>
                                    </div>
                                  )}

                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>

      {/* Modal de validação de entrega */}
      {showEntregaModal && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:12,minWidth:340,maxWidth:400,boxShadow:'0 4px 24px rgba(0,0,0,0.2)',position:'relative'}}>
            <h3 style={{marginTop:0}}>Validação de Entrega do Veículo</h3>
            <ul style={{listStyle:'none',padding:0,marginBottom:16}}>
              {entregaChecks.map((item, idx) => (
                <li key={idx} style={{marginBottom:3}}>
                  <label htmlFor={`entrega-check-${idx}`} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:'0.97rem',padding:6,borderRadius:5,transition:'background 0.2s',background: item.checked ? '#e3f2fd' : 'none'}}>
                    <input type="checkbox" checked={item.checked} onChange={() => handleEntregaCheck(idx)} id={`entrega-check-${idx}`} style={{width:18,height:18,cursor:'pointer',accentColor:'#1976d2',margin:'4px 0 2px',verticalAlign:'middle'}} />
                    <span style={{verticalAlign:'middle'}}>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div style={{marginBottom:16}}>
              <label style={{fontWeight:500}}>Funcionário que entregou o carro:</label>
              <input type="text" value={funcionarioEntrega} onChange={e => setFuncionarioEntrega(e.target.value)} placeholder="Nome do funcionário" style={{width:'100%',marginTop:6}} />
            </div>
            <div style={{marginBottom:16,marginTop:20}}>
              <label style={{fontWeight:700,display:'block',marginBottom:12}}>Status do Pagamento:</label>
              <div style={{display:'flex',gap:16}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input 
                    type="radio" 
                    name="statusPagamento" 
                    value="pago" 
                    checked={statusPagamento === 'pago'} 
                    onChange={e => setStatusPagamento(e.target.value)} 
                    style={{width:18,height:18,cursor:'pointer',accentColor:'#4caf50'}} 
                  />
                  <span style={{fontWeight:600,color:'#4caf50'}}>Pago</span>
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input 
                    type="radio" 
                    name="statusPagamento" 
                    value="pendente" 
                    checked={statusPagamento === 'pendente'} 
                    onChange={e => setStatusPagamento(e.target.value)} 
                    style={{width:18,height:18,cursor:'pointer',accentColor:'#f44336'}} 
                  />
                  <span style={{fontWeight:600,color:'#f44336'}}>Pendente</span>
                </label>
              </div>
            </div>
            {entregaErro && <div style={{color:'#f44336',marginBottom:16,background:'#ffebee',padding:12,borderRadius:6,fontWeight:500}}>{entregaErro}</div>}
            <div style={{display:'flex',gap:12,marginTop:20}}>
              <button 
                type="button" 
                onClick={() => { 
                  setShowEntregaModal(false); 
                  setEntregaErro(''); 
                  setOsParaEncerrar(null); 
                  setEntregaChecks(entregaChecks.map(item => ({ ...item, checked: false }))); 
                  setFuncionarioEntrega(''); 
                  setStatusPagamento('pago'); 
                }} 
                style={{flex:1,padding:'10px 20px',background:'#bdbdbd',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmarEntrega} 
                style={{flex:1,padding:'10px 20px',background:'#4caf50',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de finalizar OS com pagamento pendente */}
      {showFinalizarModal && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:12,minWidth:340,maxWidth:400,boxShadow:'0 4px 24px rgba(0,0,0,0.2)',position:'relative'}}>
            <h3 style={{marginTop:0}}>Finalizar Ordem de Serviço</h3>
            <p>Confirma que o pagamento foi realizado e deseja finalizar esta OS?</p>
            <div style={{display:'flex',gap:12,marginTop:20}}>
              <button 
                type="button" 
                onClick={() => { 
                  setShowFinalizarModal(false); 
                  setOsParaFinalizar(null); 
                }} 
                style={{flex:1,padding:'10px 20px',background:'#bdbdbd',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleFinalizarOS} 
                style={{padding:'10px 20px',background:'#4caf50',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}
              >
                Confirmar Pagamento e Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {previewVisible && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }} onClick={() => { setPreviewVisible(false); setPreviewUrl(null) }}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
            <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 6 }} />
            <div style={{ position: 'absolute', right: 8, top: 8 }}>
              <button onClick={() => downloadFile(previewUrl)} style={{ background: '#fff', padding: '6px 8px', borderRadius: 4, border: 'none', cursor: 'pointer' }}>Baixar</button>
            </div>
            <button onClick={() => { setPreviewVisible(false); setPreviewUrl(null) }} style={{ position: 'absolute', left: 8, top: 8, background: '#fff', borderRadius: 4, padding: '6px 8px' }}>Fechar</button>
          </div>
        </div>
      )}
    </>
  )
}
