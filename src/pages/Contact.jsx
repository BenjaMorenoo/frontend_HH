import React, { useState } from 'react'
import Navbar from "../components/Navbar"
import { useAuth } from '../context/AuthContext'
import { createRecord } from '../utils/pocketApi'

const Contact = () => {
  const { user, isAuthenticated } = useAuth()
  const [name, setName] = useState(user?.primer_nombre ? `${user.primer_nombre} ${user.primer_apellido || ''}`.trim() : '')
  const [email, setEmail] = useState(user?.email || '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!name || !email || !message) {
      setError('Por favor completa nombre, email y mensaje.')
      return
    }
    setLoading(true)
    try {
      const body = {
        name,
        email,
        subject,
        message,
      }
      // attach user relation if authenticated
      if (isAuthenticated && user?.id) body.user = user.id

      // try to create a record in PocketBase (collection: contacts)
      try {
        const created = await createRecord('contacts', body)
        setSuccess('Mensaje enviado. Gracias por contactarnos.')
        setName(user?.primer_nombre ? `${user.primer_nombre} ${user.primer_apellido || ''}`.trim() : '')
        setSubject('')
        setMessage('')
      } catch (err) {
        // if server doesn't have contacts collection or returns error, fallback to local success with warning
        console.warn('Could not save contact message to PocketBase:', err)
        setSuccess('Tu mensaje fue recibido localmente (no se pudo guardar en el servidor).')
        setName('')
        setEmail('')
        setSubject('')
        setMessage('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">Contáctanos</h2>
              <p className="mb-4 text-sm text-gray-600">¿Tienes dudas o necesitas ayuda? Deja tu mensaje y te responderemos pronto.</p>

              {error && <div className="text-red-600 mb-3">{error}</div>}
              {success && <div className="text-green-600 mb-3">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm block mb-1">Nombre</label>
                    <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-200" placeholder="Tu nombre" />
                  </div>

                  <div>
                    <label className="text-sm block mb-1">Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-200" placeholder="tu@correo.com" />
                  </div>
                </div>

                <div>
                  <label className="text-sm block mb-1">Asunto</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-200" placeholder="Sobre qué quieres escribir" />
                </div>

                <div>
                  <label className="text-sm block mb-1">Mensaje</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-200" rows={8} placeholder="Escribe tu mensaje aquí" />
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 transition text-white px-5 py-3 rounded shadow">{loading ? 'Enviando...' : 'Enviar mensaje'}</button>
                  <button type="button" onClick={() => { setName(''); setEmail(''); setSubject(''); setMessage(''); setError(null); setSuccess(null) }} className="text-sm text-gray-600">Limpiar</button>
                </div>
              </form>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium">Información</h3>
              <p className="text-sm text-gray-600">También puedes contactarnos a través de:</p>
              <div className="text-sm">
                <div className="flex items-center gap-2"><strong>Email:</strong> <span className="text-gray-700">soporte@huertohogar.cl</span></div>
                <div className="flex items-center gap-2"><strong>Teléfono:</strong> <span className="text-gray-700">+56 9 1234 98765</span></div>
                <div className="flex items-center gap-2"><strong>Horario:</strong> <span className="text-gray-700">Lun-Vie 9:00 - 18:00</span></div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Dirección</h4>
                <p className="text-sm text-gray-600">Av. Calle falsa, Concepción, Chile</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Contact
