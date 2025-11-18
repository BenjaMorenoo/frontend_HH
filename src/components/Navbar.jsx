import React from 'react'
import logo from '../assets/Nuevo_logo_cambiar.png'
import logo2 from '../assets/logo.png'


const Navbar = () => {
  return (
    <header className='p-4 bg-white shadow-md'>
      <div className='mx-auto flex items-center justify-between'>       
  <img src={logo} alt="Logo" className="h-16 w-auto mr-6" />

        <nav>
          <ul className='flex items-center space-x-6'>
            <li className='hover:underline'><a href="/">Inicio</a></li>
            <li className='hover:underline'><a href="/products">Productos</a></li>
            <li className='hover:underline'><a href="/blog">Blog</a></li>
            <li className='hover:underline'><a href="/contact">Contacto</a></li>
            <li className='hover:underline'><a href="/about">Acerca de</a></li>

            <li>
              <input className='border border-gray-300 rounded py-2 px-4 w-64' type="text" placeholder='Buscar Producto' />
            </li>

            <li className='flex items-center space-x-2'>
              <button className='bg-white text-black py-2 px-4 rounded font-bold '>Carrito</button>

              <a href="/login" className='bg-white text-black py-2 px-4 rounded font-bold'>Iniciar Sesión</a>
              <a href="/register" className='bg-green-500 text-white py-2 px-4 rounded font-bold'>Registrarse</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
