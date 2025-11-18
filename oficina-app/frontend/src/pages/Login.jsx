import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { validarFilialUsuario } from '../api'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [filial, setFilial] = useState('sao-paulo')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const { login, resetPassword } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      // Login Firebase
      await login(email, password)
      // Validação de filial no backend
      const response = await validarFilialUsuario(email, filial)
      // Salva filial e status de admin no sessionStorage
      sessionStorage.setItem('filial', filial)
      sessionStorage.setItem('isAdmin', response.isAdmin ? 'true' : 'false')
      sessionStorage.setItem('userEmail', email)
      navigate('/')
    } catch (err) {
      const errorMsg = err.message || ''
      
      // Extrai apenas a mensagem de erro limpa
      let cleanMsg = errorMsg
      
      // Remove códigos HTTP e JSON do erro
      if (errorMsg.includes('404') || errorMsg.includes('403') || errorMsg.includes('400')) {
        // Tenta extrair mensagem do JSON
        const jsonMatch = errorMsg.match(/\{[^}]+\}/)
        if (jsonMatch) {
          try {
            const errorObj = JSON.parse(jsonMatch[0])
            cleanMsg = errorObj.error || errorObj.message || errorMsg
          } catch {}
        }
      }
      
      // Mensagens customizadas
      if (cleanMsg.includes('Usuário não encontrado')) {
        setError('Usuário não encontrado no sistema.')
      } else if (cleanMsg.includes('aguardando aprovação')) {
        setError('Seu cadastro está aguardando aprovação do administrador.')
      } else if (cleanMsg.includes('Acesso negado')) {
        setError('Você não tem acesso à filial selecionada.')
      } else if (cleanMsg.includes('invalid-credential') || cleanMsg.includes('wrong-password')) {
        setError('E-mail ou senha incorretos.')
      } else if (cleanMsg.includes('user-not-found')) {
        setError('Usuário não encontrado.')
      } else if (cleanMsg.includes('too-many-requests')) {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      } else if (cleanMsg.includes('invalid-email')) {
        setError('E-mail inválido.')
      } else if (cleanMsg.includes('network-request-failed')) {
        setError('Erro de conexão. Verifique sua internet.')
      } else {
        setError('Erro ao fazer login. Verifique suas credenciais.')
      }
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!email) return setError('Informe o e-mail para receber o link de recuperação.')
    try {
      await resetPassword(email)
      setInfo('E-mail de recuperação enviado. Verifique sua caixa de entrada.')
    } catch (err) {
      const errorMsg = err.message || ''
      if (errorMsg.includes('user-not-found')) {
        setError('E-mail não encontrado.')
      } else if (errorMsg.includes('invalid-email')) {
        setError('E-mail inválido.')
      } else {
        setError('Erro ao enviar e-mail de recuperação.')
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
        {error && <div className="message error" style={{marginBottom:12}}>{error}</div>}
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:18}}>
          <input className="input-large" style={{border:'2px solid #222',fontSize:18}} placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input-large" style={{border:'2px solid #222',fontSize:18}} placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <select className="input-large" style={{border:'2px solid #222',fontSize:18}} value={filial} onChange={e => setFilial(e.target.value)} required>
            <option value="sao-paulo">São Paulo</option>
            <option value="sorocaba">Sorocaba</option>
            <option value="diesel">Diesel</option>
          </select>
          <button type="submit" style={{width:'100%',padding:'14px 0',fontSize:18,background:'#222',color:'#fff',borderRadius:8,fontWeight:700,marginTop:8}}>Entrar</button>
        </form>
        <div style={{ marginTop: 12, textAlign:'right' }}>
          <button onClick={handleReset} style={{ background: 'transparent', color: '#0b5fff', border: 'none', padding: 0, cursor: 'pointer', fontSize:15 }}>Esqueci a senha</button>
        </div>
        {info && <div className="message success" style={{ marginTop: 8 }}>{info}</div>}
        <p style={{marginTop:18,textAlign:'center',fontSize:15}}>Não tem conta? <Link to="/cadastro-usuario" style={{ color: '#0b5fff', textDecoration: 'none', fontWeight: 700 }}>Crie aqui</Link></p>
      </div>
  )
}
