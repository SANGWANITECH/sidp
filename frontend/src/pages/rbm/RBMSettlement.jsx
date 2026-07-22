import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatDateShort } from '../../utils/formatters'
import { runSettlement, getSettlementHistory, getSettlementReport } from '../../api/settlements'

export default function RBMSettlement() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [report, setReport] = useState(null)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    loadHistory()
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadHistory = async () => {
    try {
      const res = await getSettlementHistory()
      setHistory(res.data)
      if (res.data.length > 0) {
        const latest = res.data[0]
        const reportRes = await getSettlementReport(latest.settlement_date)
        setReport(reportRes.data)
      }
    } catch {
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleRunSettlement = async () => {
    if (!window.confirm('Run settlement for today? This will calculate net obligations between all institutions.')) return
    setRunning(true)
    setMessage(null)
    try {
      await runSettlement()
      setMessage({ text: 'Settlement completed successfully.', type: 'success' })
      await loadHistory()
    } catch (err) {
      setMessage({ text: err.response?.data?.detail || 'Settlement failed.', type: 'error' })
    } finally {
      setRunning(false)
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#0D2137', margin: 0 }}>Settlement Engine</h2>
            <p style={{ color: '#5A6E82', fontSize: 13, margin: '4px 0 0' }}>Automated net clearing between institutions</p>
          </div>
          <button
            onClick={handleRunSettlement}
            disabled={running}
            style={{
              background: running ? '#5A6E82' : '#1A7A4A',
              color: '#fff', border: 'none',
              padding: '12px 28px', borderRadius: 8,
              cursor: running ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', fontSize: 14,
            }}
          >
            {running ? 'Running...' : 'Run Settlement'}
          </button>
        </div>

        {message && (
          <div style={{
            background: message.type === 'success' ? '#EAF7EF' : '#FDF0EE',
            border: `1px solid ${message.type === 'success' ? '#A8DDB8' : '#E8C4C0'}`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            color: message.type === 'success' ? '#1A6A40' : '#B03030',
            fontSize: 13,
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>

          {/* Latest report */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#0D2137', margin: '0 0 16px' }}>
              Latest Settlement Report
            </h3>
            {loading ? (
              <p style={{ color: '#5A6E82', fontSize: 13 }}>Loading...</p>
            ) : !report ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: '#5A6E82', fontSize: 13, margin: '0 0 12px' }}>No settlement has been run yet.</p>
                <button onClick={handleRunSettlement} style={{ background: '#1A7A4A', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                  Run First Settlement
                </button>
              </div>
            ) : (
              <>
                <div style={{ background: '#F4F6F9', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#5A6E82' }}>Settlement Date</p>
                  <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 'bold', color: '#0D2137' }}>{report.settlement_date}</p>
                </div>
                <div style={{ background: '#EAF7EF', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#1A6A40' }}>Total Net Amount</p>
                  <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 'bold', color: '#1A6A40' }}>{formatCurrency(report.total_net_amount)}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {report.settlements.map((s, i) => (
                    <div key={i} style={{ background: '#F4F6F9', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, color: '#5A6E82' }}>From</p>
                          <p style={{ margin: '2px 0 6px', fontSize: 13, fontWeight: 'bold', color: '#B03030' }}>{s.from_institution}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#5A6E82' }}>To</p>
                          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 'bold', color: '#1A7A4A' }}>{s.to_institution}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 'bold', color: '#0D2137' }}>{formatCurrency(s.net_amount)}</p>
                          <span style={{ background: '#EAF7EF', color: '#1A7A4A', fontSize: 10, fontWeight: 'bold', padding: '2px 8px', borderRadius: 20 }}>
                            {s.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Settlement history */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#0D2137', margin: '0 0 16px' }}>Settlement History</h3>
            {loading ? (
              <p style={{ color: '#5A6E82', fontSize: 13 }}>Loading...</p>
            ) : history.length === 0 ? (
              <p style={{ color: '#5A6E82', fontSize: 13 }}>No settlements yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((s) => (
                  <div key={s.settlement_id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', background: '#F4F6F9', borderRadius: 8,
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 'bold', color: '#0D2137' }}>{s.settlement_date}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#5A6E82' }}>Net: {formatCurrency(s.net_amount)}</p>
                    </div>
                    <span style={{
                      background: '#EAF7EF', color: '#1A7A4A',
                      fontSize: 10, fontWeight: 'bold',
                      padding: '3px 8px', borderRadius: 20,
                    }}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}