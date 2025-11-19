import Navbar from "../components/Navbar"
import { Link } from 'react-router-dom'
import Footer from "../components/Footer"
import logo from "../assets/Nuevo_logo_cambiar.png"
import bgImage from "../assets/huerto.jpg"

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
          <h1 className="text-3xl sm:text-4xl font-bold">Bienvenido a Nuestra Tienda</h1>
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
        {/* Aquí puedes mantener el contenido restante del home (destacados, carrusel, etc.) */}
        <section className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Destacados</h2>
          <p className="text-gray-700">Próximamente mostraremos productos destacados aquí.</p>
        </section>
      </main>

      
    </div>
  )
}

export default Home
