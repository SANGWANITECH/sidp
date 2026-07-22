import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { getInstitutions } from '../../api/accounts'
import client from '../../api/client'

export default function RBMDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentTx, setRecentTx] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [institutionBalances, setInstitutionBalances] = useState([])
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
        client.get('/transactions/all?limit=10'),
        getInstitutions(),
        client.get('/accounts/all'),
      ])
      const txs = txRes.data.transactions || []
      const allAccounts = accRes.data || []
      const allInstitutions = instRes.data || []

      setRecentTx(txs)
      setInstitutions(allInstitutions)

      const totalSystemDeposits = allAccounts.reduce(
        (s, a) => s + parseFloat(a.balance), 0
      )

      // Calculate balance per institution
      const balanceMap = {}
      allAccounts.forEach(acc => {
        const instId = acc.institution_id
        if (!balanceMap[instId]) balanceMap[instId] = 0
        balanceMap[instId] += parseFloat(acc.balance)
      })

      const instBalances = allInstitutions.map(inst => ({
        ...inst,
        totalBalance: balanceMap[inst.institution_id] || 0,
      })).sort((a, b) => b.totalBalance - a.totalBalance)

      setInstitutionBalances(instBalances)
      setStats({
        total: txRes.data.total || 0,
        volume: totalSystemDeposits,
        flagged: txs.filter(t => t.is_flagged).length,
        institutions: allInstitutions.length,
      })
    } catch {
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
    { label: 'Overview', path: '/rbm' },
    { label: 'Transactions', path: '/rbm/transactions' },
    { label: 'Settlement', path: '/rbm/settlement' },
  ]

  const statCards = [
    { label: 'Total Transactions', value: stats?.total ?? '...', color: '#0D2137' },
    { label: 'Total System Deposits', value: stats ? formatCurrency(stats.volume) : '...', color: '#1A6FA8' },
    { label: 'Flagged Transactions', value: stats?.flagged ?? '...', color: '#B03030' },
    { label: 'Active Institutions', value: stats?.institutions ?? '...', color: '#1A7A4A' },
  ]

  const typeColor = (type) => {
    if (type === 'central_bank') return { bg: '#EBF4FB', text: '#1A6FA8' }
    if (type === 'bank') return { bg: '#EAF7EF', text: '#1A7A4A' }
    return { bg: '#FDF8EE', text: '#8A6000' }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Arial, sans-serif' }}>

      <div style={{ background: '#0D2137', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#1A6FA8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>S</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>SIDP Reserve Bank</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMobile && <span style={{ color: '#A8C8E8', fontSize: 13 }}>{user?.full_name}</span>}
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #3A6A9A', color: '#A8C8E8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #E8EDF2' }}>
        <div style={{ padding: '0 24px', display: 'flex', overflowX: 'auto' }}>
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
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#0D2137', margin: 0 }}>RBM System Overview</h2>
          <p style={{ color: '#5A6E82', fontSize: 13, margin: '4px 0 0' }}>National payment system monitoring</p>
        </div>

        {/* Stat cards */}
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

        {/* Institution balances */}
        <h3 style={{ fontSize: 15, fontWeight: 'bold', color: '#0D2137', marginBottom: 12 }}>
          Deposits by Institution
        </h3>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 24 }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#5A6E82' }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F4F6F9' }}>
                  {['Institution', 'Type', 'Total Deposits'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 'bold', color: '#5A6E82', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {institutionBalances.map((inst, i) => {
                  const c = typeColor(inst.type)
                  return (
                    <tr key={inst.institution_id} style={{ borderTop: '1px solid #F0F4F8', background: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 'bold', color: '#0D2137' }}>{inst.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#5A6E82' }}>{inst.code}</p>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: c.bg, color: c.text, fontSize: 10, fontWeight: 'bold', padding: '3px 8px', borderRadius: 20 }}>
                          {inst.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 'bold', color: inst.totalBalance > 0 ? '#1A7A4A' : '#5A6E82' }}>
                        {formatCurrency(inst.totalBalance)}
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ borderTop: '2px solid #0D2137', background: '#F4F6F9' }}>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 'bold', color: '#0D2137' }} colSpan={2}>Total System Deposits</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 'bold', color: '#1A6FA8' }}>
                    {stats ? formatCurrency(stats.volume) : '...'}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Recent transactions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 'bold', color: '#0D2137', margin: 0 }}>Recent Transactions</h3>
          <button onClick={() => navigate('/rbm/transactions')} style={{ background: 'transparent', border: 'none', color: '#1A6FA8', cursor: 'pointer', fontSize: 13 }}>
            View all
          </button>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 24 }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#5A6E82' }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentTx.slice(0, 5).map((tx, i) => (
                <div key={tx.transaction_id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px',
                  background: tx.is_flagged ? '#FFF8F8' : i % 2 === 0 ? '#fff' : '#FAFBFC',
                  borderTop: i > 0 ? '1px solid #F0F4F8' : 'none',
                  borderLeft: tx.is_flagged ? '3px solid #B03030' : '3px solid transparent',
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: '#1C2B3A', fontWeight: 'bold' }}>{tx.description || 'Payment'}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#5A6E82' }}>{formatDate(tx.created_at)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 'bold', color: '#0D2137' }}>{formatCurrency(tx.amount)}</p>
                    {tx.is_flagged && <span style={{ fontSize: 10, color: '#B03030', fontWeight: 'bold' }}>FLAGGED</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/rbm/transactions')} style={{
            background: '#0D2137', color: '#fff', border: 'none',
            padding: '12px 28px', borderRadius: 8, cursor: 'pointer',
            fontWeight: 'bold', fontSize: 14,
          }}>
            View All Transactions
          </button>
          <button onClick={() => navigate('/rbm/settlement')} style={{
            background: '#1A7A4A', color: '#fff', border: 'none',
            padding: '12px 28px', borderRadius: 8, cursor: 'pointer',
            fontWeight: 'bold', fontSize: 14,
          }}>
            Run Settlement
          </button>
        </div>
      </div>
    </div>
  )
}