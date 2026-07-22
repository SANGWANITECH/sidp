import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyAccounts } from '../../api/accounts'
import { getAccountTransactions } from '../../api/transactions'
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters'

export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const accRes = await getMyAccounts()
      setAccounts(accRes.data)

      if (accRes.data.length > 0) {
        const txRes = await getAccountTransactions(accRes.data[0].account_number, 5)
        setTransactions(txRes.data.transactions)
      }
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

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <p style={{ color: '#5A6E82' }}>Loading...</p>
    </div>
  )

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
  <div style={{ padding: '0 16px', display: 'inline-flex', gap: 0, minWidth: '100%' }}>
    {[
      { label: 'Dashboard', path: '/customer' },
      { label: 'Send Payment', path: '/customer/send' },
      { label: 'Transactions', path: '/customer/history' },
      { label: 'My Device', path: '/customer/device' },
      { label: 'Attack Simulator', path: '/customer/attack' },
    ].map((tab) => (
      <button
        key={tab.path}
        onClick={() => navigate(tab.path)}
        style={{
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          borderBottom: window.location.pathname === tab.path ? '2px solid #1A6FA8' : '2px solid transparent',
          color: window.location.pathname === tab.path ? '#1A6FA8' : '#5A6E82',
          fontWeight: window.location.pathname === tab.path ? 'bold' : 'normal',
          cursor: 'pointer',
          fontSize: 13,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
</div>

<div style={{ padding: '16px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Total balance hero */}
        <div style={{
          background: 'linear-gradient(135deg, #0D2137 0%, #1B3A6B 100%)',
          borderRadius: 16, padding: '32px', marginBottom: 24, color: '#fff',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#A8C8E8' }}>Total Balance</p>
          <h1 style={{ margin: '0 0 4px', fontSize: 36, fontWeight: 'bold' }}>
            {formatCurrency(totalBalance)}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#A8C8E8' }}>
            Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              onClick={() => navigate('/customer/send')}
              style={{ background: '#1A6FA8', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
            >
              Send Payment
            </button>
            <button
              onClick={() => navigate('/customer/history')}
              style={{ background: 'transparent', color: '#A8C8E8', border: '1px solid #3A6A9A', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
            >
              View History
            </button>
          </div>
        </div>

        {/* Accounts */}
        <h2 style={{ fontSize: 15, fontWeight: 'bold', color: '#0D2137', marginBottom: 16 }}>My Accounts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
          {accounts.map((acc) => (
            <div key={acc.account_id} style={{
              background: '#fff', borderRadius: 12, padding: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              borderLeft: '4px solid #1A6FA8',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#5A6E82', textTransform: 'uppercase', letterSpacing: 1 }}>Account</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 'bold', color: '#0D2137' }}>{acc.account_number}</p>
                </div>
                <span style={{
                  background: '#EBF4FB', color: '#1A6FA8',
                  fontSize: 11, fontWeight: 'bold',
                  padding: '3px 8px', borderRadius: 20,
                }}>
                  {acc.status.toUpperCase()}
                </span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 'bold', color: '#0D2137' }}>
                {formatCurrency(acc.balance)}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#5A6E82' }}>{acc.currency}</p>
            </div>
          ))}
        </div>

        {/* Recent transactions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 'bold', color: '#0D2137', margin: 0 }}>Recent Transactions</h2>
          <button
            onClick={() => navigate('/customer/history')}
            style={{ background: 'transparent', border: 'none', color: '#1A6FA8', cursor: 'pointer', fontSize: 13 }}
          >
            View all
          </button>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {transactions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5A6E82' }}>
              <p>No transactions yet</p>
              <button
                onClick={() => navigate('/customer/send')}
                style={{ background: '#0D2137', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginTop: 8 }}
              >
                Make your first payment
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F4F6F9' }}>
                  {['Description', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 'bold', color: '#5A6E82', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.transaction_id} style={{ borderTop: '1px solid #F0F4F8', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#1C2B3A' }}>{tx.description || 'Payment'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 'bold', color: '#0D2137' }}>{formatCurrency(tx.amount)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: getStatusColor(tx.status) + '20',
                        color: getStatusColor(tx.status),
                        fontSize: 11, fontWeight: 'bold',
                        padding: '3px 8px', borderRadius: 20,
                      }}>
                        {tx.status.toUpperCase()}
                      </span>
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