import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { request } from '../api'
import { useNavigate, Link } from 'react-router-dom'

export default function CadastroUsuario() {
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [password, setPassword] = useState('')
  const [filial, setFilial] = useState('sao-paulo')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signup } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await signup(email, password, nome)
      // Registrar usuário no backend
      await request('/usuarios/registrar', { method: 'POST', body: { nome, email, filial } })
      setSuccess('Usuário cadastrado com sucesso! Redirecionando para login...')
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      const errorMsg = err.message || ''
      
      // Extrai mensagem limpa do erro
      let cleanMsg = errorMsg
      
      // Tenta extrair mensagem do JSON se houver
      const jsonMatch = errorMsg.match(/\{[^}]+\}/)
      if (jsonMatch) {
        try {
          const errorObj = JSON.parse(jsonMatch[0])
          cleanMsg = errorObj.error || errorObj.message || errorMsg
        } catch {}
      }
      
      // Mensagens customizadas
      if (cleanMsg.includes('Usuário já existe') || cleanMsg.includes('email-already-in-use')) {
        setError('Este e-mail já está cadastrado no sistema.')
      } else if (cleanMsg.includes('weak-password')) {
        setError('Senha muito fraca. Use pelo menos 6 caracteres.')
      } else if (cleanMsg.includes('invalid-email')) {
        setError('E-mail inválido.')
      } else if (cleanMsg.includes('network-request-failed')) {
        setError('Erro de conexão. Verifique sua internet.')
      } else if (cleanMsg.includes('Dados obrigatórios')) {
        setError('Preencha todos os campos obrigatórios.')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
    }
  }

  return (
    <div className="card auth-card" style={{maxWidth:400,width:'100%',margin:'48px auto',padding:'32px 32px 24px 32px',boxShadow:'0 8px 32px rgba(15,15,15,0.10)',borderRadius:16}}>
      <div style={{display:'flex',justifyContent:'center',marginBottom:24}}>
        <img 
          src={filial === 'diesel' ? '/logo-diesel.png' : '/logo-alien.png'} 
          alt={filial === 'diesel' ? 'Logo Diesel' : 'Logo Alien'} 
          style={{height:100, width:240, objectFit:'contain', borderRadius:18, background:'transparent', display:'block'}} 
        />
      </div>
  {/* Título removido conforme solicitado */}
  {error && <div className="message error" style={{marginBottom:12}}>{error}</div>}
  {success && <div className="message success" style={{marginBottom:12}}>{success}</div>}
      <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:18}}>
        <input className="input-large" style={{border:'2px solid #222',fontSize:18}} placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} />
        <input className="input-large" style={{border:'2px solid #222',fontSize:18}} placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input-large" style={{border:'2px solid #222',fontSize:18}} placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <select className="input-large" style={{border:'2px solid #222',fontSize:18}} value={filial} onChange={e => setFilial(e.target.value)} required>
          <option value="sao-paulo">São Paulo</option>
          <option value="sorocaba">Sorocaba</option>
          <option value="diesel">Diesel</option>
        </select>
        <button type="submit" style={{width:'100%',padding:'14px 0',fontSize:18,background:'#222',color:'#fff',borderRadius:8,fontWeight:700,marginTop:8}}>Criar conta</button>
      </form>
      <p style={{marginTop:18,textAlign:'center',fontSize:15}}>Já tem conta? <Link to="/login" style={{ color: '#0b5fff', textDecoration: 'none', fontWeight: 700 }}>Entrar</Link></p>
    </div>
  )
}
