import api from './api'

const broadcastService = {
    getBroadcasts: (salonId) => {
        let url = '/vendor/broadcasts/'
        if (salonId) url += `?salon=${salonId}`
        return api.get(url).then(res => res.data)
    },

    createBroadcast: (data) => {
        return api.post('/vendor/broadcasts/', data).then(res => res.data)
    },

    performAction: (id, action) => {
        return api.post(`/vendor/broadcasts/${id}/`, { action }).then(res => res.data)
    },

    deleteBroadcast: (id) => {
        return api.delete(`/vendor/broadcasts/${id}/`).then(res => res.data)
    }
}

export default broadcastService
