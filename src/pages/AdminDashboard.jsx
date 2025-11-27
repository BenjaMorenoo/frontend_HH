import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { getRecords, getRecord, updateRecord, deleteRecord, createRecord, createRecordForm, updateRecordForm, fileUrl } from '../utils/pocketApi'
import employees from '../data/employees.json'
import expensesList from '../data/expenses.json'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

function boolVal(v) {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1'
  if (typeof v === 'number') return v === 1
  return !!v
}

function isAdminUser(user) {
  if (!user) return false
  // In this project the `role` field is a boolean indicating admin status.
  // Accept truthy boolean values; keep a small fallback for older flags.
  if (typeof user.role === 'boolean') return user.role === true
  return !!(user.isAdmin || user.is_admin || user.admin === true || user.role === 'admin')
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth()
  const { formatCLP } = useCart()
  const navigate = useNavigate()

  const [view, setView] = useState('orders') // orders | products | users | contacts
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [userNames, setUserNames] = useState({})
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({ code: '', title: '', category: '', price: '', unit: '', stock: '', description: '', active: true, state: true })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [msgActionLoading, setMsgActionLoading] = useState(false)

  // Sales chart data (derived from orders)
  const [salesSeries, setSalesSeries] = useState([]) // [{day:'2025-11-19', total: 123}, ...]
  // sales analytics
  const [salesLoading, setSalesLoading] = useState(false)
  const [salesData, setSalesData] = useState([])
  const [salesFilters, setSalesFilters] = useState({ startDate: '', endDate: '', category: 'Todas', topN: 10 })
  const [salesCategories, setSalesCategories] = useState(['Todas'])
  // prediction analytics
  const [predictionRange, setPredictionRange] = useState('weekly') // weekly | monthly | yearly
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [predictionSeries, setPredictionSeries] = useState([])
  const [predictionResult, setPredictionResult] = useState({ mean: 0, growthForecast: 0 })

  useEffect(() => {
    if (!isAuthenticated) return
    if (!isAdminUser(user)) return
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let res
        if (view === 'orders') {
          res = await getRecords('orders', '?expand=user&sort=-created')
        } else if (view === 'products') {
          res = await getRecords('products', '?sort=-created')
        } else if (view === 'contacts') {
          res = await getRecords('contacts', '?sort=-created')
        } else {
          // request many users (perPage large) so admin sees all registered users
          res = await getRecords('users', '?perPage=1000&sort=-created')
        }
        const records = Array.isArray(res) ? res : (res?.items || [])
        if (mounted) setItems(records)
        // if we're loading orders, update salesSeries
        if (view === 'orders') {
          try {
            const series = computeSalesSeries(records)
            if (mounted) setSalesSeries(series)
          } catch (e) {
            // ignore chart errors
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [view, isAuthenticated, user])

  // load sales analytics when view is selected
  useEffect(() => {
    if (view === 'sales') {
      loadSalesData()
    }
  }, [view])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />
  }

  if (!isAdminUser(user)) {
    return (
      <div>
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-2xl font-semibold mb-4">Acceso denegado</h2>
          <p className="text-sm text-gray-600">Necesitas permisos de administrador para ver esta página.</p>
        </div>
      </div>
    )
  }

  async function changeOrderStatus(id, status) {
    try {
      await updateRecord('orders', id, { status })
      // refresh
      const res = await getRecords('orders', '?expand=user&sort=-created')
      const records = Array.isArray(res) ? res : (res?.items || [])
      setItems(records)
      // keep selected order in sync if it's the one we updated
      try {
        const updated = records.find(r => r.id === id)
        if (updated && selectedOrder && selectedOrder.id === id) setSelectedOrder(updated)
      } catch (e) {
        // ignore
      }
    } catch (err) {
      alert('Error al actualizar orden: ' + (err.message || String(err)))
    }
  }

  function getOrderItems(o) {
    if (!o) return []
    if (Array.isArray(o.items)) return o.items
    if (!o.items) return []
    if (typeof o.items === 'string') {
      try { return JSON.parse(o.items) } catch (e) { return [] }
    }
    return o.items || []
  }

  async function loadSalesData() {
    setSalesLoading(true)
    try {
      const prodRes = await getRecords('products')
      const orderRes = await getRecords('orders')
      const productsList = Array.isArray(prodRes) ? prodRes : (prodRes?.items || [])
      const ordersList = Array.isArray(orderRes) ? orderRes : (orderRes?.items || [])

      // build product map and categories
      const prodByKey = {}
      const cats = new Set(['Todas'])
      productsList.forEach(p => {
        const imageField = p.image
        const image = imageField && typeof imageField === 'string' && !imageField.startsWith('http') ? fileUrl('products', p.id, imageField) : imageField
        const key = String(p.id || p.code || '')
        prodByKey[key] = { ...p, image }
        if (p.category) cats.add(p.category)
      })
      setSalesCategories(Array.from(cats))

      // filter orders by date range
      const start = salesFilters.startDate ? new Date(salesFilters.startDate) : null
      const end = salesFilters.endDate ? new Date(salesFilters.endDate) : null

      const agg = {} // key -> { units, revenue }
      ordersList.forEach(o => {
        const created = o.created ? new Date(o.created) : null
        if (start && created && created < start) return
        if (end && created && created > new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23,59,59)) return
        let items = []
        try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []) } catch (e) { items = [] }
        if (!Array.isArray(items)) return
        items.forEach(it => {
          const key = String(it.product || it.productId || it.id || it.code || '')
          const qty = Number(it.qty ?? it.quantity ?? 1) || 1
          const price = Number(it.price ?? it.unit_price ?? 0) || 0
          if (!key) return
          if (!agg[key]) agg[key] = { units: 0, revenue: 0 }
          agg[key].units += qty
          agg[key].revenue += qty * price
        })
      })

      // build array of entries with product info
      const entries = Object.keys(agg).map(k => {
        const p = prodByKey[k]
        return {
          key: k,
          id: (p && p.id) || k,
          code: (p && p.code) || '',
          title: (p && (p.title || p.name)) || (prodByKey[k] && prodByKey[k].title) || k,
          category: p?.category || '',
          image: p?.image || '',
          units: agg[k].units,
          revenue: agg[k].revenue || 0,
        }
      })

      // apply category filter
      const filtered = entries.filter(e => {
        if (!salesFilters.category || salesFilters.category === 'Todas') return true
        return e.category === salesFilters.category
      })

      filtered.sort((a, b) => b.units - a.units)
      const top = filtered.slice(0, Math.max(1, Number(salesFilters.topN || 10)))
      setSalesData(top)
    } catch (e) {
      console.error('Error loading sales data', e)
      setSalesData([])
    } finally {
      setSalesLoading(false)
    }
  }

  // prediction loader
  function getPeriodLabel(dt, range) {
    if (!dt) return ''
    const d = new Date(dt)
    if (range === 'weekly') {
      // ISO week-year key
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      const dayNum = tmp.getUTCDay() || 7
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1))
      const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1)/7)
      return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`
    }
    if (range === 'monthly') {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    }
    return `${d.getFullYear()}`
  }

  async function loadPrediction() {
    setPredictionLoading(true)
    try {
      const orderRes = await getRecords('orders')
      const ordersList = Array.isArray(orderRes) ? orderRes : (orderRes?.items || [])

      // aggregate revenue per period
      const agg = {} // label -> revenue
      ordersList.forEach(o => {
        const created = o.created ? new Date(o.created) : (o.createdAt ? new Date(o.createdAt) : null)
        if (!created) return
        const items = (() => { try { const it = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); return Array.isArray(it) ? it : [] } catch (e) { return [] } })()
        let orderRevenue = 0
        items.forEach(it => {
          const qty = Number(it.qty ?? it.quantity ?? 1) || 1
          const price = Number(it.price ?? it.unit_price ?? 0) || 0
          orderRevenue += qty * price
        })
        const label = getPeriodLabel(created, predictionRange)
        if (!label) return
        agg[label] = (agg[label] || 0) + orderRevenue
      })

      // sort periods ascending
      const periods = Object.keys(agg).sort()
      const series = periods.map(p => ({ label: p, revenue: agg[p] }))

      // use last N periods: weeks->12, months->12, years->5
      const N = predictionRange === 'yearly' ? 5 : 12
      const last = series.slice(-N)

      // compute mean
      const mean = last.reduce((s,x) => s + (x.revenue||0), 0) / Math.max(1, last.length)

      // compute average growth between consecutive periods
      const growths = []
      for (let i = 1; i < last.length; i++) {
        const prev = last[i-1].revenue || 0
        const cur = last[i].revenue || 0
        if (prev > 0) growths.push((cur - prev) / prev)
      }
      const avgGrowth = growths.length ? (growths.reduce((s,x) => s + x, 0) / growths.length) : 0

      const lastRev = last.length ? (last[last.length-1].revenue || 0) : 0
      const growthForecast = Math.max(0, lastRev * (1 + avgGrowth))

      setPredictionSeries(last)
      // compute estimated expenses for the period
      function convertToPeriodAmount(amount, freq, range) {
        // amount expressed per frequency
        // freq: 'monthly'|'weekly'|'yearly'|'one-time'
        if (range === 'weekly') {
          if (freq === 'weekly') return amount
          if (freq === 'monthly') return amount / 4.345
          if (freq === 'yearly') return amount / 52
          return amount
        }
        if (range === 'monthly') {
          if (freq === 'weekly') return amount * 4.345
          if (freq === 'monthly') return amount
          if (freq === 'yearly') return amount / 12
          return amount
        }
        // yearly
        if (freq === 'weekly') return amount * 52
        if (freq === 'monthly') return amount * 12
        if (freq === 'yearly') return amount
        return amount
      }

      // sum employee salaries and other expenses
      let estimatedExpenses = 0
      // employees.json stores monthlySalary
      employees.forEach(emp => {
        const sal = Number(emp.monthlySalary || 0) || 0
        estimatedExpenses += convertToPeriodAmount(sal, 'monthly', predictionRange)
      })
      expensesList.forEach(e => {
        const amt = Number(e.amount || 0) || 0
        const freq = e.frequency || 'monthly'
        estimatedExpenses += convertToPeriodAmount(amt, freq, predictionRange)
      })

      const netForecast = Math.max(0, growthForecast - estimatedExpenses)
      const netMean = Math.max(0, mean - estimatedExpenses)

      setPredictionResult({ mean, growthForecast, estimatedExpenses, netForecast, netMean })
    } catch (e) {
      console.error('Prediction error', e)
      setPredictionSeries([])
      setPredictionResult({ mean: 0, growthForecast: 0, estimatedExpenses: 0, netForecast: 0, netMean: 0 })
    } finally {
      setPredictionLoading(false)
    }
  }
  // human-friendly labels for prediction ranges
  const predictionRangeLabel = (r) => {
    if (r === 'weekly') return 'Semanal'
    if (r === 'monthly') return 'Mensual'
    if (r === 'yearly') return 'Anual'
    return r
  }

  function openOrder(o) {
    setSelectedOrder(o)
    setShowOrderModal(true)
  }

  function formatOrderUser(o) {
    if (!o) return '—'
    // prefer buyerName saved on the order
    if (o.buyerName) return o.buyerName
    const u = o.user
    if (!u) return '—'
    if (typeof u === 'object') {
      return u.username || u.user || u.primer_nombre || u.primer_nombre_completo || u.email || (u.id || '—')
    }
    // u is string id
    return userNames[u] || u
  }

  async function handleDeleteProduct(id) {
    if (!confirm('Eliminar producto? Esta acción no se puede deshacer.')) return
    try {
      await deleteRecord('products', id)
      const res = await getRecords('products', '?sort=-created')
      const records = Array.isArray(res) ? res : (res?.items || [])
      setItems(records)
    } catch (err) {
      alert('Error al eliminar producto: ' + (err.message || String(err)))
    }
  }

  // Contacts (messages) actions
  async function markContactRead(id) {
    try {
      await updateRecord('contacts', id, { read: true })
      const res = await getRecords('contacts', '?sort=-created')
      const records = Array.isArray(res) ? res : (res?.items || [])
      setItems(records)
    } catch (err) {
      alert('Error al marcar mensaje: ' + (err.message || String(err)))
    }
  }

  async function markContactUnread(id) {
    try {
      await updateRecord('contacts', id, { read: false })
      const res = await getRecords('contacts', '?sort=-created')
      const records = Array.isArray(res) ? res : (res?.items || [])
      setItems(records)
    } catch (err) {
      alert('Error al marcar mensaje como no leído: ' + (err.message || String(err)))
    }
  }

  async function openMessage(m) {
    // If message is unread, mark it read before opening so UI reflects state
    try {
      if (!m.read) {
        await updateRecord('contacts', m.id, { read: true })
        // refresh items list
        const res = await getRecords('contacts', '?sort=-created')
        const records = Array.isArray(res) ? res : (res?.items || [])
        setItems(records)
        // reflect change in selected message
        setSelectedMessage({ ...m, read: true })
      } else {
        setSelectedMessage(m)
      }
      setShowMessageModal(true)
    } catch (err) {
      alert('No se pudo marcar el mensaje como leído: ' + (err.message || String(err)))
    }
  }

  async function deleteMessageFromModal(id) {
    if (!confirm('Eliminar mensaje?')) return
    setMsgActionLoading(true)
    try {
      await deleteRecord('contacts', id)
      const res = await getRecords('contacts', '?sort=-created')
      const records = Array.isArray(res) ? res : (res?.items || [])
      setItems(records)
      setShowMessageModal(false)
      setSelectedMessage(null)
    } catch (err) {
      alert('Error al eliminar mensaje: ' + (err.message || String(err)))
    } finally {
      setMsgActionLoading(false)
    }
  }

  async function handleDeleteContact(id) {
    if (!confirm('Eliminar mensaje?')) return
    try {
      await deleteRecord('contacts', id)
      const res = await getRecords('contacts', '?sort=-created')
      const records = Array.isArray(res) ? res : (res?.items || [])
      setItems(records)
    } catch (err) {
      alert('Error al eliminar mensaje: ' + (err.message || String(err)))
    }
  }
  
  // When items (orders) change, resolve any missing user ids in batch and cache display names
  useEffect(() => {
    if (!items || items.length === 0) return
    const ids = Array.from(new Set(items.map(o => {
      if (!o.user) return null
      if (typeof o.user === 'string') return o.user
      if (typeof o.user === 'object') {
        const hasName = !!(o.user.username || o.user.user || o.user.primer_nombre || o.user.email)
        if (!hasName && o.user.id) return o.user.id
      }
      return null
    }).filter(Boolean)))
    const missing = ids.filter(id => !userNames[id])
    if (missing.length === 0) return
    ;(async () => {
      try {
        const results = await Promise.all(missing.map(id => getRecord('users', id).catch(() => null)))
        const map = {}
        results.forEach(u => {
          if (!u || !u.id) return
          map[u.id] = u.username || u.user || u.primer_nombre || u.primer_nombre_completo || u.email || u.id
        })
        if (Object.keys(map).length > 0) setUserNames(prev => ({ ...prev, ...map }))
      } catch (e) {
        // ignore resolution errors
      }
    })()
  }, [items])

  function computeSalesSeries(orders) {
    // produce last 7 days totals (by order.created date)
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toISOString().slice(0,10)
      days.push({ key, total: 0 })
    }

    orders.forEach(o => {
      const created = o.created ? new Date(o.created) : null
      if (!created) return
      const key = created.toISOString().slice(0,10)
      const idx = days.findIndex(d => d.key === key)
      const amount = Number(o.total || 0)
      if (idx >= 0) days[idx].total += amount
    })

    return days
  }

  // Product modal handlers
  function openCreateProduct() {
    setEditingProduct(null)
    setProductForm({ code: '', title: '', category: '', price: '', unit: '', stock: '', description: '', active: true })
    setProductModalOpen(true)
  }

  function openEditProduct(p) {
    setEditingProduct(p)
    setProductForm({ code: p.code || p.id || '', title: p.title || '', category: p.category || '', price: p.price || '', unit: p.unit || '', stock: p.stock || '', description: p.description || '', active: p.active !== false, state: p.state !== undefined && p.state !== null ? !!p.state : (p.active !== false) })
    setProductModalOpen(true)
  }

  function onProductFormChange(e) {
    const { name, value, type, checked } = e.target
    let val = type === 'checkbox' ? checked : value
    if (name === 'state') {
      // normalize select/string to boolean
      if (typeof val === 'string') val = val === 'true'
      else val = !!val
    }
    setProductForm(prev => ({ ...prev, [name]: val }))
  }

  async function submitProductForm(e) {
    e.preventDefault()
    try {
      // if there's a file input, use FormData
      const fileInput = document.querySelector('#product-image')
      const file = fileInput && fileInput.files && fileInput.files[0]

      if (editingProduct) {
        // update
        if (file) {
          const fd = new FormData()
          fd.append('code', productForm.code)
          fd.append('title', productForm.title)
          fd.append('category', productForm.category)
          fd.append('price', productForm.price)
          fd.append('unit', productForm.unit)
          fd.append('stock', productForm.stock)
          fd.append('description', productForm.description)
          // send state as string 'true'/'false' for FormData (PocketBase will coerce)
          fd.append('state', productForm.state ? 'true' : 'false')
          fd.append('image', file)
          await updateRecordForm('products', editingProduct.id, fd)
        } else {
          await updateRecord('products', editingProduct.id, { code: productForm.code, title: productForm.title, category: productForm.category, price: Number(productForm.price || 0), unit: productForm.unit, stock: Number(productForm.stock || 0), description: productForm.description, state: !!productForm.state })
        }
      } else {
        if (file) {
          const fd = new FormData()
          fd.append('code', productForm.code)
          fd.append('title', productForm.title)
          fd.append('category', productForm.category)
          fd.append('price', productForm.price)
          fd.append('unit', productForm.unit)
          fd.append('stock', productForm.stock)
          fd.append('description', productForm.description)
          fd.append('state', productForm.state ? 'true' : 'false')
          fd.append('image', file)
          await createRecordForm('products', fd)
        } else {
          await createRecord('products', { code: productForm.code, title: productForm.title, category: productForm.category, price: Number(productForm.price || 0), unit: productForm.unit, stock: Number(productForm.stock || 0), description: productForm.description, state: !!productForm.state })
        }
      }

      // refresh products view
      const res = await getRecords('products', '?sort=-created')
      const records = Array.isArray(res) ? res : (res?.items || [])
      setItems(records)
      setProductModalOpen(false)
    } catch (err) {
      alert('Error al guardar producto: ' + (err.message || String(err)))
    }
  }

  async function toggleProductActive(p) {
    try {
      // toggle the boolean `state` attribute
      const current = (p.state !== undefined && p.state !== null) ? boolVal(p.state) : (p.active !== false)
      const newState = !current
      await updateRecord('products', p.id, { state: newState })
      const res = await getRecords('products', '?sort=-created')
      const records = Array.isArray(res) ? res : (res?.items || [])
      setItems(records)
    } catch (err) {
      alert('Error al cambiar estado: ' + (err.message || String(err)))
    }
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className='flex items-center justify-between mb-6'>
          <h1 className="text-2xl font-semibold">Admin Dashboard <span className='ml-2 text-xl inline-block' aria-hidden></span></h1>
            <div className='flex items-center gap-3'>
              <button onClick={() => setView('orders')} className={`py-1 px-3 rounded ${view==='orders' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Pedidos</button>
              <button onClick={() => setView('sales')} className={`py-1 px-3 rounded ${view==='sales' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Ventas</button>
              <button onClick={() => setView('predictions')} className={`py-1 px-3 rounded ${view==='predictions' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Predicción</button>
            <button onClick={() => setView('products')} className={`py-1 px-3 rounded ${view==='products' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Productos</button>
            <button onClick={() => setView('contacts')} className={`py-1 px-3 rounded ${view==='contacts' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Mensajes</button>
            <button onClick={() => setView('users')} className={`py-1 px-3 rounded ${view==='users' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Usuarios</button>
            <button onClick={() => { navigate('/') }} className='py-1 px-3 rounded bg-white border text-sm'>Volver al sitio</button>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <div onClick={() => setView('orders')} role="button" tabIndex={0} className='p-4 rounded shadow-sm text-white bg-blue-500 cursor-pointer hover:shadow-md'>
            <div className='text-sm'>Pedidos</div>
            <div className='text-xl font-semibold'>{view === 'orders' ? items.length : '—'}</div>
            <div className='text-xs'>Ver detalles</div>
          </div>
          <div onClick={() => setView('orders')} role="button" tabIndex={0} className='p-4 rounded shadow-sm text-black bg-yellow-400 cursor-pointer hover:shadow-md'>
            <div className='text-sm'>Ingresos (7d)</div>
            <div className='text-xl font-semibold'>{formatCLP((salesSeries || []).reduce((s, x) => s + (x.total || 0), 0))}</div>
            <div className='text-xs'>Ver detalles</div>
          </div>
          <div onClick={() => setView('products')} role="button" tabIndex={0} className='p-4 rounded shadow-sm text-white bg-green-500 cursor-pointer hover:shadow-md'>
            <div className='text-sm'>Productos</div>
            <div className='text-xl font-semibold'>{view === 'products' ? items.length : '—'}</div>
            <div className='text-xs'>Ver detalles</div>
          </div>
          <div onClick={() => setView('users')} role="button" tabIndex={0} className='p-4 rounded shadow-sm text-white bg-red-500 cursor-pointer hover:shadow-md'>
            <div className='text-sm'>Usuarios</div>
            <div className='text-xl font-semibold'>{view === 'users' ? items.length : '—'}</div>
            <div className='text-xs'>Ver detalles</div>
          </div>
        </div>

        <div className='bg-white rounded shadow-sm p-4'>
          <section className="flex-1">
            {loading && <div>Cargando {view}...</div>}
            {error && <div className='text-red-600'>Error: {error}</div>}

            {/* Charts and table area */}
            {!loading && view === 'orders' && (
              <div className='space-y-4'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  <div className='p-4 rounded bg-white'>
                    <h3 className='font-medium mb-2 text-gray-700'>Gráfico de área (últimos 7 días)</h3>
                    <div className='h-40'>
                      <Line options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={{
                        labels: salesSeries.map(s => s.key.slice(5)),
                        datasets: [{ label: 'Ventas', data: salesSeries.map(s => s.total || 0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)', tension: 0.4 }]
                      }} />
                    </div>
                  </div>
                  <div className='p-4 rounded bg-white'>
                    <h3 className='font-medium mb-2 text-gray-700'>Gráfico de barras (últimos 7 días)</h3>
                    <div className='h-40'>
                      <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={{
                        labels: salesSeries.map(s => s.key.slice(5)),
                        datasets: [{ label: 'Ventas', data: salesSeries.map(s => s.total || 0), backgroundColor: '#16a34a' }]
                      }} />
                    </div>
                  </div>
                </div>

                <div className='overflow-x-auto bg-white rounded p-4'>
                  <div className='text-sm font-medium mb-2'>Tabla de datos</div>
                  <table className='min-w-full divide-y divide-gray-100'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Orden</th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Usuario</th>
                        <th className='px-4 py-2 text-right text-xs font-medium text-gray-500'>Total</th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Estado</th>
                        <th className='px-4 py-2 text-right text-xs font-medium text-gray-500'>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-100'>
                      {items.length === 0 && (
                        <tr><td colSpan={5} className='p-4 text-sm text-gray-500'>Sin pedidos</td></tr>
                      )}
                      {items.map(o => (
                        <tr key={o.id}>
                          <td className='px-4 py-3 text-sm text-gray-700'>{o.id}</td>
                          <td className='px-4 py-3 text-sm text-gray-600'>{formatOrderUser(o)}</td>
                          <td className='px-4 py-3 text-sm text-right'>{formatCLP(Number(o.total || 0))}</td>
                          <td className='px-4 py-3 text-sm'>
                            <select value={o.status || ''} onChange={(e) => changeOrderStatus(o.id, e.target.value)} className='border rounded py-1 px-2 text-sm'>
                              <option value='pending'>pending</option>
                              <option value='processing'>processing</option>
                              <option value='shipped'>shipped</option>
                              <option value='delivered'>delivered</option>
                              <option value='cancelled'>cancelled</option>
                            </select>
                          </td>
                          <td className='px-4 py-3 text-right'>
                            <button onClick={() => { openOrder(o) }} className='text-sm text-blue-600 mr-2'>Ver</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sales analytics view */}
            {!loading && view === 'sales' && (
              <div className='space-y-4'>
                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                  <div className='flex items-center gap-3'>
                    <label className='text-sm text-gray-600'>Desde:</label>
                    <input type='date' value={salesFilters.startDate} onChange={(e) => setSalesFilters(sf => ({ ...sf, startDate: e.target.value }))} className='border rounded py-1 px-2 text-sm' />
                    <label className='text-sm text-gray-600 ml-2'>Hasta:</label>
                    <input type='date' value={salesFilters.endDate} onChange={(e) => setSalesFilters(sf => ({ ...sf, endDate: e.target.value }))} className='border rounded py-1 px-2 text-sm' />
                    <label className='text-sm text-gray-600 ml-2'>Categoría:</label>
                    <select value={salesFilters.category} onChange={(e) => setSalesFilters(sf => ({ ...sf, category: e.target.value }))} className='border rounded py-1 px-2 text-sm'>
                      {salesCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <label className='text-sm text-gray-600 ml-2'>Top</label>
                    <input type='number' min={1} value={salesFilters.topN} onChange={(e) => setSalesFilters(sf => ({ ...sf, topN: Number(e.target.value) || 10 }))} className='w-20 border rounded py-1 px-2 text-sm' />
                    <button onClick={() => loadSalesData()} className='ml-3 bg-green-600 text-white py-1 px-3 rounded text-sm'>Aplicar</button>
                    <button onClick={() => { setSalesFilters({ startDate: '', endDate: '', category: 'Todas', topN: 10 }); loadSalesData() }} className='ml-2 border rounded py-1 px-3 text-sm'>Reset</button>
                  </div>
                </div>

                <div className='p-4 rounded bg-white'>
                  {salesLoading ? <div>Cargando ventas...</div> : (
                    <div>
                      <h3 className='font-medium mb-2 text-gray-700'>Productos más vendidos</h3>
                      <div className='h-44'>
                        <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={{
                          labels: salesData.map(s => s.title || s.id || s.code || '—'),
                          datasets: [{ label: 'Unidades vendidas', data: salesData.map(s => s.units || 0), backgroundColor: '#3b82f6' }]
                        }} />
                      </div>

                      <div className='overflow-x-auto mt-4'>
                        <table className='min-w-full divide-y divide-gray-100'>
                          <thead className='bg-gray-50'>
                            <tr>
                              <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Producto</th>
                              <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Categoría</th>
                              <th className='px-4 py-2 text-right text-xs font-medium text-gray-500'>Unidades</th>
                              <th className='px-4 py-2 text-right text-xs font-medium text-gray-500'>Ingresos</th>
                            </tr>
                          </thead>
                          <tbody className='bg-white divide-y divide-gray-100'>
                            {salesData.map(s => (
                              <tr key={s.id || s.code}>
                                <td className='px-4 py-3 text-sm flex items-center gap-3'>
                                  <div className='w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center'>
                                    {s.image ? <img src={s.image} alt={s.title} className='w-full h-full object-contain' /> : <div className='text-xs text-gray-400'>No image</div>}
                                  </div>
                                  <div>
                                    <div className='font-medium'>{s.title || s.code}</div>
                                    <div className='text-xs text-gray-500'>{s.id}</div>
                                  </div>
                                </td>
                                <td className='px-4 py-3 text-sm text-gray-600'>{s.category || '—'}</td>
                                <td className='px-4 py-3 text-sm text-right'>{s.units || 0}</td>
                                <td className='px-4 py-3 text-sm text-right'>{formatCLP(Number(s.revenue || 0))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prediction view */}
            {!loading && view === 'predictions' && (
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='text-sm text-gray-600 mr-2'>Rango:</div>
                  <button onClick={() => setPredictionRange('weekly')} className={`py-1 px-3 rounded ${predictionRange==='weekly' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Semanal</button>
                  <button onClick={() => setPredictionRange('monthly')} className={`py-1 px-3 rounded ${predictionRange==='monthly' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Mensual</button>
                  <button onClick={() => setPredictionRange('yearly')} className={`py-1 px-3 rounded ${predictionRange==='yearly' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Anual</button>
                  <button onClick={() => loadPrediction()} className='ml-4 py-1 px-3 bg-green-600 text-white rounded'>Calcular</button>
                </div>

                <div className='p-4 rounded bg-white'>
                  {predictionLoading ? <div>Cargando predicción...</div> : (
                    <div>
                      <h3 className='font-medium mb-2 text-gray-700'>Predicción de Ganancias ({predictionRangeLabel(predictionRange)})</h3>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                        <div className='p-3 border rounded text-center'>
                          <div className='text-sm text-gray-500'>Media histórica (últimos periodos)</div>
                          <div className='text-xl font-semibold'>{formatCLP(Number(predictionResult.mean || 0))}</div>
                        </div>
                        <div className='p-3 border rounded text-center'>
                          <div className='text-sm text-gray-500'>Predicción (crecimiento promedio)</div>
                          <div className='text-xl font-semibold'>{formatCLP(Number(predictionResult.growthForecast || 0))}</div>
                        </div>
                        <div className='p-3 border rounded text-center'>
                          <div className='text-sm text-gray-500'>Gastos estimados ({predictionRangeLabel(predictionRange)})</div>
                          <div className='text-xl font-semibold text-red-600'>{formatCLP(Number(predictionResult.estimatedExpenses || 0))}</div>
                        </div>
                      </div>

                      <div className='h-44'>
                        <Line options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={{
                          labels: predictionSeries.map(s => s.label),
                          datasets: [{ label: 'Ingresos', data: predictionSeries.map(s => s.revenue || 0), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', tension: 0.2 }]
                        }} />
                      </div>

                      <div className='mt-4 flex gap-4'>
                        <div className='p-3 border rounded'>
                          <div className='text-sm text-gray-500'>Ganancia neta estimada</div>
                          <div className={`text-xl font-semibold ${predictionResult.netForecast < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCLP(Number(predictionResult.netForecast || 0))}</div>
                        </div>
                        <div className='p-3 border rounded'>
                          <div className='text-sm text-gray-500'>Media neta histórica</div>
                          <div className='text-xl font-semibold'>{formatCLP(Number(predictionResult.netMean || 0))}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showOrderModal && selectedOrder && (
              <div className='fixed inset-0 z-50 flex items-center justify-center'>
                <div className='absolute inset-0 bg-black/50' onClick={() => { setShowOrderModal(false); setSelectedOrder(null) }} />
                <div className='relative z-10 bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 p-6'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <div className='text-lg font-semibold'>Pedido {selectedOrder.id}</div>
                      <div className='text-xs text-gray-400'>{selectedOrder.created ? new Date(selectedOrder.created).toLocaleString() : ''}</div>
                      <div className='text-xs text-gray-500 mt-1'>Comprador: {selectedOrder.buyerName || formatOrderUser(selectedOrder)}</div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <select value={selectedOrder.status || ''} onChange={async (e) => { await changeOrderStatus(selectedOrder.id, e.target.value) }} className='border rounded py-1 px-2 text-sm'>
                        <option value='pending'>pending</option>
                        <option value='processing'>processing</option>
                        <option value='shipped'>shipped</option>
                        <option value='delivered'>delivered</option>
                        <option value='cancelled'>cancelled</option>
                      </select>
                      <button onClick={() => { setShowOrderModal(false); setSelectedOrder(null) }} className='text-gray-500 hover:text-gray-700 ml-4' aria-label='Cerrar pedido'>Cerrar ✕</button>
                    </div>
                  </div>

                  <div className='mt-4 space-y-4'>
                    {getOrderItems(selectedOrder).length === 0 && (
                      <div className='text-sm text-gray-500'>No hay items en esta orden</div>
                    )}
                    {getOrderItems(selectedOrder).map((it, idx) => {
                      const thumb = it.image || it.imageUrl || ((it.product && it.image) ? fileUrl('products', it.product, it.image) : (it.product && it.cover ? fileUrl('products', it.product, it.cover) : ''))
                      return (
                        <div key={idx} className='flex items-center gap-3 border-b pb-3'>
                          <div className='w-16 h-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center'>
                            {thumb ? <img src={thumb} alt={it.title || it.name || 'producto'} className='w-full h-full object-contain'/> : <div className='text-xs text-gray-400'>No image</div>}
                          </div>
                          <div className='flex-1'>
                            <div className='font-medium'>{it.title || it.name || it.productName || it.product || 'Producto'}</div>
                            <div className='text-xs text-gray-500'>Cantidad: {it.qty ?? it.quantity ?? 1} — Precio: {formatCLP(Number(it.price || it.unit_price || 0))}</div>
                          </div>
                          <div className='text-sm text-gray-700 font-medium'>{formatCLP(Number((it.price || it.unit_price || 0) * (it.qty ?? it.quantity ?? 1)))}</div>
                        </div>
                      )
                    })}

                    <div className='flex justify-end items-center gap-4 pt-2'>
                      <div className='text-sm text-gray-500'>Total:</div>
                      <div className='text-lg font-semibold'>{formatCLP(Number(selectedOrder.total || selectedOrder.amount || 0))}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showMessageModal && selectedMessage && (
              <div className='fixed inset-0 z-50 flex items-center justify-center'>
                <div className='absolute inset-0 bg-black/50' onClick={() => { setShowMessageModal(false); setSelectedMessage(null) }} />
                <div className='relative z-10 bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <div className='text-lg font-semibold'>{selectedMessage.name || selectedMessage.nombre || 'Mensaje'}</div>
                      <div className='text-xs text-gray-400'>{selectedMessage.created ? new Date(selectedMessage.created).toLocaleString() : ''}</div>
                      <div className='text-xs text-gray-500 mt-1'>Email: {selectedMessage.email || '—'}</div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {selectedMessage.email && (
                        <a className='text-sm text-blue-600' href={`mailto:${selectedMessage.email}?subject=Respuesta%20a%20tu%20mensaje`} rel='noreferrer'>Responder</a>
                      )}
                      <button onClick={() => { setShowMessageModal(false); setSelectedMessage(null) }} className='text-gray-500 hover:text-gray-700 ml-4' aria-label='Cerrar mensaje'>×</button>
                    </div>
                  </div>

                  <div className='mt-4 whitespace-pre-wrap text-sm text-gray-700'>{selectedMessage.message || selectedMessage.mensaje || selectedMessage.body || ''}</div>

                  <div className='mt-4 flex justify-end gap-2'>
                    {selectedMessage.read ? (
                      <button onClick={() => { markContactUnread(selectedMessage.id); setShowMessageModal(false); setSelectedMessage(null) }} className='py-1 px-3 rounded border text-sm'>Marcar no leído</button>
                    ) : (
                      <button onClick={() => { markContactRead(selectedMessage.id); setShowMessageModal(false); setSelectedMessage(null) }} className='py-1 px-3 rounded bg-green-600 text-white text-sm'>Marcar leído</button>
                    )}
                    <button onClick={() => deleteMessageFromModal(selectedMessage.id)} disabled={msgActionLoading} className='py-1 px-3 rounded bg-red-600 text-white text-sm'>{msgActionLoading ? 'Eliminando...' : 'Eliminar'}</button>
                  </div>
                </div>
              </div>
            )}

            {!loading && view === 'products' && (
              <div>
                <div className='flex justify-between items-center mb-4'>
                  <div className='text-lg font-medium'>Productos</div>
                  <div>
                    <button onClick={openCreateProduct} className='bg-green-600 text-white py-1 px-3 rounded shadow'>+ Nuevo Producto</button>
                  </div>
                </div>

                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-100'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Producto</th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Categoría</th>
                        <th className='px-4 py-2 text-right text-xs font-medium text-gray-500'>Precio</th>
                        <th className='px-4 py-2 text-right text-xs font-medium text-gray-500'>Stock</th>
                        <th className='px-4 py-2 text-center text-xs font-medium text-gray-500'>Estado</th>
                        <th className='px-4 py-2 text-right text-xs font-medium text-gray-500'>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-100'>
                      {items.length === 0 && (
                        <tr><td colSpan={6} className='p-4 text-sm text-gray-500'>Sin productos</td></tr>
                      )}
                      {items.map(p => (
                        <tr key={p.id} className='hover:bg-gray-50'>
                          <td className='px-4 py-3 flex items-center gap-3'>
                            <div className='w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center'>
                              {p.image ? <img src={p.image} alt={p.title} className='w-full h-full object-contain'/> : <div className='text-xs text-gray-400'>No image</div>}
                            </div>
                            <div>
                              <div className='font-medium'>{p.code || p.id} — {p.title}</div>
                              <div className='text-xs text-gray-500'>{p.unit || ''}</div>
                            </div>
                          </td>
                          <td className='px-4 py-3 text-sm text-gray-600'>{p.category || ''}</td>
                          <td className='px-4 py-3 text-sm text-right'>{formatCLP(Number(p.price || 0))}</td>
                          <td className='px-4 py-3 text-sm text-right'>{p.stock ?? '—'}</td>
                          <td className='px-4 py-3 text-center text-sm'>{((p.state !== undefined && p.state !== null) ? boolVal(p.state) : (p.active !== false)) ? <span className='text-green-600 font-medium'>Activo</span> : <span className='text-gray-500'>Inactivo</span>}</td>
                          <td className='px-4 py-3 text-right'>
                            <button onClick={() => openEditProduct(p)} className='text-sm text-blue-600 mr-3'>Editar</button>
                            <button onClick={() => toggleProductActive(p)} className='text-sm text-gray-700 mr-3'>{((p.state !== undefined && p.state !== null) ? boolVal(p.state) : (p.active !== false)) ? 'Desactivar' : 'Activar'}</button>
                            <button onClick={() => handleDeleteProduct(p.id)} className='text-sm text-red-600'>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading && view === 'users' && (
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <div className='text-lg font-medium'>Usuarios registrados</div>
                </div>

                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-100'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>ID</th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Email</th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Nombre</th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Rol</th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Creación</th>
                        <th className='px-4 py-2 text-right text-xs font-medium text-gray-500'>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-100'>
                      {items.length === 0 && (
                        <tr><td colSpan={6} className='p-4 text-sm text-gray-500'>Sin usuarios</td></tr>
                      )}
                      {items.map(u => (
                        <tr key={u.id} className='hover:bg-gray-50'>
                          <td className='px-4 py-3 text-sm text-gray-700 font-mono'>{u.id}</td>
                          <td className='px-4 py-3 text-sm text-gray-700'>{u.email || '—'}</td>
                          <td className='px-4 py-3 text-sm text-gray-600'>{u.primer_nombre ? `${u.primer_nombre} ${u.primer_apellido || ''}` : (u.username || u.name || '—')}</td>
                          <td className='px-4 py-3 text-sm text-gray-600'>{(u.role === true || u.isAdmin || u.admin) ? 'admin' : (u.role || 'user')}</td>
                          <td className='px-4 py-3 text-sm text-gray-500'>{u.created ? new Date(u.created).toLocaleString() : '—'}</td>
                          <td className='px-4 py-3 text-right'>
                            <button onClick={() => { navigator.clipboard?.writeText(u.id); alert('ID copiada al portapapeles') }} className='text-sm text-gray-700 mr-3'>Copiar ID</button>
                            <button onClick={() => alert(JSON.stringify(u, null, 2))} className='text-sm text-blue-600'>Ver</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Contacts/messages view */}
            {!loading && view === 'contacts' && (
              <div>
                <div className='flex justify-between items-center mb-4'>
                  <div className='text-lg font-medium'>Mensajes de Contacto</div>
                </div>

                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-100'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Fecha</th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Nombre</th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Email</th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500'>Mensaje</th>
                        <th className='px-4 py-2 text-center text-xs font-medium text-gray-500'>Leído</th>
                        <th className='px-4 py-2 text-right text-xs font-medium text-gray-500'>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-100'>
                      {items.length === 0 && (
                        <tr><td colSpan={6} className='p-4 text-sm text-gray-500'>Sin mensajes</td></tr>
                      )}
                      {items.map(m => (
                        <tr key={m.id} className={`hover:bg-gray-50 ${!m.read ? 'bg-yellow-50' : ''}`}>
                          <td className='px-4 py-3 text-sm text-gray-600'>{m.created ? new Date(m.created).toLocaleString() : ''}</td>
                          <td className={`px-4 py-3 text-sm ${!m.read ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>{m.name || m.nombre || '—'}</td>
                          <td className={`px-4 py-3 text-sm ${!m.read ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>{m.email || '—'}</td>
                          <td className={`px-4 py-3 text-sm ${!m.read ? 'text-gray-900' : 'text-gray-700'}`}>{(m.message || m.mensaje || m.body || '').slice(0,120)}{(m.message || m.mensaje || m.body || '').length > 120 ? '…' : ''}</td>
                          <td className='px-4 py-3 text-center text-sm'>{m.read ? <span className='text-green-600'>Sí</span> : <span className='text-yellow-700 font-medium'>No</span>}</td>
                          <td className='px-4 py-3 text-right'>
                            <button onClick={() => openMessage(m)} className='text-sm text-blue-600 mr-2'>Ver</button>
                            {m.read ? (
                              <button onClick={() => markContactUnread(m.id)} className='text-sm text-yellow-600 mr-2'>Marcar no leído</button>
                            ) : (
                              <button onClick={() => markContactRead(m.id)} className='text-sm text-green-600 mr-2'>Marcar leído</button>
                            )}
                            <button onClick={() => handleDeleteContact(m.id)} className='text-sm text-red-600'>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product modal */}
            {productModalOpen && (
              <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
                <div className='bg-white rounded w-full max-w-3xl p-6 shadow-lg'>
                  <div className='flex items-start justify-between mb-4'>
                    <h3 className='text-lg font-medium'>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <button onClick={() => setProductModalOpen(false)} className='text-gray-500 hover:text-gray-700'>Cerrar ✕</button>
                  </div>
                  <form onSubmit={submitProductForm} className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='md:col-span-2 space-y-3'>
                      <div>
                        <label className='block text-sm'>Código</label>
                        <input name='code' value={productForm.code} onChange={onProductFormChange} className='w-full border rounded py-2 px-3' />
                      </div>
                      <div>
                        <label className='block text-sm'>Título</label>
                        <input name='title' value={productForm.title} onChange={onProductFormChange} className='w-full border rounded py-2 px-3' />
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='block text-sm'>Categoría</label>
                          <input name='category' value={productForm.category} onChange={onProductFormChange} className='w-full border rounded py-2 px-3' />
                        </div>
                        <div>
                          <label className='block text-sm'>Unidad</label>
                          <input name='unit' value={productForm.unit} onChange={onProductFormChange} className='w-full border rounded py-2 px-3' />
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='block text-sm'>Precio</label>
                          <input name='price' value={productForm.price} onChange={onProductFormChange} type='number' step='0.01' className='w-full border rounded py-2 px-3' />
                        </div>
                        <div>
                          <label className='block text-sm'>Stock</label>
                          <input name='stock' value={productForm.stock} onChange={onProductFormChange} type='number' className='w-full border rounded py-2 px-3' />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm'>Descripción</label>
                        <textarea name='description' value={productForm.description} onChange={onProductFormChange} className='w-full border rounded py-2 px-3' />
                      </div>
                      <div className='flex items-center gap-3'>
                        <label className='flex items-center gap-2'><input name='active' checked={productForm.active} onChange={onProductFormChange} type='checkbox' /> Activo</label>
                        <label className='flex items-center gap-2'>
                          <span className='text-sm mr-2'>Visible</span>
                          <select name='state' value={String(productForm.state)} onChange={onProductFormChange} className='border rounded py-1 px-2 text-sm'>
                            <option value='true'>Sí</option>
                            <option value='false'>No</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <div>
                        <label className='block text-sm'>Imagen (opcional)</label>
                        <input id='product-image' type='file' accept='image/*' className='w-full' />
                      </div>
                      <div className='border rounded p-3 bg-gray-50'>
                        <div className='text-sm text-gray-500 mb-2'>Vista previa</div>
                        <div className='w-full h-48 bg-white rounded overflow-hidden flex items-center justify-center'>
                          {editingProduct && (editingProduct.image || editingProduct.cover) ? (
                            <img src={editingProduct.image || editingProduct.cover} alt={editingProduct.title} className='w-full h-full object-contain' />
                          ) : (
                            <div className='text-xs text-gray-400'>No hay imagen seleccionada</div>
                          )}
                        </div>
                      </div>
                      <div className='flex gap-2 justify-end'>
                        <button type='button' onClick={() => setProductModalOpen(false)} className='py-1 px-3 rounded border'>Cancelar</button>
                        <button type='submit' className='py-1 px-3 rounded bg-green-600 text-white w-full'>
                          {editingProduct ? 'Guardar cambios' : 'Crear producto'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </section>
        </div>
      </div>
    </div>
  )
}

function AreaChart({ series = [] }) {
  if (!Array.isArray(series) || series.length === 0) return <div className='text-sm text-gray-500'>Sin datos</div>
  const max = Math.max(...series.map(s => s.total || 0), 1)
  const width = 600
  const height = 140
  const points = series.map((s, i) => {
    const x = Math.round((i / Math.max(1, series.length - 1)) * (width - 40)) + 20
    const y = Math.round(height - 20 - ((Number(s.total || 0) / max) * (height - 40)))
    return `${x},${y}`
  }).join(' ')
  const poly = `20,${height - 20} ${points} ${width - 20},${height - 20}`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className='w-full h-36'>
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <polygon points={poly} fill="rgba(59,130,246,0.12)" />
      {series.map((s, i) => {
        const x = Math.round((i / Math.max(1, series.length - 1)) * (width - 40)) + 20
        const y = Math.round(height - 20 - ((Number(s.total || 0) / max) * (height - 40)))
        return <circle key={s.key} cx={x} cy={y} r={3} fill="#3b82f6" />
      })}
    </svg>
  )
}

function BarChart({ series = [] }) {
  // simple SVG bar chart
  if (!Array.isArray(series) || series.length === 0) return <div className='text-sm text-gray-500'>Sin datos</div>
  const max = Math.max(...series.map(s => s.total || 0), 1)
  const width = 600
  const height = 120
  const barW = Math.floor(width / series.length)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className='w-full h-32'>
      {series.map((s, i) => {
        const h = Math.round((Number(s.total || 0) / max) * (height - 20))
        const x = i * barW + 6
        const y = height - h - 20
        return (
          <g key={s.key}>
            <rect x={x} y={y} width={barW - 10} height={h} fill='#16a34a' rx='4' />
            <text x={x + (barW - 10) / 2} y={height - 6} fontSize='10' textAnchor='middle' fill='#374151'>{s.key.slice(5)}</text>
          </g>
        )
      })}
    </svg>
  )
}
