import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Services from './pages/Services'
import Login from './pages/Login' 

function getTokenRole(token) {
  try {
    if (!token) return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload?.role ?? null
  } catch {
    return null
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const isAdmin = getTokenRole(token) === 'ROLE_ADMIN'

  useEffect(() => {
    setCurrentPage(token ? 'home' : 'login')
  }, [token])

  function handleLoginSuccess(newToken) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setCurrentPage('home')
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken('')
    setCurrentPage('login')
  }

  function renderPage() {
    if (!token || currentPage === 'login') {
      return <Login onLoginSuccess={handleLoginSuccess} />
    }

    if (currentPage === 'about') return <About />
    if (currentPage === 'contact') return <Contact />
    if (currentPage === 'services') return <Services />

    return <Home token={token} onLogout={handleLogout} />
  }

  return (
    <>
      <Header 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onLogout={handleLogout} 
        isAdmin={isAdmin}
      />
      <main className="app-shell">
        {renderPage()}
      </main>
      <Footer />
    </>
  )
}

export default App