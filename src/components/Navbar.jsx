import React from 'react'
import logo from '../assets/Nuevo_logo_cambiar.png'
import logo2 from '../assets/logo.png'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'


const Navbar = () => {
  const { setCartOpen, cartCount } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // sync query input when on /products and q param exists
  useEffect(() => {
    if (location.pathname === '/products') {
      const q = searchParams.get('q') || ''
      setQuery(q)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, searchParams])

  const onSearchSubmit = (e) => {
    e.preventDefault()
    const q = (query || '').trim()
    if (!q) {
      navigate('/products')
      return
    }
    navigate(`/products?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className='p-4 bg-white shadow-md'>
      <div className='mx-auto flex items-center justify-between'>       
  <img src={logo} alt="Logo" className="h-16 w-auto mr-6" />

        <nav>
          <ul className='flex items-center space-x-6'>
            <li className='hover:underline'><a href="/">Inicio</a></li>
            <li className='hover:underline'><a href="/products">Productos</a></li>
            {isAuthenticated && (
              <li className='hover:underline'><a href="/orders">Mis Compras</a></li>
            )}
            <li className='hover:underline'><a href="/blog">Blog</a></li>
            <li className='hover:underline'><a href="/contact">Contacto</a></li>
            <li className='hover:underline'><a href="/about">Acerca de</a></li>

            {/* search form renders below */}

            <li className='flex items-center space-x-2'>
              <form onSubmit={onSearchSubmit} className='mr-4'>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Buscar Producto'
                  className='border border-gray-300 rounded py-2 px-4 w-64'
                />
              </form>
              <button onClick={() => setCartOpen(true)} className='relative bg-white text-black py-2 px-4 rounded font-bold '>
                Carrito
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{cartCount}</span>
                )}
              </button>

              {isAuthenticated ? (
                <div className='flex items-center gap-3'>
                  <a href="/profile" className='text-sm text-gray-700 hover:underline'>Hola, {user?.primer_nombre || user?.name || user?.email}</a>
                  <button onClick={() => { logout(); navigate('/products') }} className='bg-red-500 text-white py-2 px-3 rounded text-sm'>Cerrar sesión</button>
                </div>
              ) : (
                <>
                  <a href="/login" className='bg-white text-black py-2 px-4 rounded font-bold'>Iniciar Sesión</a>
                  <a href="/register" className='bg-green-500 text-white py-2 px-4 rounded font-bold'>Registrarse</a>
                </>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
