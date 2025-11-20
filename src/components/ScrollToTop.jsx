import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop({ behavior = 'smooth' }) {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    // If there's a hash, try to scroll to the element with that id
    if (hash) {
      // small timeout to allow the route/component to render
      setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) {
          el.scrollIntoView({ behavior, block: 'start' })
          return
        }
        window.scrollTo({ top: 0, behavior })
      }, 50)
    } else {
      window.scrollTo({ top: 0, behavior })
    }
  }, [pathname, search, hash, behavior])

  return null
}
