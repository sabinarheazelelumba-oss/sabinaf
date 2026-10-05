import { useState } from 'react'

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="card modal modal-sm">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirm} disabled={busy}>
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
