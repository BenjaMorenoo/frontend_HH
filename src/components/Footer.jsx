import React from "react";
import facebookIcon from "../assets/facebook-svgrepo-com.svg";
import instagramIcon from "../assets/instagram-1-svgrepo-com.svg";
import xIcon from "../assets/X_logo_2023_original.svg";
import logo from '../assets/Nuevo_logo_cambiar.png'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            {/*<h3 className="text-white text-2xl font-bold">HuertoHogar</h3>*/}
            <img src={logo} alt="HuertoHogar" className="h-16 w-auto mr-6 bg-transparent" />
            <p className="mt-4 text-sm text-slate-400">Tu tienda online de productos orgánicos frescos. Conectamos directamente a productores locales con tu hogar para ofrecerte la mejor calidad.</p>

            <div className="flex items-center space-x-3 mt-4">
              <a href="#" aria-label="facebook" className="text-slate-400 hover:text-white">
                <img src={facebookIcon} alt="Facebook" className="h-5 w-5" />
              </a>

              <a href="#" aria-label="instagram" className="text-slate-400 hover:text-white">
                <img src={instagramIcon} alt="Instagram" className="h-5 w-5" />
              </a>

              <a href="#" aria-label="x" className="text-slate-400 hover:text-white">
                <img src={xIcon} alt="X" className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/" className="hover:underline">Inicio</Link></li>
              <li><Link to="/products" className="hover:underline">Productos</Link></li>
              <li><Link to="/blog" className="hover:underline">Blog</Link></li>
              <li><Link to="/about" className="hover:underline">Acerca de Nosotros</Link></li>
              <li><Link to="/contact" className="hover:underline">Contacto</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Categorías</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/products?category=Verduras" className="hover:underline">Verduras</Link></li>
              <li><Link to="/products?category=Frutas" className="hover:underline">Frutas</Link></li>
              <li><Link to="/products?category=Hierbas" className="hover:underline">Hierbas</Link></li>
              <li><Link to="/products?category=Lácteos" className="hover:underline">Lácteos</Link></li>
              <li><Link to="/products?category=Granos" className="hover:underline">Granos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <ul className="text-sm text-slate-400 space-y-3">
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"/></svg>
                <span>Av. Calle falsa, Concepcioón, Chile</span>
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16.5v3a1.5 1.5 0 01-1.6 1.5c-8.8-.9-15.9-8-16.8-16.8A1.5 1.5 0 015.5 2h3A1.5 1.5 0 0110 3.4c0 .6-.2 1.4-.6 2.1-.4.8-.9 1.6-1.4 2.1.9 2.1 2.8 4 4.9 4.9.6-.5 1.3-1 2.1-1.4.7-.4 1.5-.6 2.1-.6A1.5 1.5 0 0120.6 14v2.5z"/></svg>
                <span>+56 9 1234-5678</span>
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                <span>info@huertohogar.cl</span>
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
            <Link to="/privacy" className="hover:underline">Política de Privacidad</Link>
            <Link to="/terms" className="hover:underline">Términos de Servicio</Link>
            <Link to="/cookies" className="hover:underline">Política de Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
