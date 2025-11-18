import React from 'react'

export default function FirebaseSetupBanner() {
  const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const apiKeyLooksValid = typeof rawApiKey === 'string' && rawApiKey.length > 20 && !rawApiKey.includes('<')

  if (apiKeyLooksValid) return null

  return (
    <div className="message error" style={{display:'block'}}>
      <strong>Firebase não configurado:</strong> a API key do Firebase não parece estar definida. Preencha <code>frontend/.env</code> com as variáveis VITE_FIREBASE_* e reinicie o dev server.
    </div>
  )
}
