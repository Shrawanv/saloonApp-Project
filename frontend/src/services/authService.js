import api from './api'

const authService = {
  async register(userData) {
    const response = await api.post('/auth/register/', userData)
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  async login(credentials) {
    const response = await api.post('/auth/login/', credentials)
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  async logout() {
    try {
      await api.post('/auth/logout/', {})
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('user')
    }
  },

  async getProfile() {
    const response = await api.get('/auth/profile/')
    return response.data
  },

  async updateProfile(data) {
    const response = await api.put('/auth/profile/', data)
    localStorage.setItem('user', JSON.stringify(response.data))
    return response.data
  },

  async changePassword(data) {
    const response = await api.post('/auth/change-password/', data)
    return response.data
  },

  async getCsrf() {
    const response = await api.get('/auth/csrf/')
    return response.data
  },

  getStoredUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated() {
    return !!localStorage.getItem('user')
  },

  getUserRole() {
    const user = this.getStoredUser()
    return user?.role?.toLowerCase() || null
  },
}

export default authService
