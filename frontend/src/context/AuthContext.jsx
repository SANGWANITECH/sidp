import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logoutUser as apiLogout } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await apiLogin(email, password)
    const { access_token, refresh_token, user } = res.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const logout = async () => {
    const refresh_token = localStorage.getItem('refresh_token')
    if (refresh_token) {
      try { await apiLogout(refresh_token) } catch {}
    }
    localStorage.clear()
    setUser(null)
  }

  const getRole = () => {
    if (!user) return null
    if (user.is_admin) return 'rbm'
    // Bank operators identified by email convention for demo
    if (user.email.includes('nbm@') || user.email.includes('airtel@')) return 'bank'
    return 'customer'
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)