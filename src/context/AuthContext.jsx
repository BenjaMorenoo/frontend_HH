import React, { createContext, useContext, useEffect, useState } from 'react'
import { authWithPassword, logout as pbLogout, registerUser as pbRegisterUser, updateRecordForm } from '../utils/pocketApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('pb_user')
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  })

  const isAuthenticated = !!user

  useEffect(() => {
    // sync localStorage user if changed externally
    function onStorage(e) {
      if (e.key === 'pb_user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null)
        } catch (err) {
          setUser(null)
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  async function login(identity, password) {
    const res = await authWithPassword(identity, password)
    // authWithPassword stores token and pb_user in localStorage
    if (res && res.record) {
      setUser(res.record)
    } else if (res && res.user) {
      setUser(res.user)
    } else if (res && res.id) {
      setUser(res)
    }
    return res
  }

  async function updateProfile(formData) {
    if (!user || !user.id) throw new Error('No authenticated user')
    const updated = await updateRecordForm('users', user.id, formData)
    // update local storage and state
    try {
      localStorage.setItem('pb_user', JSON.stringify(updated || {}))
    } catch (e) {
      // ignore
    }
    setUser(updated)
    return updated
  }

  function logout() {
    pbLogout()
    setUser(null)
  }

  async function register(payload) {
    // wrapper around pocketApi.registerUser
    const created = await pbRegisterUser(payload)
    return created
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
