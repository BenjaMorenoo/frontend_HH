import React, { useState, useEffect } from 'react'
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
      if (newPassword.length < 8) {
        setError('La nueva contraseña debe tener al menos 8 caracteres')
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
            </div>

            <div className="mt-5 md:mt-0 md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input className="mt-1 w-full rounded border px-3 py-2" value={address} onChange={e => setAddress(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Avatar (opcional)</label>
                    <input type="file" accept="image/*" onChange={e => handleFileChange(e.target.files?.[0] || null)} className="mt-1" />
                  </div>

                  <div>
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
                </div>

                {error && <p className="text-red-600">{error}</p>}
                {message && <p className="text-green-600">{message}</p>}

                <div className="flex items-center gap-3">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
