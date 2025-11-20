import React, { useState, useEffect } from "react"
import { useLocation, useSearchParams } from 'react-router-dom'
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import products from "../data/products"
import { useCart } from "../context/CartContext"
import { getRecords, fileUrl } from "../utils/pocketApi"

const sampleProducts = products

const Products = () => {
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('Todas')
  const { addToCart, formatCLP } = useCart()
  const [modalQty, setModalQty] = useState(1)

  useEffect(() => {
    if (selected) setModalQty(1)
  }, [selected])

  const categories = ['Todas', ...Array.from(new Set(sampleProducts.map(p => p.category)))]
  const [productsList, setProductsList] = useState(sampleProducts)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const productParam = searchParams.get('product') || ''

  // apply category filter then search filter
  const byCategory = category === 'Todas' ? productsList : productsList.filter(p => p.category === category)
  const filtered = q
    ? byCategory.filter(p => {
        const term = q.toLowerCase()
        return (
          (p.title || '').toLowerCase().includes(term) ||
          (p.code || '').toLowerCase().includes(term) ||
          (p.category || '').toLowerCase().includes(term) ||
          (p.description || '').toLowerCase().includes(term)
        )
      })
    : byCategory

  // load products from PocketBase (fallback to local sampleProducts)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await getRecords('products')
        if (!mounted) return
        const items = (res.items || []).map(item => {
          // normalize image field: if it's a filename from PocketBase, build full URL
          const imageField = item.image
          const image = imageField && typeof imageField === 'string' && !imageField.startsWith('http')
            ? fileUrl('products', item.id, imageField)
            : imageField
          return { ...item, image }
        })
        setProductsList(items)
      } catch (e) {
        console.warn('Could not load products from PocketBase, using local data', e)
        setProductsList(sampleProducts)
      }
    })()
    return () => { mounted = false }
  }, [])

  // open specific product modal when ?product=<id> is present
  useEffect(() => {
    if (!productParam) {
      // if no product param, don't override manual selection
      return
    }
    // try to find in loaded products list first, then fallback to sampleProducts
    const found = productsList.find(p => String(p.id) === String(productParam)) || sampleProducts.find(p => String(p.id) === String(productParam))
    if (found) setSelected(found)
  }, [productParam, productsList])

  

  return (
    <div className="products-page min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-semibold mb-6">Productos</h1>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
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
            {q && (
              <div className="text-sm text-gray-600">Resultados para: <span className="font-medium">"{q}"</span></div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="group block transform overflow-hidden rounded-lg bg-white shadow hover:scale-105 transition h-64 flex flex-col"
            >
              <div className="h-40 w-full flex items-center justify-center overflow-hidden">
                <img src={p.image} alt={p.title} className="h-full w-auto max-w-full object-contain mx-auto" />
              </div>
              <div className="p-4 text-left flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">{p.code} - {p.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{formatCLP(p.price)}{p.unit ? ` ${p.unit.replace(/^CLP\s*/,'')}` : ''}</p>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-gray-500">Stock: {p.stock ?? '—'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Cart is now global — floating button and panel rendered by App */}

        {/* Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />

            <div className="relative z-10 w-[920px] max-w-[95%] max-h-[90%] rounded-lg bg-white shadow-lg overflow-hidden">
              <button onClick={() => setSelected(null)} aria-label="Cerrar" className="absolute right-3 top-3 rounded p-1 text-gray-600 hover:bg-gray-100">
                ✕
              </button>

              <div className="flex flex-col md:flex-row h-full">
                {/* Image column */}
                <div className="md:w-1/2 w-full bg-gray-50 flex items-center justify-center p-6">
                  <img src={selected.image} alt={selected.title} className="max-h-[420px] max-w-full object-contain" />
                </div>

                {/* Details column */}
                <div className="md:w-1/2 w-full p-6 flex flex-col">
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold leading-tight">{selected.title}</h2>
                        <div className="mt-2 text-sm text-gray-500">Código: <span className="font-medium text-gray-700">{selected.code}</span></div>
                        {selected.category && <div className="mt-2 inline-block bg-green-50 text-green-700 px-2 py-1 rounded text-xs">{selected.category}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-xl text-gray-500">{selected.unit ? selected.unit.replace(/^CLP\s*/,'') : ''}</div>
                        <div className="text-3xl font-extrabold text-gray-900 mt-2">{formatCLP(selected.price)}</div>
                      </div>
                    </div>

                    <div className="mt-4 text-gray-700 whitespace-pre-line">{selected.description}</div>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded">
                        <button onClick={() => setModalQty(q => Math.max(1, q - 1))} className="px-3 py-2">-</button>
                        <input type="number" min="1" value={modalQty} onChange={(e) => setModalQty(Math.max(1, Number(e.target.value) || 1))} className="w-16 text-center border-l border-r p-2" />
                        <button onClick={() => setModalQty(q => q + 1)} className="px-3 py-2">+</button>
                      </div>

                      <button onClick={() => { addToCart(selected, modalQty); setSelected(null); }} className="ml-auto rounded bg-green-600 px-6 py-3 text-white font-semibold">Agregar {modalQty > 1 ? `(${modalQty})` : ''}</button>
                      <button onClick={() => setSelected(null)} className="rounded border px-4 py-3">Cerrar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      
    </div>
  )
}

export default Products
