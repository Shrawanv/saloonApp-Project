import { useState } from 'react'
import './FeedbackSection.css'

const MOCK_FEEDBACKS = [
  { user: 'Amit K.', text: 'Great haircut! Rahul is very skilled.', rating: 5, date: '2 days ago' },
  { user: 'Sneha M.', text: 'Clean and professional. Will visit again.', rating: 5, date: '1 week ago' },
]

function FeedbackSection({ salonId }) {
  const [newFeedback, setNewFeedback] = useState('')

  return (
    <div className="feedback-section">
      <div className="feedback-form card">
        <h3>Give Feedback</h3>
        <textarea
          placeholder="Share your experience..."
          value={newFeedback}
          onChange={(e) => setNewFeedback(e.target.value)}
          rows={4}
        />
        <button className="btn btn-primary">Submit Feedback</button>
      </div>

      <div className="feedback-list">
        <h4>Customer Reviews</h4>
        {MOCK_FEEDBACKS.map((fb, i) => (
          <div key={i} className="feedback-card card">
            <div className="fb-header">
              <span className="fb-user">{fb.user}</span>
              <span className="fb-rating">{'⭐'.repeat(fb.rating)}</span>
            </div>
            <p className="fb-text">{fb.text}</p>
            <span className="fb-date">{fb.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeedbackSection
