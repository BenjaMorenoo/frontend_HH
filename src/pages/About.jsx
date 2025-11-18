import React, { useEffect, useRef } from "react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

const About = () => {
  const mapRef = useRef(null)

  useEffect(() => {
    // Dynamically load Leaflet if it's not already available, then init the map
    const loadLeaflet = () => {
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('no window'))
        if (window.L) return resolve(window.L)

        // add css if not present
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        // add script
        const existing = document.querySelector('script[src*="leaflet"]')
        if (existing) {
          existing.addEventListener('load', () => resolve(window.L))
          existing.addEventListener('error', () => reject(new Error('failed to load leaflet')))
          return
        }

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.async = true
        script.onload = () => {
          if (window.L) resolve(window.L)
          else reject(new Error('Leaflet loaded but window.L missing'))
        }
        script.onerror = () => reject(new Error('failed to load leaflet'))
        document.body.appendChild(script)
      })
    }

    if (mapRef.current) return
    let mounted = true

    loadLeaflet().then(L => {
      if (!mounted) return

      // create a minimalistic map: CartoDB Positron (light, minimal)
      // hide the default zoom control for a cleaner look
      const map = L.map('map', { zoomControl: false }).setView([-35.6751, -71.5430], 5)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
      }).addTo(map)

      const points = [
        { name: 'Santiago', coords: [-33.4489, -70.6693], emoji: '🍎' },
        { name: 'Puerto Montt', coords: [-41.4694, -72.9428], emoji: '🍯' },
        { name: 'Villarrica', coords: [-39.2869, -72.2270], emoji: '🌾' },
        { name: 'Nacimiento', coords: [-37.5757, -72.4106], emoji: '🌶️' },
        { name: 'Viña del Mar', coords: [-33.0245, -71.5516], emoji: '🍌' },
        { name: 'Valparaíso', coords: [-33.0472, -71.6127], emoji: '🍊' },
        { name: 'Concepción', coords: [-36.8201, -73.0444], emoji: '🥕' }
      ]

      // create emoji markers and fit map to their bounds
      const markers = points.map(p => {
        const emojiHtml = `<div style="font-size:20px;line-height:36px;text-align:center">${p.emoji}</div>`
        const emojiIcon = L.divIcon({
          html: emojiHtml,
          className: 'hh-emoji-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
        })

        const m = L.marker(p.coords, { icon: emojiIcon }).addTo(map)
        const popupHtml = `
          <div style="display:flex;align-items:center;gap:8px;">
            <img src="/src/assets/logo.png" alt="logo" style="width:28px;height:28px;border-radius:6px;object-fit:cover;" />
            <strong style="font-size:14px">${p.name}</strong>
            <span style="margin-left:8px">🇨🇱</span>
          </div>
        `
        m.bindPopup(popupHtml)
        return m
      })

      if (markers.length > 0) {
        const latlngs = points.map(p => p.coords)
        const bounds = L.latLngBounds(latlngs)
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 })
      }

      mapRef.current = map
    }).catch(err => console.error('Leaflet load/init error:', err))

    return () => {
      mounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-lg overflow-hidden mb-8 shadow-sm">
          <img src="/src/assets/huerto.jpg" alt="Huerto" className="w-full h-48 object-cover" />
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold mb-4">Acerca de HuertoHogar</h1>

        <section className="prose prose-lg text-gray-700 mb-8">
          <p>
            HuertoHogar es una tienda online dedicada a llevar la frescura y calidad de los productos del campo directamente a la puerta de nuestros clientes en Chile. Con más de 6 años de experiencia, operamos en más de 9 puntos a lo largo del país, incluyendo ciudades clave como Santiago, Puerto Montt, Villarica, Nacimiento, Viña del Mar, Valparaíso y Concepción. Nuestra misión es conectar a las familias chilenas con el campo, promoviendo un estilo de vida saludable y sostenible.
          </p>
        </section>

        <div className="grid gap-8 md:grid-cols-2">
          <article className="bg-white rounded-lg p-6 shadow-sm flex gap-4 items-start">
            <img src="/src/assets/huerto.jpg" alt="Misión - Huerto" className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Misión</h2>
              <p className="text-gray-700">
                Nuestra misión es proporcionar productos frescos y de calidad directamente desde el campo hasta la puerta de nuestros clientes, garantizando la frescura y el sabor en cada entrega. Nos comprometemos a fomentar una conexión más cercana entre los consumidores y los agricultores locales, apoyando prácticas agrícolas sostenibles y promoviendo una alimentación saludable en todos los hogares chilenos.
              </p>
            </div>
          </article>

          <article className="bg-white rounded-lg p-6 shadow-sm flex gap-4 items-start">
            <img src="/src/assets/miel.jpg" alt="Visión - Miel" className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Visión</h2>
              <p className="text-gray-700">
                Nuestra visión es ser la tienda online líder en la distribución de productos frescos y naturales en Chile, reconocida por nuestra calidad excepcional, servicio al cliente y compromiso con la sostenibilidad. Aspiramos a expandir nuestra presencia a nivel nacional e internacional, estableciendo un nuevo estándar en la distribución de productos agrícolas directos del productor al consumidor.
              </p>
            </div>
          </article>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Puntos de distribución</h3>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div id="map" className="w-full h-64 md:h-80 rounded"></div>
            <p className="mt-3 text-sm text-gray-600">Nuestros puntos principales en Chile. Haz zoom y mueve el mapa para explorar.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default About
