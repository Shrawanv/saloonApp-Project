import { useState, useEffect, useRef } from 'react'
import { reviewService } from '../../services'
import './FeedbackSection.css'

function FeedbackSection({ salonId }) {
  const [reviews, setReviews] = useState([])
  const [newFeedback, setNewFeedback] = useState('')
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [animatingStar, setAnimatingStar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [salonId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const data = await reviewService.getSalonReviews(salonId)
      setReviews(data)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      await reviewService.createReview(salonId, {
        rating,
        comment: newFeedback
      })
      setNewFeedback('')
      setRating(0)
      setHoveredStar(0)
      fetchReviews()
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setError(err.response?.data?.detail || 'Failed to submit feedback. Are you logged in?')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStarClick = (star) => {
    setRating(star)
    setAnimatingStar(star)
    setTimeout(() => setAnimatingStar(null), 350)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
  }

  const renderStar = (index) => {
    const filled = index <= (hoveredStar || rating)
    return (
      <button
        key={index}
        type="button"
        className={`star-btn${filled ? ' star-filled' : ''}${animatingStar === index ? ' star-animate' : ''}`}
        onClick={() => handleStarClick(index)}
        onMouseEnter={() => setHoveredStar(index)}
        onMouseLeave={() => setHoveredStar(0)}
        aria-label={`Rate ${index} star${index > 1 ? 's' : ''}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    )
  }

  return (
    <div className="feedback-section">
      <div className="feedback-form card">
        <h3>Give Feedback</h3>
        <p className="feedback-hint">How was your visit? Share your thoughts below.</p>

        {error && <p className="error-text">{error}</p>}

        <div className="rating-input">
          <label>Overall Rating</label>
          <div className="star-select">
            {[1, 2, 3, 4, 5].map(renderStar)}
          </div>
        </div>

        <textarea
          placeholder="Write your review here... (Optional)"
          value={newFeedback}
          onChange={(e) => setNewFeedback(e.target.value)}
          rows={4}
        />

        <button
          className="btn btn-primary btn-block"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>

        <p className="success-hint">Your feedback helps us improve and helps other customers!</p>
      </div>
    </div>
  )
}

export default FeedbackSection
