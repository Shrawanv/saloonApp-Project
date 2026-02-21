import { useState, useEffect } from 'react'
import { reviewService } from '../../services'
import './SalonProfile.css'

function SalonProfile({ salon }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState(null)

  useEffect(() => {
    if (salon?.id) {
      fetchReviews()
    }
  }, [salon?.id])

  const fetchReviews = async () => {
    try {
      const data = await reviewService.getSalonReviews(salon.id)
      setReviews(data)
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
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

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
  }

  const getMediaUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `http://localhost:8000${path}`
  }

  if (!salon) {
    return <div className="salon-profile-container">Loading...</div>
  }

  return (
    <div className="salon-profile-container">
      <div className="salon-profile card">
        <div className="profile-intro">
          <div className="logo-row">
            <div className="salon-logo-container">
              {salon.logo ? (
                <img src={getMediaUrl(salon.logo)} alt={salon.name} className="salon-logo-img" />
              ) : (
                <div className="cover-placeholder">✂️</div>
              )}
            </div>
            <div className="profile-title-row">
              <h3>{salon.name}</h3>
              {(salon.average_rating !== undefined) && (
                <div className="profile-rating">
                  <span className="star">⭐</span>
                  <span className="rating-val">{salon.average_rating}</span>
                  <span className="review-count">({salon.reviews_count || 0} reviews)</span>
                </div>
              )}
            </div>
          </div>
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
              <span className="detail-label">Location</span>
              <span className="detail-value">📍 {salon.pincode}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Working Hours</span>
              <span className="detail-value">🕐 {formatTime(salon.opening_time)} - {formatTime(salon.closing_time)}</span>
            </div>
            {salon.break_start_time && salon.break_end_time && (
              <div className="detail-item">
                <span className="detail-label">Break Time</span>
                <span className="detail-value">☕ {formatTime(salon.break_start_time)} - {formatTime(salon.break_end_time)}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Mobile</span>
              <span className="detail-value">📞 {salon.mobile}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="salon-gallery-sidebar card">
        <h3>Work Gallery</h3>
        {salon.media && salon.media.length > 0 ? (
          <div className="work-gallery-grid">
            {salon.media.map(item => (
              <div
                key={item.id}
                className="work-gallery-item"
                onClick={() => setSelectedMedia(item)}
              >
                {item.media_type === 'IMAGE' ? (
                  <img src={getMediaUrl(item.file)} alt="Gallery Item" />
                ) : (
                  <video src={getMediaUrl(item.file)} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-media">No photos available yet.</p>
        )}
      </div>

      {/* Media Zoom Modal */}
      {selectedMedia && (
        <div className="media-modal-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="media-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedMedia(null)}>✕</button>
            {selectedMedia.media_type === 'IMAGE' ? (
              <img src={getMediaUrl(selectedMedia.file)} alt="Zoomed Media" />
            ) : (
              <video src={getMediaUrl(selectedMedia.file)} controls autoPlay />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SalonProfile
