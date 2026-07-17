import { useEffect, useState } from 'react'
import DataService from '../api/DataService'
import Customer from '../models/Customer'
import './Data.css'

export default function Data() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newUserName, setNewUserName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)

  // Customer Dashboard mode: when set, we show a single-customer view
  // instead of the admin list.
  const [activeCustomer, setActiveCustomer] = useState(null)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferDirection, setTransferDirection] = useState('checking-to-savings')
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState(null)

  function loadCustomers() {
    setLoading(true)
    setError(null)
    return DataService.getCustomers()
      .then((res) => {
        // expect an array of account objects from the Flask backend
        const list = Array.isArray(res)
          ? res.map((account) => {
              const customer = Customer.from(account)
              // balances aren't part of the shared Customer model,
              // so we attach them alongside it for display purposes
              customer.checkingBalance = account.checking_balance ?? 0
              customer.savingsBalance = account.savings_balance ?? 0
              return customer
            })
          : []
        setCustomers(list)
        return list
      })
      .catch((err) => {
        setError(err.message || 'Failed to load customers')
        return []
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCreate(e) {
    e.preventDefault()
    const userName = newUserName.trim()
    const password = newPassword.trim()
    if (!userName) return

    setCreating(true)
    DataService.createCustomer(userName, password)
      .then(() => {
        setNewUserName('')
        setNewPassword('')
        return loadCustomers()
      })
      .catch((err) => setError(err.message || 'Failed to create user'))
      .finally(() => setCreating(false))
  }

  function refreshActiveCustomer() {
    return loadCustomers().then((list) => {
      const updated = list.find((c) => c.id === activeCustomer.id)
      if (updated) setActiveCustomer(updated)
    })
  }

  function handleDeposit(customer) {
    const amountStr = window.prompt(`Deposit amount for ${customer.name}:`)
    if (amountStr === null) return
    const amount = parseFloat(amountStr)
    if (Number.isNaN(amount) || amount <= 0) {
      window.alert('Please enter a valid amount.')
      return
    }

    const accountType = (window.prompt('Account type (checking/savings):', 'checking') || 'checking').toLowerCase()

    DataService.deposit(customer.id, amount, accountType)
      .then(() => refreshActiveCustomer())
      .catch((err) => setError(err.message || 'Deposit failed'))
  }

  function handleWithdraw(customer) {
    const amountStr = window.prompt(`Withdraw amount for ${customer.name}:`)
    if (amountStr === null) return
    const amount = parseFloat(amountStr)
    if (Number.isNaN(amount) || amount <= 0) {
      window.alert('Please enter a valid amount.')
      return
    }

    const accountType = (window.prompt('Account type (checking/savings):', 'checking') || 'checking').toLowerCase()

    DataService.withdraw(customer.id, amount, accountType)
      .then(() => refreshActiveCustomer())
      .catch((err) => setError(err.message || 'Withdraw failed'))
  }

  function handleDelete(customer) {
    const confirmed = window.confirm(`Delete account for ${customer.name}? This cannot be undone.`)
    if (!confirmed) return

    DataService.deleteCustomer(customer.id)
      .then(() => loadCustomers())
      .catch((err) => setError(err.message || 'Delete failed'))
  }

  function handleLoginAsCustomer(customer) {
    setTransferAmount('')
    setTransferDirection('checking-to-savings')
    setTransferError(null)
    setActiveCustomer(customer)
  }

  function handleLogout() {
    setActiveCustomer(null)
    setTransferAmount('')
    setTransferError(null)
  }

  function handleTransferSubmit(e) {
    e.preventDefault()
    setTransferError(null)

    const amount = parseFloat(transferAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      setTransferError('Please enter a valid amount.')
      return
    }

    const fromType = transferDirection === 'checking-to-savings' ? 'checking' : 'savings'
    const toType = transferDirection === 'checking-to-savings' ? 'savings' : 'checking'

    // No /transfer endpoint on the backend, so a transfer is a withdraw
    // from the source account type followed by a deposit to the target type.
    setTransferring(true)
    DataService.withdraw(activeCustomer.id, amount, fromType)
      .then(() => DataService.deposit(activeCustomer.id, amount, toType))
      .then(() => {
        setTransferAmount('')
        return refreshActiveCustomer()
      })
      .catch((err) => setTransferError(err.message || 'Transfer failed'))
      .finally(() => setTransferring(false))
  }

  if (activeCustomer) {
    return (
      <div className="customers">
        <div className="customer-dashboard">
          <div className="dashboard-header">
            <h2>Welcome back, {activeCustomer.name}!</h2>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Log Out / Back to Admin
            </button>
          </div>

          <div className="balance-cards">
            <div className="balance-card">
              <p className="balance-label">Checking</p>
              <p className="balance-amount">${activeCustomer.checkingBalance.toFixed(2)}</p>
            </div>
            <div className="balance-card">
              <p className="balance-label">Savings</p>
              <p className="balance-amount">${activeCustomer.savingsBalance.toFixed(2)}</p>
            </div>
          </div>

          <div className="customer-quick-actions">
            <button type="button" className="btn-deposit" onClick={() => handleDeposit(activeCustomer)}>
              Deposit
            </button>
            <button type="button" className="btn-withdraw" onClick={() => handleWithdraw(activeCustomer)}>
              Withdraw
            </button>
          </div>

          <form className="transfer-form" onSubmit={handleTransferSubmit}>
            <h3>Transfer Funds</h3>
            <div className="transfer-fields">
              <input
                type="number"
                step="0.01"
                min="0"
                className="transfer-input"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
              <select
                className="transfer-select"
                value={transferDirection}
                onChange={(e) => setTransferDirection(e.target.value)}
              >
                <option value="checking-to-savings">Checking to Savings</option>
                <option value="savings-to-checking">Savings to Checking</option>
              </select>
              <button type="submit" className="btn-transfer" disabled={transferring}>
                {transferring ? 'Transferring...' : 'Submit Transfer'}
              </button>
            </div>
            {transferError && <p className="transfer-error">{transferError}</p>}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="customers">
      <form className="create-user-form" onSubmit={handleCreate}>
        <input
          type="text"
          className="create-user-input"
          placeholder="New customer name"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
        />
        <input
          type="password"                  
          className="create-user-input"
          placeholder="Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        
        <button type="submit" className="btn-create" disabled={creating}>
          {creating ? 'Creating...' : 'Create User'}
        </button>
      </form>

      {loading && <p>Loading customers...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && customers.length === 0 && <p>No customers found.</p>}

      {!loading && customers.map((c) => (
        <div key={c.id} className="customer-row">
          <div className="customer-avatar">{(c.name || '?').charAt(0).toUpperCase()}</div>
          <div>
            <p className="customer-name">{c.name}</p>
            <p className="customer-balance">
              Checking: ${c.checkingBalance.toFixed(2)} &nbsp;|&nbsp; Savings: ${c.savingsBalance.toFixed(2)}
            </p>
          </div>
          <div className="customer-actions">
            <button type="button" className="btn-login-as" onClick={() => handleLoginAsCustomer(c)}>
              Login as Customer
            </button>
            <button type="button" className="btn-delete" onClick={() => handleDelete(c)}>
              Delete
            </button>
          </div>
          <div className="customer-id">{c.id}</div>
        </div>
      ))}
    </div>
  )
}