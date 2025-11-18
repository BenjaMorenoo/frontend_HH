import React from "react";
import logo from '../assets/Nuevo_logo_cambiar.png'
import logo2 from '../assets/logo.png'

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            {/*<h3 className="text-white text-2xl font-bold">HuertoHogar</h3>*/}
            <img src={logo2} alt="Logo" className="h-16 w-auto mr-6" />
            <p className="mt-4 text-sm text-slate-400">Tu tienda online de productos orgánicos frescos. Conectamos directamente a productores locales con tu hogar para ofrecerte la mejor calidad.</p>

            <div className="flex items-center space-x-3 mt-4">
              <a href="#" aria-label="facebook" className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12a10 10 0 10-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12H20l-1 3h-2.3v7A10 10 0 0022 12z" />
                </svg>
              </a>

              <a href="#" aria-label="instagram" className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 6.5A4.5 4.5 0 1016.5 13 4.5 4.5 0 0012 8.5zM18 7.2a1.2 1.2 0 11-1.2-1.2A1.2 1.2 0 0118 7.2z" />
                </svg>
              </a>

              <a href="#" aria-label="twitter" className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 5.92c-.63.28-1.3.47-2 .56a3.48 3.48 0 001.52-1.92 6.9 6.9 0 01-2.2.84 3.46 3.46 0 00-5.9 3.15A9.81 9.81 0 013 4.79a3.46 3.46 0 001.07 4.62 3.42 3.42 0 01-1.57-.43v.04a3.46 3.46 0 002.77 3.39 3.5 3.5 0 01-1.56.06 3.47 3.47 0 003.24 2.4A6.94 6.94 0 012 19.54a9.79 9.79 0 005.29 1.55c6.35 0 9.84-5.26 9.84-9.84v-.45A7 7 0 0022 5.92z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:underline">Inicio</a></li>
              <li><a href="#" className="hover:underline">Productos</a></li>
              <li><a href="#" className="hover:underline">Blog</a></li>
              <li><a href="#" className="hover:underline">Acerca de Nosotros</a></li>
              <li><a href="#" className="hover:underline">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Categorías</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:underline">Verduras</a></li>
              <li><a href="#" className="hover:underline">Frutas</a></li>
              <li><a href="#" className="hover:underline">Hierbas</a></li>
              <li><a href="#" className="hover:underline">Lácteos</a></li>
              <li><a href="#" className="hover:underline">Granos</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <ul className="text-sm text-slate-400 space-y-3">
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"/></svg>
                <span>Av. Principal 123, Ciudad, País</span>
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16.5v3a1.5 1.5 0 01-1.6 1.5c-8.8-.9-15.9-8-16.8-16.8A1.5 1.5 0 015.5 2h3A1.5 1.5 0 0110 3.4c0 .6-.2 1.4-.6 2.1-.4.8-.9 1.6-1.4 2.1.9 2.1 2.8 4 4.9 4.9.6-.5 1.3-1 2.1-1.4.7-.4 1.5-.6 2.1-.6A1.5 1.5 0 0120.6 14v2.5z"/></svg>
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                <span>info@huertohogar.com</span>
              </li>
            </ul>

            <div className="mt-4">
              <label className="text-sm text-slate-400 block mb-2">Newsletter</label>
              <div className="flex">
                <input placeholder="Tu email" className="w-full rounded-l-md px-3 py-2 bg-slate-800 text-sm placeholder-slate-400 border border-slate-700 focus:outline-none" />
                <button className="bg-green-600 text-white rounded-r-md px-4">Suscribirse</button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-slate-400">
          <p>© {new Date().getFullYear()} HuertoHogar. Todos los derechos reservados.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:underline">Política de Privacidad</a>
            <a href="#" className="hover:underline">Términos de Servicio</a>
            <a href="#" className="hover:underline">Política de Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
