import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { createRecord, createRecordForm } from '../utils/pocketApi'

export default function CreatePost() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [type, setType] = useState('recipe')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [cover, setCover] = useState(null)
  const editorRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isAuthenticated) {
    return (
      <div>
        <Navbar />
        <div className="max-w-3xl mx-auto p-6">Debes iniciar sesión para crear publicaciones.</div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!title || !content) {
      setError('Título y contenido son requeridos')
      return
    }
    setLoading(true)
    try {
      // if cover file provided, use FormData
      if (cover) {
        // validate file size and type before upload
        const MAX = 5 * 1024 * 1024 // 5MB
        if (cover.size > MAX) {
          setError('La imagen supera el tamaño máximo permitido (5MB).')
          setLoading(false)
          return
        }
        if (!/image\/(png|jpe?g|webp)/i.test(cover.type)) {
          setError('Tipo de imagen no permitido. Usa PNG/JPG/WEBP.')
          setLoading(false)
          return
        }

        const fd = new FormData()
        fd.append('title', title)
        fd.append('type', type)
        fd.append('excerpt', excerpt)
        fd.append('content', content)
        fd.append('author', user.id)
        fd.append('cover', cover)

        // log FormData keys for debugging (won't show file contents)
        try {
          for (const pair of fd.entries()) {
            if (pair[1] instanceof File) {
              console.debug('FormData', pair[0], pair[1].name, pair[1].type, pair[1].size)
            } else {
              console.debug('FormData', pair[0], pair[1])
            }
          }
        } catch (e) {
          console.debug('Could not iterate FormData for logging', e)
        }

        try {
          const created = await createRecordForm('posts', fd)
          navigate(`/blog/${created.id}`)
          return
        } catch (err) {
          console.warn('createRecordForm failed, falling back to JSON create:', err)
          setError('No se pudo subir la imagen de portada. Se intentará crear la publicación sin la imagen.')
          try {
            const body = { title, type, excerpt, content, author: user.id }
            const created = await createRecord('posts', body)
            navigate(`/blog/${created.id}`)
            return
          } catch (err2) {
            setError(err2.message || String(err2))
            return
          }
        }
      }

      const body = { title, type, excerpt, content, author: user.id }
      const created = await createRecord('posts', body)
      navigate(`/blog/${created.id}`)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded shadow p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Crear publicación</h2>
          {error && <div className="text-red-600 mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm block mb-1">Título</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded p-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm block mb-1">Tipo</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded p-2">
                  <option value="recipe">Receta</option>
                  <option value="news">Noticia</option>
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">Extracto</label>
                <input value={excerpt} onChange={e => setExcerpt(e.target.value)} className="w-full border rounded p-2" />
              </div>
            </div>

            <div>
              <label className="text-sm block mb-2">Contenido</label>

              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => document.execCommand('bold')} className="px-2 py-1 border rounded text-sm">B</button>
                <button type="button" onClick={() => document.execCommand('italic')} className="px-2 py-1 border rounded text-sm">I</button>
                <button type="button" onClick={() => document.execCommand('underline')} className="px-2 py-1 border rounded text-sm">U</button>
                <select onChange={(e) => document.execCommand('fontName', false, e.target.value)} className="border rounded px-2 py-1 text-sm">
                  <option value="Arial">Sans</option>
                  <option value="Georgia">Serif</option>
                  <option value="'Courier New', Courier">Mono</option>
                  <option value="Cursive">Cursiva</option>
                </select>
                <button type="button" onClick={() => document.execCommand('insertUnorderedList')} className="px-2 py-1 border rounded text-sm">• Lista</button>
                <button type="button" onClick={() => document.execCommand('formatBlock', false, 'blockquote')} className="px-2 py-1 border rounded text-sm">Cita</button>
              </div>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => setContent(editorRef.current?.innerHTML || '')}
                className="min-h-[220px] max-h-[420px] overflow-auto border rounded p-3 prose"
                style={{outline: 'none'}}
              />
            </div>

            <div>
              <label className="text-sm block mb-1">Imagen de portada (opcional)</label>
              <input type="file" onChange={e => setCover(e.target.files?.[0] || null)} accept="image/*" />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto">{loading ? 'Publicando...' : 'Publicar'}</button>
              <button type="button" onClick={() => { setTitle(''); setExcerpt(''); setContent(''); if (editorRef.current) editorRef.current.innerHTML = ''; setCover(null); setError(null) }} className="w-full sm:w-auto border rounded px-4 py-2">Limpiar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
