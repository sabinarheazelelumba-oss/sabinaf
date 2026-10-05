import { useCallback, useEffect, useMemo, useState } from 'react'
import { createProduct, deleteProduct, getProducts, updateProduct } from '../api.js'
import ProductForm from './ProductForm.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

// "2026-10-05 14:30:00" -> "Oct 5, 2026 2:30 PM"  (shown exactly as stored, no timezone shifting)
function formatDate(value) {
  if (!value) return ''
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (!m) return value
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]))
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function ProductsPage({ user, onLogout }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('') // debounced search
  const [formFor, setFormFor] = useState(undefined) // undefined = closed, null = add, object = edit
  const [toDelete, setToDelete] = useState(null)

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProducts(await getProducts(query))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  // auto-hide success notices
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3000)
    return () => clearTimeout(t)
  }, [notice])

  async function handleSave(values) {
    if (formFor) {
      await updateProduct(formFor.id, values)
      setNotice('Product updated.')
    } else {
      await createProduct(values)
      setNotice('Product added.')
    }
    setFormFor(undefined)
    await load()
  }

  async function handleDelete() {
    try {
      await deleteProduct(toDelete.id)
      setNotice('Product deleted.')
      setToDelete(null)
      await load()
    } catch (err) {
      setToDelete(null)
      setError(err.message)
    }
  }

  const stats = useMemo(
    () => ({
      count: products.length,
      units: products.reduce((sum, p) => sum + p.quantity, 0),
      value: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    }),
    [products]
  )
  const initials = (user.username || user.email || 'User')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-inline">
          <span className="brand-mark">PM</span>
          <strong>Product Management</strong>
        </div>
        <div className="topbar-right">
          <div className="user-chip">
            <span className="avatar">{initials}</span>
            <span className="user-details"><strong>{user.username}</strong><span>Workspace account</span></span>
          </div>
          <button className="btn" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="container">
        <section className="page-heading">
          <div>
            <h1>Inventory overview</h1>
            <p>Keep track of your products and stock levels.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setFormFor(null)}>
            <span aria-hidden="true">＋</span> Add product
          </button>
        </section>

        <section className="stats">
          <div className="card stat-card">
            <div className="stat-copy"><span className="stat-label">Total products</span><strong>{stats.count}</strong></div>
            <span className="stat-icon" aria-hidden="true">▦</span>
          </div>
          <div className="card stat-card">
            <div className="stat-copy"><span className="stat-label">Units in stock</span><strong>{stats.units.toLocaleString()}</strong></div>
            <span className="stat-icon" aria-hidden="true">↗</span>
          </div>
          <div className="card stat-card">
            <div className="stat-copy"><span className="stat-label">Total inventory value</span><strong>{peso.format(stats.value)}</strong></div>
            <span className="stat-icon" aria-hidden="true">₱</span>
          </div>
        </section>

        <section className="card inventory-panel">
          <div className="toolbar">
            <div className="toolbar-title">
              <h2>Product catalog</h2>
              <span className="count-pill">{products.length}</span>
            </div>
            <div className="toolbar-actions">
              <div className="search-wrap">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <input
                  className="search"
                  type="search"
                  aria-label="Search products"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {notice && <div className="alert alert-success">{notice}</div>}
          {error && (
            <div className="alert alert-error">
              {error}{' '}
              <button className="link" onClick={load}>
                Retry
              </button>
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>In stock</th>
                  <th>Added</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="empty">
                      <span className="loading-mark" aria-hidden="true" />Loading your products...
                    </td>
                  </tr>
                )}
                {!loading && products.length === 0 && !error && (
                  <tr>
                    <td colSpan="6" className="empty">
                      {query ? 'No products match your search.' : 'No products yet. Click “Add product” to create one.'}
                    </td>
                  </tr>
                )}
                {!loading &&
                  products.map((p, index) => (
                    <tr key={p.id}>
                      <td className="name">
                        <div className="product-cell">
                          <span className={`product-glyph tone-${index % 4}`} aria-hidden="true">
                            {(p.product_name || 'P').slice(0, 1).toUpperCase()}
                          </span>
                          <span>{p.product_name}</span>
                        </div>
                      </td>
                      <td className="desc">{p.description}</td>
                      <td className="price">{peso.format(p.price)}</td>
                      <td>
                        <span className={p.quantity === 0 ? 'badge badge-out' : p.quantity < 10 ? 'badge badge-low' : 'badge'}>
                          {p.quantity === 0 ? 'Out of stock' : p.quantity < 10 ? `${p.quantity} left` : p.quantity}
                        </span>
                      </td>
                      <td className="nowrap">{formatDate(p.created_at)}</td>
                      <td className="actions">
                        <button className="btn btn-sm" onClick={() => setFormFor(p)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger-outline" onClick={() => setToDelete(p)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {formFor !== undefined && (
        <ProductForm product={formFor} onSave={handleSave} onCancel={() => setFormFor(undefined)} />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete product?"
          message={`“${toDelete.product_name}” will be permanently removed. This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
