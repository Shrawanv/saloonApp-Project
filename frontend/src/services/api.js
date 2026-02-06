import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[2]) : null
}

api.interceptors.request.use(
  async (config) => {
    if (/^(POST|PATCH|PUT|DELETE)$/i.test(config.method)) {
      let csrf = getCookie('csrftoken')
      if (!csrf) {
        try {
          await axios.get(`${API_BASE_URL}/auth/csrf/`, { withCredentials: true })
          csrf = getCookie('csrftoken')
        } catch (_) {
          csrf = null
        }
      }
      if (csrf) {
        config.headers['X-CSRFToken'] = csrf
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await axios.post(`${API_BASE_URL}/auth/refresh/`, {}, { withCredentials: true })
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('user')
        if (!window.location.pathname.startsWith('/guest')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
