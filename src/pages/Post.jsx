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
  const [selectedReview, setSelectedReview] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

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

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && showReviewModal) {
        setShowReviewModal(false)
        setSelectedReview(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showReviewModal])

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
          <div className="prose max-w-none mb-6 whitespace-pre-wrap text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        <section className="mt-6">
          <h3 className="text-lg font-medium mb-3">Reseñas</h3>

          {/* Summary */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-semibold">{reviews.length ? (Math.round((reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length) * 10) / 10) : '—'}</div>
              <div className="text-sm text-gray-500">/ 5</div>
            </div>
            <div className="flex items-center text-yellow-500 text-sm">
              {/* show stars for average (rounded) */}
              {(() => {
                const avg = reviews.length ? Math.round((reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length)) : 0
                return Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`h-4 w-4 ${i < avg ? 'text-yellow-500' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.174c.969 0 1.371 1.24.588 1.81l-3.376 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.376 2.455c-.784.57-1.839-.197-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.631 9.393c-.783-.57-.38-1.81.588-1.81h4.174a1 1 0 00.95-.69L9.05 2.927z" />
                  </svg>
                ))
              })()}
            </div>
            <div className="text-sm text-gray-500">{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</div>
          </div>

          <div className="grid gap-4">
            {reviews.length === 0 && <div className="text-sm text-gray-600">Aún no hay reseñas.</div>}

            {reviews.map(r => {
              const name = r.expand?.user?.primer_nombre || r.expand?.user?.name || r.expand?.user?.email || r.user || 'Anónimo'
              const initials = (name || '').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()
              const created = r.created ? new Date(r.created).toLocaleDateString('es-CL') : null
              return (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setSelectedReview(r); setShowReviewModal(true) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedReview(r); setShowReviewModal(true) } }}
                  className="bg-white p-4 rounded-lg border hover:shadow-lg transform hover:-translate-y-1 transition-shadow transition-transform cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">{initials || 'U'}</div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-800">{name}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-yellow-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                          {created && <div className="text-xs text-gray-400">{created}</div>}
                        </div>
                      </div>
                      {r.comment && <div className="mt-2 text-sm text-gray-700">{r.comment}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
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

        {showReviewModal && selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-50" onClick={() => { setShowReviewModal(false); setSelectedReview(null) }} />

            <div className="relative z-10 bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6 transform transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{selectedReview.expand?.user?.primer_nombre || selectedReview.expand?.user?.name || selectedReview.expand?.user?.email || selectedReview.user || 'Anónimo'}</div>
                  <div className="text-xs text-gray-400">{selectedReview.created ? new Date(selectedReview.created).toLocaleDateString('es-CL') : ''}</div>
                </div>
                <button onClick={() => { setShowReviewModal(false); setSelectedReview(null) }} className="text-gray-500 hover:text-gray-700 ml-4" aria-label="Cerrar reseña">×</button>
              </div>

              <div className="mt-4 text-yellow-500">{'★'.repeat(selectedReview.rating)}{'☆'.repeat(5 - selectedReview.rating)}</div>
              {selectedReview.comment && <div className="mt-4 text-gray-700 whitespace-pre-wrap">{selectedReview.comment}</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
