import { useState, useEffect } from 'react'
import { salonService } from '../../services'
import './LiveQueue.css'

function LiveQueue({ salonId, isGuest, mobile, onTabChange }) {
  const [queueData, setQueueData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleBookRedirect = (e) => {
    e.preventDefault()
    if (onTabChange) {
      onTabChange('book')
    }
  }

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [salonId, mobile])

  const fetchQueue = async () => {
    try {
      const data = await salonService.getLiveQueue(salonId, mobile)
      setQueueData(data)
    } catch (err) {
      console.error('Error fetching queue:', err)
      setError('Failed to load queue status.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="live-queue card">Loading queue...</div>
  if (error) return <div className="live-queue card error-text">{error}</div>

  const { queue, position, total_in_queue, message, is_full_access } = queueData || {}

  return (
    <div className="live-queue card">
      <div className="queue-header">
        <h3>Live Queue</h3>
        <span className="live-badge">● Live</span>
      </div>

      <div className="queue-stats">
        <div className="stat-item">
          <span className="stat-value">{total_in_queue || 0}</span>
          <span className="stat-label">In Queue</span>
        </div>
        {position && (
          <div className="stat-item highlight">
            <span className="stat-value">#{position}</span>
            <span className="stat-label">Your Position</span>
          </div>
        )}
      </div>

      {is_full_access && queue ? (
        <div className="queue-list">
          {queue.map((item, idx) => (
            <div key={item.id} className={`queue-item ${item.checked_in_at ? 'checked-in' : ''}`}>
              <span className="q-pos">{idx + 1}.</span>
              <span className="q-name">{item.display_name || (item.guest_name ? `${item.guest_name[0]}***` : 'Customer')}</span>
              <span className="q-time">{item.slot_start}</span>
              {item.checked_in_at && <span className="q-status">Present</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className="queue-info">
          <p>{message || 'Queue information is available for booked appointments.'}</p>
          {!isGuest && !position && (
            <button onClick={handleBookRedirect} className="btn btn-primary btn-block">
              Book a Slot
            </button>
          )}
        </div>
      )}

      {!is_full_access && position && (
        <div className="queue-actions">
          <p className="hint">Visit the salon and scan the QR code to see full queue details.</p>
        </div>
      )}
    </div>
  )
}

export default LiveQueue
