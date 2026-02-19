import api from './api'

const appointmentService = {
  async getAppointments(params = {}) {
    const response = await api.get('/bookings/mine/', { params })
    const data = response.data
    return Array.isArray(data) ? data : (data.results || [])
  },

  async getUpcomingAppointments() {
    const response = await api.get('/bookings/mine/', {
      params: { type: 'upcoming' }
    })
    const data = response.data
    return Array.isArray(data) ? data : (data.results || [])
  },

  async getPastAppointments() {
    const response = await api.get('/bookings/mine/', {
      params: { type: 'past' }
    })
    const data = response.data
    return Array.isArray(data) ? data : (data.results || [])
  },

  async getAppointmentById(id) {
    const response = await api.get(`/customer/bookings/${id}/`)
    return response.data
  },

  async createAppointment(data) {
    const response = await api.post('/bookings/', data)
    return response.data
  },

  async cancelAppointment(id) {
    const response = await api.delete(`/customer/bookings/${id}/`)
    return response.data
  },

  async getVendorAppointments(params = {}) {
    const response = await api.get('/appointments/vendor/', { params })
    const data = response.data
    return Array.isArray(data) ? data : (data.results || [])
  },

  async updateAppointmentStatus(id, status, action = null, extraData = {}) {
    const payload = { ...extraData }
    if (status) payload.status = status
    if (action) payload.action = action
    const response = await api.post(`/appointments/vendor/${id}/update/`, payload)
    return response.data
  },

  async checkIn(data) {
    const response = await api.post('/bookings/check-in/', data)
    return response.data
  },
}

export default appointmentService
