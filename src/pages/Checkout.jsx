import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { createRecord } from '../utils/pocketApi'

export default function Checkout() {
  const { cart, cartTotal, formatCLP, setCart } = useCart()
  const { user, isAuthenticated, updateProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } })
    }
  }, [isAuthenticated])

  const IVA_RATE = 0.19
  const subtotal = cartTotal || 0
  const iva = Math.round(subtotal * IVA_RATE)
  const total = subtotal + iva

  // Address: support selecting saved address or entering a new one
  const [useNewAddress, setUseNewAddress] = useState(!user?.address)
  const [newAddress, setNewAddress] = useState('')
  useEffect(() => {
    // if user changes or on mount set defaults
    setUseNewAddress(!user?.address)
    setNewAddress('')
  }, [user?.address])

  const getSelectedAddress = () => {
    return useNewAddress ? newAddress : (user?.address || '')
  }
  const [saveAddress, setSaveAddress] = useState(false)
  const [method, setMethod] = useState('card')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [card, setCard] = useState({ name: '', number: '', exp: '', cvc: '' })

  // Helpers for input formatting / validation
  const formatCardNumber = (digits) => {
    if (!digits) return ''
    // group every 4 digits for display (max 12 digits)
    const groups = digits.match(/\d{1,4}/g) || []
    return groups.join(' ')
  }

  const formatExpiry = (input) => {
    const digits = (input || '').replace(/\D/g, '').slice(0,4)
    if (digits.length <= 2) return digits
    let mm = digits.slice(0,2)
    let yy = digits.slice(2)
    // cap month to 12
    const mnum = parseInt(mm, 10)
    if (!isNaN(mnum)) {
      if (mnum === 0) mm = '01'
      else if (mnum > 12) mm = '12'
      else mm = mm.padStart(2,'0')
    }
    return `${mm}/${yy}`
  }

  const canPay = (() => {
    const addressVal = getSelectedAddress().trim()
    const cardOk = method !== 'card' || (card.number.replace(/\D/g,'').length === 12 && card.cvc.replace(/\D/g,'').length === 3 && card.exp.length === 5)
    return cart.length > 0 && addressVal.length > 0 && cardOk
  })()

  async function handlePay(e) {
    e.preventDefault()
    setError(null)
    if (!canPay) {
      setError('Por favor complete los datos de envío y pago.')
      return
    }
    setProcessing(true)
    try {
      const address = getSelectedAddress()
      // create order record in PocketBase (orders collection)
      const body = {
        // PocketBase relation field for the user must be sent under the relation field name
        // (here `user`) with the related record id. Using `userId` won't populate the relation.
        user: user?.id || null,
        items: JSON.stringify(cart.map(i => ({ id: i.id, title: i.title, price: i.price, qty: i.qty }))),
        subtotal,
        iva,
        total,
        address,
        paymentMethod: method,
        status: 'paid'
      }
      const created = await createRecord('orders', body)
      if (saveAddress) {
        // attempt to save address to user
        try {
          const fd = new FormData()
          fd.append('address', address)
          await updateProfile(fd)
        } catch (err) {
          console.warn('Could not save address', err)
        }
      }

      // clear local cart
      setCart([])
      setSuccess(created)
    } catch (err) {
      console.error(err)
      setError('Error al procesar el pago. Intente nuevamente.')
    } finally {
      setProcessing(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-semibold">Pago exitoso</h2>
        <p className="mt-2">Gracias por tu compra. Tu orden se ha registrado con id <strong>{success.id}</strong>.</p>
        <div className="mt-4">
          <button onClick={() => navigate('/products')} className="rounded bg-green-600 px-4 py-2 text-white">Seguir comprando</button>
        </div>
      </div>
    )
  }

  return (
    
    <div>
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
        
      <h2 className="text-2xl font-semibold">Checkout</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <form onSubmit={handlePay} className="space-y-4">
            <section className="p-4 border rounded">
              <h3 className="font-medium">Datos de envío</h3>
              <div className="mt-2">
                <label className="text-sm">Dirección</label>
                <select
                  value={useNewAddress ? '__new' : 'saved'}
                  onChange={(e) => {
                    if (e.target.value === '__new') setUseNewAddress(true)
                    else setUseNewAddress(false)
                  }}
                  className="w-full mt-2 rounded border p-2"
                >
                  {user?.address && <option value="saved">Dirección guardada: {user.address}</option>}
                  <option value="__new">Nueva dirección...</option>
                </select>

                {useNewAddress && (
                  <textarea value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Dirección completa" className="w-full mt-2 rounded border p-2" rows={3} />
                )}

                <div className="flex items-center gap-2 mt-2">
                  <input id="saveAddress" type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                  <label htmlFor="saveAddress" className="text-sm">Guardar dirección en mi perfil</label>
                </div>
              </div>
            </section>

            <section className="p-4 border rounded">
              <h3 className="font-medium">Método de pago</h3>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="method" value="card" checked={method === 'card'} onChange={() => setMethod('card')} />
                  <span>Tarjeta de crédito/débito</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="method" value="transfer" checked={method === 'transfer'} onChange={() => setMethod('transfer')} />
                  <span>Transferencia / Otro</span>
                </label>
              </div>

              {method === 'card' && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Nombre en la tarjeta" className="rounded border p-2" />
                  <input
                    inputMode="numeric"
                    value={formatCardNumber(card.number)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 12)
                      setCard({ ...card, number: digits })
                    }}
                    placeholder="Número de tarjeta (12 dígitos)"
                    className="rounded border p-2"
                  />
                  <input
                    value={card.exp}
                    onChange={(e) => {
                      const formatted = formatExpiry(e.target.value)
                      setCard({ ...card, exp: formatted })
                    }}
                    placeholder="MM/AA"
                    className="rounded border p-2"
                  />
                  <input
                    inputMode="numeric"
                    value={card.cvc}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 3)
                      setCard({ ...card, cvc: digits })
                    }}
                    placeholder="CVC (3 dígitos)"
                    className="rounded border p-2"
                  />
                </div>
              )}
            </section>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex items-center gap-2">
              <button type="submit" disabled={!canPay || processing} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{processing ? 'Procesando...' : 'Pagar ahora'}</button>
              <button type="button" onClick={() => navigate(-1)} className="rounded border px-4 py-2">Volver</button>
            </div>
          </form>
        </div>

        <aside className="p-4 border rounded">
          <h3 className="font-medium">Resumen de la orden</h3>
          <div className="mt-2 space-y-2">
            {cart.map(i => (
              <div key={i.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{i.title} <span className="text-xs text-gray-500">x{i.qty}</span></div>
                  <div className="text-xs text-gray-500">{formatCLP(i.price)}</div>
                </div>
                <div className="font-medium">{formatCLP(i.price * i.qty)}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCLP(subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA ({Math.round(IVA_RATE * 100)}%)</span><span>{formatCLP(iva)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCLP(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
    </div>
  )
}
