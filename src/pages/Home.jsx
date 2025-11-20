import Navbar from "../components/Navbar"
import { Link } from 'react-router-dom'
import Footer from "../components/Footer"
import logo from "../assets/Nuevo_logo_cambiar.png"
import bgImage from "../assets/huerto.jpg"
import products from '../data/products'

const Home = () => {
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
            {products.slice(0,2).map(p => (
              <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                <div className="w-full overflow-hidden">
                  <img src={p.image} alt={p.title} className="w-full h-auto mx-auto" />
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
