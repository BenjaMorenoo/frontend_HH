const BASE = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

function getAuthToken() {
  return localStorage.getItem('pb_token') || null
}

function setAuthToken(token) {
  if (token) localStorage.setItem('pb_token', token)
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
    // try to provide a clearer hint when PocketBase reports missing collection
    let hint = ''
    try {
      const parsed = JSON.parse(text || '{}')
      const msg = (parsed && parsed.message) ? String(parsed.message) : text
      if (res.status === 404 && /missing or invalid collection context/i.test(msg)) {
        hint = `\nHint: PocketBase responded with 'Missing or invalid collection context'. Verify the collection slug in PocketBase admin matches the name used in the request path (${path}).`
      }
    } catch (e) {
      // ignore JSON parse errors
    }

    throw new Error(`${res.status} ${res.statusText} - ${text}${hint}`)
  }
  // some endpoints return empty body for DELETE
  const txt = await res.text()
  return txt ? JSON.parse(txt) : {}
}

export async function getRecords(collection, query = '') {
  return request(`/api/collections/${collection}/records${query}`)
}

export function fileUrl(collection, recordId, filename) {
  if (!filename) return ''
  // filename may already be a full URL
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

// Create using FormData (useful to upload files on create)
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
    // try to parse JSON error body for better messages
    let parsed = null
    try { parsed = JSON.parse(text || '{}') } catch (e) { /* ignore */ }
    const msg = parsed && parsed.message ? parsed.message : text
    let hint = ''
    if (res.status === 400 && parsed && parsed.data) {
      hint = `\nField errors: ${JSON.stringify(parsed.data)}`
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

// Authentication helpers
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
      // ignore storage errors
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
  // PocketBase default users collection is 'users'
  const body = { email, password, passwordConfirm }
  // support both new separated fields and legacy `name`
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

// Update using FormData (useful for file uploads such as avatar)
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

export default { getRecords, getRecord, createRecord, updateRecord, deleteRecord, fileUrl, authWithPassword, registerUser, logout }
