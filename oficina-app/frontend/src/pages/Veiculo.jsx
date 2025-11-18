function getFilialAtual() {
  return sessionStorage.getItem('filial') || 'sao-paulo'
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientes, getVeiculos, createVeiculo, updateVeiculo } from '../api';
import { useToast } from '../contexts/ToastContext';

function Veiculo() {
  const navigate = useNavigate();
  const toast = useToast();
  const [abaAtiva, setAbaAtiva] = useState('cadastro'); // 'cadastro' ou 'buscar'
  const [clientes, setClientes] = useState([]);
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [montadora, setMontadora] = useState('');
  const [modelsForMontadora, setModelsForMontadora] = useState([]);
  const [ano, setAno] = useState('');
  const [combustivel, setCombustivel] = useState('');
  const [cor, setCor] = useState('');
  const [chassi, setChassi] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchCliente, setSearchCliente] = useState('');
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  
  // Estados para listagem e edição
  const [veiculos, setVeiculos] = useState([]);
  const [todosVeiculos, setTodosVeiculos] = useState([]); // Lista completa para sugestões
  const [loadingList, setLoadingList] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [veiculoEditando, setVeiculoEditando] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [searchVeiculo, setSearchVeiculo] = useState('');
  const [showVeiculoSuggestions, setShowVeiculoSuggestions] = useState(false);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  
  // Estados para API FIPE
  const [marcasFipe, setMarcasFipe] = useState([]);
  const [modelosFipe, setModelosFipe] = useState([]);
  const [anosFipe, setAnosFipe] = useState([]);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [loadingAnos, setLoadingAnos] = useState(false);
  const [marcaFipeId, setMarcaFipeId] = useState('');
  const [modeloFipeId, setModeloFipeId] = useState('');
  
  // Estados para API FIPE no modal de edição
  const [marcasFipeEdit, setMarcasFipeEdit] = useState([]);
  const [modelosFipeEdit, setModelosFipeEdit] = useState([]);
  const [anosFipeEdit, setAnosFipeEdit] = useState([]);
  const [loadingMarcasEdit, setLoadingMarcasEdit] = useState(false);
  const [loadingModelosEdit, setLoadingModelosEdit] = useState(false);
  const [loadingAnosEdit, setLoadingAnosEdit] = useState(false);
  const [marcaFipeIdEdit, setMarcaFipeIdEdit] = useState('');
  const [modeloFipeIdEdit, setModeloFipeIdEdit] = useState('');

  useEffect(() => {
    getClientes().then(setClientes).catch(err => toast.error(err.message || 'Erro ao carregar clientes'));
    // Carrega marcas da FIPE ao montar o componente
    carregarMarcasFipe();
  }, []);

  // Carrega todos os veículos ao abrir a aba de busca
  useEffect(() => {
    if (abaAtiva === 'buscar' && todosVeiculos.length === 0) {
      getVeiculos().then(setTodosVeiculos).catch(err => {
        console.error('Erro ao carregar veículos:', err);
      });
    }
  }, [abaAtiva]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (showVeiculoSuggestions && !event.target.closest('input[type="text"]')) {
        setShowVeiculoSuggestions(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showVeiculoSuggestions]);

  // Lista de veículos filtrados para o dropdown de sugestões
  const filteredVeiculosSuggestions = todosVeiculos.filter(v => {
    if (!searchVeiculo) return false;
    const searchLower = searchVeiculo.toLowerCase();
    const placaMatch = v.placa?.toLowerCase().includes(searchLower);
    const modeloMatch = v.modelo?.toLowerCase().includes(searchLower);
    const montadoraMatch = v.montadora?.toLowerCase().includes(searchLower);
    return placaMatch || modeloMatch || montadoraMatch;
  }).slice(0, 10); // Limita a 10 sugestões

  function handleSelectVeiculoSuggestion(veiculo) {
    setVeiculoSelecionado(veiculo);
    setSearchVeiculo(veiculo.placa);
    setShowVeiculoSuggestions(false);
    setVeiculos([veiculo]); // Mostra apenas o veículo selecionado na lista
  }

  async function handlePesquisarVeiculo() {
    if (!searchVeiculo.trim()) {
      toast.error('Digite algo para pesquisar');
      return;
    }
    
    setLoadingList(true);
    try {
      const data = await getVeiculos(searchVeiculo.trim());
      setVeiculos(data);
      if (data.length === 0) {
        toast.info('Nenhum veículo encontrado');
      } else {
        toast.success(`${data.length} veículo(s) encontrado(s)`);
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao pesquisar veículos');
    } finally {
      setLoadingList(false);
    }
  }

  function handleLimparPesquisa() {
    setSearchVeiculo('');
    setVeiculos([]);
    setVeiculoSelecionado(null);
    setShowVeiculoSuggestions(false);
  }

  function handleEditarVeiculo(veiculo) {
    setVeiculoEditando({
      ...veiculo,
      placa: veiculo.placa || '',
      montadora: veiculo.montadora || '',
      modelo: veiculo.modelo || '',
      ano: veiculo.ano || ''
    });
    setMarcaFipeIdEdit('');
    setModeloFipeIdEdit('');
    setMarcasFipeEdit([]);
    setModelosFipeEdit([]);
    setAnosFipeEdit([]);
    carregarMarcasFipeEdit();
    setShowEditModal(true);
  }

  async function handleSalvarEdicao() {
    if (!veiculoEditando.placa.trim()) {
      toast.error('Placa é obrigatória');
      return;
    }
    try {
      setSavingEdit(true);
      await updateVeiculo(veiculoEditando._id, veiculoEditando);
      toast.success('Veículo atualizado!');
      setShowEditModal(false);
      setVeiculoEditando(null);
      // Recarrega a pesquisa se houver termo de busca
      if (searchVeiculo.trim()) {
        handlePesquisarVeiculo();
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar');
    } finally {
      setSavingEdit(false);
    }
  }

  // Funções para API FIPE
  async function carregarMarcasFipe() {
    setLoadingMarcas(true);
    try {
      const response = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
      const data = await response.json();
      setMarcasFipe(data);
    } catch (err) {
      toast.error('Erro ao carregar marcas da FIPE');
      console.error(err);
    } finally {
      setLoadingMarcas(false);
    }
  }

  async function carregarModelosFipe(marcaId) {
    if (!marcaId) return;
    setLoadingModelos(true);
    setModelosFipe([]);
    setAnosFipe([]);
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos`);
      const data = await response.json();
      setModelosFipe(data.modelos || []);
    } catch (err) {
      toast.error('Erro ao carregar modelos');
      console.error(err);
    } finally {
      setLoadingModelos(false);
    }
  }

  async function carregarAnosFipe(marcaId, modeloId) {
    if (!marcaId || !modeloId) return;
    setLoadingAnos(true);
    setAnosFipe([]);
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos/${modeloId}/anos`);
      const data = await response.json();
      setAnosFipe(data || []);
    } catch (err) {
      toast.error('Erro ao carregar anos');
      console.error(err);
    } finally {
      setLoadingAnos(false);
    }
  }

  // Quando marca FIPE muda
  useEffect(() => {
    if (marcaFipeId) {
      const marca = marcasFipe.find(m => m.codigo === marcaFipeId);
      if (marca) {
        setMontadora(marca.nome);
      }
      carregarModelosFipe(marcaFipeId);
      setModeloFipeId('');
      setModelo('');
      setAno('');
    }
  }, [marcaFipeId]);

  // Quando modelo FIPE muda
  useEffect(() => {
    if (modeloFipeId && marcaFipeId) {
      const modeloObj = modelosFipe.find(m => m.codigo === parseInt(modeloFipeId));
      if (modeloObj) {
        setModelo(modeloObj.nome);
      }
      carregarAnosFipe(marcaFipeId, modeloFipeId);
      setAno('');
    }
  }, [modeloFipeId]);

  // Funções para API FIPE no modal de edição
  async function carregarMarcasFipeEdit() {
    setLoadingMarcasEdit(true);
    try {
      const response = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
      const data = await response.json();
      setMarcasFipeEdit(data);
    } catch (err) {
      toast.error('Erro ao carregar marcas da FIPE');
      console.error(err);
    } finally {
      setLoadingMarcasEdit(false);
    }
  }

  async function carregarModelosFipeEdit(marcaId) {
    if (!marcaId) return;
    setLoadingModelosEdit(true);
    setModelosFipeEdit([]);
    setAnosFipeEdit([]);
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos`);
      const data = await response.json();
      setModelosFipeEdit(data.modelos || []);
    } catch (err) {
      toast.error('Erro ao carregar modelos');
      console.error(err);
    } finally {
      setLoadingModelosEdit(false);
    }
  }

  async function carregarAnosFipeEdit(marcaId, modeloId) {
    if (!marcaId || !modeloId) return;
    setLoadingAnosEdit(true);
    setAnosFipeEdit([]);
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaId}/modelos/${modeloId}/anos`);
      const data = await response.json();
      setAnosFipeEdit(data || []);
    } catch (err) {
      toast.error('Erro ao carregar anos');
      console.error(err);
    } finally {
      setLoadingAnosEdit(false);
    }
  }

  // Quando marca FIPE muda no modal de edição
  useEffect(() => {
    if (marcaFipeIdEdit && veiculoEditando) {
      const marca = marcasFipeEdit.find(m => m.codigo === marcaFipeIdEdit);
      if (marca) {
        setVeiculoEditando(prev => ({ ...prev, montadora: marca.nome }));
      }
      carregarModelosFipeEdit(marcaFipeIdEdit);
      setModeloFipeIdEdit('');
    }
  }, [marcaFipeIdEdit]);

  // Quando modelo FIPE muda no modal de edição
  useEffect(() => {
    if (modeloFipeIdEdit && marcaFipeIdEdit && veiculoEditando) {
      const modeloObj = modelosFipeEdit.find(m => m.codigo === parseInt(modeloFipeIdEdit));
      if (modeloObj) {
        setVeiculoEditando(prev => ({ ...prev, modelo: modeloObj.nome }));
      }
      carregarAnosFipeEdit(marcaFipeIdEdit, modeloFipeIdEdit);
    }
  }, [modeloFipeIdEdit]);

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

  // Selecionar cliente
  function handleSelectCliente(cliente) {
    setClienteId(cliente._id)
    setSearchCliente(cliente.nome)
    setShowClienteSuggestions(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const filial = getFilialAtual()
      await createVeiculo({
        clienteId,
        placa,
        montadora,
        modelo,
        ano: ano ? Number(ano) : undefined,
        combustivel,
        cor,
        chassi,
        kmAtual: kmAtual ? Number(kmAtual) : undefined,
        filial
      })
      toast.success('Veículo cadastrado com sucesso!')
      setPlaca(''); setMontadora(''); setModelo(''); setAno(''); setClienteId(''); setCombustivel(''); setCor(''); setChassi(''); setKmAtual(''); setSearchCliente('');
      setMarcaFipeId(''); setModeloFipeId(''); setModelosFipe([]); setAnosFipe([]);
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar veículo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h2 style={{margin: 0}}>
            Gerenciamento de Veículos
          </h2>
          <p style={{margin: '8px 0 0 0', color: '#666', fontSize: 14}}>
            Cadastre novos veículos ou busque para editar
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
          Cadastrar Veículo
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
      <form onSubmit={handleSubmit}>
        <div style={{background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0', marginBottom: 16}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 16, color: '#333'}}>
            Cliente
          </h3>
          <div style={{marginBottom: 0, position: 'relative'}}>
            <label>Cliente Proprietário <span style={{color: '#c00'}}>*</span></label>
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
                      {c.cpf && `CPF: ${c.cpf}`}
                      {c.cpfCnpj && `CPF/CNPJ: ${c.cpfCnpj}`}
                      {c.telefone && ` • Tel: ${c.telefone}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #e0e0e0', marginBottom: 16}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: 16, color: '#333'}}>
            Dados do Veículo
          </h3>
          <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
            <div style={{flex: 1}}>
              <label>Marca</label>
              <select 
                value={marcaFipeId} 
                onChange={e => setMarcaFipeId(e.target.value)} 
                disabled={loadingMarcas}
                style={{width: '100%', background: loadingMarcas ? '#f5f5f5' : '#fff'}}
              >
                <option value="">{loadingMarcas ? 'Carregando marcas...' : '-- selecione a marca --'}</option>
                {marcasFipe.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
              </select>
            </div>
            <div style={{flex: 1}}>
              <label>Modelo</label>
              <select 
                value={modeloFipeId} 
                onChange={e => setModeloFipeId(e.target.value)} 
                disabled={!marcaFipeId || loadingModelos}
                style={{width: '100%', background: (!marcaFipeId || loadingModelos) ? '#f5f5f5' : '#fff'}}
              >
                <option value="">{loadingModelos ? 'Carregando modelos...' : marcaFipeId ? '-- selecione o modelo --' : '-- selecione a marca primeiro --'}</option>
                {modelosFipe.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
              </select>
            </div>
          </div>
          <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
            <div style={{flex: 1}}>
              <label>Placa <span style={{color: '#c00'}}>*</span></label>
              <input
                value={placa}
                onChange={e => setPlaca(e.target.value.replace(/\s/g, '').toUpperCase())}
                required
                placeholder="ABC1D23"
                style={{width: '100%'}}
              />
            </div>
            <div style={{flex: 1}}>
              <label>Ano</label>
              <select 
                value={ano} 
                onChange={e => setAno(e.target.value)} 
                disabled={!modeloFipeId || loadingAnos}
                style={{width: '100%', background: (!modeloFipeId || loadingAnos) ? '#f5f5f5' : '#fff'}}
              >
                <option value="">{loadingAnos ? 'Carregando anos...' : modeloFipeId ? '-- selecione o ano --' : '-- selecione o modelo primeiro --'}</option>
                {anosFipe.map(a => {
                  const anoExtraido = a.nome.split(' ')[0];
                  return <option key={a.codigo} value={anoExtraido}>{anoExtraido}</option>;
                })}
              </select>
            </div>
            <div style={{flex: 1}}>
              <label>Combustível <span style={{color: '#c00'}}>*</span></label>
              <select value={combustivel} onChange={e => setCombustivel(e.target.value)} required style={{width: '100%'}}>
                <option value="">-- selecione --</option>
                <option value="Alcool">Álcool</option>
                <option value="Diesel">Diesel</option>
                <option value="Flex">Flex</option>
                <option value="Gasolina">Gasolina</option>
                <option value="GNV">GNV</option>
              </select>
            </div>
          </div>
          <div style={{display: 'flex', gap: 12, marginBottom: 0}}>
            <div style={{flex: 1}}>
              <label>KM Atual</label>
              <input
                type="number"
                value={kmAtual}
                onChange={e => setKmAtual(e.target.value)}
                placeholder="Quilometragem atual"
                style={{width: '100%'}}
                min="0"
              />
            </div>
            <div style={{flex: 1}}>
              <label>Cor</label>
              <input
                value={cor}
                onChange={e => setCor(e.target.value)}
                placeholder="Cor do veículo"
                style={{width: '100%'}}
              />
            </div>
            <div style={{flex: 1}}>
              <label>Chassi</label>
              <input
                value={chassi}
                onChange={e => setChassi(e.target.value)}
                placeholder="Número do chassi"
                style={{width: '100%'}}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate('/os')}
            style={{
              padding: '12px 24px',
              background: '#757575',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 15,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => e.target.style.background = '#616161'}
            onMouseLeave={(e) => e.target.style.background = '#757575'}
          >
            ← Voltar para OS
          </button>
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
            {loading ? 'Salvando...' : 'Salvar Veículo'}
          </button>
        </div>
      </form>
        </div>
      )}

      {/* Conteúdo da Aba de Busca */}
      {abaAtiva === 'buscar' && (
      <div>
        <h3 style={{ marginBottom: 16, marginTop: 0 }}>Pesquisar Veículo</h3>
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <input
            type="text"
            placeholder="Digite a placa ou modelo do veículo..."
            value={searchVeiculo}
            onChange={e => {
              setSearchVeiculo(e.target.value);
              setShowVeiculoSuggestions(true);
              if (!e.target.value) {
                setVeiculoSelecionado(null);
                setVeiculos([]);
              }
            }}
            onFocus={() => setShowVeiculoSuggestions(true)}
            onKeyDown={e => e.key === 'Enter' && handlePesquisarVeiculo()}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 15
            }}
          />
          {showVeiculoSuggestions && searchVeiculo && filteredVeiculosSuggestions.length > 0 && (
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
              {filteredVeiculosSuggestions.map(v => (
                <div
                  key={v._id}
                  onClick={() => handleSelectVeiculoSuggestion(v)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f5f5f5',
                    background: veiculoSelecionado?._id === v._id ? '#f5f5f5' : '#fff',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background = veiculoSelecionado?._id === v._id ? '#f5f5f5' : '#fff'}
                >
                  <div style={{fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 3}}>{v.placa}</div>
                  <div style={{fontSize: 12, color: '#888'}}>
                    {v.montadora || v.marca || ''} {v.modelo}
                    {v.ano && ` • ${v.ano}`}
                    {v.cor && ` • ${v.cor}`}
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
          <div>Pesquisando veículos...</div>
        ) : veiculos.length === 0 ? (
          <div className="muted">
            {searchVeiculo ? 'Nenhum veículo encontrado com esse critério.' : 'Digite algo no campo de pesquisa para buscar veículos.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Placa</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Montadora</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Modelo</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Ano</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Cliente</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {veiculos.map(v => (
                <tr key={v._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{v.placa}</td>
                  <td style={{ padding: 8 }}>{v.montadora || '—'}</td>
                  <td style={{ padding: 8 }}>{v.modelo || '—'}</td>
                  <td style={{ padding: 8 }}>{v.ano || '—'}</td>
                  <td style={{ padding: 8 }}>{v.clienteId?.nome || '—'}</td>
                  <td style={{ padding: 8 }}>
                    <button
                      onClick={() => handleEditarVeiculo(v)}
                      style={{
                        background: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        borderRadius: 4,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 16
                      }}
                      title="Editar veículo"
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
      {showEditModal && veiculoEditando && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }} onClick={() => setShowEditModal(false)}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 400, maxWidth: 500, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Editar Veículo</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Placa</label>
              <input 
                type="text" 
                value={veiculoEditando.placa} 
                onChange={e => setVeiculoEditando(prev => ({ ...prev, placa: e.target.value }))}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Montadora (FIPE)</label>
              <select
                value={marcaFipeIdEdit}
                onChange={e => setMarcaFipeIdEdit(e.target.value)}
                disabled={loadingMarcasEdit}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
              >
                <option value="">Selecione uma montadora</option>
                {marcasFipeEdit.map(m => (
                  <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                ))}
              </select>
              {loadingMarcasEdit && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Carregando marcas...</div>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Modelo (FIPE)</label>
              <select
                value={modeloFipeIdEdit}
                onChange={e => setModeloFipeIdEdit(e.target.value)}
                disabled={!marcaFipeIdEdit || loadingModelosEdit}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
              >
                <option value="">Selecione um modelo</option>
                {modelosFipeEdit.map(m => (
                  <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                ))}
              </select>
              {loadingModelosEdit && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Carregando modelos...</div>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Ano (FIPE)</label>
              <select
                value={veiculoEditando.ano}
                onChange={e => setVeiculoEditando(prev => ({ ...prev, ano: e.target.value }))}
                disabled={!modeloFipeIdEdit || loadingAnosEdit}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
              >
                <option value="">Selecione um ano</option>
                {anosFipeEdit.map(a => (
                  <option key={a.codigo} value={a.nome}>{a.nome}</option>
                ))}
              </select>
              {loadingAnosEdit && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Carregando anos...</div>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Montadora (atual)</label>
              <input 
                type="text" 
                value={veiculoEditando.montadora} 
                onChange={e => setVeiculoEditando(prev => ({ ...prev, montadora: e.target.value }))}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', background: '#f5f5f5' }}
                readOnly
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Modelo (atual)</label>
              <input 
                type="text" 
                value={veiculoEditando.modelo} 
                onChange={e => setVeiculoEditando(prev => ({ ...prev, modelo: e.target.value }))}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', background: '#f5f5f5' }}
                readOnly
              />
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

  );
}

export default Veiculo;
