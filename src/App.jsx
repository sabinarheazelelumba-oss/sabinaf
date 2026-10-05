import { useEffect, useState } from 'react'
import LoginPage from './components/LoginPage.jsx'
import ProductsPage from './components/ProductsPage.jsx'
import { loadSession, logout, setSessionExpiredHandler } from './api.js'

export default function App() {
  const [session, setSession] = useState(() => loadSession())

  // If the API says the session can't be refreshed anymore, go back to the login screen.
  useEffect(() => {
    setSessionExpiredHandler(() => setSession(null))
  }, [])

  async function handleLogout() {
    await logout()
    setSession(null)
  }

  if (!session) {
    return <LoginPage onAuthenticated={setSession} />
  }

  return <ProductsPage user={session.user} onLogout={handleLogout} />
}
