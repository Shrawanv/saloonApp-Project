import { useState, useEffect } from 'react'
import { appointmentService } from '../../services'
import './MyAppointments.css'

function MyAppointments() {
  const [filter, setFilter] = useState('upcoming')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(null)
  const [cancelError, setCancelError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(null)

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
    try {
      setCancelling(id)
      setCancelError('')
      await appointmentService.cancelAppointment(id)
      setShowCancelConfirm(null)
      fetchAppointments()
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      setCancelError('Failed to cancel appointment. Please try again.')
      setShowCancelConfirm(null)
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

      <div className="profile-tabs">
        <button
          className={`profile-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`profile-tab ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
      </div>

      <div className="appointment-list">
        {loading && <div className="loading-state">Loading appointments...</div>}

        {error && <div className="error-state card">{error}</div>}
        {cancelError && <div className="error-message">{cancelError}</div>}

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
            <div className="apt-pricing">
              {apt.coupon_code && parseFloat(apt.discount_amount) > 0 ? (
                <>
                  <span className="apt-price-original">₹{apt.total_price}</span>
                  <span className="apt-price-final">
                    ₹{(parseFloat(apt.total_price) - parseFloat(apt.discount_amount)).toFixed(2)}
                  </span>
                  <span className="apt-coupon-tag">{apt.coupon_code} applied</span>
                </>
              ) : (
                apt.total_price && <span className="apt-price">₹{apt.total_price}</span>
              )}
            </div>
            {filter === 'upcoming' && apt.status !== 'CANCELLED' && (
              <div className="apt-actions">
                <button
                  className="btn btn-outline btn-sm cancel"
                  onClick={() => setShowCancelConfirm(apt.id)}
                  disabled={cancelling === apt.id}
                >
                  {cancelling === apt.id ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="modal-overlay" onClick={() => setShowCancelConfirm(null)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center', padding: '2.5rem' }}>
            <h3>Cancel Appointment?</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Are you sure you want to cancel this appointment? This cannot be undone.</p>
            <div className="modal-actions" style={{ flexDirection: 'row', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowCancelConfirm(null)}>Keep It</button>
              <button
                className="btn btn-primary"
                onClick={() => handleCancel(showCancelConfirm)}
                disabled={cancelling === showCancelConfirm}
              >
                {cancelling === showCancelConfirm ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyAppointments
