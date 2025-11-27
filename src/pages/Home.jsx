import Navbar from "../components/Navbar"
import { Link } from 'react-router-dom'
import Footer from "../components/Footer"
import logo from "../assets/Nuevo_logo_cambiar.png"
import bgImage from "../assets/huerto.jpg"
import localProducts from '../data/products'
import { useEffect, useState } from 'react'
import { getRecords, fileUrl } from '../utils/pocketApi'

const Home = () => {
  const [featured, setFeatured] = useState(localProducts.slice(0, 2))

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // load products and orders from PocketBase
        const [prodRes, ordersRes] = await Promise.allSettled([
          getRecords('products'),
          getRecords('orders')
        ])

        const productsList = (prodRes.status === 'fulfilled' ? (Array.isArray(prodRes.value) ? prodRes.value : (prodRes.value?.items || [])) : [])
        const ordersList = (ordersRes.status === 'fulfilled' ? (Array.isArray(ordersRes.value) ? ordersRes.value : (ordersRes.value?.items || [])) : [])

        // map product by id and by code for fallback
        const prodById = {}
        const prodByCode = {}
        productsList.forEach(p => {
          const imageField = p.image
          const image = imageField && typeof imageField === 'string' && !imageField.startsWith('http')
            ? fileUrl('products', p.id, imageField)
            : imageField
          prodById[String(p.id)] = { ...p, image }
          if (p.code) prodByCode[String(p.code)] = { ...p, image }
        })

        // aggregate sales counts per product key
        const sales = {}
        ordersList.forEach(o => {
          let items = []
          try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []) } catch (e) { items = [] }
          if (!Array.isArray(items)) return
          items.forEach(it => {
            const key = String(it.product || it.productId || it.id || it.code || it._product || it.product_id || '')
            const qty = Number(it.qty ?? it.quantity ?? it.cantidad ?? 1) || 1
            if (!key) return
            sales[key] = (sales[key] || 0) + qty
          })
        })

        // produce ranked list of products that are active/state true
        const ranked = Object.keys(sales)
          .map(k => ({ key: k, sold: sales[k], product: prodById[k] || prodByCode[k] }))
          .filter(x => x.product) // only keep if we can resolve product metadata
          .filter(x => {
            const p = x.product
            if (p.state !== undefined && p.state !== null) return (typeof p.state === 'boolean') ? p.state : String(p.state).toLowerCase() === 'true' || p.state === '1'
            return p.active !== false
          })
          .sort((a, b) => b.sold - a.sold)

        const top = ranked.slice(0, 2).map(x => x.product)
        if (mounted && top.length > 0) {
          setFeatured(top)
          // mark task done
          try { /* noop */ } catch (e) {}
        }
      } catch (e) {
        // fallback stays to localProducts
        console.warn('Could not compute featured from backend', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="home-page">
      <Navbar />

      <header
        className="relative flex items-center justify-center px-4 py-20"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-5xl w-full flex flex-col items-center text-center text-white gap-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Bienvenidos a Huerto Hogar</h1>
          <p className="max-w-2xl text-sm sm:text-base text-white/90">
            Explora productos seleccionados especialmente para ti. Calidad, envío rápido
            y atención personalizada. Encuentra lo que necesitas y recibe ofertas
            exclusivas.
          </p>

          <div className="mt-4">
            <Link to="/products" className="rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700">
              Ver Productos
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-10">
        {/* Destacados: mostramos 2 productos seleccionados */}
        <section className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Destacados</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featured.slice(0,2).map(p => (
              <div key={p.id || p.code} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                <div className="w-full overflow-hidden">
                  <img src={p.image || p.cover || ''} alt={p.title} className="w-full h-auto mx-auto object-contain" />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-sm text-gray-500 mb-1">{p.category}</div>
                  <div className="font-medium text-lg">{p.title}</div>
                  <div className="text-green-600 font-semibold mt-2">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(p.price)}</div>
                  <div className="mt-3 mt-auto">
                    <Link to={`/products?product=${p.id}`} className="inline-block bg-green-600 text-white px-3 py-1 rounded text-sm">Ver producto</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </section>
      </main>

      
    </div>
  )
}

export default Home
