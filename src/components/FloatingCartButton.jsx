import React from 'react'
import { useCart } from '../context/CartContext'
import { FiShoppingCart } from 'react-icons/fi'

export default function FloatingCartButton() {
  const { setCartOpen, cartCount, displayCartCount } = useCart()

  return (
    <div className="fixed right-6 bottom-6 z-40">
      <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 rounded-full bg-green-600 p-3 text-white shadow-lg">
        <FiShoppingCart className="h-5 w-5" />
        <span className="sr-only">Abrir carrito</span>
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">{displayCartCount}</span>
        )}
      </button>
    </div>
  )
}
