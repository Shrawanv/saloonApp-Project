import { useState, useEffect } from 'react'
import { reviewService } from '../../services'
import './FeedbackSection.css'

function FeedbackSection({ salonId }) {
  const [reviews, setReviews] = useState([])
  const [newFeedback, setNewFeedback] = useState('')
  const [rating, setRating] = useState(5)
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
    if (!newFeedback.trim()) return

    try {
      setSubmitting(true)
      setError('')
      await reviewService.createReview(salonId, {
        rating,
        comment: newFeedback
      })
      setNewFeedback('')
      setRating(5)
      fetchReviews() // Refresh list
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setError(err.response?.data?.detail || 'Failed to submit feedback. Are you logged in?')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
  }

  return (
    <div className="feedback-section container-center">
      <div className="feedback-form card">
        <h3>Give Feedback</h3>
        <p className="feedback-hint">How was your visit? Share your thoughts below.</p>

        {error && <p className="error-text">{error}</p>}

        <div className="rating-input">
          <label>Overall Rating:</label>
          <div className="star-select">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="star-btn"
                onClick={() => setRating(star)}
              >
                {rating >= star ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        <textarea
          placeholder="Write your review here... (Optional)"
          value={newFeedback}
          onChange={(e) => setNewFeedback(e.target.value)}
          rows={5}
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
