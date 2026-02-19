import api from './api'

const salonService = {
  async getSalons(params = {}) {
    const response = await api.get('/salons/', { params })
    const data = response.data
    return Array.isArray(data) ? data : (data.results || [])
  },

  async searchSalons(searchQuery) {
    const response = await api.get('/salons/', {
      params: { search: searchQuery }
    })
    const data = response.data
    return Array.isArray(data) ? data : (data.results || [])
  },

  async getSalonById(id) {
    const response = await api.get(`/salons/${id}/`)
    return response.data
  },

  async getSlots(salonId, date, durationMinutes) {
    const response = await api.get(`/salons/${salonId}/slots/`, {
      params: { date, duration_minutes: durationMinutes }
    })
    return response.data
  },

  async getMySalons() {
    const response = await api.get('/vendor/salons/')
    const data = response.data
    return Array.isArray(data) ? data : (data.results || [])
  },

  async createSalon(data) {
    const response = await api.post('/vendor/salons/', data)
    return response.data
  },

  async updateSalon(id, data) {
    const response = await api.patch(`/vendor/salons/${id}/`, data)
    return response.data
  },

  async deleteSalon(id) {
    const response = await api.delete(`/vendor/salons/${id}/`)
    return response.data
  },

  async getLiveQueue(salonId, mobile = null) {
    const params = mobile ? { mobile } : {}
    const response = await api.get(`/salons/${salonId}/live-queue/`, { params })
    return response.data
  },
}

export default salonService
