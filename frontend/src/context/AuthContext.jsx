import React, { createContext, useContext, useState, useEffect } from 'react'
import authApi from '../api/authApi'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('user')

      if (token) {
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (e) {
            console.error('Lỗi phân tích thông tin người dùng từ localStorage:', e)
          }
        }

        try {
          const res = await authApi.getMe()
          setUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        } catch (error) {
          console.error('Không thể lấy thông tin người dùng hiện tại:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    const { access_token } = res.data
    localStorage.setItem('access_token', access_token)

    const meRes = await authApi.getMe()
    const userData = meRes.data
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const isAdmin = () => {
    return user?.role?.toUpperCase() === 'ADMIN'
  }

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    isAdmin,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
