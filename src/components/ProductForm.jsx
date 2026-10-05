import { useEffect, useRef, useState } from 'react'

const EMPTY = { product_name: '', description: '', price: '', quantity: '' }

/**
 * Modal form used for both "Add product" (product = null) and "Edit product".
 * `onSave(values)` must return a promise; it throws an Error (with optional .errors) on failure.
 */
export default function ProductForm({ product, onSave, onCancel }) {
  const editing = Boolean(product)
  const [form, setForm] = useState(
    product
      ? {
          product_name: product.product_name,
          description: product.description || '',
          price: String(product.price),
          quantity: String(product.quantity),
        }
      : EMPTY
  )
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const firstField = useRef(null)

  useEffect(() => {
    firstField.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !saving) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saving, onCancel])

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // quick client-side checks (the API validates again)
    const errors = {}
    if (!form.product_name.trim()) errors.product_name = 'Product name is required.'
    if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0)
      errors.price = 'Enter a valid price (0 or more).'
    if (form.quantity === '' || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0)
      errors.quantity = 'Enter a whole number (0 or more).'
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setSaving(true)
    try {
      await onSave({
        product_name: form.product_name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
      })
    } catch (err) {
      setError(err.message)
      if (err.errors) setFieldErrors(err.errors)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onCancel()}>
      <form className="card modal" onSubmit={submit} noValidate>
        <h2>{editing ? 'Edit product' : 'Add product'}</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <label>
          Product name
          <input
            ref={firstField}
            name="product_name"
            value={form.product_name}
            onChange={update}
            maxLength={100}
            placeholder="e.g. Wireless Mouse"
          />
          {fieldErrors.product_name && <small className="field-error">{fieldErrors.product_name}</small>}
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={update}
            rows={3}
            placeholder="Optional details about the product"
          />
          {fieldErrors.description && <small className="field-error">{fieldErrors.description}</small>}
        </label>

        <div className="row">
          <label>
            Price (₱)
            <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={update} />
            {fieldErrors.price && <small className="field-error">{fieldErrors.price}</small>}
          </label>
          <label>
            Quantity
            <input name="quantity" type="number" step="1" min="0" value={form.quantity} onChange={update} />
            {fieldErrors.quantity && <small className="field-error">{fieldErrors.quantity}</small>}
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  )
}
