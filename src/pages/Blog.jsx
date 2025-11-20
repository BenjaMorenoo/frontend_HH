import React, { useEffect, useState } from 'react'
import Navbar from "../components/Navbar"
import { Link } from 'react-router-dom'
import { getRecords, fileUrl } from '../utils/pocketApi'
import { useAuth } from '../context/AuthContext'

const Blog = () => {
  const { isAuthenticated } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'recipe' | 'news'

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        // build query: optional filter by type
        let q = '?sort=-created'
        if (filter && filter !== 'all') {
          const f = encodeURIComponent(`type="${filter}"`)
          q = `?filter=${f}&sort=-created`
        }
        const res = await getRecords('posts', q)
        const records = Array.isArray(res) ? res : (res?.items || [])
        if (mounted) setPosts(records)
      } catch (err) {
        if (mounted) setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [filter])

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Blog</h1>
            <div className="flex items-center gap-3">
              <div className="inline-flex bg-gray-100 rounded overflow-hidden">
                <button onClick={() => setFilter('all')} className={`px-3 py-2 ${filter === 'all' ? 'bg-white font-semibold' : 'text-gray-600'}`}>Todos</button>
                <button onClick={() => setFilter('recipe')} className={`px-3 py-2 ${filter === 'recipe' ? 'bg-white font-semibold' : 'text-gray-600'}`}>Recetas</button>
                <button onClick={() => setFilter('news')} className={`px-3 py-2 ${filter === 'news' ? 'bg-white font-semibold' : 'text-gray-600'}`}>Noticias</button>
              </div>
              {isAuthenticated && <Link to="/blog/new" className="bg-green-600 text-white px-3 py-2 rounded">Crear publicación</Link>}
            </div>
          </div>

        {loading && <div>Cargando publicaciones...</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
          {posts.map(p => (
            <article key={p.id} className="bg-white rounded shadow-sm overflow-hidden flex flex-col h-full">
              {p.cover && (
                <div className="w-full">
                  <img src={fileUrl('posts', p.id, p.cover)} alt={p.title} className="w-full h-40 md:h-48 lg:h-56 object-cover" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg md:text-xl font-medium"><Link to={`/blog/${p.id}`}>{p.title}</Link></h3>
                <p className="text-sm md:text-base text-gray-600 mt-2 flex-1">{p.excerpt || (p.content || '').slice(0,120) + '...'}</p>
                <div className="mt-3 text-xs md:text-sm text-gray-500">Tipo: {p.type}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Blog
