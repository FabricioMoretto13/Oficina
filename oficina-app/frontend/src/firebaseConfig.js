import { initializeApp } from 'firebase/app'
import { getAuth, browserSessionPersistence, setPersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '<YOUR_API_KEY>',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '<YOUR_AUTH_DOMAIN>',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '<YOUR_PROJECT_ID>',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '<YOUR_STORAGE_BUCKET>',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '<YOUR_MESSAGING_SENDER_ID>',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '<YOUR_APP_ID>'
}

// Basic validation to help diagnose the common "api-key-not-valid" error
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY
const apiKeyLooksValid = typeof rawApiKey === 'string' && rawApiKey.length > 20 && !rawApiKey.includes('<')
if (!apiKeyLooksValid) {
  console.error('Firebase API key inválida ou não definida. Verifique `frontend/.env` e reinicie o dev server (Vite).')
  console.error('Dica: cole o valor de config -> Firebase SDK snippet (Web) no .env, sem aspas, usando as variáveis VITE_...')
}


const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
// Garante que a sessão será encerrada ao fechar o navegador
setPersistence(auth, browserSessionPersistence)
export { auth }
export default app
