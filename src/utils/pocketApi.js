const BASE = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

function getAuthToken() {
  return localStorage.getItem('pb_token') || null
}

function setAuthToken(token) {
  if (!token) return
  try {
    localStorage.setItem('pb_token', token)
  } catch (e) {
    // ignorar errores de almacenamiento (cuota, modos de privacidad)
  }
}

function clearAuthToken() {
  localStorage.removeItem('pb_token')
  localStorage.removeItem('pb_user')
}

async function request(path, opts = {}) {
  const token = getAuthToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...opts,
  })
  if (!res.ok) {
    const text = await res.text()
    // intentar proporcionar una pista más clara cuando PocketBase informa una colección faltante
    let hint = ''
    try {
      const parsed = JSON.parse(text || '{}')
      const msg = (parsed && parsed.message) ? String(parsed.message) : text
      if (res.status === 404 && /missing or invalid collection context/i.test(msg)) {
        hint = `\nPista: PocketBase respondió con 'Missing or invalid collection context'. Verifica que el slug de la colección en el admin de PocketBase coincida con el nombre usado en la ruta (${path}).`
      }
    } catch (e) {
      // ignorar errores al parsear JSON
    }

    throw new Error(`${res.status} ${res.statusText} - ${text}${hint}`)
  }
  // algunos endpoints retornan cuerpo vacío para DELETE
  const txt = await res.text()
  return txt ? JSON.parse(txt) : {}
}

export async function getRecords(collection, query = '') {
  return request(`/api/collections/${collection}/records${query}`)
}

export function fileUrl(collection, recordId, filename) {
  if (!filename) return ''
  // el nombre de archivo puede ya ser una URL completa
  if (typeof filename === 'string' && (filename.startsWith('http://') || filename.startsWith('https://'))) return filename
  return `${BASE}/api/files/${collection}/${recordId}/${filename}`
}

export async function getRecord(collection, id) {
  return request(`/api/collections/${collection}/records/${id}`)
}

export async function createRecord(collection, body) {
  return request(`/api/collections/${collection}/records`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Crear usando FormData (útil para subir archivos al crear)
export async function createRecordForm(collection, formData) {
  const token = getAuthToken()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}/api/collections/${collection}/records`, {
    method: 'POST',
    headers,
    body: formData,
  })
  const text = await res.text()
  if (!res.ok) {
    // intentar parsear el error JSON para mejores mensajes
    let parsed = null
    try { parsed = JSON.parse(text || '{}') } catch (e) { /* ignorar */ }
    const msg = parsed && parsed.message ? parsed.message : text
    let hint = ''
    if (res.status === 400 && parsed && parsed.data) {
      hint = `\nErrores de campos: ${JSON.stringify(parsed.data)}`
    }
    throw new Error(`${res.status} ${res.statusText} - ${msg}${hint}`)
  }
  return text ? JSON.parse(text) : {}
}

export async function updateRecord(collection, id, body) {
  return request(`/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function deleteRecord(collection, id) {
  return request(`/api/collections/${collection}/records/${id}`, {
    method: 'DELETE',
  })
}

// Helpers de autenticación
export async function authWithPassword(identity, password) {
  const res = await request('/api/collections/users/auth-with-password', {
    method: 'POST',
    body: JSON.stringify({ identity, password }),
  })
  if (res && res.token) {
    setAuthToken(res.token)
    try {
      localStorage.setItem('pb_user', JSON.stringify(res.record || res))
    } catch (e) {
      // ignorar errores de almacenamiento
    }
  }
  return res
}

export async function registerUser({
  primer_nombre,
  segundo_nombre,
  primer_apellido,
  segundo_apellido,
  email,
  password,
  passwordConfirm,
  phone,
  address,
}) {
  // La colección de usuarios por defecto en PocketBase es 'users'
  const body = { email, password, passwordConfirm }
  // soporta tanto campos nuevos separados como el campo legacy `name`
  if (primer_nombre) body.primer_nombre = primer_nombre
  if (segundo_nombre) body.segundo_nombre = segundo_nombre
  if (primer_apellido) body.primer_apellido = primer_apellido
  if (segundo_apellido) body.segundo_apellido = segundo_apellido
  if (phone) body.phone = phone
  if (address) body.address = address

  const created = await createRecord('users', body)
  return created
}

export function logout() {
  clearAuthToken()
}

// Actualizar usando FormData (útil para subir archivos como avatar)
export async function updateRecordForm(collection, id, formData) {
  const token = getAuthToken()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers,
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText} - ${text}`)
  }
  const txt = await res.text()
  return txt ? JSON.parse(txt) : {}
}

export default { 
  getRecords, 
  getRecord, 
  createRecord, 
  updateRecord, 
  deleteRecord, 
  fileUrl, 
  authWithPassword, 
  registerUser, 
  logout 
}
