import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters'
import client from '../../api/client'

export default function BankTransactions() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    loadTransactions()
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadTransactions = async () => {
    try {
      const res = await client.get('/transactions/institution/NBM?limit=100')
      setTransactions(res.data.transactions || [])
      setTotal(res.data.total || 0)
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const filtered = filter === 'flagged'
    ? transactions.filter(t => t.is_flagged)
    : transactions

  const navTabs = [
    { label: 'Overview', path: '/bank' },
    { label: 'Transactions', path: '/bank/transactions' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Arial, sans-serif' }}>

      <div style={{ background: '#0D2137', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#1A6FA8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>S</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>SIDP Bank Operator</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMobile && <span style={{ color: '#A8C8E8', fontSize: 13 }}>{user?.full_name}</span>}
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #3A6A9A', color: '#A8C8E8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #E8EDF2' }}>
        <div style={{ padding: '0 24px', display: 'flex' }}>
          {navTabs.map((tab) => (
            <button key={tab.path} onClick={() => navigate(tab.path)} style={{
              padding: '14px 20px', background: 'transparent', border: 'none',
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

      <div style={{ padding: isMobile ? '20px 16px' : '28px 24px', maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#0D2137', margin: 0 }}>NBM Transactions</h2>
            <p style={{ color: '#5A6E82', fontSize: 13, margin: '4px 0 0' }}>{total} transactions involving National Bank of Malawi</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'flagged'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 16px', borderRadius: 8, border: '1px solid #C8D8E8',
                background: filter === f ? '#0D2137' : '#fff',
                color: filter === f ? '#fff' : '#5A6E82',
                cursor: 'pointer', fontSize: 13,
                fontWeight: filter === f ? 'bold' : 'normal',
              }}>
                {f === 'all' ? 'All' : 'Flagged Only'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5A6E82' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5A6E82' }}>No transactions found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: '#F4F6F9' }}>
                    {['Description', 'Amount', 'Status', 'Flagged', 'Flag Reason', 'Date'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 'bold', color: '#5A6E82', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx, i) => (
                    <tr key={tx.transaction_id} style={{
                      borderTop: '1px solid #F0F4F8',
                      background: tx.is_flagged ? '#FFF8F8' : i % 2 === 0 ? '#fff' : '#FAFBFC',
                    }}>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#1C2B3A' }}>{tx.description || 'Payment'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 'bold', color: '#0D2137', whiteSpace: 'nowrap' }}>{formatCurrency(tx.amount)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: getStatusColor(tx.status) + '20', color: getStatusColor(tx.status), fontSize: 11, fontWeight: 'bold', padding: '3px 8px', borderRadius: 20 }}>
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {tx.is_flagged
                          ? <span style={{ background: '#FDF0EE', color: '#B03030', fontSize: 11, fontWeight: 'bold', padding: '3px 8px', borderRadius: 20 }}>FLAGGED</span>
                          : <span style={{ color: '#5A6E82', fontSize: 12 }}>No</span>
                        }
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#B03030' }}>{tx.flag_reason || ''}</td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#5A6E82', whiteSpace: 'nowrap' }}>{formatDate(tx.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}