import { useState, useEffect } from 'react'
import { salonService, appointmentService, serviceService } from '../../services'
import './BookingQueue.css'

const VENDOR_TABS = [
  { id: 'live', label: 'Live Queue Monitoring' },
  { id: 'all', label: 'All Appointments' },
]

function BookingQueue() {
  const [activeTab, setActiveTab] = useState('live')
  const [dateFilter, setDateFilter] = useState('today') // 'all', 'today', '7d', '30d', 'custom'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [salons, setSalons] = useState([])
  const [selectedSalon, setSelectedSalon] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [walkInError, setWalkInError] = useState('')

  // Walk-in booking state
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [walkInStep, setWalkInStep] = useState(1) // 1: Details & Services, 2: Slot & Confirm
  const [salonServices, setSalonServices] = useState([])
  const [walkInSlots, setWalkInSlots] = useState([])
  const [loadingWalkInSlots, setLoadingWalkInSlots] = useState(false)
  const [walkInForm, setWalkInForm] = useState({
    guest_name: '',
    guest_mobile: '',
    service_ids: [],
    appointment_date: new Date().toISOString().split('T')[0],
    slot_start: '',
    confirm: true,
  })

  useEffect(() => {
    fetchSalons()
  }, [])

  useEffect(() => {
    if (selectedSalon) {
      fetchAppointments()
      fetchSalonServices(selectedSalon)
    }
  }, [selectedSalon, activeTab, dateFilter, startDate, endDate])

  useEffect(() => {
    let interval;
    if (selectedSalon && activeTab === 'live') {
      interval = setInterval(fetchAppointments, 30000)
    }
    return () => clearInterval(interval)
  }, [selectedSalon, activeTab])

  const fetchSalons = async () => {
    try {
      const data = await salonService.getMySalons()
      setSalons(data)
      if (data.length > 0) {
        setSelectedSalon(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching salons:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSalonServices = async (salonId) => {
    try {
      const data = await serviceService.getServicesBySalon(salonId)
      setSalonServices(data)
    } catch (err) {
      console.error('Error fetching services:', err)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = {
        salon: selectedSalon,
      }

      const getFormattedDate = (dateObj) => {
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      if (activeTab === 'live') {
        params.date = getFormattedDate(new Date())
        // Keep it flexible to show all today's bookings in live view, 
        // but often we want only non-finalised ones.
        // The original code filtered by status=BOOKED and confirmed=true.
        // Let's remove status/confirmed to see the full "Today's Queue" but can toggle.
      } else {
        const today = new Date()
        if (dateFilter === 'today') {
          params.date = getFormattedDate(today)
        } else if (dateFilter === '7d') {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(today.getDate() - 7)
          params.start_date = getFormattedDate(sevenDaysAgo)
          params.end_date = getFormattedDate(today)
        } else if (dateFilter === '30d') {
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(today.getDate() - 30)
          params.start_date = getFormattedDate(thirtyDaysAgo)
          params.end_date = getFormattedDate(today)
        } else if (dateFilter === 'custom' && startDate && endDate) {
          params.start_date = startDate
          params.end_date = endDate
        }
      }

      const data = await appointmentService.getVendorAppointments(params)
      setAppointments(data)
    } catch (err) {
      console.error('Error fetching appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setUpdating(appointmentId)
      await appointmentService.updateAppointmentStatus(appointmentId, newStatus)
      fetchAppointments()
    } catch (err) {
      console.error('Error updating appointment:', err)
    } finally {
      setUpdating(null)
    }
  }

  const handleConfirm = async (appointmentId, isUndo = false) => {
    try {
      setUpdating(appointmentId)
      const action = isUndo ? 'undo_check_in' : 'check_in'
      await appointmentService.updateAppointmentStatus(appointmentId, null, action)
      fetchAppointments()
      // Also refresh salons for waiting time
      fetchSalons()
    } catch (err) {
      console.error('Error confirming appointment:', err)
    } finally {
      setUpdating(null)
    }
  }

  const fetchWalkInSlots = async () => {
    if (!selectedSalon || !walkInForm.appointment_date) return
    try {
      setLoadingWalkInSlots(true)
      const duration = salonServices
        .filter(s => walkInForm.service_ids.includes(s.id))
        .reduce((sum, s) => sum + (s.duration || 0), 0)

      const data = await salonService.getSlots(selectedSalon, walkInForm.appointment_date, duration > 0 ? duration : undefined)
      setWalkInSlots(data.slots || [])
    } catch (err) {
      console.error('Error fetching walk-in slots:', err)
    } finally {
      setLoadingWalkInSlots(false)
    }
  }

  useEffect(() => {
    if (showWalkInModal && walkInStep === 2) {
      fetchWalkInSlots()
    }
  }, [walkInStep, walkInForm.appointment_date, showWalkInModal])

  const handleWalkInSubmit = async (e) => {
    e.preventDefault()
    setWalkInError('')
    if (walkInStep === 1) {
      if (walkInForm.service_ids.length === 0) {
        setWalkInError('Please select at least one service')
        return
      }
      setWalkInStep(2)
      return
    }

    if (!walkInForm.slot_start) {
      setWalkInError('Please select a time slot')
      return
    }

    try {
      setUpdating('walkin')
      await appointmentService.createWalkIn({
        salon_id: selectedSalon,
        guest_name: walkInForm.guest_name,
        guest_mobile: walkInForm.guest_mobile,
        service_ids: walkInForm.service_ids,
        appointment_date: walkInForm.appointment_date,
        slot_start: walkInForm.slot_start,
        confirm: walkInForm.confirm
      })

      setShowWalkInModal(false)
      setWalkInStep(1)
      setWalkInError('')
      setWalkInForm({
        guest_name: '',
        guest_mobile: '',
        service_ids: [],
        appointment_date: new Date().toISOString().split('T')[0],
        slot_start: '',
        confirm: true
      })
      fetchAppointments()
      fetchSalons()
    } catch (err) {
      console.error('Error creating walk-in:', err)
      setWalkInError(err.response?.data?.detail || 'Failed to create walk-in')
    } finally {
      setUpdating(null)
    }
  }

  const toggleServiceSelection = (serviceId) => {
    setWalkInForm(prev => {
      const ids = prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId]
      return { ...prev, service_ids: ids }
    })
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
    switch (status) {
      case 'BOOKED': return 'pending'
      case 'COMPLETED': return 'completed'
      case 'CANCELLED': return 'cancelled'
      default: return ''
    }
  }

  const currentSalon = salons.find(s => s.id === selectedSalon)

  if (salons.length === 0 && !loading) {
    return (
      <div className="booking-queue-page">
        <div className="page-header">
          <h1>Booking &amp; Queue Management</h1>
        </div>
        <div className="no-salon empty-state card">
          <p>You need to create a salon first to manage bookings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-queue-page">
      <div className="page-header header-with-action">
        <div>
          <h1>Booking &amp; Queue Management</h1>
          {currentSalon && (
            <p className="wait-time-indicator">
              Estimated Wait: <strong>{currentSalon.waiting_time} mins</strong> • Queue: <strong>{currentSalon.queue_length} people</strong>
            </p>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setShowWalkInModal(true)}>
          + Add Walk-in
        </button>
      </div>

      {salons.length > 1 && (
        <div className="salon-selector">
          <label>Select Salon:</label>
          <select
            value={selectedSalon || ''}
            onChange={(e) => setSelectedSalon(parseInt(e.target.value))}
          >
            {salons.map(salon => (
              <option key={salon.id} value={salon.id}>{salon.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="profile-tabs">
        {VENDOR_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content card">
        {activeTab === 'all' && (
          <div className="filter-controls">
            <div className="date-presets">
              <button
                className={`btn btn-sm ${dateFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDateFilter('all')}
              >
                All
              </button>
              <button
                className={`btn btn-sm ${dateFilter === 'today' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDateFilter('today')}
              >
                Today
              </button>
              <button
                className={`btn btn-sm ${dateFilter === '7d' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDateFilter('7d')}
              >
                Last 7 Days
              </button>
              <button
                className={`btn btn-sm ${dateFilter === '30d' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDateFilter('30d')}
              >
                Last 30 Days
              </button>
              <button
                className={`btn btn-sm ${dateFilter === 'custom' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDateFilter('custom')}
              >
                Custom Range
              </button>
            </div>

            {dateFilter === 'custom' && (
              <div className="custom-range-inputs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-control"
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-control"
                />
              </div>
            )}
          </div>
        )}

        <div className="section-header">
          <h3>{activeTab === 'live' ? "Today's Queue" : 'All Appointments'}</h3>
        </div>

        {loading ? (
          <div className="loading-state">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="empty-state"><p>No appointments found</p></div>
        ) : (
          <div className="queue-table">
            {appointments.map((apt) => (
              <div key={apt.id} className={`queue-row ${apt.checked_in_at ? 'row-checked-in' : ''}`}>
                <div className="apt-info">
                  <strong>{apt.user_name || apt.guest_name || 'Customer'}</strong>
                  {apt.guest_mobile && <span className="apt-mobile">{apt.guest_mobile}</span>}
                  <span className="apt-services">
                    {apt.services_details?.map(s => s.name).join(', ') || 'Service'}
                  </span>
                </div>
                <div className="apt-time">
                  <span>{apt.appointment_date}</span>
                  <span>{formatTime(apt.slot_start)}</span>
                </div>
                <div className="apt-price-col">
                  {apt.coupon_code && parseFloat(apt.discount_amount) > 0 ? (
                    <>
                      <span className="price-discounted">₹{(parseFloat(apt.total_price) - parseFloat(apt.discount_amount)).toFixed(0)}</span>
                      <span className="coupon-tag">{apt.coupon_code}</span>
                    </>
                  ) : apt.total_price ? (
                    <span className="price-normal">₹{apt.total_price}</span>
                  ) : null}
                </div>
                <div className="status-container">
                  {apt.status !== 'BOOKED' && (
                    <span className={`status-badge ${getStatusClass(apt.status)}`}>
                      {apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
                    </span>
                  )}
                  {apt.checked_in_at && apt.status === 'BOOKED' && (
                    <span className="status-badge active">Checked-in</span>
                  )}
                </div>
                {apt.status === 'BOOKED' && (
                  <div className="apt-actions">
                    {!apt.checked_in_at ? (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleConfirm(apt.id)}
                        disabled={updating === apt.id}
                      >
                        {updating === apt.id ? '...' : 'Confirm'}
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusUpdate(apt.id, 'COMPLETED')}
                          disabled={updating === apt.id}
                        >
                          {updating === apt.id ? '...' : 'Done'}
                        </button>
                        <button
                          className="btn btn-outline btn-sm btn-undo"
                          onClick={() => handleConfirm(apt.id, true)}
                          disabled={updating === apt.id}
                        >
                          {updating === apt.id ? '...' : 'Undo'}
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleStatusUpdate(apt.id, 'CANCELLED')}
                      disabled={updating === apt.id}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="modal-overlay" onClick={() => { setShowWalkInModal(false); setWalkInStep(1); setWalkInError(''); }}>
          <div className="modal-content bq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{walkInStep === 1 ? 'Manual Walk-in Booking' : 'Choose a Slot'}</h3>
              <button className="close-btn" onClick={() => { setShowWalkInModal(false); setWalkInStep(1); setWalkInError(''); }}>×</button>
            </div>
            {walkInError && <div className="error-message" style={{ margin: '0 1.5rem' }}>{walkInError}</div>}
            <form onSubmit={handleWalkInSubmit} className="walkin-form">
              {walkInStep === 1 ? (
                <div className="walkin-grid">
                  <div className="walkin-details-col">
                    <div className="form-group">
                      <label>Customer Name</label>
                      <input
                        type="text"
                        value={walkInForm.guest_name}
                        onChange={(e) => setWalkInForm({ ...walkInForm, guest_name: e.target.value })}
                        placeholder="Enter name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input
                        type="tel"
                        value={walkInForm.guest_mobile}
                        onChange={(e) => setWalkInForm({ ...walkInForm, guest_mobile: e.target.value })}
                        placeholder="Enter mobile"
                        required
                      />
                    </div>
                  </div>

                  <div className="walkin-services-col">
                    <div className="form-group">
                      <label>Select Service(s)</label>
                      <div className="service-options walkin-service-options">
                        {salonServices.map(service => (
                          <button
                            key={service.id}
                            type="button"
                            className={`service-btn ${walkInForm.service_ids.includes(service.id) ? 'active' : ''}`}
                            onClick={() => toggleServiceSelection(service.id)}
                          >
                            <span>{service.name}</span>
                            <span>₹{service.price} • {service.duration} min</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="walkin-grid">
                  <div className="walkin-details-col">
                    <div className="form-group">
                      <label>Select Date</label>
                      <input
                        type="date"
                        value={walkInForm.appointment_date}
                        onChange={(e) => setWalkInForm({ ...walkInForm, appointment_date: e.target.value, slot_start: '' })}
                        min={new Date().toISOString().split('T')[0]}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={walkInForm.confirm}
                          onChange={(e) => setWalkInForm({ ...walkInForm, confirm: e.target.checked })}
                        />
                        <span>MARK AS CHECKED-IN IMMEDIATELY</span>
                      </label>
                    </div>
                  </div>

                  <div className="walkin-services-col">
                    <div className="form-group">
                      <label>Available Slots</label>
                      {loadingWalkInSlots ? (
                        <div className="hint">Loading available slots...</div>
                      ) : walkInSlots.length === 0 ? (
                        <div className="hint text-error">No slots available for this date</div>
                      ) : (
                        <div className="slot-grid walkin-slot-grid">
                          {walkInSlots.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              className={`slot-btn ${walkInForm.slot_start === slot ? 'active' : ''}`}
                              onClick={() => setWalkInForm({ ...walkInForm, slot_start: slot })}
                            >
                              {formatTime(slot)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-actions horizontal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    if (walkInStep === 1) setShowWalkInModal(false)
                    else setWalkInStep(1)
                  }}
                >
                  {walkInStep === 1 ? 'Cancel' : 'Back'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating === 'walkin' || walkInForm.service_ids.length === 0}
                >
                  {updating === 'walkin'
                    ? 'Processing...'
                    : walkInStep === 1 ? 'Choose Slot' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingQueue
