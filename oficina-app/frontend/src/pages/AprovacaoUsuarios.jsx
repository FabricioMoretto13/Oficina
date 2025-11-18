import { useState, useEffect } from 'react'
import { getUsuarios, atualizarStatusUsuario } from '../api'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

export default function AprovacaoUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendente')
  const [processando, setProcessando] = useState(null) // ID do usuário sendo processado
  const toast = useToast()
  const navigate = useNavigate()

  const ADMIN_EMAIL = 'fabriciomoretto73@gmail.com'
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true'
  const userEmail = sessionStorage.getItem('userEmail')

  // Redireciona se não for admin
  useEffect(() => {
    if (!isAdmin || userEmail !== ADMIN_EMAIL) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
      navigate('/')
    }
  }, [isAdmin, userEmail, navigate, toast])

  useEffect(() => {
    carregarUsuarios()
  }, [])

  async function carregarUsuarios() {
    try {
      setLoading(true)
      const data = await getUsuarios()
      setUsuarios(data)
    } catch (error) {
      toast.error('Erro ao carregar usuários: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAtualizarStatus(id, novoStatus) {
    try {
      setProcessando(id)
      console.log(`Atualizando usuário ${id} para status: ${novoStatus}`)
      
      const resultado = await atualizarStatusUsuario(id, novoStatus)
      console.log('Resultado da atualização:', resultado)
      
      // Mensagem personalizada
      const mensagem = novoStatus === 'aprovado' 
        ? '✓ Usuário aprovado com sucesso!' 
        : novoStatus === 'reprovado'
        ? '✗ Usuário reprovado!'
        : '↻ Usuário retornado para pendente'
      
      toast.success(mensagem)
      
      // Recarrega a lista
      await carregarUsuarios()
      console.log('Lista de usuários recarregada')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status: ' + error.message)
    } finally {
      setProcessando(null)
    }
  }

  const usuariosFiltrados = usuarios.filter(u => {
    if (filtro === 'todos') return true
    return u.status === filtro
  })

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Gerenciar Usuários</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFiltro('pendente')}
          style={{
            padding: '10px 20px',
            backgroundColor: filtro === 'pendente' ? '#ff9800' : '#e0e0e0',
            color: filtro === 'pendente' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: filtro === 'pendente' ? 'bold' : 'normal',
            transition: 'all 0.2s',
            boxShadow: filtro === 'pendente' ? '0 2px 8px rgba(255, 152, 0, 0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (filtro !== 'pendente') {
              e.target.style.backgroundColor = '#d0d0d0'
            }
          }}
          onMouseLeave={(e) => {
            if (filtro !== 'pendente') {
              e.target.style.backgroundColor = '#e0e0e0'
            }
          }}
        >
          Pendentes ({usuarios.filter(u => u.status === 'pendente').length})
        </button>
        <button
          onClick={() => setFiltro('aprovado')}
          style={{
            padding: '10px 20px',
            backgroundColor: filtro === 'aprovado' ? '#4caf50' : '#e0e0e0',
            color: filtro === 'aprovado' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: filtro === 'aprovado' ? 'bold' : 'normal',
            transition: 'all 0.2s',
            boxShadow: filtro === 'aprovado' ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (filtro !== 'aprovado') {
              e.target.style.backgroundColor = '#d0d0d0'
            }
          }}
          onMouseLeave={(e) => {
            if (filtro !== 'aprovado') {
              e.target.style.backgroundColor = '#e0e0e0'
            }
          }}
        >
          Aprovados ({usuarios.filter(u => u.status === 'aprovado').length})
        </button>
        <button
          onClick={() => setFiltro('reprovado')}
          style={{
            padding: '10px 20px',
            backgroundColor: filtro === 'reprovado' ? '#f44336' : '#e0e0e0',
            color: filtro === 'reprovado' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: filtro === 'reprovado' ? 'bold' : 'normal',
            transition: 'all 0.2s',
            boxShadow: filtro === 'reprovado' ? '0 2px 8px rgba(244, 67, 54, 0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (filtro !== 'reprovado') {
              e.target.style.backgroundColor = '#d0d0d0'
            }
          }}
          onMouseLeave={(e) => {
            if (filtro !== 'reprovado') {
              e.target.style.backgroundColor = '#e0e0e0'
            }
          }}
        >
          Reprovados ({usuarios.filter(u => u.status === 'reprovado').length})
        </button>
        <button
          onClick={() => setFiltro('todos')}
          style={{
            padding: '10px 20px',
            backgroundColor: filtro === 'todos' ? '#2196f3' : '#e0e0e0',
            color: filtro === 'todos' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: filtro === 'todos' ? 'bold' : 'normal',
            transition: 'all 0.2s',
            boxShadow: filtro === 'todos' ? '0 2px 8px rgba(33, 150, 243, 0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (filtro !== 'todos') {
              e.target.style.backgroundColor = '#d0d0d0'
            }
          }}
          onMouseLeave={(e) => {
            if (filtro !== 'todos') {
              e.target.style.backgroundColor = '#e0e0e0'
            }
          }}
        >
          Todos ({usuarios.length})
        </button>
      </div>

      {usuariosFiltrados.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
          Nenhum usuário encontrado com status "{filtro}"
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={tableHeaderStyle}>Nome</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>Filial</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Data Cadastro</th>
                <th style={tableHeaderStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={tableCellStyle}>
                    {usuario.nome}
                    {usuario.email === ADMIN_EMAIL && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        backgroundColor: '#1976d2',
                        color: 'white'
                      }}>
                        ADMIN
                      </span>
                    )}
                  </td>
                  <td style={tableCellStyle}>{usuario.email}</td>
                  <td style={tableCellStyle}>{usuario.filial}</td>
                  <td style={tableCellStyle}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      backgroundColor: 
                        usuario.status === 'aprovado' ? '#e8f5e9' :
                        usuario.status === 'reprovado' ? '#ffebee' :
                        '#fff3e0',
                      color:
                        usuario.status === 'aprovado' ? '#2e7d32' :
                        usuario.status === 'reprovado' ? '#c62828' :
                        '#ef6c00'
                    }}>
                      {usuario.status.charAt(0).toUpperCase() + usuario.status.slice(1)}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ ...tableCellStyle, display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {usuario.email === ADMIN_EMAIL ? (
                      <span style={{ color: '#666', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        Administrador fixo
                      </span>
                    ) : (
                      <>
                        {usuario.status !== 'aprovado' && (
                          <button
                            onClick={() => handleAtualizarStatus(usuario._id, 'aprovado')}
                            disabled={processando === usuario._id}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: processando === usuario._id ? '#a5d6a7' : '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: processando === usuario._id ? 'wait' : 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              opacity: processando === usuario._id ? 0.7 : 1,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (processando !== usuario._id) {
                                e.target.style.backgroundColor = '#45a049'
                                e.target.style.transform = 'scale(1.05)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (processando !== usuario._id) {
                                e.target.style.backgroundColor = '#4caf50'
                                e.target.style.transform = 'scale(1)'
                              }
                            }}
                          >
                            {processando === usuario._id ? '...' : '✓ Aprovar'}
                          </button>
                        )}
                        {usuario.status !== 'reprovado' && (
                          <button
                            onClick={() => handleAtualizarStatus(usuario._id, 'reprovado')}
                            disabled={processando === usuario._id}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: processando === usuario._id ? '#ef9a9a' : '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: processando === usuario._id ? 'wait' : 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              opacity: processando === usuario._id ? 0.7 : 1,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (processando !== usuario._id) {
                                e.target.style.backgroundColor = '#d32f2f'
                                e.target.style.transform = 'scale(1.05)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (processando !== usuario._id) {
                                e.target.style.backgroundColor = '#f44336'
                                e.target.style.transform = 'scale(1)'
                              }
                            }}
                          >
                            {processando === usuario._id ? '...' : '✗ Reprovar'}
                          </button>
                        )}
                        {usuario.status !== 'pendente' && (
                          <button
                            onClick={() => handleAtualizarStatus(usuario._id, 'pendente')}
                            disabled={processando === usuario._id}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: processando === usuario._id ? '#ffcc80' : '#ff9800',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: processando === usuario._id ? 'wait' : 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              opacity: processando === usuario._id ? 0.7 : 1,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (processando !== usuario._id) {
                                e.target.style.backgroundColor = '#f57c00'
                                e.target.style.transform = 'scale(1.05)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (processando !== usuario._id) {
                                e.target.style.backgroundColor = '#ff9800'
                                e.target.style.transform = 'scale(1)'
                              }
                            }}
                          >
                            {processando === usuario._id ? '...' : '↻ Pendente'}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
  color: '#555',
  fontSize: '0.9rem'
}

const tableCellStyle = {
  padding: '12px',
  textAlign: 'left',
  fontSize: '0.9rem',
  color: '#333'
}
