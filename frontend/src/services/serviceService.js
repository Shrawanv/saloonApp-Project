import api from './api'

const serviceService = {
  async getServicesBySalon(salonId) {
    const response = await api.get(`/services/salon/${salonId}/`)
    return response.data
  },

  async getServiceById(id) {
    const response = await api.get(`/services/${id}/`)
    return response.data
  },

  async getMyServices() {
    const response = await api.get('/vendor/services/')
    const data = response.data
    return Array.isArray(data) ? data : (data.results || [])
  },

  async createService(data) {
    const response = await api.post('/vendor/services/', data)
    return response.data
  },

  async updateService(id, data) {
    const response = await api.patch(`/vendor/services/${id}/`, data)
    return response.data
  },

  async deleteService(id) {
    const response = await api.delete(`/vendor/services/${id}/`)
    return response.data
  },

  async toggleService(id) {
    const response = await api.post(`/vendor/services/${id}/toggle/`)
    return response.data
  },
}

export default serviceService
