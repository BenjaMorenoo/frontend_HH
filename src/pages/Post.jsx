import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getRecord, getRecords, fileUrl, createRecord } from '../utils/pocketApi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Post() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const { formatCLP } = useCart()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const p = await getRecord('posts', id)
        if (mounted) setPost(p)

        const r = await getRecords('reviews', `?filter=post%3D%22${id}%22&expand=user&sort=-created`)
        let items = Array.isArray(r) ? r : (r?.items || [])

        // If some reviews don't include expanded user data, fetch those users
        const missingUserIds = Array.from(new Set(items.filter(x => x && !x.expand?.user && typeof x.user === 'string').map(x => x.user)))
        if (missingUserIds.length > 0) {
          try {
            const users = await Promise.all(missingUserIds.map(uid => getRecord('users', uid).catch(() => null)))
            const userById = {}
            users.forEach(u => { if (u && u.id) userById[u.id] = u })
            items = items.map(it => {
              if (it && !it.expand?.user && typeof it.user === 'string' && userById[it.user]) {
                it.expand = it.expand || {}
                it.expand.user = userById[it.user]
              }
              return it
            })
          } catch (e) {
            // ignore fetch errors, we'll show id as fallback
            console.warn('Could not fetch some user records for reviews', e)
          }
        }

        if (mounted) setReviews(items)
      } catch (err) {
        if (mounted) setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  async function submitReview(e) {
    e.preventDefault()
    if (!isAuthenticated) return alert('Debes iniciar sesión para dejar una reseña')
    if (!rating) return alert('Selecciona una calificación')
    setSubmitting(true)
    try {
      const body = { post: id, user: user.id, rating: Number(rating), comment }
      const created = await createRecord('reviews', body)
      // reload reviews
      const r = await getRecords('reviews', `?filter=post%3D%22${id}%22&expand=user&sort=-created`)
      const items = Array.isArray(r) ? r : (r?.items || [])
      setReviews(items)
      setRating(5)
      setComment('')
    } catch (err) {
      console.error(err)
      alert('No se pudo enviar la reseña')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div><Navbar/><div className="max-w-4xl mx-auto p-6">Cargando...</div></div>
  if (error) return <div className="max-w-4xl mx-auto p-6 text-red-600">Error: {error}</div>
  if (!post) return <div className="max-w-4xl mx-auto p-6">No se encontró la publicación.</div>

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <article className="bg-white rounded shadow p-4 sm:p-6">
          {post.cover && <img src={fileUrl('posts', post.id, post.cover)} alt={post.title} className="w-full h-48 sm:h-64 md:h-80 object-cover rounded mb-4" />}
          <h1 className="text-xl sm:text-2xl font-semibold mb-2">{post.title}</h1>
          <div className="text-xs sm:text-sm text-gray-500 mb-4">Tipo: {post.type} — Autor: {post.author?.email || (post.expand?.author?.email || '—')}</div>
          <div className="prose max-w-none mb-6 whitespace-pre-wrap text-sm sm:text-base">{post.content}</div>
        </article>

        <section className="mt-6">
          <h3 className="text-lg font-medium mb-3">Reseñas</h3>
          <div className="space-y-3">
            {reviews.length === 0 && <div className="text-sm text-gray-600">Aún no hay reseñas.</div>}
            {reviews.map(r => (
              <div key={r.id} className="p-3 border rounded bg-white">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">{r.expand?.user?.email || r.user}</div>
                  <div className="text-sm text-yellow-600">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
                {r.comment && <div className="mt-2 text-sm text-gray-700">{r.comment}</div>}
              </div>
            ))}
          </div>

          <div className="mt-4 bg-white rounded p-4 shadow">
            <h4 className="font-medium mb-2">Dejar una reseña</h4>
            <form onSubmit={submitReview} className="space-y-3">
              <div>
                <label className="text-sm block mb-1">Calificación</label>
                <select value={rating} onChange={e => setRating(e.target.value)} className="border rounded p-2">
                  <option value={5}>5 - Excelente</option>
                  <option value={4}>4 - Muy buena</option>
                  <option value={3}>3 - Buena</option>
                  <option value={2}>2 - Regular</option>
                  <option value={1}>1 - Mala</option>
                </select>
              </div>

              <div>
                <label className="text-sm block mb-1">Comentario (opcional)</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full border rounded p-2" rows={4} />
              </div>

              <div>
                <button type="submit" disabled={submitting} className="bg-green-600 w-full sm:w-auto text-white px-4 py-2 rounded">{submitting ? 'Enviando...' : 'Enviar reseña'}</button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
