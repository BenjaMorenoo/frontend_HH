import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { getRecords } from '../utils/pocketApi'

export default function Orders() {
  const { user, isAuthenticated } = useAuth()
  const { formatCLP } = useCart()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        {orders.map(o => (
          <div key={o.id} className="p-4 border rounded">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-500">Orden ID: <span className="font-mono text-xs">{o.id}</span></div>
                <div className="font-medium">Estado: {o.status || 'n/a'}</div>
                <div className="text-sm text-gray-600">Método: {o.paymentMethod || '—'}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCLP(o.total || 0)}</div>
                <div className="text-xs text-gray-500">Subtotal {formatCLP(o.subtotal || 0)}</div>
              </div>
            </div>

            <div className="mt-3 text-sm">
              <div className="font-medium">Items</div>
              <div className="mt-1 space-y-1">
                {(function renderItems() {
                  try {
                    const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || [])
                    if (!Array.isArray(items) || items.length === 0) return <div className="text-xs text-gray-500">(sin items)</div>
                    return items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div>{it.title || it.name || it.id} <span className="text-xs text-gray-500">x{it.qty || 1}</span></div>
                        <div className="text-gray-700">{formatCLP((it.price || 0) * (it.qty || 1))}</div>
                      </div>
                    ))
                  } catch (e) {
                    return <div className="text-xs text-gray-500">No se pudieron leer los items</div>
                  }
                })()}
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">Dirección: {o.address || '—'}</div>
          </div>
        ))}
      </div>
    </div>
    </div>
  )
}
