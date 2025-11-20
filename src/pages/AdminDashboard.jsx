import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { getRecords, updateRecord, deleteRecord, createRecord, createRecordForm, updateRecordForm } from '../utils/pocketApi'

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
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({ code: '', title: '', category: '', price: '', unit: '', stock: '', description: '', active: true })

  // Sales chart data (derived from orders)
  const [salesSeries, setSalesSeries] = useState([]) // [{day:'2025-11-19', total: 123}, ...]

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
          res = await getRecords('users', '?sort=-created')
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
    } catch (err) {
      alert('Error al actualizar orden: ' + (err.message || String(err)))
    }
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
    setProductForm({ code: p.code || p.id || '', title: p.title || '', category: p.category || '', price: p.price || '', unit: p.unit || '', stock: p.stock || '', description: p.description || '', active: p.active !== false })
    setProductModalOpen(true)
  }

  function onProductFormChange(e) {
    const { name, value, type, checked } = e.target
    setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
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
          fd.append('active', productForm.active ? 'true' : 'false')
          fd.append('image', file)
          await updateRecordForm('products', editingProduct.id, fd)
        } else {
          await updateRecord('products', editingProduct.id, { code: productForm.code, title: productForm.title, category: productForm.category, price: Number(productForm.price || 0), unit: productForm.unit, stock: Number(productForm.stock || 0), description: productForm.description, active: productForm.active })
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
          fd.append('active', productForm.active ? 'true' : 'false')
          fd.append('image', file)
          await createRecordForm('products', fd)
        } else {
          await createRecord('products', { code: productForm.code, title: productForm.title, category: productForm.category, price: Number(productForm.price || 0), unit: productForm.unit, stock: Number(productForm.stock || 0), description: productForm.description, active: productForm.active })
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
      await updateRecord('products', p.id, { active: !p.active })
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
          <h1 className="text-2xl font-semibold">Admin Dashboard <span className='ml-2 text-xl inline-block' aria-hidden>👨‍💻</span></h1>
            <div className='flex items-center gap-3'>
            <button onClick={() => setView('orders')} className={`py-1 px-3 rounded ${view==='orders' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Pedidos</button>
            <button onClick={() => setView('products')} className={`py-1 px-3 rounded ${view==='products' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Productos</button>
            <button onClick={() => setView('contacts')} className={`py-1 px-3 rounded ${view==='contacts' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Mensajes</button>
            <button onClick={() => setView('users')} className={`py-1 px-3 rounded ${view==='users' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Usuarios</button>
            <button onClick={() => { navigate('/') }} className='py-1 px-3 rounded bg-white border text-sm'>Volver al sitio</button>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white p-4 rounded shadow-sm'>
            <div className='text-sm text-gray-500'>Pedidos</div>
            <div className='text-xl font-semibold'>{view === 'orders' ? items.length : '—'}</div>
            <div className='text-xs text-gray-400'>Últimos</div>
          </div>
          <div className='bg-white p-4 rounded shadow-sm'>
            <div className='text-sm text-gray-500'>Ingresos (7d)</div>
            <div className='text-xl font-semibold'>{formatCLP((salesSeries || []).reduce((s, x) => s + (x.total || 0), 0))}</div>
            <div className='text-xs text-gray-400'>Total estimado</div>
          </div>
          <div className='bg-white p-4 rounded shadow-sm'>
            <div className='text-sm text-gray-500'>Productos</div>
            <div className='text-xl font-semibold'>{view === 'products' ? items.length : '—'}</div>
            <div className='text-xs text-gray-400'>Totales</div>
          </div>
          <div className='bg-white p-4 rounded shadow-sm'>
            <div className='text-sm text-gray-500'>Usuarios</div>
            <div className='text-xl font-semibold'>{view === 'users' ? items.length : '—'}</div>
            <div className='text-xs text-gray-400'>Registrados</div>
          </div>
        </div>

        <div className='bg-white rounded shadow-sm p-4'>
          <section className="flex-1">
            {loading && <div>Cargando {view}...</div>}
            {error && <div className='text-red-600'>Error: {error}</div>}

            {/* Sales chart for orders view */}
            {!loading && view === 'orders' && (
              <div className='space-y-4'>
                <div className='p-4 rounded bg-gradient-to-r from-green-50 to-white'>
                  <h3 className='font-medium mb-2 text-gray-700'>Ventas (últimos 7 días)</h3>
                  <SalesChart series={salesSeries} />
                </div>

                <div className='overflow-x-auto'>
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
                          <td className='px-4 py-3 text-sm text-gray-600'>{typeof o.user === 'object' ? (o.user.email || o.user.id) : (o.user || '—')}</td>
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
                            <button onClick={() => { navigate(`/orders/${o.id}`) }} className='text-sm text-blue-600 mr-2'>Ver</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                          <td className='px-4 py-3 text-center text-sm'>{p.active ? <span className='text-green-600 font-medium'>Activo</span> : <span className='text-gray-500'>Inactivo</span>}</td>
                          <td className='px-4 py-3 text-right'>
                            <button onClick={() => openEditProduct(p)} className='text-sm text-blue-600 mr-3'>Editar</button>
                            <button onClick={() => toggleProductActive(p)} className='text-sm text-gray-700 mr-3'>{p.active ? 'Desactivar' : 'Activar'}</button>
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
              <div className='space-y-3'>
                {items.length === 0 && <div className='text-sm text-gray-500'>Sin usuarios</div>}
                {items.map(u => (
                  <div key={u.id} className='p-3 border rounded'>
                    <div className='font-medium'>{u.email || u.id}</div>
                    <div className='text-sm text-gray-500'>{u.primer_nombre ? `${u.primer_nombre} ${u.primer_apellido || ''}` : ''}</div>
                  </div>
                ))}
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
                        <tr key={m.id} className='hover:bg-gray-50'>
                          <td className='px-4 py-3 text-sm text-gray-600'>{m.created ? new Date(m.created).toLocaleString() : ''}</td>
                          <td className='px-4 py-3 text-sm text-gray-700'>{m.name || m.nombre || '—'}</td>
                          <td className='px-4 py-3 text-sm text-gray-600'>{m.email || '—'}</td>
                          <td className='px-4 py-3 text-sm text-gray-700'>{m.message || m.mensaje || m.body || ''}</td>
                          <td className='px-4 py-3 text-center text-sm'>{m.read ? <span className='text-green-600'>Sí</span> : <span className='text-gray-500'>No</span>}</td>
                          <td className='px-4 py-3 text-right'>
                            {!m.read && <button onClick={() => markContactRead(m.id)} className='text-sm text-green-600 mr-3'>Marcar leído</button>}
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

function SalesChart({ series = [] }) {
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
