import React, { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function CartPanel() {
  const { cart, cartOpen, setCartOpen, updateQty, removeFromCart, cartTotal, formatCLP, clearCart } = useCart()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showToast, setShowToast] = useState(false)
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

      {/* Panel: slide from right (minimal) */}
      <aside
        aria-hidden={!cartOpen}
        className={`relative ml-auto w-full max-w-sm bg-white p-4 border-l border-gray-100 transform transition-transform duration-300 ease-out ${cartOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full'}`}
      >
        <button
          aria-label="Cerrar carrito"
          onClick={() => setCartOpen(false)}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 p-1 rounded focus:outline-none cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-800">Tu carrito</h3>
        </div>
        {cart.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Tu carrito está vacío.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {cart.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between transform transition-all duration-200 ease-out ${cartOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                style={{ transitionDelay: `${idx * 75}ms` }}
              >
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.title} className="h-10 w-10 object-contain" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="text-xs text-gray-400">{formatCLP(item.price)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min="1" value={item.qty} onChange={(e) => updateQty(item.id, Number(e.target.value))} className="w-14 rounded border px-2 py-1 text-sm" />
                  <button onClick={() => removeFromCart(item.id)} className="text-sm text-red-500">Eliminar</button>
                </div>
              </div>
            ))}

            <div className="mt-2 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Total</div>
                <div className="text-sm font-semibold">{formatCLP(cartTotal)}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login', { state: { from: '/checkout' } })
                    } else {
                      navigate('/checkout')
                      setCartOpen(false)
                    }
                  }}
                  disabled={cart.length === 0}
                  className="flex-1 rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >Ir a pagar</button>
                <button
                  onClick={() => { if (cart.length === 0) return; setShowConfirm(true) }}
                  disabled={cart.length === 0}
                  className="rounded border px-3 py-2 text-sm text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >Vaciar</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm dialog (styled) */}
        {showConfirm && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <div className="bg-white rounded p-3 shadow-sm w-11/12 max-w-xs text-center">
              <p className="mb-3 text-sm text-gray-600">¿Estás seguro de vaciar el carrito? Esta acción no se puede deshacer.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    clearCart()
                    setShowConfirm(false)
                    setShowToast(true)
                    setTimeout(() => setShowToast(false), 2500)
                  }}
                  className="bg-red-600 text-white px-3 py-2 rounded text-sm"
                >Sí, vaciar</button>
                <button onClick={() => setShowConfirm(false)} className="border px-3 py-2 rounded text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {showToast && (
          <div className="absolute top-4 right-4 z-40">
            <div className="bg-green-600 text-white px-3 py-1 rounded shadow-sm text-sm">Carrito vaciado</div>
          </div>
        )}
      </aside>
    </div>
  )
}
