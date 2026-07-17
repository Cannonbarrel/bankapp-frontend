import { useEffect, useMemo, useState } from 'react'

function decodeToken(token) {
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

export default function Home({ token, onLogout }) {
  const [accountData, setAccountData] = useState(null)
  const [adminAccounts, setAdminAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [txLoading, setTxLoading] = useState(false)

  const [txType, setTxType] = useState('deposit')
  const [txAccountType, setTxAccountType] = useState('checking')
  const [txAmount, setTxAmount] = useState('')
  const [transferDirection, setTransferDirection] = useState('checking-to-savings')
  const [transferAmount, setTransferAmount] = useState('')

  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newChecking, setNewChecking] = useState('0')
  const [newSavings, setNewSavings] = useState('0')
  const [adminBusy, setAdminBusy] = useState(false)

  const customerInputStyle = {
    backgroundColor: '#111111',
    color: '#ffffff',
    border: '1px solid #4e3629',
    borderRadius: '6px',
    padding: '10px',
  }

  const customerButtonStyle = {
    backgroundColor: '#4e3629',
    color: '#ffffff',
    border: '1px solid #3e2723',
    borderRadius: '6px',
    padding: '10px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  }

  const customerPanelStyle = {
    marginTop: '20px',
    border: '1px solid #3e2723',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#0d0d0d',
    color: '#ffffff',
  }

  const adminInputStyle = {
    backgroundColor: '#111111',
    color: '#ffffff',
    border: '1px solid #4e3629',
    borderRadius: '6px',
    padding: '10px',
  }

  const adminButtonStyle = {
    backgroundColor: '#4e3629',
    color: '#ffffff',
    border: '1px solid #3e2723',
    borderRadius: '6px',
    padding: '10px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  }

  const adminPanelStyle = {
    marginTop: '20px',
    border: '1px solid #3e2723',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#0d0d0d',
    color: '#ffffff',
  }

  const payload = useMemo(() => decodeToken(token), [token])
  const username = payload?.username || 'Guest'
  const isAdmin = payload?.role === 'ROLE_ADMIN'

  function getDisplayName(acc) {
    return acc?.userName || acc?.username || acc?.name || ''
  }

  function normalizeId(value) {
    if (!value) return null
    if (typeof value === 'string' || typeof value === 'number') return String(value)
    if (typeof value === 'object') {
      if (value.$oid) return String(value.$oid)
      if (value.oid) return String(value.oid)
      if (value.id) return String(value.id)
    }
    return null
  }

  function getAccountId(acc) {
    return normalizeId(acc?._id) || normalizeId(acc?.id)
  }

  function getHeaders(extra = {}) {
    return {
      Authorization: `Bearer ${token}`,
      ...extra,
    }
  }

  async function loadCustomerAccount() {
    const allRes = await fetch('http://localhost:5000/accounts', {
      headers: getHeaders(),
    })
    if (!allRes.ok) throw new Error('Failed to load account index.')

    const allAccounts = await allRes.json()
    const normalizedUser = (username || '').trim().toLowerCase()

    const match = Array.isArray(allAccounts)
      ? allAccounts.find((acc) => {
          const candidate = getDisplayName(acc).trim().toLowerCase()
          return Boolean(candidate) && candidate === normalizedUser
        })
      : null

    const accountId = getAccountId(match)
    if (!accountId) {
      throw new Error(`No account found for user '${username}'.`)
    }

    const detailRes = await fetch(`http://localhost:5000/accounts/${accountId}`, {
      headers: getHeaders(),
    })
    if (!detailRes.ok) throw new Error('Failed to load customer account details.')

    const detail = await detailRes.json()
    setAccountData(detail)
  }

  async function loadAdminAccounts() {
    const res = await fetch('http://localhost:5000/accounts', {
      headers: getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to load admin metrics.')

    const accounts = await res.json()
    setAdminAccounts(Array.isArray(accounts) ? accounts : [])
    setAccountData(null)
  }

  async function refreshDashboard() {
    setLoading(true)
    setError('')

    try {
      if (isAdmin) {
        await loadAdminAccounts()
      } else {
        await loadCustomerAccount()
      }
    } catch (err) {
      setError(err.message || 'Error loading dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Please login to load account data.')
      return
    }

    refreshDashboard()
  }, [isAdmin, token, username])

  async function submitTransaction(e) {
    e.preventDefault()
    const amount = Number(txAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Enter a valid transaction amount greater than 0.')
      setActionMessage('')
      return
    }

    const accountId = getAccountId(accountData)
    if (!accountId) {
      setActionError('Customer account id is missing.')
      setActionMessage('')
      return
    }

    const endpoint = txType === 'deposit' ? 'deposit' : 'withdraw'

    setTxLoading(true)
    setActionError('')
    setActionMessage('')

    try {
      const res = await fetch(`http://localhost:5000/accounts/${accountId}/${endpoint}`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ amount, account_type: txAccountType }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Failed to ${txType} funds.`)

      setAccountData(data)
      setActionMessage(`${txType === 'deposit' ? 'Deposit' : 'Withdrawal'} successful.`)
      setTxAmount('')
    } catch (err) {
      setActionError(err.message || 'Transaction failed.')
    } finally {
      setTxLoading(false)
    }
  }

  async function submitTransfer(e) {
    e.preventDefault()
    const amount = Number(transferAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Enter a valid transfer amount greater than 0.')
      setActionMessage('')
      return
    }

    const accountId = getAccountId(accountData)
    if (!accountId) {
      setActionError('Customer account id is missing.')
      setActionMessage('')
      return
    }

    const fromType = transferDirection === 'checking-to-savings' ? 'checking' : 'savings'
    const toType = transferDirection === 'checking-to-savings' ? 'savings' : 'checking'

    setTxLoading(true)
    setActionError('')
    setActionMessage('')

    try {
      const withdrawRes = await fetch(`http://localhost:5000/accounts/${accountId}/withdraw`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ amount, account_type: fromType }),
      })

      const withdrawData = await withdrawRes.json().catch(() => ({}))
      if (!withdrawRes.ok) {
        throw new Error(withdrawData?.error || 'Transfer failed during withdrawal step.')
      }

      const depositRes = await fetch(`http://localhost:5000/accounts/${accountId}/deposit`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ amount, account_type: toType }),
      })

      const depositData = await depositRes.json().catch(() => ({}))
      if (!depositRes.ok) {
        throw new Error(depositData?.error || 'Transfer failed during deposit step.')
      }

      setAccountData(depositData)
      setTransferAmount('')
      setActionMessage('Transfer completed successfully.')
    } catch (err) {
      setActionError(`${err.message} If the first step succeeded, balances may be temporarily out of sync until refresh.`)
      await refreshDashboard()
    } finally {
      setTxLoading(false)
    }
  }

  async function createAccount(e) {
    e.preventDefault()
    const checkingStart = Number(newChecking)
    const savingsStart = Number(newSavings)

    if (!newName.trim()) {
      setActionError('New account username is required.')
      setActionMessage('')
      return
    }
    if (!Number.isFinite(checkingStart) || checkingStart < 0 || !Number.isFinite(savingsStart) || savingsStart < 0) {
      setActionError('Initial balances must be numbers greater than or equal to 0.')
      setActionMessage('')
      return
    }

    setAdminBusy(true)
    setActionError('')
    setActionMessage('')

    try {
      const createRes = await fetch('http://localhost:5000/accounts', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          userName: newName.trim(),
          password: newPassword,
          initial_balance: checkingStart,
        }),
      })

      const created = await createRes.json().catch(() => ({}))
      if (!createRes.ok) throw new Error(created?.error || 'Failed to create account.')

      const createdId = getAccountId(created)

      if (createdId && savingsStart > 0) {
        const savingsRes = await fetch(`http://localhost:5000/accounts/${createdId}/deposit`, {
          method: 'POST',
          headers: getHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ amount: savingsStart, account_type: 'savings' }),
        })

        const savingsData = await savingsRes.json().catch(() => ({}))
        if (!savingsRes.ok) {
          throw new Error(savingsData?.error || 'Account created but failed to seed savings balance.')
        }
      }

      setNewName('')
      setNewPassword('')
      setNewChecking('0')
      setNewSavings('0')
      setActionMessage('Account created successfully.')
      await refreshDashboard()
    } catch (err) {
      setActionError(err.message || 'Unable to create account.')
    } finally {
      setAdminBusy(false)
    }
  }

  async function deleteAccount(accountId) {
    if (!accountId) return

    setAdminBusy(true)
    setActionError('')
    setActionMessage('')

    try {
      const res = await fetch(`http://localhost:5000/accounts/${accountId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to delete account.')

      setActionMessage('Account deleted successfully.')
      await refreshDashboard()
    } catch (err) {
      setActionError(err.message || 'Unable to delete account.')
    } finally {
      setAdminBusy(false)
    }
  }

  if (!token) {
    return (
      <section style={{ padding: '20px' }}>
        <h2>Secure Banking Dashboard</h2>
        <p>Login to view your account dashboard.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section style={{ padding: '20px' }}>
        <h2>Loading Dashboard</h2>
        <p>Retrieving secure account data...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section style={{ padding: '20px' }}>
        <h2>Dashboard Error</h2>
        <p style={{ color: '#b42318' }}>{error}</p>
      </section>
    )
  }

  if (isAdmin) {
    const totalAccounts = adminAccounts.length
    const totalChecking = adminAccounts.reduce(
      (sum, acc) => sum + Number(acc?.checking_balance || 0),
      0,
    )
    const totalSavings = adminAccounts.reduce(
      (sum, acc) => sum + Number(acc?.savings_balance || 0),
      0,
    )

    return (
      <section style={{ padding: '20px' }}>
        <h2>Admin Dashboard</h2>
        <p>Welcome, {username}.</p>
        {actionMessage && <p style={{ color: '#067647' }}>{actionMessage}</p>}
        {actionError && <p style={{ color: '#b42318' }}>{actionError}</p>}
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <article style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '16px' }}>
            <h3>Total Accounts</h3>
            <p>{totalAccounts}</p>
          </article>
          <article style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '16px' }}>
            <h3>Total Checking</h3>
            <p>${totalChecking.toFixed(2)}</p>
          </article>
          <article style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '16px' }}>
            <h3>Total Savings</h3>
            <p>${totalSavings.toFixed(2)}</p>
          </article>
        </div>

        <section style={adminPanelStyle}>
          <h3>Create Account</h3>
          <form onSubmit={createAccount} style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <input
              type="text"
              placeholder="Username"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={adminInputStyle}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={adminInputStyle}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Initial Checking"
              value={newChecking}
              onChange={(e) => setNewChecking(e.target.value)}
              style={adminInputStyle}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Initial Savings"
              value={newSavings}
              onChange={(e) => setNewSavings(e.target.value)}
              style={adminInputStyle}
            />
            <button type="submit" disabled={adminBusy} style={{ ...adminButtonStyle, opacity: adminBusy ? 0.75 : 1 }}>
              {adminBusy ? 'Saving...' : 'Create Account'}
            </button>
          </form>
        </section>

        <section style={adminPanelStyle}>
          <h3>Customer Accounts</h3>
          {adminAccounts.length === 0 ? (
            <p>No accounts found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {adminAccounts.map((acc, index) => {
                const id = getAccountId(acc)
                return (
                  <article key={id || `${getDisplayName(acc)}-${index}`} style={{ border: '1px solid #4e3629', borderRadius: '8px', padding: '12px', backgroundColor: '#111111', color: '#ffffff' }}>
                    <p><strong>Name:</strong> {getDisplayName(acc) || 'Unknown'}</p>
                    <p><strong>Id:</strong> {id || 'N/A'}</p>
                    <p><strong>Checking:</strong> ${Number(acc?.checking_balance || 0).toFixed(2)}</p>
                    <p><strong>Savings:</strong> ${Number(acc?.savings_balance || 0).toFixed(2)}</p>
                    <button type="button" onClick={() => deleteAccount(id)} disabled={adminBusy || !id} style={{ ...adminButtonStyle, opacity: adminBusy || !id ? 0.65 : 1 }}>
                      {adminBusy ? 'Working...' : 'Delete Account'}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </section>
    )
  }

  const checking = Number(accountData?.checking_balance || 0)
  const savings = Number(accountData?.savings_balance || 0)

  return (
    <section style={{ padding: '20px' }}>
      <h2>Customer Dashboard</h2>
      <p>Welcome back, {username}.</p>
      <button
        type="button"
        onClick={onLogout}
        style={{ ...customerButtonStyle, marginBottom: '12px' }}
      >
        Logout
      </button>
      {actionMessage && <p style={{ color: '#067647' }}>{actionMessage}</p>}
      {actionError && <p style={{ color: '#b42318' }}>{actionError}</p>}
      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <article style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '16px' }}>
          <h3>Checking Balance</h3>
          <p>${checking.toFixed(2)}</p>
        </article>
        <article style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '16px' }}>
          <h3>Savings Balance</h3>
          <p>${savings.toFixed(2)}</p>
        </article>
        <article style={{ border: '1px solid #d0d5dd', borderRadius: '8px', padding: '16px' }}>
          <h3>Account Id</h3>
          <p>{getAccountId(accountData) || 'N/A'}</p>
        </article>
      </div>

      <section style={customerPanelStyle}>
        <h3>Deposit / Withdraw</h3>
        <form onSubmit={submitTransaction} style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <select value={txType} onChange={(e) => setTxType(e.target.value)} style={customerInputStyle}>
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
          </select>
          <select value={txAccountType} onChange={(e) => setTxAccountType(e.target.value)} style={customerInputStyle}>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            style={customerInputStyle}
            required
          />
          <button type="submit" disabled={txLoading} style={{ ...customerButtonStyle, opacity: txLoading ? 0.75 : 1 }}>
            {txLoading ? 'Processing...' : 'Submit'}
          </button>
        </form>
      </section>

      <section style={customerPanelStyle}>
        <h3>Transfer Between Accounts</h3>
        <form onSubmit={submitTransfer} style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <select value={transferDirection} onChange={(e) => setTransferDirection(e.target.value)} style={customerInputStyle}>
            <option value="checking-to-savings">Checking to Savings</option>
            <option value="savings-to-checking">Savings to Checking</option>
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Transfer Amount"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            style={customerInputStyle}
            required
          />
          <button type="submit" disabled={txLoading} style={{ ...customerButtonStyle, opacity: txLoading ? 0.75 : 1 }}>
            {txLoading ? 'Transferring...' : 'Transfer'}
          </button>
        </form>
      </section>
    </section>
  )
}
