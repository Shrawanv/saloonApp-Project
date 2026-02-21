import api from './api'

const vendorService = {
    /**
     * Fetches analytics reports for a vendor's salon.
     * Includes earnings, frequent customers, and ratings.
     * @param {number} salonId - Optional salon ID. Defaults to first salon if omited.
     */
    async getReports(salonId) {
        const params = salonId ? { salon_id: salonId } : {}
        try {
            const response = await api.get('/vendor/reports/', { params })
            return response.data
        } catch (error) {
            console.error('Error fetching vendor reports:', error)
            throw error
        }
    }
}

export default vendorService
