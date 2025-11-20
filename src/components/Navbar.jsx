import React from 'react'
import logo from '../assets/Nuevo_logo_cambiar.png'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'


const Navbar = () => {
  const { setCartOpen, cartCount, displayCartCount } = useCart()
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

  // live search: navigate to /products?q=... while typing (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      const qTrim = (query || '').trim()
      const currentQ = new URLSearchParams(location.search).get('q') || ''
      if (qTrim === currentQ) return
      if (!qTrim) navigate('/products')
      else navigate(`/products?q=${encodeURIComponent(qTrim)}`)
    }, 300)
    return () => clearTimeout(handler)
  // include location.search so we don't navigate unnecessarily
  }, [query, location.search, navigate])

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
          <div className='flex items-center gap-4 mr-6 md:mr-8'>
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </div>

          <div className='flex items-center'>
            {/* Desktop nav */}
            <nav className='hidden md:flex md:items-center divide-x divide-gray-200'>
              <div className='px-3'><a href="/" className='hh-nav-link'><span className='hover:underline'>Inicio</span><span className='hh-icon' aria-hidden>🌱</span></a></div>
              <div className='px-3'><a href="/products" className='hh-nav-link'><span className='hover:underline'>Productos</span><span className='hh-icon' aria-hidden>🥕</span></a></div>
              <div className='px-3'><a href="/blog" className='hh-nav-link'><span className='hover:underline'>Blog</span><span className='hh-icon' aria-hidden>📰</span></a></div>
              <div className='px-3'><a href="/contact" className='hh-nav-link'><span className='hover:underline'>Contacto</span><span className='hh-icon' aria-hidden>✉️</span></a></div>
              <div className='px-3'><a href="/about" className='hh-nav-link'><span className='hover:underline'>Acerca de</span><span className='hh-icon' aria-hidden>🏡</span></a></div>
              {isAdmin && <div className='px-3'><Link to="/admin" className='hover:underline'>Admin</Link></div>}
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
              <div className='hidden md:flex items-center divide-x divide-gray-200'>
                <div className='pr-3 flex items-center'>
                  <button onClick={() => setCartOpen(true)} aria-label="Abrir carrito" className='relative bg-white text-black py-2 px-3 rounded font-bold cursor-pointer flex items-center justify-center'>
                    <span className='text-lg' aria-hidden>🛒</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">{displayCartCount}</span>
                    )}
                  </button>
                </div>

                {isAuthenticated ? (
                  <>
                    <div className='px-3 pl-4 flex items-center'>
                      <a href="/profile" className='text-sm text-gray-700 hover:underline'>Hola, {user?.primer_nombre || user?.name || user?.email}</a>
                    </div>
                    <div className='pl-3 flex items-center'>
                      <button onClick={() => { logout(); navigate('/products') }} className='bg-red-500 text-white px-2 py-1 rounded text-xs'>Cerrar sesión</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='px-3 pl-4 flex items-center'>
                      <a href="/login" className='hh-nav-link'><span className='hover:underline'>Iniciar Sesión</span></a>
                    </div>
                    <div className='pl-3 flex items-center'>
                      <a href="/register" className='hh-nav-link bg-green-500 text-white px-3 py-1 rounded'>
                        <span className='hover:underline'>Registrarse</span>
                      </a>
                    </div>
                  </>
                )}
              </div>

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
            <a href='/' className='block px-3 py-2 rounded hover:bg-gray-100 hh-nav-link'><span className='hover:underline'>Inicio</span><span className='hh-icon' aria-hidden>🌱</span></a>
            <a href='/products' className='block px-3 py-2 rounded hover:bg-gray-100 hh-nav-link'><span className='hover:underline'>Productos</span><span className='hh-icon' aria-hidden>🥕</span></a>
            <a href='/blog' className='block px-3 py-2 rounded hover:bg-gray-100 hh-nav-link'><span className='hover:underline'>Blog</span><span className='hh-icon' aria-hidden>📰</span></a>
            <a href='/contact' className='block px-3 py-2 rounded hover:bg-gray-100 hh-nav-link'><span className='hover:underline'>Contacto</span><span className='hh-icon' aria-hidden>✉️</span></a>
            <a href='/about' className='block px-3 py-2 rounded hover:bg-gray-100 hh-nav-link'><span className='hover:underline'>Acerca de</span><span className='hh-icon' aria-hidden>🏡</span></a>
            {isAdmin && (
              <Link to='/admin' onClick={() => setMobileOpen(false)} className='block px-3 py-2 rounded hover:bg-gray-100'>Admin</Link>
            )}

            <form onSubmit={onSearchSubmit} className='px-3 py-2'>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Buscar Producto' className='w-full border border-gray-300 rounded py-2 px-3' />
            </form>

            <div className='px-3 space-y-2'>
              <button onClick={() => { setCartOpen(true); setMobileOpen(false) }} className='w-full text-left py-2 px-3 rounded hover:bg-gray-100'>Carrito {cartCount > 0 ? `(${displayCartCount})` : ''}</button>
              {isAuthenticated ? (
                <>
                  <a href='/profile' className='block py-2 px-3 rounded hover:bg-gray-100'>Perfil</a>
                  <button onClick={() => { logout(); navigate('/products') }} className='block w-full text-left py-2 px-3 rounded bg-red-500 text-white'>Cerrar sesión</button>
                </>
              ) : (
                  <div className='space-y-2'>
                  <a href='/login' className='block py-2 px-3 hh-nav-link'>Iniciar Sesión</a>
                  <a href='/register' className='block py-2 px-3 hh-nav-link bg-green-500 text-white rounded'>Registrarse</a>
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
