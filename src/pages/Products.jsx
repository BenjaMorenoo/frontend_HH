import React, { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import products from "../data/products"

const sampleProducts = products

const Products = () => {
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('Todas')
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('cart')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)

  const categories = ['Todas', ...Array.from(new Set(sampleProducts.map(p => p.category)))]
  const filtered = category === 'Todas' ? sampleProducts : sampleProducts.filter(p => p.category === category)

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart))
    } catch (e) {}
  }, [cart])

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const found = prev.find(i => i.id === product.id)
      if (found) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i)
      }
      return [...prev, { ...product, qty }]
    })
    setSelected(null)
    setCartOpen(true)
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeFromCart(id)
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const cartCount = cart.reduce((s, i) => s + (i.qty || 0), 0)
  const cartTotal = cart.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0)

  const formatCLP = (value) => {
    try {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)
    } catch (e) {
      return `${value}`
    }
  }

  return (
    <div className="products-page min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-semibold mb-6">Productos</h1>

        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded ${c === category ? 'bg-green-600 text-white' : 'bg-white border'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="group block transform overflow-hidden rounded-lg bg-white shadow hover:scale-105 transition"
            >
                  <div className="h-40 w-full flex items-center justify-center overflow-hidden">
                <img src={p.image} alt={p.title} className="h-full w-auto max-w-full object-contain mx-auto" />
              </div>
              <div className="p-4 text-left">
                <h3 className="text-sm font-medium text-gray-800">{p.code} - {p.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{formatCLP(p.price)}{p.unit ? ` ${p.unit.replace(/^CLP\s*/,'')}` : ''}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Cart floating button */}
        <div className="fixed right-6 bottom-6 z-40">
          <button onClick={() => setCartOpen(true)} className="relative rounded-full bg-green-600 p-3 text-white shadow-lg">
            Carrito
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">{cartCount}</span>
            )}
          </button>
        </div>

        {/* Cart panel */}
        {cartOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
            <div className="relative ml-auto w-full max-w-md bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold">Tu carrito</h3>
              {cart.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">Tu carrito está vacío.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.title} className="h-12 w-12 object-cover rounded" />
                        <img src={item.image} alt={item.title} className="h-12 w-auto object-contain rounded mx-auto" />
                        <div>
                          <div className="text-sm font-medium">{item.title}</div>
                            <div className="text-xs text-gray-500">{formatCLP(item.price)}{item.unit ? ` ${item.unit.replace(/^CLP\s*/,'')}` : ''}</div>
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
                      <button className="w-full rounded bg-green-600 px-4 py-2 text-white">Ir a pagar</button>
                      <button onClick={() => setCartOpen(false)} className="w-full rounded border px-4 py-2">Cerrar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />

              <div className="relative z-10 w-[820px] max-w-[95%] h-[560px] max-h-[95%] rounded-lg bg-white shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-[410px] w-full h-56 md:h-full overflow-hidden flex items-center justify-center">
                    <img src={selected.image} alt={selected.title} className="max-h-[100%] max-w-[100%] object-contain object-center" />
                </div>
                <div className="flex-1 w-full p-6 flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <h2 className="text-2xl font-semibold">{selected.title}</h2>
                    <p className="mt-3 text-gray-700">{selected.description}</p>
                    <p className="mt-4 text-xl font-bold">{formatCLP(selected.price)}{selected.unit ? ` ${selected.unit.replace(/^CLP\s*/,'')}` : ''}</p>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button onClick={() => addToCart(selected)} className="flex-1 rounded bg-green-600 px-4 py-2 text-white">Agregar al carrito</button>
                    <button onClick={() => setSelected(null)} className="flex-1 rounded border px-4 py-2">Cerrar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Products
