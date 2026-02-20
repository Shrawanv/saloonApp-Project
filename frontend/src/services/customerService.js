import api from './api'

const customerService = {
    async getProfile() {
        const response = await api.get('/customer/profile/')
        return response.data
    },

    async updateProfile(profileData) {
        const response = await api.patch('/customer/profile/', profileData)
        // Optionally update local storage if user data is mirrored there
        const user = JSON.parse(localStorage.getItem('user'))
        if (user) {
            const updatedUser = { ...user, ...response.data }
            localStorage.setItem('user', JSON.stringify(updatedUser))
        }
        return response.data
    },
}

export default customerService
