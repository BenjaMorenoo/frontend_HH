import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { getRecords, fileUrl } from '../utils/pocketApi'

export default function Orders() {
  const { user, isAuthenticated } = useAuth()
  const { formatCLP } = useCart()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/orders' } })
      return
    }

    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // request expanded user relation so we can check it client-side
        const res = await getRecords('orders', '?expand=user&sort=-created')
        const records = Array.isArray(res) ? res : (res?.items || [])

        const mine = records.filter(r => {
          // expanded relation will appear as object
          if (r.user && typeof r.user === 'object') return r.user?.id === user?.id
          // fallback if stored as plain id string
          if (typeof r.user === 'string') return r.user === user?.id
          // fallback if relation expanded under "expand" key (older PB responses)
          if (r.expand && r.expand.user && r.expand.user.id) return r.expand.user.id === user?.id
          return false
        })

        if (mounted) setOrders(mine)
      } catch (err) {
        if (mounted) setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [isAuthenticated, user?.id, navigate])

  return (
    <div>
    <Navbar />
    <div className="max-w-4xl mx-auto p-6">
      
      <h2 className="text-2xl font-semibold mb-4">Mis Compras</h2>

      {loading && <div>Cargando compras...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}

      {!loading && orders.length === 0 && (
        <div className="text-sm text-gray-600">Aún no tienes compras registradas.</div>
      )}

      <div className="space-y-4 mt-4">
        {orders.map(o => {
          const created = o.created || o.createdAt || o.created_date || o.createdOn
          const dateText = created ? (new Date(created)).toLocaleString('es-CL') : ''
          const items = (function () { try { const it = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); return Array.isArray(it) ? it : [] } catch (e) { return [] } })()
          const isExpanded = !!expanded[o.id]
          const badgeColor = (status => {
            if (!status) return 'bg-gray-200 text-gray-800'
            const s = String(status).toLowerCase()
            if (s.includes('paid') || s.includes('entregado') || s.includes('completed') ) return 'bg-green-100 text-green-800'
            if (s.includes('pending') || s.includes('pendiente')) return 'bg-yellow-100 text-yellow-800'
            if (s.includes('cancel') || s.includes('anulado')) return 'bg-red-100 text-red-800'
            return 'bg-gray-100 text-gray-800'
          })(o.status)

          return (
            <div key={o.id} className="p-4 border rounded bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-500">Orden <span className="font-mono text-xs">{o.id}</span></div>
                  <div className="mt-1 font-semibold">{o.title || `Pedido ${o.id}`}</div>
                  <div className="text-xs text-gray-500">{dateText}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs ${badgeColor}`}> {o.status || '—'} </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCLP(o.total || 0)}</div>
                    <div className="text-xs text-gray-500">Subtotal {formatCLP(o.subtotal || 0)}</div>
                  </div>
                  <button onClick={() => setExpanded(prev => ({ ...prev, [o.id]: !prev[o.id] }))} className="ml-2 rounded border px-3 py-1 text-sm">{isExpanded ? 'Ocultar' : 'Ver detalle'}</button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 text-sm">
                  <div className="font-medium mb-2">Items</div>
                  <div className="space-y-2">
                    {items.length === 0 && <div className="text-xs text-gray-500">(sin items)</div>}
                    {items.map((it, idx) => {
                      // try to show a thumbnail if available
                      let imgSrc = ''
                      if (it.image && typeof it.image === 'string') {
                        try { imgSrc = fileUrl('products', it.id || it.productId || it.code || '', it.image) } catch (e) { imgSrc = '' }
                      } else if (it.imageUrl) {
                        imgSrc = it.imageUrl
                      }
                      return (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {imgSrc ? (
                              <img src={imgSrc} alt={it.title || it.name || ''} className="w-14 h-14 object-contain rounded"/>
                            ) : (
                              <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">img</div>
                            )}
                            <div>
                              <div className="font-medium">{it.title || it.name || it.id}</div>
                              <div className="text-xs text-gray-500">Cantidad: {it.qty || 1} • Precio unitario {formatCLP(it.price || 0)}</div>
                            </div>
                          </div>
                          <div className="font-medium">{formatCLP((it.price || 0) * (it.qty || 1))}</div>
                        </div>
                      )
                    })}

                  </div>

                  <div className="mt-3 text-xs text-gray-500">Dirección: {o.address || '—'}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
    </div>
  )
}
