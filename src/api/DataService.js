let BASE_URL = "";
let isBackendLocal = false;
let isBackendRemote = true;

if (isBackendLocal) {
    BASE_URL = 'http://localhost:5000';
}
if (isBackendRemote) {
    BASE_URL = 'https://bankapp-backend-production.up.railway.app';
}
// Inside DataService.js[cite: 2]
async function request(path, opts = {}) {
  const url = `${BASE_URL}${path}` //[cite: 2]
  
  // 1. Grab the token from localStorage
  const token = localStorage.getItem('token')

  // 2. Ensure headers object exists in options
  if (!opts.headers) {
    opts.headers = {}
  }

  // 3. Inject the Authorization Header automatically if a token exists!
  if (token) {
    opts.headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, opts) //[cite: 2]
  if (!res.ok) { //[cite: 2]
    const body = await res.text().catch(() => '') //[cite: 2]
    const err = new Error(`HTTP ${res.status} ${res.statusText}: ${body}`) //[cite: 2]
    err.status = res.status //[cite: 2]
    throw err //[cite: 2]
  } //[cite: 2]
  
  const ct = res.headers.get('content-type') || '' //[cite: 2]
  if (ct.includes('application/json')) return res.json() //[cite: 2]
  return res.text() //[cite: 2]
}
const DataService = {
  // GET /accounts
  getCustomers() {
    return request('/accounts')
  },

  // POST /accounts  body: { "userName": userName }
  createCustomer(userName, password) {
    return request('/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, password }),
    })
  },

  // DELETE /accounts/<account_id>
  deleteCustomer(accountId) {
    return request(`/accounts/${accountId}`, {
      method: 'DELETE',
    })
  },

  // POST /accounts/<account_id>/deposit
  deposit(accountId, amount, accountType) {
    return request(`/accounts/${accountId}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, account_type: accountType }),
    })
  },

  // POST /accounts/<account_id>/withdraw
  withdraw(accountId, amount, accountType) {
    return request(`/accounts/${accountId}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, account_type: accountType }),
    })
  },
}

export default DataService