import { useState, useEffect } from 'react'
import { salonService, appointmentService, broadcastService } from '../../services'
import './Communication.css'

const COMM_TABS = [
  { id: 'appointments', label: 'Manage Requests' },
  { id: 'broadcast', label: 'Broadcast Offers' },
  { id: 'chat', label: 'In-app Chat' },
]

function Communication() {
  const [activeTab, setActiveTab] = useState('appointments')
  const [salons, setSalons] = useState([])
  const [selectedSalon, setSelectedSalon] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [commSuccess, setCommSuccess] = useState('')
  const [commError, setCommError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const [showReschedule, setShowReschedule] = useState(false)
  const [currentApt, setCurrentApt] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Broadcast states
  const [broadcasts, setBroadcasts] = useState([])
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({
    message: '',
    offer_code: '',
    discount_type: 'PERCENT',
    discount_value: 0,
    expiry_date: '',
    target_audience: 'ALL'
  })
  const [sendingId, setSendingId] = useState(null)

  useEffect(() => {
    fetchSalons()
  }, [])

  useEffect(() => {
    if (selectedSalon) {
      fetchUpcomingAppointments()
      fetchBroadcasts()
    }
  }, [selectedSalon])

  useEffect(() => {
    if (showReschedule && newDate && currentApt) {
      fetchAvailableSlots()
    }
  }, [newDate, showReschedule])

  const fetchSalons = async () => {
    try {
      const data = await salonService.getMySalons()
      setSalons(data)
      if (data.length > 0) {
        setSelectedSalon(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching salons:', err)
    }
  }

  const fetchUpcomingAppointments = async () => {
    try {
      setLoading(true)
      const data = await appointmentService.getVendorAppointments({
        salon: selectedSalon,
        status: 'BOOKED',
        start_date: new Date().toISOString().split('T')[0]
      })
      // If data is paginated, extract results
      const list = Array.isArray(data) ? data : (data.results || [])
      setAppointments(list)
    } catch (err) {
      console.error('Error fetching appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBroadcasts = async () => {
    try {
      setLoadingBroadcasts(true)
      const data = await broadcastService.getBroadcasts(selectedSalon)
      setBroadcasts(data)
    } catch (err) {
      console.error('Error fetching broadcasts:', err)
    } finally {
      setLoadingBroadcasts(false)
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true)
      const availableSlots = await salonService.getSlots(selectedSalon, newDate, currentApt.duration_minutes)
      setSlots(availableSlots)
    } catch (err) {
      console.error('Error fetching slots:', err)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleOpenReschedule = (apt) => {
    setCurrentApt(apt)
    setNewDate(apt.appointment_date)
    setSelectedSlot(apt.slot_start)
    setShowReschedule(true)
  }

  const handleRescheduleSubmit = async () => {
    if (!selectedSlot) return
    try {
      await appointmentService.updateAppointmentStatus(currentApt.id, 'BOOKED', null, {
        appointment_date: newDate,
        slot_start: selectedSlot
      })
      setCommSuccess('Appointment rescheduled successfully!')
      setCommError('')
      setTimeout(() => setCommSuccess(''), 5000)
      setShowReschedule(false)
      fetchUpcomingAppointments()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reschedule'
      setCommError(msg)
      setCommSuccess('')
    }
  }

  const handleCancelAppointment = async (id) => {
    try {
      await appointmentService.updateAppointmentStatus(id, 'CANCELLED')
      setCommSuccess('Appointment cancelled.')
      setCommError('')
      setTimeout(() => setCommSuccess(''), 5000)
      setShowCancelConfirm(null)
      fetchUpcomingAppointments()
    } catch (err) {
      setCommError('Failed to cancel appointment')
      setCommSuccess('')
      setShowCancelConfirm(null)
    }
  }

  const handleCreateBroadcast = async (e) => {
    e.preventDefault()
    try {
      await broadcastService.createBroadcast({ ...broadcastForm, salon: selectedSalon })
      setCommSuccess('Broadcast created!')
      setCommError('')
      setTimeout(() => setCommSuccess(''), 5000)
      setShowBroadcastModal(false)
      setBroadcastForm({
        title: '',
        message: '',
        offer_code: '',
        discount_type: 'PERCENT',
        discount_value: 0,
        expiry_date: '',
        target_audience: 'ALL'
      })
      fetchBroadcasts()
    } catch (err) {
      setCommError('Failed to create broadcast')
      setCommSuccess('')
    }
  }

  const handleSendBroadcast = async (id) => {
    try {
      setSendingId(id)
      await broadcastService.performAction(id, 'send')
      setCommSuccess('Broadcast sent successfully!')
      setCommError('')
      setTimeout(() => setCommSuccess(''), 5000)
      fetchBroadcasts()
    } catch (err) {
      setCommError('Failed to send broadcast')
      setCommSuccess('')
    } finally {
      setSendingId(null)
    }
  }

  const handleDeleteBroadcast = async (id) => {
    try {
      await broadcastService.deleteBroadcast(id)
      setCommSuccess('Broadcast deleted.')
      setCommError('')
      setShowDeleteConfirm(null)
      setTimeout(() => setCommSuccess(''), 5000)
      fetchBroadcasts()
    } catch (err) {
      setCommError('Failed to delete broadcast')
      setCommSuccess('')
      setShowDeleteConfirm(null)
    }
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hr = parseInt(h)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    const h12 = hr % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  const renderManageRequests = () => {
    const filteredAppointments = appointments.filter(apt => {
      const q = searchQuery.toLowerCase()
      const matchesName = (apt.user_name || apt.guest_name || '').toLowerCase().includes(q)
      const matchesMobile = (apt.user?.mobile || apt.guest_mobile || '').toLowerCase().includes(q)
      return matchesName || matchesMobile
    })

    return (
      <div className="apt-management-list">
        <div className="search-bar-container" style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by customer name or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.875rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              background: 'white'
            }}
          />
        </div>

        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(apt => (
            <div key={apt.id} className="apt-manage-card card">
              <div className="apt-manage-main">
                <div className="apt-user-info">
                  <h4>{apt.user_name || apt.guest_name}</h4>
                  <p>📞 {apt.user?.mobile || apt.guest_mobile || 'No mobile'}</p>
                  <div className="apt-services-list" style={{ marginTop: '0.75rem' }}>
                    {apt.services_details?.map((s, idx) => (
                      <span key={idx} className="service-chip">{s.name}</span>
                    ))}
                  </div>
                </div>
                <div className="apt-time-badge">
                  <span className="date-text">{new Date(apt.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="time-text">{formatTime(apt.slot_start)}</span>
                </div>
              </div>
              <div className="apt-manage-actions">
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => setShowCancelConfirm(apt.id)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => handleOpenReschedule(apt)}
                >
                  Reschedule
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-comm">
            <p>No upcoming appointment requests found.</p>
          </div>
        )}
      </div>
    )
  }

  const renderBroadcast = () => (
    <div className="broadcast-section">
      <div className="section-header">
        <div className="header-text">
          <h3>Campaign History</h3>
          <p className="hint">View and manage your marketing broadcasts.</p>
        </div>
        <button className="btn btn-primary btn-small" onClick={() => setShowBroadcastModal(true)}>
          + Create New Campaign
        </button>
      </div>

      <div className="broadcast-list">
        {loadingBroadcasts ? (
          <p className="hint">Loading campaigns...</p>
        ) : broadcasts.length > 0 ? (
          broadcasts.map(b => (
            <div key={b.id} className={`broadcast-card card ${b.is_sent ? 'sent' : 'draft'}`}>
              <div className="broadcast-main">
                <div className="broadcast-info">
                  <div className="broadcast-status-row">
                    <span className={`status-pill ${b.is_sent ? 'sent' : 'draft'}`}>
                      {b.is_sent ? '✅ Sent' : '📝 Draft'}
                    </span>
                    <span className="broadcast-date">
                      {new Date(b.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4>{b.title}</h4>
                  <p className="broadcast-msg">{b.message}</p>

                  <div className="broadcast-meta-grid">
                    {b.offer_code && (
                      <div className="offer-tag">
                        Code: <strong>{b.offer_code}</strong>
                      </div>
                    )}
                    <div className="discount-badge">
                      {b.discount_type === 'PERCENT' ? `${Number(b.discount_value)}% OFF` : `₹${Number(b.discount_value)} OFF`}
                    </div>
                    {b.expiry_date && (
                      <div className="expiry-tag">
                        Expires: {new Date(b.expiry_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="target-pill" style={{ marginTop: '0.75rem' }}>
                    🎯 Target: {b.target_audience === 'ALL' ? 'All Customers' : b.target_audience === 'LOYAL' ? 'Loyalists' : 'New Customers'}
                  </div>
                </div>
                <div className="broadcast-actions">
                  {!b.is_sent && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSendBroadcast(b.id)}
                      disabled={sendingId === b.id}
                    >
                      {sendingId === b.id ? 'Sending...' : '🚀 Send Now'}
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteConfirm(b.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>📣 No broadcast campaigns yet. Create your first offer to engage customers!</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderChat = () => (
    <div className="empty-comm">
      <div className="placeholder-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
      <h3>Real-time Customer Chat</h3>
      <p>Chat directly with customers who have active bookings.</p>
      <div className="chat-placeholder-list" style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'left' }}>
        <div className="stat-card card" style={{ padding: '1rem', opacity: 0.6 }}>
          <strong>Rajesh Kumar</strong>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>Can I come 10 mins late?</p>
        </div>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '1rem' }}>Coming Soon: Real-time Messaging Infrastructure</p>
    </div>
  )

  return (
    <div className="communication-page">
      <div className="comm-header">
        <div className="page-header">
          <h1>Communication Tools</h1>
          <p>Manage appointments and stay connected with customers.</p>
        </div>

        {salons.length > 0 && (
          <div className="salon-selector-inline">
            <label>Select Salon</label>
            <select
              value={selectedSalon || ''}
              onChange={(e) => setSelectedSalon(e.target.value)}
            >
              {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {commSuccess && <div className="success-message">{commSuccess}</div>}
      {commError && <div className="error-message">{commError}</div>}

      <div className="profile-tabs">
        {COMM_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="comm-content">
        {loading && activeTab === 'appointments' ? (
          <div className="loading-state">Loading communication module...</div>
        ) : (
          <>
            {activeTab === 'appointments' && renderManageRequests()}
            {activeTab === 'broadcast' && renderBroadcast()}
            {activeTab === 'chat' && renderChat()}
          </>
        )}
      </div>

      {showReschedule && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Reschedule Appointment</h2>
              <button className="close-btn" onClick={() => setShowReschedule(false)}>&times;</button>
            </div>

            <div className="reschedule-form">
              <div className="form-group">
                <label>Select New Date</label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Select Available Slot</label>
                {loadingSlots ? (
                  <p className="hint">Loading available slots...</p>
                ) : (
                  <div className="walkin-slot-grid" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {slots.map(slot => (
                      <button
                        key={slot.start}
                        className={`slot-btn ${selectedSlot === slot.start ? 'active' : ''} ${slot.is_full ? 'full' : ''}`}
                        disabled={slot.is_full}
                        onClick={() => setSelectedSlot(slot.start)}
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))}
                    {slots.length === 0 && <p className="hint">No slots available for this date.</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button className="btn btn-outline" onClick={() => setShowReschedule(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleRescheduleSubmit}
                disabled={!selectedSlot}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {showBroadcastModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2>New Broadcast Campaign</h2>
              <button className="close-btn" onClick={() => setShowBroadcastModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="broadcast-form">
              <div className="form-group">
                <label>Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Festival Special Discount"
                  required
                  value={broadcastForm.title}
                  onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Message Content</label>
                <textarea
                  placeholder="Tell your customers about the offer..."
                  required
                  rows="4"
                  value={broadcastForm.message}
                  onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type</label>
                  <select
                    value={broadcastForm.discount_type}
                    onChange={e => setBroadcastForm({ ...broadcastForm, discount_type: e.target.value })}
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value</label>
                  <input
                    type="number"
                    placeholder="20"
                    required
                    value={broadcastForm.discount_value}
                    onChange={e => setBroadcastForm({ ...broadcastForm, discount_value: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Offer Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="SAVE20"
                    value={broadcastForm.offer_code}
                    onChange={e => setBroadcastForm({ ...broadcastForm, offer_code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={broadcastForm.expiry_date}
                    onChange={e => setBroadcastForm({ ...broadcastForm, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Target Audience</label>
                <select
                  value={broadcastForm.target_audience}
                  onChange={e => setBroadcastForm({ ...broadcastForm, target_audience: e.target.value })}
                >
                  <option value="ALL">All Customers</option>
                  <option value="LOYAL">Loyal Customers Only</option>
                  <option value="NEW">New Customers Only</option>
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowBroadcastModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save as Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Appointment Confirmation Modal */}
      {showCancelConfirm && (
        <div className="modal-overlay" onClick={() => setShowCancelConfirm(null)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center', padding: '2.5rem' }}>
            <h3>Cancel Appointment?</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Are you sure you want to cancel this appointment? This cannot be undone.</p>
            <div className="modal-actions" style={{ flexDirection: 'row', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowCancelConfirm(null)}>Keep It</button>
              <button className="btn btn-primary" onClick={() => handleCancelAppointment(showCancelConfirm)}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Broadcast Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center', padding: '2.5rem' }}>
            <h3>Delete Broadcast?</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Are you sure you want to delete this broadcast?</p>
            <div className="modal-actions" style={{ flexDirection: 'row', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleDeleteBroadcast(showDeleteConfirm)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Communication
