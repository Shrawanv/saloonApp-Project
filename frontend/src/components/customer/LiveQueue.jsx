import { Link } from 'react-router-dom'
import './LiveQueue.css'

function LiveQueue({ salonId, isGuest }) {
  return (
    <div className="live-queue card">
      <div className="queue-header">
        <h3>Live Queue</h3>
        <span className="live-badge">● Live</span>
      </div>
      
      <div className="queue-info">
        <p>
          Queue information is available for booked appointments.
          Book a slot to see your position in the queue.
        </p>
      </div>

      <div className="queue-actions">
        <p className="queue-cta">Ready to book?</p>
        {isGuest ? (
          <Link to="/login" className="btn btn-primary btn-block">
            Login to Book
          </Link>
        ) : (
          <Link to={`/customer/dashboard/${salonId}`} className="btn btn-primary btn-block">
            Book a Slot
          </Link>
        )}
      </div>
    </div>
  )
}

export default LiveQueue
