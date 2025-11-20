import React from 'react'
import logo from '../assets/Nuevo_logo_cambiar.png'
import logo2 from '../assets/logo.png'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'


const Navbar = () => {
  const { setCartOpen, cartCount } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = (() => {
    if (!user) return false
    if (typeof user.role === 'boolean') return user.role === true
    return !!(user.isAdmin || user.is_admin || user.admin === true || user.role === 'admin')
  })()

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
    <header className='bg-white shadow-md'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex items-center gap-4'>
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </div>

          <div className='flex items-center'>
            {/* Desktop nav */}
            <nav className='hidden md:flex md:items-center md:space-x-6'>
              <a href="/" className='hover:underline'>Inicio</a>
              <a href="/products" className='hover:underline'>Productos</a>
              <a href="/blog" className='hover:underline'>Blog</a>
              <a href="/contact" className='hover:underline'>Contacto</a>
              <a href="/about" className='hover:underline'>Acerca de</a>
              {isAdmin && <Link to="/admin" className='hover:underline'>Admin</Link>}
            </nav>

            {/* Search (desktop) */}
            <form onSubmit={onSearchSubmit} className='hidden md:block ml-4'>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Buscar Producto'
                className='border border-gray-300 rounded py-2 px-3 w-64 focus:outline-none'
              />
            </form>

            <div className='flex items-center gap-3 ml-4'>
              <button onClick={() => setCartOpen(true)} className='relative bg-white text-black py-2 px-3 rounded font-bold'>
                <span className='hidden sm:inline'>Carrito</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{cartCount}</span>
                )}
              </button>

              {isAuthenticated ? (
                <div className='hidden md:flex items-center gap-3'>
                  <a href="/profile" className='text-sm text-gray-700 hover:underline'>Hola, {user?.primer_nombre || user?.name || user?.email}</a>
                  <button onClick={() => { logout(); navigate('/products') }} className='bg-red-500 text-white py-2 px-3 rounded text-sm'>Cerrar sesión</button>
                </div>
              ) : (
                <div className='hidden md:flex items-center gap-2'>
                  <a href="/login" className='bg-white text-black py-2 px-3 rounded font-bold'>Iniciar Sesión</a>
                  <a href="/register" className='bg-green-500 text-white py-2 px-3 rounded font-bold'>Registrarse</a>
                </div>
              )}

              {/* Mobile menu button */}
              <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Abrir menú" className='md:hidden ml-2 p-2 rounded hover:bg-gray-100'>
                <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div className={`${mobileOpen ? 'block' : 'hidden'} md:hidden pb-4`}>
            <div className='space-y-2'>
            <a href='/' className='block px-3 py-2 rounded hover:bg-gray-100'>Inicio</a>
            <a href='/products' className='block px-3 py-2 rounded hover:bg-gray-100'>Productos</a>
            <a href='/blog' className='block px-3 py-2 rounded hover:bg-gray-100'>Blog</a>
            <a href='/contact' className='block px-3 py-2 rounded hover:bg-gray-100'>Contacto</a>
            <a href='/about' className='block px-3 py-2 rounded hover:bg-gray-100'>Acerca de</a>
            {isAdmin && (
              <Link to='/admin' onClick={() => setMobileOpen(false)} className='block px-3 py-2 rounded hover:bg-gray-100'>Admin</Link>
            )}

            <form onSubmit={onSearchSubmit} className='px-3 py-2'>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Buscar Producto' className='w-full border border-gray-300 rounded py-2 px-3' />
            </form>

            <div className='px-3 space-y-2'>
              <button onClick={() => { setCartOpen(true); setMobileOpen(false) }} className='w-full text-left py-2 px-3 rounded hover:bg-gray-100'>Carrito {cartCount > 0 ? `(${cartCount})` : ''}</button>
              {isAuthenticated ? (
                <>
                  <a href='/profile' className='block py-2 px-3 rounded hover:bg-gray-100'>Perfil</a>
                  <button onClick={() => { logout(); navigate('/products') }} className='block w-full text-left py-2 px-3 rounded bg-red-500 text-white'>Cerrar sesión</button>
                </>
              ) : (
                <div className='space-y-2'>
                  <a href='/login' className='block py-2 px-3 rounded hover:bg-gray-100'>Iniciar Sesión</a>
                  <a href='/register' className='block py-2 px-3 rounded bg-green-500 text-white'>Registrarse</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
