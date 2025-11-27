import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { fileUrl } from '../utils/pocketApi'

export default function Profile(){
  const { user, updateProfile } = useAuth()
  // handle separated name fields; if not present, try to split legacy `user.name`
  function parseNameParts(u) {
    if (!u) return { primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '' }
    if (u.primer_nombre || u.primer_apellido) {
      return {
        primer_nombre: u.primer_nombre || '',
        segundo_nombre: u.segundo_nombre || '',
        primer_apellido: u.primer_apellido || '',
        segundo_apellido: u.segundo_apellido || '',
      }
    }
    // fallback: split full name
    const parts = (u.name || '').trim().split(/\s+/)
    return {
      primer_nombre: parts[0] || '',
      segundo_nombre: parts.length > 2 ? parts.slice(1, parts.length - 1).join(' ') : (parts[1] || ''),
      primer_apellido: parts.length > 1 ? parts[parts.length - 1] : '',
      segundo_apellido: '',
    }
  }

  const initialName = parseNameParts(user)
  const [primerNombre, setPrimerNombre] = useState(initialName.primer_nombre || '')
  const [segundoNombre, setSegundoNombre] = useState(initialName.segundo_nombre || '')
  const [primerApellido, setPrimerApellido] = useState(initialName.primer_apellido || '')
  const [segundoApellido, setSegundoApellido] = useState(initialName.segundo_apellido || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const fileInputRef = useRef(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!user) return (
    <div>
      <Navbar />
      <div className="p-6">
        <p className="text-center">Debes iniciar sesión para ver tu perfil.</p>
      </div>
    </div>
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    // basic client validation
    if (!primerNombre || !primerApellido || !phone || !address) {
      setError('Por favor completa todos los campos (nombre y apellido requeridos)')
      return
    }

    // validate/normalize phone: ensure Chile mobile +56 9 and 8 digits after the 9
    const digits = (phone || '').replace(/\D/g, '')
    let rest = digits
    if (rest.startsWith('56') && rest.length > 2) rest = rest.slice(2)
    if (rest.startsWith('9')) rest = rest.slice(1)
    if (rest.length !== 8) {
      setError('El número debe tener 8 dígitos después del prefijo +56 9')
      return
    }
    const normalizedPhone = `+56 9 ${rest.slice(0,4)} ${rest.slice(4)}`

    const formData = new FormData()
    // send separated name fields (keep legacy compatibility if needed)
    formData.append('primer_nombre', primerNombre)
    if (segundoNombre) formData.append('segundo_nombre', segundoNombre)
    formData.append('primer_apellido', primerApellido)
    if (segundoApellido) formData.append('segundo_apellido', segundoApellido)
    formData.append('phone', phone)
    formData.append('address', address)
    if (avatarFile) {
      formData.append('avatar', avatarFile)
    }

    // include password change if provided
    if (newPassword || confirmPassword) {
      // password rules: min 6, max 8, must contain at least one symbol
      if (newPassword.length < 6 || newPassword.length > 8) {
        setError('La nueva contraseña debe tener entre 6 y 8 caracteres')
        setLoading(false)
        return
      }
      if (!/[^A-Za-z0-9]/.test(newPassword)) {
        setError('La nueva contraseña debe contener al menos un símbolo (p.ej. !@#$%)')
        setLoading(false)
        return
      }
      if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden')
        setLoading(false)
        return
      }
      formData.append('password', newPassword)
      formData.append('passwordConfirm', confirmPassword)
    }

    setLoading(true)
    try{
      await updateProfile(formData)
      setMessage('Perfil actualizado correctamente')
    }catch(err){
      setError(err?.message || 'Error actualizando perfil')
    }finally{
      setLoading(false)
    }
  }

  // build current avatar url if available
  function currentAvatarUrl() {
    if (!user) return null
    const avatarField = user.avatar || user.avatarUrl || user.avatar_file || null
    if (!avatarField) return null
    if (typeof avatarField === 'string') return fileUrl('users', user.id, avatarField)
    if (Array.isArray(avatarField) && avatarField.length > 0) return fileUrl('users', user.id, avatarField[0])
    return null
  }

  // phone input handler: enforce Chile mobile +56 9 and limit to 8 digits after the 9
  const handlePhoneChange = (e) => {
    const raw = e.target.value || ''
    let digits = raw.replace(/\D/g, '')
    if (digits.startsWith('56')) digits = digits.slice(2)
    if (digits.startsWith('9')) digits = digits.slice(1)
    digits = digits.slice(0, 8)
    if (digits.length === 0) {
      setPhone('+56 9 ')
      return
    }
    const first4 = digits.slice(0, 4)
    const last4 = digits.slice(4)
    const formatted = last4 ? `+56 9 ${first4} ${last4}` : `+56 9 ${first4}`
    setPhone(formatted)
  }

  const handlePhoneKeyDown = (e) => {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab']
    if (allowed.includes(e.key)) return
    if (!/^[0-9]$/.test(e.key)) return
    const currentDigits = (phone || '').replace(/\D/g, '')
    let rest = currentDigits
    if (rest.startsWith('56')) rest = rest.slice(2)
    if (rest.startsWith('9')) rest = rest.slice(1)
    if (rest.length >= 8) {
      e.preventDefault()
    }
  }

  const handlePhonePaste = (e) => {
    e.preventDefault()
    const paste = (e.clipboardData || window.clipboardData).getData('Text') || ''
    const pasteDigits = paste.replace(/\D/g, '')
    const currentDigits = (phone || '').replace(/\D/g, '')
    let rest = currentDigits
    if (rest.startsWith('56')) rest = rest.slice(2)
    if (rest.startsWith('9')) rest = rest.slice(1)
    const combined = (rest + pasteDigits).slice(0, 8)
    if (combined.length === 0) {
      setPhone('+56 9 ')
      return
    }
    const first4 = combined.slice(0, 4)
    const last4 = combined.slice(4)
    const formatted = last4 ? `+56 9 ${first4} ${last4}` : `+56 9 ${first4}`
    setPhone(formatted)
  }

  const handleFileChange = (file) => {
    setAvatarFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      // revoke previous preview to avoid memory leak
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(url)
    } else {
      setAvatarPreview(null)
    }
  }

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  // sync local input state if user changes (e.g., after updateProfile)
  useEffect(() => {
    const parts = parseNameParts(user)
    setPrimerNombre(parts.primer_nombre || '')
    setSegundoNombre(parts.segundo_nombre || '')
    setPrimerApellido(parts.primer_apellido || '')
    setSegundoApellido(parts.segundo_apellido || '')
    setPhone(user?.phone || '')
    setAddress(user?.address || '')
  }, [user])

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Mi perfil</h1>

        <div className="bg-white rounded shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1 flex flex-col items-center border-r pr-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview avatar" className="w-full h-full object-cover" />
                  ) : (
                    (() => {
                      const url = currentAvatarUrl()
                      return url ? (
                        <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400">No avatar</span>
                      )
                    })()
                  )}
                </div>

                <p className="mt-4 text-center text-sm text-gray-600">{user?.primer_nombre ? `${user.primer_nombre} ${user.primer_apellido || ''}` : (user?.name || user?.email)}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>

                {/* Move avatar file input below avatar preview; password fields moved to right column */}
                <div className="mt-4 w-full">
                  <label className="block text-sm font-medium text-gray-700">Avatar (opcional)</label>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 shadow-sm rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      aria-label="Cambiar foto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm5 3a3 3 0 110 6 3 3 0 010-6z" />
                      </svg>
                      Cambiar foto
                    </button>
                    <span className="text-sm text-gray-500">(PNG, JPG — máximo 2MB)</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Primer nombre</label>
                    <input className="mt-1 w-full rounded border px-3 py-2" value={primerNombre} onChange={e => setPrimerNombre(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Segundo nombre</label>
                    <input className="mt-1 w-full rounded border px-3 py-2" value={segundoNombre} onChange={e => setSegundoNombre(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Primer apellido</label>
                    <input className="mt-1 w-full rounded border px-3 py-2" value={primerApellido} onChange={e => setPrimerApellido(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Segundo apellido</label>
                    <input className="mt-1 w-full rounded border px-3 py-2" value={segundoApellido} onChange={e => setSegundoApellido(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyDown={handlePhoneKeyDown}
                    onPaste={handlePhonePaste}
                    onFocus={() => { if (!phone || phone.trim() === '') setPhone('+56 9 ') }}
                    onBlur={() => { if (phone === '+56 9 ') setPhone('') }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input className="mt-1 w-full rounded border px-3 py-2" value={address} onChange={e => setAddress(e.target.value)} />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Cambiar contraseña</label>
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2"
                  />
                  <input
                    type="password"
                    placeholder="Confirma la contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="mt-2 w-full rounded border px-3 py-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">Deja ambos campos vacíos si no deseas cambiar la contraseña.</p>
                </div>

                {error && <p className="text-red-600">{error}</p>}
                {message && <p className="text-green-600">{message}</p>}

                <div className="flex items-center gap-3 mt-4">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
