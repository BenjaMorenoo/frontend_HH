import React, { createContext, useContext, useEffect, useState } from 'react'
import { getRecords, createRecordForm, createRecord, updateRecord, deleteRecord, fileUrl } from '../utils/pocketApi'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('cart')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })

  const [cartOpen, setCartOpen] = useState(false)

  // sessionId to identify visitor (no auth). Persisted in localStorage.
  const getSessionId = () => {
    try {
      let s = localStorage.getItem('hh_session')
      if (!s) {
        s = crypto?.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2))
        localStorage.setItem('hh_session', s)
      }
      return s
    } catch (e) {
      return 'anon'
    }
  }
  const sessionId = getSessionId()

  // Load cart items from PocketBase for this session on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const q = `?filter=sessionId="${sessionId}"`
        const res = await getRecords('cart_items', q)
        const items = (res.items || []).map(r => ({
          id: r.productId,
          title: r.title,
          price: r.price,
          qty: r.qty,
          image: r.image,
          serverId: r.id,
          unit: r.unit,
          code: r.code,
        }))
        if (mounted) setCart(items)
      } catch (e) {
        // fallback: keep existing localStorage-based cart
        console.warn('Could not load cart from PocketBase', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  const addToCart = (product, qty = 1) => {
    // determine allowed stock (if product.stock is provided)
    const maxStock = (product && typeof product.stock === 'number') ? product.stock : Infinity
    // optimistic local update with stock cap
    setCart(prev => {
      const found = prev.find(i => i.id === product.id)
      if (found) {
        const desired = found.qty + qty
        const newQty = Math.min(desired, maxStock)
        return prev.map(i => i.id === product.id ? { ...i, qty: newQty } : i)
      }
      const initialQty = Math.min(qty, maxStock)
      return [...prev, { ...product, qty: initialQty }]
    })

    // sync to server (async, best-effort)
    ;(async () => {
      try {
        // look for existing server record
        const q = `?filter=productId="${product.id}" && sessionId="${sessionId}"`
        const res = await getRecords('cart_items', q)
          if (res && res.items && res.items.length > 0) {
          const rec = res.items[0]
          // enforce stock limit when updating server-side qty
          const currentServerQty = rec.qty || 0
          const allowed = (typeof product.stock === 'number') ? Math.min(currentServerQty + qty, product.stock) : (currentServerQty + qty)
          await updateRecord('cart_items', rec.id, { qty: allowed })
          return
        }

        // create with FormData so we can upload an image file when needed
        const fd = new FormData()
        fd.append('productId', product.id)
        fd.append('title', product.title)
        fd.append('price', String(product.price))
        // ensure qty respects stock when creating server record
        const createQty = (typeof product.stock === 'number') ? String(Math.min(qty, product.stock)) : String(qty)
        fd.append('qty', createQty)
        fd.append('sessionId', sessionId)
        fd.append('unit', product.unit || '')
        fd.append('code', product.code || '')

        // Determine image source and try to fetch it so we can upload the file
        let imgUrl = null
        if (product.image) {
          if (typeof product.image === 'string' && /^https?:\/\//i.test(product.image)) {
            imgUrl = product.image
          } else if (typeof product.image === 'string') {
            try {
              imgUrl = fileUrl('products', product.id, product.image)
            } catch (err) {
              imgUrl = null
            }
          }
        }

        if (imgUrl) {
          try {
            const r = await fetch(imgUrl)
            if (r.ok) {
              const blob = await r.blob()
              const parts = imgUrl.split('/')
              const fname = parts[parts.length - 1] || `image-${Date.now()}`
              const file = new File([blob], fname, { type: blob.type })
              fd.append('image', file, fname)
            }
          } catch (err) {
            console.warn('Could not fetch image to upload to cart_items', err)
          }
        }

        try {
          const created = await createRecordForm('cart_items', fd)
          if (created && created.id) {
            setCart(prev => prev.map(i => i.id === product.id ? { ...i, serverId: created.id } : i))
            return
          }
        } catch (err) {
          // fallback: try JSON create (without image) to at least persist metadata
          try {
            const body = {
              productId: product.id,
              title: product.title,
              price: product.price,
              qty: (typeof product.stock === 'number') ? Math.min(qty, product.stock) : qty,
              sessionId,
              unit: product.unit || '',
              code: product.code || ''
            }
            const created = await createRecord('cart_items', body)
            if (created && created.id) {
              setCart(prev => prev.map(i => i.id === product.id ? { ...i, serverId: created.id } : i))
              return
            }
          } catch (err2) {
            // If server rejects because `image` is required, try creating with `imageUrl` string field as fallback.
            try {
              const msg = (err2 && err2.message) ? err2.message : ''
              const isImageRequired = msg.includes('"image"') && msg.includes('validation_required')
              if (isImageRequired && imgUrl) {
                const body2 = {
                  productId: product.id,
                  title: product.title,
                  price: product.price,
                  qty: (typeof product.stock === 'number') ? Math.min(qty, product.stock) : qty,
                  sessionId,
                  unit: product.unit || '',
                  code: product.code || '',
                  imageUrl: imgUrl
                }
                const created2 = await createRecord('cart_items', body2)
                if (created2 && created2.id) {
                  setCart(prev => prev.map(i => i.id === product.id ? { ...i, serverId: created2.id } : i))
                  return
                }
              }
            } catch (err3) {
              console.warn('Tried fallback with imageUrl but failed', err3)
            }

            console.warn('Failed to persist cart item to PocketBase (form/json attempts)', err, err2)
          }
        }
      } catch (e) {
        console.warn('Failed to sync addToCart to PocketBase', e)
      }
    })()
  }

  const removeFromCart = (id) => {
    // optimistic local update
    const maybe = cart.find(i => i.id === id)
    setCart(prev => prev.filter(i => i.id !== id))
    // delete on server if we have serverId
    ;(async () => {
      try {
        const serverId = maybe?.serverId
        if (serverId) await deleteRecord('cart_items', serverId)
        else {
          // try to find by productId + sessionId
          const q = `?filter=productId="${id}" && sessionId="${sessionId}"`
          const res = await getRecords('cart_items', q)
          if (res && res.items && res.items.length > 0) {
            await deleteRecord('cart_items', res.items[0].id)
          }
        }
      } catch (e) {
        console.warn('Failed to delete cart item from PocketBase', e)
      }
    })()
  }

  const clearCart = () => {
    // optimistic local update
    const prev = cart.slice()
    setCart([])
    ;(async () => {
      try {
        // attempt to delete all server-side cart_items for this session
        const q = `?filter=sessionId="${sessionId}"`
        const res = await getRecords('cart_items', q)
        if (res && res.items && res.items.length > 0) {
          await Promise.all(res.items.map(it => deleteRecord('cart_items', it.id).catch(() => null)))
        }
      } catch (e) {
        console.warn('Failed to clear cart on server', e)
        // restore local cart if server delete failed
        setCart(prev)
      }
    })()
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeFromCart(id)
    // enforce stock limit if available on item
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i
      const max = (typeof i.stock === 'number') ? i.stock : Infinity
      const newQty = Math.min(qty, max)
      return { ...i, qty: newQty }
    }))
    ;(async () => {
      try {
        const item = cart.find(i => i.id === id)
        const serverId = item?.serverId
        // ensure server update respects stock
        if (item && typeof item.stock === 'number' && qty > item.stock) qty = item.stock
        if (serverId) {
          await updateRecord('cart_items', serverId, { qty })
        } else {
          // find record by productId and sessionId
          const q = `?filter=productId="${id}" && sessionId="${sessionId}"`
          const res = await getRecords('cart_items', q)
          if (res && res.items && res.items.length > 0) {
            await updateRecord('cart_items', res.items[0].id, { qty })
          }
        }
      } catch (e) {
        console.warn('Failed to update qty on PocketBase', e)
      }
    })()
  }

  const cartCount = cart.reduce((s, i) => s + (i.qty || 0), 0)
  // Display count capped at 9+ for UI badges
  const displayCartCount = cartCount > 9 ? '9+' : cartCount
  const cartTotal = cart.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0)

  const formatCLP = (value) => {
    try {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)
    } catch (e) {
      return `${value}`
    }
  }

  const value = {
    cart,
    setCart,
    cartOpen,
    setCartOpen,
    addToCart,
    removeFromCart,
    clearCart,
    updateQty,
    cartCount,
    displayCartCount,
    cartTotal,
    formatCLP,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

export default CartProvider
