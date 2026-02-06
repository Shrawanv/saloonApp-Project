import { useState, useEffect } from 'react'
import { appointmentService } from '../../services'
import './MyAppointments.css'

function MyAppointments() {
  const [filter, setFilter] = useState('upcoming')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    fetchAppointments()
  }, [filter])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError('')
      const data = filter === 'upcoming'
        ? await appointmentService.getUpcomingAppointments()
        : await appointmentService.getPastAppointments()
      setAppointments(data)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Failed to load appointments. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    
    try {
      setCancelling(id)
      await appointmentService.cancelAppointment(id)
      fetchAppointments()
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      alert('Failed to cancel appointment. Please try again.')
    } finally {
      setCancelling(null)
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

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'BOOKED': return 'confirmed'
      case 'COMPLETED': return 'completed'
      case 'CANCELLED': return 'cancelled'
      default: return 'pending'
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Appointments</h1>
        <p>View and manage your bookings</p>    
      </div>

      <div className="appointment-tabs">
        <button
          className={`tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`tab ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
      </div>

      <div className="appointment-list">
        {loading && <div className="loading-state">Loading appointments...</div>}
        
        {error && <div className="error-state card">{error}</div>}
        
        {!loading && !error && appointments.length === 0 && (
          <div className="empty-state card">
            <p>No {filter} appointments</p>
          </div>
        )}
        
        {!loading && !error && appointments.map((apt) => (
          <div key={apt.id} className="appointment-card card">
            <div className="apt-header">
              <h4>{apt.salon_name}</h4>
              {apt.status && (
                <span className={`status-badge ${getStatusClass(apt.status)}`}>
                  {apt.status}
                </span>
              )}
            </div>
            <p className="apt-service">
              {apt.services_names?.join(', ') || 'Service'}
            </p>
            <p className="apt-datetime">
              📅 {apt.appointment_date} at {formatTime(apt.slot_start)}
            </p>
            {apt.total_price && (
              <p className="apt-price">₹{apt.total_price}</p>
            )}
            {filter === 'upcoming' && apt.status !== 'CANCELLED' && (
              <div className="apt-actions">
                <button 
                  className="btn btn-outline btn-sm cancel"
                  onClick={() => handleCancel(apt.id)}
                  disabled={cancelling === apt.id}
                >
                  {cancelling === apt.id ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyAppointments
