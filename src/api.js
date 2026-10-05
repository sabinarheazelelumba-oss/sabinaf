// ---------------------------------------------------------------------------
// Tiny API client for the LavaLust API.
//  - sends the Bearer access token on every request
//  - if the access token expired (401) it silently uses the refresh token once,
//    then retries the original request
//  - the frontend NEVER talks to the database; everything goes through this API
// ---------------------------------------------------------------------------

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '')

const STORAGE_KEY = 'pms_session'

// ---- session storage -------------------------------------------------------
export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

// Called by App when the session can no longer be refreshed
let onSessionExpired = () => {}
export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn
}

// ---- errors ----------------------------------------------------------------
export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors || null // field errors from 422 responses
  }
}

// ---- low level request -----------------------------------------------------
async function rawRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the API. Check VITE_API_URL, your internet, or whether the server is awake.', 0)
  }

  let data = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const message = (data && (data.error || data.message)) || `Request failed (${response.status})`
    throw new ApiError(message, response.status, data && data.errors)
  }

  return data
}

// ---- token refresh (shared promise so parallel 401s refresh only once) -----
let refreshing = null

async function refreshTokens() {
  if (refreshing) return refreshing

  refreshing = (async () => {
    const session = loadSession()
    if (!session || !session.tokens || !session.tokens.refresh_token) {
      throw new ApiError('Session expired', 401)
    }
    const data = await rawRequest('/api/auth/refresh', {
      method: 'POST',
      body: { refresh_token: session.tokens.refresh_token },
    })
    const updated = { ...session, tokens: data.tokens }
    saveSession(updated)
    return updated
  })()

  try {
    return await refreshing
  } finally {
    refreshing = null
  }
}

// ---- authenticated request -------------------------------------------------
async function authRequest(path, options = {}) {
  const session = loadSession()
  if (!session) {
    onSessionExpired()
    throw new ApiError('Please log in.', 401)
  }

  try {
    return await rawRequest(path, { ...options, token: session.tokens.access_token })
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err

    // access token expired -> get a fresh one, then retry once
    try {
      const current = loadSession()
      const alreadyRefreshed = current && current.tokens.access_token !== session.tokens.access_token
      // If another request already refreshed the tokens while this one was in flight, reuse them.
      const fresh = alreadyRefreshed ? current : await refreshTokens()
      return await rawRequest(path, { ...options, token: fresh.tokens.access_token })
    } catch (refreshErr) {
      // Only log out when the server really rejected the refresh/new token;
      // a network hiccup should not kick the user out.
      if (refreshErr instanceof ApiError && (refreshErr.status === 401 || refreshErr.status === 403)) {
        clearSession()
        onSessionExpired()
        throw new ApiError('Your session has expired. Please log in again.', 401)
      }
      throw refreshErr
    }
  }
}

// ---- Auth ------------------------------------------------------------------
export async function login(loginName, password) {
  const data = await rawRequest('/api/auth/login', {
    method: 'POST',
    body: { login: loginName, password },
  })
  const session = { user: data.user, tokens: data.tokens }
  saveSession(session)
  return session
}

export async function register(username, email, password) {
  const data = await rawRequest('/api/auth/register', {
    method: 'POST',
    body: { username, email, password },
  })
  const session = { user: data.user, tokens: data.tokens }
  saveSession(session)
  return session
}

export async function logout() {
  const session = loadSession()
  try {
    if (session) {
      await rawRequest('/api/auth/logout', {
        method: 'POST',
        token: session.tokens.access_token,
        body: { refresh_token: session.tokens.refresh_token },
      })
    }
  } catch {
    // even if the server call fails (expired token, offline) we still log out locally
  } finally {
    clearSession()
  }
}

// ---- Products (all require a login) ----------------------------------------
export async function getProducts(search = '') {
  const q = search ? `?search=${encodeURIComponent(search)}` : ''
  const data = await authRequest(`/api/products${q}`)
  return data.data || []
}

export async function createProduct(product) {
  const data = await authRequest('/api/products', { method: 'POST', body: product })
  return data.data
}

export async function updateProduct(id, product) {
  const data = await authRequest(`/api/products/${id}`, { method: 'PUT', body: product })
  return data.data
}

export async function deleteProduct(id) {
  await authRequest(`/api/products/${id}`, { method: 'DELETE' })
}

export { API_URL }
