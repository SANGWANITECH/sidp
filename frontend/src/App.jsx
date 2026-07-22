import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import SendPayment from './pages/customer/SendPayment'
import TransactionHistory from './pages/customer/TransactionHistory'
import DeviceSetup from './pages/customer/DeviceSetup'
import AttackSimulator from './pages/customer/AttackSimulator'
import BankDashboard from './pages/bank/BankDashboard'
import BankTransactions from './pages/bank/BankTransactions'
import RBMDashboard from './pages/rbm/RBMDashboard'
import RBMTransactions from './pages/rbm/RBMTransactions'
import RBMSettlement from './pages/rbm/RBMSettlement'

function ProtectedRoute({ children, roles }) {
  const { user, loading, getRole } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(getRole())) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Customer routes */}
      <Route path="/customer" element={
        <ProtectedRoute roles={['customer']}>
          <CustomerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/customer/send" element={
        <ProtectedRoute roles={['customer']}>
          <SendPayment />
        </ProtectedRoute>
      } />
      <Route path="/customer/history" element={
        <ProtectedRoute roles={['customer']}>
          <TransactionHistory />
        </ProtectedRoute>
      } />
      <Route path="/customer/device" element={
        <ProtectedRoute roles={['customer']}>
          <DeviceSetup />
        </ProtectedRoute>
      } />
      <Route path="/customer/attack" element={
        <ProtectedRoute roles={['customer']}>
          <AttackSimulator />
        </ProtectedRoute>
      } />

      {/* Bank routes */}
      <Route path="/bank" element={
        <ProtectedRoute roles={['bank']}>
          <BankDashboard />
        </ProtectedRoute>
      } />
      <Route path="/bank/transactions" element={
        <ProtectedRoute roles={['bank']}>
          <BankTransactions />
        </ProtectedRoute>
      } />

      {/* RBM routes */}
      <Route path="/rbm" element={
        <ProtectedRoute roles={['rbm']}>
          <RBMDashboard />
        </ProtectedRoute>
      } />
      <Route path="/rbm/transactions" element={
        <ProtectedRoute roles={['rbm']}>
          <RBMTransactions />
        </ProtectedRoute>
      } />
      <Route path="/rbm/settlement" element={
        <ProtectedRoute roles={['rbm']}>
          <RBMSettlement />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}