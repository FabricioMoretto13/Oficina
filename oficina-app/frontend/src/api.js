const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export async function request(path, options = {}) {
  const url = `${API}${path}`
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
    
    const bodyString = options.body ? JSON.stringify(options.body) : undefined
    
    console.log('Request sendo enviada:')
    console.log('  URL:', url)
    console.log('  Method:', options.method || 'GET')
    console.log('  Headers:', headers)
    console.log('  Body original:', options.body)
    console.log('  Body stringificado:', bodyString)
    
    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      body: bodyString
    }
    
    console.log('  FetchOptions completo:', fetchOptions)
    
    const res = await fetch(url, fetchOptions)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`${res.status} ${res.statusText} - ${text}`)
    }
    return res.status === 204 ? null : res.json()
  } catch (err) {
    throw err
  }
}

// Valida filial do usuário após login
export const validarFilialUsuario = (email, filial) => request('/usuarios/validar-filial', { method: 'POST', body: { email, filial } })

// Gerenciamento de usuários
export const getUsuarios = () => {
  const userEmail = sessionStorage.getItem('userEmail')
  return request('/usuarios/listar', { 
    headers: { 
      'x-user-email': userEmail || ''
    }
  })
}

export const atualizarStatusUsuario = (id, status) => {
  const userEmail = sessionStorage.getItem('userEmail')
  console.log('atualizarStatusUsuario chamado com:')
  console.log('  id:', id)
  console.log('  status:', status)
  console.log('  userEmail:', userEmail)
  console.log('  body que será enviado:', { status })
  
  return request(`/usuarios/${id}/status`, { 
    method: 'PATCH', 
    body: { status },
    headers: {
      'x-user-email': userEmail || ''
    }
  })
}

export const getClientes = (searchTerm) => {
  const filial = sessionStorage.getItem('filial')
  const params = []
  if (filial) params.push(`filial=${filial}`)
  if (searchTerm) params.push(`q=${encodeURIComponent(searchTerm)}`)
  const qs = params.length ? `?${params.join('&')}` : ''
  return request(`/clientes${qs}`)
}
export const createCliente = (data) => request('/clientes', { method: 'POST', body: data })
export const updateCliente = (id, data) => request(`/clientes/${id}`, { method: 'PUT', body: data })

export const getVeiculos = (searchTerm) => {
  const filial = sessionStorage.getItem('filial')
  const params = []
  if (filial) params.push(`filial=${filial}`)
  if (searchTerm) params.push(`q=${encodeURIComponent(searchTerm)}`)
  const qs = params.length ? `?${params.join('&')}` : ''
  return request(`/veiculos${qs}`)
}
export const createVeiculo = (data) => request('/veiculos', { method: 'POST', body: data })
export const updateVeiculo = (id, data) => request(`/veiculos/${id}`, { method: 'PUT', body: data })

// params can include month, year, clienteId, veiculoId, etc.
export const getOS = (params) => {
  const filial = sessionStorage.getItem('filial')
  const allParams = { ...params, filial }
  let qs = ''
  if (allParams) {
    const entries = Object.entries(allParams).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    qs = entries.length ? `?${new URLSearchParams(Object.fromEntries(entries)).toString()}` : ''
  }
  return request(`/os${qs}`)
}

// Get total unique vehicles attended in a given month
export const getTotalVeiculosAtendidos = (month, year) => {
  const filial = sessionStorage.getItem('filial')
  const qs = `?month=${month}&year=${year}${filial ? '&filial=' + filial : ''}`;
  return request(`/os/total-veiculos-atendidos${qs}`);
}
export const createOS = (data) => request('/os', { method: 'POST', body: data })
export const getOSById = (id) => request(`/os/${id}`)
export const updateOS = (id, data) => request(`/os/${id}`, { method: 'PUT', body: data })
export const closeOS = (id, entregaValidacao, statusPagamento) => request(`/os/${id}/close`, { 
  method: 'PATCH', 
  body: { 
    entregaValidacao: entregaValidacao || undefined,
    statusPagamento: statusPagamento || 'pago'
  } 
})
export const getOSs = (params) => getOS(params) // Alias para manter compatibilidade
export const deleteOS = (id) => request(`/os/${id}`, { method: 'DELETE' })
export const generateOSPdf = (id) => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const url = `${API_BASE}/os/${id}/pdf`
  return url // Retorna a URL do PDF
}

export const getChecklists = (params) => {
  const filial = sessionStorage.getItem('filial')
  const allParams = { ...params, filial }
  let qs = ''
  if (allParams) {
    const entries = Object.entries(allParams).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    qs = entries.length ? `?${new URLSearchParams(Object.fromEntries(entries)).toString()}` : ''
  }
  return request(`/checklist${qs}`)
}
export const createChecklist = (data) => request('/checklist', { method: 'POST', body: data })
// createChecklist using multipart/form-data with files. `data` should contain { osId, items } where items is an array
export const createChecklistForm = async (data) => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const url = `${API_BASE}/checklist`
  const fd = new FormData()
  fd.append('osId', data.osId || '')
  // items should be an array with each item having nome, ok, observacao, and fotos (array of original filenames)
  const items = data.items || data.itens || data.itens || []
  // attach files with originalname so backend can map them
  // files should be a flat array in data.files: [{ fieldname, originalname, blob }]
  if (data.files && Array.isArray(data.files)) {
    data.files.forEach(f => fd.append('files', f.blob, f.originalname))
  }
  fd.append('items', JSON.stringify(items))
  // Adiciona filial ao FormData
  if (data.filial) {
    fd.append('filial', data.filial)
  }
  // Adiciona verificações adicionais ao FormData
  if (data.verificacoesAdicionais) {
    fd.append('verificacoesAdicionais', JSON.stringify(data.verificacoesAdicionais))
  }

  const res = await fetch(url, { method: 'POST', body: fd })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText} - ${text}`)
  }
  return res.status === 204 ? null : res.json()
}
export const deleteChecklist = (id) => request(`/checklist/${id}`, { method: 'DELETE' })
export const deleteChecklistItem = (checklistId, itemId) => request(`/checklist/${checklistId}/items/${itemId}`, { method: 'DELETE' })
export const getChecklistsByOS = (osId) => request(`/checklist?osId=${osId}`)

// Envia checklist por WhatsApp
export const sendChecklistWhatsapp = async ({ checklistId, phone }) => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  const url = `${API_BASE}/checklist/sendWhatsappChecklist`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checklistId, phone })
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText} - ${text}`)
  }
  return res.json()
}

// Envia OS com checklist por e-mail
export const sendOSEmail = (osId, incluirTermo = true) => 
  request(`/os/${osId}/enviar-email`, { 
    method: 'POST', 
    body: { incluirTermo } 
  })

export default { getClientes, createCliente, getVeiculos, createVeiculo, getOS, createOS, getChecklists, createChecklist }
