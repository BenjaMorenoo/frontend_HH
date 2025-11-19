import React, { useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function CartPanel() {
  const { cart, cartOpen, setCartOpen, updateQty, removeFromCart, cartTotal, formatCLP } = useCart()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  useEffect(() => {
    if (!cartOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') setCartOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cartOpen, setCartOpen])

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-none">
      {/* Overlay: fade in/out */}
      <div
        aria-hidden={!cartOpen}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}
        onClick={() => setCartOpen(false)}
      />

      {/* Panel: slide from right */}
      <aside
        aria-hidden={!cartOpen}
        className={`relative ml-auto w-full max-w-md bg-white p-6 shadow-lg transform transition-transform duration-300 ease-out ${cartOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full'}`}
      >
        <h3 className="text-lg font-semibold">Tu carrito</h3>
        {cart.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">Tu carrito está vacío.</p>
        ) : (
          <div className="mt-4 space-y-4">
              {cart.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between transform transition-all duration-300 ease-out ${cartOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                  style={{ transitionDelay: `${idx * 75}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.title} className="h-12 w-12 object-cover rounded" />
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500">{formatCLP(item.price)}{item.unit ? ` ${item.unit.replace(/^CLP\\s*/,'')}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" value={item.qty} onChange={(e) => updateQty(item.id, Number(e.target.value))} className="w-16 rounded border p-1 text-sm" />
                    <button onClick={() => removeFromCart(item.id)} className="text-sm text-red-600">Eliminar</button>
                  </div>
                </div>
              ))}

              <div className="mt-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Total</div>
                <div className="text-lg font-semibold">{formatCLP(cartTotal)}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      // send to login and then forward to checkout
                      navigate('/login', { state: { from: '/checkout' } })
                    } else {
                      navigate('/checkout')
                      setCartOpen(false)
                    }
                  }}
                  disabled={cart.length === 0}
                  className="w-full rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >Ir a pagar</button>
                <button onClick={() => setCartOpen(false)} className="w-full rounded border px-4 py-2">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
