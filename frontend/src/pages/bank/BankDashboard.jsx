import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getInstitutions } from '../../api/accounts'
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters'
import client from '../../api/client'

export default function BankDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentTx, setRecentTx] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    loadData()
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadData = async () => {
    try {
      const [txRes, instRes, accRes] = await Promise.all([
        client.get('/transactions/institution/NBM?limit=50'),
        getInstitutions(),
        client.get('/accounts/institution/NBM'),
      ])
      setRecentTx(txRes.data.transactions || [])
      const total = txRes.data.total || 0
      const flagged = (txRes.data.transactions || []).filter(t => t.is_flagged).length
      const totalDeposits = (accRes.data || []).reduce((s, a) => s + parseFloat(a.balance), 0)
      setStats({ total, volume: totalDeposits, flagged, institutions: instRes.data.length })
    } catch {
      setRecentTx([])
      setStats({ total: 0, volume: 0, flagged: 0, institutions: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navTabs = [
    { label: 'Overview', path: '/bank' },
    { label: 'Transactions', path: '/bank/transactions' },
  ]

  const statCards = [
    { label: 'Total Transactions', value: stats?.total ?? '...', color: '#0D2137' },
    { label: 'Total Deposits', value: stats ? formatCurrency(stats.volume) : '...', color: '#1A6FA8' },
    { label: 'Flagged Transactions', value: stats?.flagged ?? '...', color: '#B03030' },
    { label: 'Active Institutions', value: stats?.institutions ?? '...', color: '#1A7A4A' },
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

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#0D2137', margin: 0 }}>
            National Bank of Malawi
          </h2>
          <p style={{ color: '#5A6E82', fontSize: 13, margin: '4px 0 0' }}>
            Institution transaction overview
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 12, marginBottom: 28,
        }}>
          {statCards.map((s) => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 12, padding: '18px 16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              borderTop: `3px solid ${s.color}`, textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: '#5A6E82', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 'bold', color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 'bold', color: '#0D2137', marginBottom: 12 }}>Recent Transactions</h3>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5A6E82' }}>Loading...</div>
          ) : recentTx.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5A6E82' }}>No transactions found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ background: '#F4F6F9' }}>
                    {['Description', 'Amount', 'Status', 'Flagged', 'Date'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 'bold', color: '#5A6E82', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx, i) => (
                    <tr key={tx.transaction_id} style={{ borderTop: '1px solid #F0F4F8', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#1C2B3A' }}>{tx.description || 'Payment'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 'bold', color: '#0D2137', whiteSpace: 'nowrap' }}>{formatCurrency(tx.amount)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: getStatusColor(tx.status) + '20', color: getStatusColor(tx.status), fontSize: 11, fontWeight: 'bold', padding: '3px 8px', borderRadius: 20 }}>
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {tx.is_flagged
                          ? <span style={{ background: '#FDF0EE', color: '#B03030', fontSize: 11, fontWeight: 'bold', padding: '3px 8px', borderRadius: 20 }}>YES</span>
                          : <span style={{ color: '#5A6E82', fontSize: 12 }}>No</span>
                        }
                      </td>
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