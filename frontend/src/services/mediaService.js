import api from './api'

const mediaService = {
    uploadProfilePicture: async (file) => {
        const formData = new FormData()
        formData.append('profile_picture', file)
        const response = await api.post('/customer/profile/avatar/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    },

    uploadSalonLogo: async (salonId, file) => {
        const formData = new FormData()
        formData.append('logo', file)
        const response = await api.post(`/vendor/salons/${salonId}/logo/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    },

    uploadSalonGalleryMedia: async (salonId, file, mediaType = 'IMAGE') => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('media_type', mediaType)
        const response = await api.post(`/vendor/salons/${salonId}/gallery/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    },

    getSalonGalleryMedia: async (salonId) => {
        const response = await api.get(`/vendor/salons/${salonId}/gallery/`)
        return response.data
    },

    deleteGalleryMedia: async (mediaId) => {
        const response = await api.delete(`/vendor/gallery/${mediaId}/`)
        return response.data
    }
}

export default mediaService
