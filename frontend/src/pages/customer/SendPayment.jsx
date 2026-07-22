import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyAccounts } from '../../api/accounts'
import { sendPayment } from '../../api/transactions'
import { getNonce } from '../../api/auth'
import { signPayload, hasRegisteredKey } from '../../utils/crypto'
import { formatCurrency } from '../../utils/formatters'

export default function SendPayment() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [senderAccount, setSenderAccount] = useState('')
  const [receiverAccount, setReceiverAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [hasDevice, setHasDevice] = useState(false)

  useEffect(() => {
    loadAccounts()
    checkDevice()
  }, [])

  const loadAccounts = async () => {
    try {
      const res = await getMyAccounts()
      setAccounts(res.data)
      if (res.data.length > 0) setSenderAccount(res.data[0].account_number)
    } catch (err) {
      console.error(err)
    }
  }

  const checkDevice = async () => {
    const has = await hasRegisteredKey()
    setHasDevice(has)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    try {
      setStep('Requesting one-time nonce from server...')
      const nonceRes = await getNonce()
      const nonce = nonceRes.data.nonce

      setStep('Signing transaction with your device key...')
      const payload = {
        amount: parseFloat(amount).toFixed(2),
        nonce,
        receiver_account: receiverAccount,
        sender_account: senderAccount,
      }
      const signature = await signPayload(payload)

      setStep('Submitting signed transaction...')
      const res = await sendPayment({
        sender_account_number: senderAccount,
        receiver_account_number: receiverAccount,
        amount: parseFloat(amount),
        nonce,
        signature,
        description,
      })

      setResult(res.data)
      setStep('')
      setAmount('')
      setReceiverAccount('')
      setDescription('')
      await loadAccounts()
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment failed. Please try again.')
      setStep('')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const selectedAccount = accounts.find(a => a.account_number === senderAccount)

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #C8D8E8',
    borderRadius: 8,
    fontSize: 13,
    color: '#1C2B3A',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Arial, sans-serif' }}>

      {/* Navbar */}
      <div style={{ background: '#0D2137', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#1A6FA8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>S</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>SIDP Banking</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#A8C8E8', fontSize: 13 }}>Welcome, {user?.full_name}</span>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #3A6A9A', color: '#A8C8E8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8EDF2', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <div style={{ padding: '0 16px', display: 'inline-flex', minWidth: '100%' }}>
          {[
            { label: 'Dashboard', path: '/customer' },
            { label: 'Send Payment', path: '/customer/send' },
            { label: 'Transactions', path: '/customer/history' },
            { label: 'My Device', path: '/customer/device' },
            { label: 'Attack Simulator', path: '/customer/attack' },
          ].map((tab) => (
            <button key={tab.path} onClick={() => navigate(tab.path)} style={{
              padding: '14px 16px', background: 'transparent', border: 'none',
              borderBottom: window.location.pathname === tab.path ? '2px solid #1A6FA8' : '2px solid transparent',
              color: window.location.pathname === tab.path ? '#1A6FA8' : '#5A6E82',
              fontWeight: window.location.pathname === tab.path ? 'bold' : 'normal',
              cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 16px', maxWidth: 560, margin: '0 auto' }}>

        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#0D2137', marginBottom: 4 }}>Send Payment</h2>
        <p style={{ color: '#5A6E82', fontSize: 13, marginBottom: 24, marginTop: 0 }}>
          All payments are cryptographically signed by your registered device.
        </p>

        {/* No device warning */}
        {!hasDevice && (
          <div style={{ background: '#FDF8EE', border: '1px solid #F0D98C', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#8A6000', fontSize: 13 }}>
              Device not registered
            </p>
            <p style={{ margin: '0 0 10px', color: '#8A6000', fontSize: 12 }}>
              You must register this device before sending payments.
            </p>
            <button
              onClick={() => navigate('/customer/device')}
              style={{ background: '#8A6000', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
            >
              Register Device
            </button>
          </div>
        )}

        {/* Success result */}
        {result && (
          <div style={{ background: '#EAF7EF', border: '1px solid #A8DDB8', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#1A6A40', fontSize: 14 }}>
              Payment sent successfully
            </p>
            <p style={{ margin: '0 0 12px', color: '#1A6A40', fontSize: 13 }}>
              Transaction signed and verified by your device.
            </p>
            <div style={{ background: '#fff', borderRadius: 8, padding: 14, fontSize: 12, color: '#1C2B3A' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#5A6E82' }}>Amount</span>
                <span style={{ fontWeight: 'bold' }}>{formatCurrency(result.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#5A6E82' }}>Status</span>
                <span style={{ fontWeight: 'bold', color: '#1A6A40' }}>COMPLETED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#5A6E82' }}>Transaction ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {result.transaction_id?.substring(0, 16)}...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#FDF0EE', border: '1px solid #E8C4C0', borderRadius: 10, padding: 14, marginBottom: 20, color: '#B03030', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Processing steps */}
        {loading && step && (
          <div style={{ background: '#EBF4FB', border: '1px solid #B8D8F0', borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 16, height: 16, border: '2px solid #1A6FA8',
                borderTop: '2px solid transparent', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 13, color: '#1A6FA8' }}>{step}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: '600', color: '#1C2B3A', marginBottom: 6 }}>
              From Account
            </label>
            <select
              value={senderAccount}
              onChange={(e) => setSenderAccount(e.target.value)}
              style={{ ...inputStyle }}
            >
              {accounts.map((acc) => (
                <option key={acc.account_id} value={acc.account_number}>
                  {acc.account_number} — {formatCurrency(acc.balance)}
                </option>
              ))}
            </select>
            {selectedAccount && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#5A6E82' }}>
                Available balance: {formatCurrency(selectedAccount.balance)}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: '600', color: '#1C2B3A', marginBottom: 6 }}>
              To Account Number
            </label>
            <input
              type="text"
              value={receiverAccount}
              onChange={(e) => setReceiverAccount(e.target.value.toUpperCase())}
              placeholder="e.g. SIDP0975202453"
              required
              style={{ ...inputStyle }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: '600', color: '#1C2B3A', marginBottom: 6 }}>
              Amount (MWK)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              required
              style={{ ...inputStyle }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: '600', color: '#1C2B3A', marginBottom: 6 }}>
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. School fees payment"
              style={{ ...inputStyle }}
            />
          </div>

          {/* Security note */}
          <div style={{ background: '#F4F6F9', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#5A6E82' }}>
            This payment will be signed by your registered device before submission. No OTP required.
          </div>

          <button
            onClick={handleSend}
            disabled={loading || !hasDevice || !senderAccount || !receiverAccount || !amount}
            style={{
              width: '100%', padding: '13px',
              background: loading || !hasDevice ? '#5A6E82' : '#0D2137',
              color: '#fff', border: 'none', borderRadius: 8,
              cursor: loading || !hasDevice ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', fontSize: 14,
            }}
          >
            {loading ? 'Processing...' : 'Sign and Send Payment'}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}