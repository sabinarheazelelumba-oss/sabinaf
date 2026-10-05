import { useState } from 'react'
import { login, register } from '../api.js'

export default function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ login: '', username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setFieldErrors({})
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      const session =
        mode === 'login'
          ? await login(form.login.trim(), form.password)
          : await register(form.username.trim(), form.email.trim(), form.password)
      onAuthenticated(session)
    } catch (err) {
      setError(err.message)
      if (err.errors) setFieldErrors(err.errors)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-story">
        <div className="auth-brand">
          <span className="brand-mark">PM</span>
          <span>Product Management</span>
        </div>
        <div className="auth-story-content">
          <span className="auth-eyebrow">Your inventory, in focus</span>
          <h1>Make every product count.</h1>
          <p className="auth-story-copy">
            A clearer view of your stock, product value, and the details that keep your business moving.
          </p>
          <div className="auth-preview" aria-hidden="true">
            <div className="preview-head">
              <span>Inventory overview</span>
              <span className="preview-dots"><i /><i /><i /></span>
            </div>
            <div className="preview-bars"><i /><i /><i /><i /><i /><i /><i /></div>
          </div>
        </div>
        <div className="auth-story-footer">A simple home for your product catalog.</div>
      </aside>
      <main className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-heading">
            <span className="auth-eyebrow">{mode === 'login' ? 'Welcome back' : 'Get started'}</span>
            <h2>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Enter your details to continue to your workspace.' : 'Set up your account to manage your products.'}</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {mode === 'login' ? (
            <label>
              Email or username
              <input
                name="login"
                value={form.login}
                onChange={update}
                placeholder="name@example.com"
                autoComplete="username"
                autoFocus
                required
              />
              {fieldErrors.login && <small className="field-error">{fieldErrors.login}</small>}
            </label>
          ) : (
            <>
            <label>
              Username
              <input name="username" value={form.username} onChange={update} autoComplete="username" required />
              {fieldErrors.username && <small className="field-error">{fieldErrors.username}</small>}
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required />
              {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
            </label>
            </>
          )}

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={update}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
            {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
          </label>

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <p className="switch">
            {mode === 'login' ? (
              <>
                New to Product Management?{' '}
                <button type="button" className="link" onClick={() => switchMode('register')}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" className="link" onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </main>
    </div>
  )
}
