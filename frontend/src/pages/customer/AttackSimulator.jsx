import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AttackSimulator() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState('idle')
  const [attackLog, setAttackLog] = useState([])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const addLog = (message, type = 'info') => {
    setAttackLog(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }])
  }

  const runSimulation = async () => {
    setStage('running')
    setAttackLog([])

    await delay(500)
    addLog('Attacker identifies target: John Banda, NBM account holder', 'warning')

    await delay(1000)
    addLog('Attacker obtains email and password from data breach: john@sidp.demo / demo1234', 'warning')

    await delay(1200)
    addLog('Attacker contacts TNM operator, requests SIM swap for +265 991 000 001', 'warning')

    await delay(1200)
    addLog('SIM swap approved. Attacker now receives all SMS sent to John\'s number', 'danger')

    await delay(1000)
    addLog('Attacker logs into SIDP using stolen credentials...', 'warning')

    await delay(1000)
    addLog('Login successful. Session token obtained.', 'warning')

    await delay(1000)
    addLog('Attacker attempts to initiate transaction: MWK 30,000 to attacker account', 'warning')

    await delay(1000)
    addLog('System requests transaction signature from registered device...', 'info')

    await delay(1200)
    addLog('Attacker does not have John\'s registered device. Cannot produce valid signature.', 'danger')

    await delay(1000)
    addLog('Attacker attempts to submit transaction without valid signature...', 'warning')

    await delay(1200)
    addLog('BACKEND: Signature verification failed — transaction rejected', 'success')

    await delay(800)
    addLog('BACKEND: Nonce consumed. Replay attempt will also fail.', 'success')

    await delay(800)
    addLog('John\'s account balance unchanged. Attack unsuccessful.', 'success')

    await delay(500)
    setStage('done')
  }

  const reset = () => {
    setStage('idle')
    setAttackLog([])
  }

  const delay = (ms) => new Promise(r => setTimeout(r, ms))

  const logColors = {
    info: { bg: '#EBF4FB', color: '#1A6FA8', dot: '#1A6FA8' },
    warning: { bg: '#FDF8EE', color: '#8A6000', dot: '#F0A500' },
    danger: { bg: '#FDF0EE', color: '#B03030', dot: '#B03030' },
    success: { bg: '#EAF7EF', color: '#1A6A40', dot: '#1A6A40' },
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

      <div style={{ padding: '24px 16px', maxWidth: 700, margin: '0 auto' }}>

        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#0D2137', marginBottom: 4 }}>SIM Swap Attack Simulator</h2>
        <p style={{ color: '#5A6E82', fontSize: 13, marginBottom: 24, marginTop: 0 }}>
          This simulation demonstrates how SIDP defeats a SIM swap attack step by step.
        </p>

        {/* Scenario card */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#0D2137', margin: '0 0 12px' }}>Attack Scenario</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Target', value: 'John Banda' },
              { label: 'Account', value: 'NBM — MWK 30,000+' },
              { label: 'Attack Type', value: 'SIM Swap + Credential Theft' },
              { label: 'Expected Outcome', value: 'Attack Blocked' },
            ].map((item) => (
              <div key={item.label} style={{ background: '#F4F6F9', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: '#5A6E82', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 'bold', color: '#0D2137' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {stage === 'idle' && (
            <button
              onClick={runSimulation}
              style={{ background: '#B03030', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}
            >
              Run Attack Simulation
            </button>
          )}
          {stage === 'running' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0' }}>
              <div style={{ width: 16, height: 16, border: '2px solid #B03030', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#B03030', fontWeight: 'bold' }}>Simulation running...</span>
            </div>
          )}
          {stage === 'done' && (
            <>
              <div style={{ background: '#EAF7EF', border: '1px solid #A8DDB8', borderRadius: 8, padding: '11px 20px', fontSize: 13, fontWeight: 'bold', color: '#1A6A40' }}>
                Attack defeated. Account protected.
              </div>
              <button
                onClick={reset}
                style={{ background: '#F4F6F9', color: '#5A6E82', border: '1px solid #C8D8E8', padding: '11px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
              >
                Reset
              </button>
            </>
          )}
        </div>

        {/* Attack log */}
        {attackLog.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ background: '#0D2137', padding: '12px 20px' }}>
              <span style={{ color: '#A8C8E8', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                Attack Log
              </span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attackLog.map((log, i) => {
                const c = logColors[log.type]
                return (
                  <div key={i} style={{ background: c.bg, borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, marginTop: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: c.color }}>{log.message}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#5A6E82', flexShrink: 0 }}>{log.time}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}