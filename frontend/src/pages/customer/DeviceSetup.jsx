import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { registerDevice, getMyDevices, revokeDevice } from '../../api/devices'
import { generateKeyPair, exportPublicKey, storePrivateKey, hasRegisteredKey } from '../../utils/crypto'
import { formatDate } from '../../utils/formatters'

export default function DeviceSetup() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [hasKey, setHasKey] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [revoking, setRevoking] = useState(null)
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('info')
  const [step, setStep] = useState(0)

  useEffect(() => {
    loadDevices()
    checkKey()
  }, [])

  const checkKey = async () => {
    const has = await hasRegisteredKey()
    setHasKey(has)
  }

  const loadDevices = async () => {
    try {
      const res = await getMyDevices()
      setDevices(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRegister = async () => {
    setRegistering(true)
    setStep(1)
    setStatus('Generating cryptographic key pair on your device...')
    setStatusType('info')

    try {
      await new Promise(r => setTimeout(r, 800))
      setStep(2)
      setStatus('Key pair generated. Storing private key securely on this device...')

      const keyPair = await generateKeyPair()
      await new Promise(r => setTimeout(r, 600))

      setStep(3)
      setStatus('Private key stored. Sending public key to server...')
      await storePrivateKey(keyPair.privateKey)

      const jwk = await exportPublicKey(keyPair.publicKey)
      await new Promise(r => setTimeout(r, 400))

      setStep(4)
      setStatus('Registering device with SIDP server...')
      const deviceLabel = `${user.full_name.split(' ')[0]}'s Browser — ${new Date().toLocaleDateString()}`
      await registerDevice(jwk, deviceLabel)

      await new Promise(r => setTimeout(r, 400))
      setStep(5)
      setStatus('Device registered successfully. This device can now sign transactions.')
      setStatusType('success')
      setHasKey(true)
      await loadDevices()
    } catch (err) {
      setStatus(err.response?.data?.detail || 'Registration failed. Please try again.')
      setStatusType('error')
      setStep(0)
    } finally {
      setRegistering(false)
    }
  }

  const handleRevoke = async (deviceId) => {
    if (!window.confirm('Revoke this device? It will no longer be able to sign transactions.')) return
    setRevoking(deviceId)
    try {
      await revokeDevice(deviceId)
      setStatus('Device revoked. Transactions from this device will be rejected.')
      setStatusType('info')
      await loadDevices()
    } catch (err) {
      setStatus('Failed to revoke device.')
      setStatusType('error')
    } finally {
      setRevoking(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const steps = [
    'Generate key pair',
    'Store private key',
    'Export public key',
    'Register with server',
    'Complete',
  ]

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

        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#0D2137', marginBottom: 4 }}>Device Security</h2>
        <p style={{ color: '#5A6E82', fontSize: 13, marginBottom: 24, marginTop: 0 }}>
          Register this device to enable cryptographic transaction signing. Your private key never leaves this device.
        </p>

        {/* Security model explanation */}
        {[
  'A cryptographic key pair is generated directly on your device',
  'Your private key is stored locally and never leaves this device',
  'Only the public key is sent to the SIDP server',
  'Every transaction is signed with your private key before submission',
  'Even if someone steals your password, they cannot transact without this device',
].map((text, i) => (
  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
    <div style={{
      width: 6, height: 6, borderRadius: '50%',
      background: '#1A6FA8', marginTop: 6, flexShrink: 0,
    }} />
    <span style={{ fontSize: 13, color: '#1C2B3A', lineHeight: 1.5 }}>{text}</span>
  </div>
))}

        {/* Registration status */}
        {!hasKey && !registering && (
          <div style={{ background: '#FDF8EE',  border: '1px solid #F0D98C', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#8A6000', fontSize: 14 }}>
              This device is not registered
            </p>
            <p style={{ margin: 0, color: '#8A6000', fontSize: 13 }}>
              You must register this device before you can send payments.
            </p>
          </div>
        )}

        {hasKey && !registering && (
          <div style={{ background: '#EAF7EF',marginTop: '5px', border: '1px solid #A8DDB8', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#1A6A40', fontSize: 14 }}>
              This device is registered and secured
            </p>
            <p style={{ margin: 0, color: '#1A6A40', fontSize: 13 }}>
              Your private key is stored locally. You can sign and send transactions from this device.
            </p>
          </div>
        )}

        {/* Registration steps */}
        {registering && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#0D2137', margin: '0 0 20px' }}>Registering device...</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: step > i + 1 ? '#1A7A4A' : step === i + 1 ? '#1A6FA8' : '#E8EDF2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {step > i + 1 ? (
                      <span style={{ color: '#fff', fontSize: 14 }}>✓</span>
                    ) : step === i + 1 ? (
                      <span style={{ color: '#fff', fontSize: 10 }}>...</span>
                    ) : (
                      <span style={{ color: '#5A6E82', fontSize: 11, fontWeight: 'bold' }}>{i + 1}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: step > i ? '#1C2B3A' : '#5A6E82', fontWeight: step === i + 1 ? 'bold' : 'normal' }}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
            {status && (
              <p style={{ fontSize: 12, color: '#1A6FA8', marginTop: 16, marginBottom: 0 }}>{status}</p>
            )}
          </div>
        )}

        {/* Status message */}
        {status && !registering && (
          <div style={{
            background: statusType === 'success' ? '#EAF7EF' : statusType === 'error' ? '#FDF0EE' : '#EBF4FB',
            border: `1px solid ${statusType === 'success' ? '#A8DDB8' : statusType === 'error' ? '#E8C4C0' : '#B8D8F0'}`,
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            color: statusType === 'success' ? '#1A6A40' : statusType === 'error' ? '#B03030' : '#1A6FA8',
            fontSize: 13,
          }}>
            {status}
          </div>
        )}

        {/* Register button */}
        {!registering && (
          <button
            onClick={handleRegister}
            disabled={registering}
            style={{
              background: '#0D2137', color: '#fff', border: 'none',
              padding: '12px 28px', borderRadius: 8,
              cursor: 'pointer', fontWeight: 'bold', fontSize: 14,
              marginBottom: 32,
            }}
          >
            {hasKey ? 'Register Another Device' : 'Register This Device'}
          </button>
        )}

        {/* Registered devices list */}
        {devices.length > 0 && (
          <>
            <h3 style={{ fontSize: 15, fontWeight: 'bold', color: '#0D2137', marginBottom: 12 }}>Registered Devices</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {devices.map((device) => (
                <div key={device.device_id} style={{
                  background: '#fff', borderRadius: 10, padding: '16px 20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: 13, color: '#0D2137' }}>{device.device_label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#5A6E82' }}>Registered: {formatDate(device.registered_at)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      background: device.is_active ? '#EAF7EF' : '#F4F6F9',
                      color: device.is_active ? '#1A6A40' : '#5A6E82',
                      fontSize: 11, fontWeight: 'bold',
                      padding: '3px 8px', borderRadius: 20,
                    }}>
                      {device.is_active ? 'ACTIVE' : 'REVOKED'}
                    </span>
                    {device.is_active && (
                      <button
                        onClick={() => handleRevoke(device.device_id)}
                        disabled={revoking === device.device_id}
                        style={{
                          background: '#FDF0EE', color: '#B03030',
                          border: '1px solid #E8C4C0',
                          padding: '5px 12px', borderRadius: 6,
                          cursor: 'pointer', fontSize: 12,
                        }}
                      >
                        {revoking === device.device_id ? 'Revoking...' : 'Revoke'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}