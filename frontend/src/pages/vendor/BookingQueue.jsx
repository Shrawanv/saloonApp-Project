import { useState, useEffect } from 'react'
import { salonService, appointmentService } from '../../services'
import './BookingQueue.css'

const VENDOR_TABS = [
  { id: 'live', label: 'Live Queue Monitoring' },
  { id: 'all', label: 'All Appointments' },
]

function BookingQueue() {
  const [activeTab, setActiveTab] = useState('live')
  const [salons, setSalons] = useState([])
  const [selectedSalon, setSelectedSalon] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    fetchSalons()
  }, [])

  useEffect(() => {
    if (selectedSalon) {
      fetchAppointments()
    }
  }, [selectedSalon, activeTab])

  const fetchSalons = async () => {
    try {
      const data = await salonService.getMySalons()
      setSalons(data)
      if (data.length > 0) {
        setSelectedSalon(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching salons:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = {
        salon: selectedSalon,
      }
      
      if (activeTab === 'live') {
        params.date = new Date().toISOString().split('T')[0]
        params.status = 'BOOKED'
      }
      
      const data = await appointmentService.getVendorAppointments(params)
      setAppointments(data)
    } catch (err) {
      console.error('Error fetching appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setUpdating(appointmentId)
      await appointmentService.updateAppointmentStatus(appointmentId, newStatus)
      fetchAppointments()
    } catch (err) {
      console.error('Error updating appointment:', err)
      alert('Failed to update appointment status')
    } finally {
      setUpdating(null)
    }
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BOOKED': return 'badge-pending'
      case 'COMPLETED': return 'badge-completed'
      case 'CANCELLED': return 'badge-cancelled'
      default: return ''
    }
  }

  if (salons.length === 0 && !loading) {
    return (
      <div className="booking-queue-page">
        <h1>Booking & Queue Management</h1>
        <div className="no-salon card">
          <p>You need to create a salon first to manage bookings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-queue-page">
      <h1>Booking & Queue Management</h1>

      {salons.length > 1 && (
        <div className="salon-selector">
          <label>Select Salon:</label>
          <select 
            value={selectedSalon || ''} 
            onChange={(e) => setSelectedSalon(parseInt(e.target.value))}
          >
            {salons.map(salon => (
              <option key={salon.id} value={salon.id}>{salon.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="vendor-tabs">
        {VENDOR_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`vendor-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content card">
        <h3>{activeTab === 'live' ? "Today's Queue" : 'All Appointments'}</h3>
        
        {loading ? (
          <p className="loading">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="empty">No appointments found</p>
        ) : (
          <div className="queue-table">
            {appointments.map((apt) => (
              <div key={apt.id} className="queue-row">
                <div className="apt-info">
                  <strong>{apt.user_name || 'Customer'}</strong>
                  <span className="apt-services">
                    {apt.services_details?.map(s => s.name).join(', ') || 'Service'}
                  </span>
                </div>
                <div className="apt-time">
                  <span>{apt.appointment_date}</span>
                  <span>{formatTime(apt.slot_start)}</span>
                </div>
                <span className={`status-badge ${getStatusBadge(apt.status)}`}>
                  {apt.status}
                </span>
                {apt.status === 'BOOKED' && (
                  <div className="apt-actions">
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStatusUpdate(apt.id, 'COMPLETED')}
                      disabled={updating === apt.id}
                    >
                      {updating === apt.id ? '...' : 'Done'}
                    </button>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleStatusUpdate(apt.id, 'CANCELLED')}
                      disabled={updating === apt.id}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingQueue
