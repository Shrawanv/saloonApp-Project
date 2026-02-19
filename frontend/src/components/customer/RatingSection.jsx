import { useState, useEffect } from 'react'
import { reviewService } from '../../services'
import './RatingSection.css'

function RatingSection({ salonId, salon }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  const averageRating = salon?.average_rating || 0
  const totalReviews = salon?.reviews_count || 0

  return (
    <div className="rating-section card">
      <div className="rating-overview">
        <div className="avg-rating">
          <span className="stars">⭐</span>
          <span className="number">{averageRating}</span>
        </div>
        <p>{totalReviews} reviews</p>
      </div>

      <div className="rate-now">
        <h4>Rate this salon</h4>
        <p className="hint">Your rating will be submitted with your feedback in the Feedback tab.</p>
        <div className="star-select">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className="star-btn"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              {(hoverRating || rating) >= star ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RatingSection
