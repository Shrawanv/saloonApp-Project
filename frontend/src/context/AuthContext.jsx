import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Ensure CSRF cookie is set for state-changing requests
    authService.getCsrf().catch(() => {})
    const storedUser = authService.getStoredUser()
    if (storedUser) {
      setUser(storedUser)
    }
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials)
      setUser(data.user)
      
      if (data.user.role === 'VENDOR') {
        navigate('/vendor')
      } else {
        navigate('/customer/select-salon')
      }
      
      return { success: true, data }
    } catch (error) {
      const message = error.response?.data?.detail || 
                      error.response?.data?.non_field_errors?.[0] ||
                      'Login failed. Please check your credentials.'
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      const data = await authService.register(userData)
      setUser(data.user)
      
      if (data.user.role === 'VENDOR') {
        navigate('/vendor')
      } else {
        navigate('/customer/select-salon')
      }
      
      return { success: true, data }
    } catch (error) {
      const message = error.response?.data?.detail || 
                      error.response?.data?.username?.[0] ||
                      error.response?.data?.email?.[0] ||
                      'Registration failed. Please try again.'
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    navigate('/login')
  }

  const updateProfile = async (data) => {
    try {
      const updatedUser = await authService.updateProfile(data)
      setUser(updatedUser)
      return { success: true, data: updatedUser }
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to update profile.'
      return { success: false, error: message }
    }
  }

  const isAuthenticated = () => {
    return !!user && authService.isAuthenticated()
  }

  const getUserRole = () => {
    return user?.role?.toLowerCase() || null
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated,
    getUserRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
