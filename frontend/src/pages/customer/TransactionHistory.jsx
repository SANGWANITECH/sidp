import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyAccounts } from '../../api/accounts'
import { getAccountTransactions } from '../../api/transactions'
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters'

export default function TransactionHistory() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount) loadTransactions(selectedAccount)
  }, [selectedAccount])

  const loadAccounts = async () => {
    try {
      const res = await getMyAccounts()
      setAccounts(res.data)
      if (res.data.length > 0) setSelectedAccount(res.data[0].account_number)
    } catch (err) {
      console.error(err)
    }
  }

  const loadTransactions = async (accountNumber) => {
    setLoading(true)
    try {
      const res = await getAccountTransactions(accountNumber, 50)
      setTransactions(res.data.transactions)
      setTotal(res.data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
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

      <div style={{ padding: '24px 16px', maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#0D2137', margin: 0 }}>Transaction History</h2>
            <p style={{ color: '#5A6E82', fontSize: 13, margin: '4px 0 0' }}>{total} transactions found</p>
          </div>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #C8D8E8', borderRadius: 8, fontSize: 13, color: '#1C2B3A', background: '#fff' }}
          >
            {accounts.map((acc) => (
              <option key={acc.account_id} value={acc.account_number}>
                {acc.account_number}
              </option>
            ))}
          </select>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5A6E82' }}>Loading...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5A6E82' }}>No transactions for this account</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F4F6F9' }}>
                  {['Description', 'From', 'To', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 'bold', color: '#5A6E82', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.transaction_id} style={{ borderTop: '1px solid #F0F4F8', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#1C2B3A' }}>{tx.description || 'Payment'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 11, color: '#5A6E82', fontFamily: 'monospace' }}>
                      {String(tx.sender_account_id).substring(0, 8)}...
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 11, color: '#5A6E82', fontFamily: 'monospace' }}>
                      {String(tx.receiver_account_id).substring(0, 8)}...
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 'bold', color: '#0D2137' }}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: getStatusColor(tx.status) + '20',
                        color: getStatusColor(tx.status),
                        fontSize: 11, fontWeight: 'bold',
                        padding: '3px 8px', borderRadius: 20,
                      }}>
                        {tx.status.toUpperCase()}
                      </span>
                      {tx.is_flagged && (
                        <span style={{ marginLeft: 6, background: '#FDF0EE', color: '#B03030', fontSize: 10, fontWeight: 'bold', padding: '2px 6px', borderRadius: 10 }}>
                          FLAGGED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#5A6E82' }}>{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}