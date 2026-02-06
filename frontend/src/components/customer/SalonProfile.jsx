import './SalonProfile.css'

function SalonProfile({ salon }) {
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  if (!salon) {
    return <div className="salon-profile card">Loading...</div>
  }

  return (
    <div className="salon-profile card">
      <div className="profile-intro">
        <div className="cover-placeholder">✂️</div>
        <h3>About {salon.name}</h3>
        <p>
          Welcome to {salon.name}! We provide quality salon services with
          professional staff. Book your slot today and experience the best grooming services.
        </p>
      </div>

      <div className="salon-details">
        <h3>Salon Details</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Services Available</span>
            <span className="detail-value">{salon.services_count || 0} services</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Slot Duration</span>
            <span className="detail-value">{salon.slot_duration || 60} minutes</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Max Capacity/Slot</span>
            <span className="detail-value">{salon.max_capacity_per_slot || 1} person(s)</span>
          </div>
        </div>
      </div>

      <div className="contact-info">
        <h3>Contact Information</h3>
        <p>📍 Pincode: {salon.pincode}</p>
        <p>🕐 {formatTime(salon.opening_time)} - {formatTime(salon.closing_time)}</p>
        {salon.break_start_time && salon.break_end_time && (
          <p>☕ Break: {formatTime(salon.break_start_time)} - {formatTime(salon.break_end_time)}</p>
        )}
        <p>📞 {salon.mobile}</p>
      </div>
    </div>
  )
}

export default SalonProfile
