import api from './api'

const reviewService = {
    async getSalonReviews(salonId, params = {}) {
        const response = await api.get(`/salons/${salonId}/reviews/`, { params })
        const data = response.data
        return Array.isArray(data) ? data : (data.results || [])
    },

    async createReview(salonId, data) {
        const response = await api.post(`/salons/${salonId}/reviews/`, data)
        return response.data
    },
}

export default reviewService
