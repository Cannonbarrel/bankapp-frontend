import { useState } from 'react'

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = {
    width: '100%',
    padding: '10px',
    boxSizing: 'border-box',
    backgroundColor: '#111111',
    color: '#ffffff',
    border: '1px solid #4e3629',
    borderRadius: '6px',
  }

  const primaryButtonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#4e3629',
    color: '#ffffff',
    border: '1px solid #3e2723',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const trimmedUsername = username.trim()
    const isLoggingAsAdmin = trimmedUsername.toLowerCase() === 'admin'
    const requestedRole = isLoggingAsAdmin ? 'ROLE_ADMIN' : 'ROLE_USER'

    if (!trimmedUsername) {
      setError('Username is required.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:5000/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: trimmedUsername,
          password: password, 
          role: requestedRole 
        })
      })

      const data = await response.json()

      if (response.ok && data.token) {
        onLoginSuccess(data.token)
      } else {
        setError(data.error || 'Failed to authenticate.')
      }
    } catch (err) {
      console.error("Login connection error:", err)
      setError('Cannot connect to the backend server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container" style={{ maxWidth: '420px', margin: '50px auto', padding: '20px', border: '1px solid #3e2723', borderRadius: '8px', backgroundColor: '#0d0d0d', color: '#ffffff' }}>
      <h2>Secure Banking Login</h2>
      <p style={{ marginTop: '0', color: '#475467' }}>
        Use your customer username to view balances, or use <strong>admin</strong> credentials for admin metrics.
      </p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            style={inputStyle}
            placeholder="Enter your username"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            style={inputStyle}
            placeholder={username.trim().toLowerCase() === 'admin' ? 'Enter admin password' : 'Enter your password'}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ ...primaryButtonStyle, opacity: loading ? 0.75 : 1 }}
        >
          {loading ? 'Authenticating...' : 'Login'}
        </button>
      </form>
    </div>
  )
}