import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { salonService, appointmentService, customerService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import './BookSlot.css'

function BookSlot({ salonId, services = [], salon, onBookingSuccess }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Coupon states
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const today = (() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })()

  useEffect(() => {
    if (selectedDate) {
      fetchSlots()
    }
  }, [selectedDate])

  const fetchSlots = async () => {
    try {
      setLoadingSlots(true)
      setError('')
      const duration = selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0)
      const data = await salonService.getSlots(salonId, selectedDate, duration > 0 ? duration : undefined)
      setSlots(data.slots || [])
    } catch (err) {
      console.error('Error fetching slots:', err)
      setError('Failed to load available slots')
    } finally {
      setLoadingSlots(false)
    }
  }

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id)
      if (exists) {
        return prev.filter(s => s.id !== service.id)
      }
      return [...prev, service]
    })
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return
    try {
      setCouponLoading(true)
      setCouponError('')
      const data = await customerService.validateCoupon(salonId, couponCode)
      setAppliedCoupon(data)
      setCouponCode('')
    } catch (err) {
      setCouponError(err.response?.data?.detail || 'Invalid coupon code')
      setAppliedCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  const handleBooking = async () => {
    if (!isAuthenticated()) {
      navigate('/login')
      return
    }

    if (selectedServices.length === 0) {
      setError('Please select at least one service')
      return
    }
    if (!selectedDate) {
      setError('Please select a date')
      return
    }
    if (!selectedSlot) {
      setError('Please select a time slot')
      return
    }

    try {
      setBooking(true)
      setError('')

      await appointmentService.createAppointment({
        salon_id: parseInt(salonId),
        appointment_date: selectedDate,
        slot_start: selectedSlot,
        service_ids: selectedServices.map(s => s.id),
        coupon_code: appliedCoupon ? appliedCoupon.code : null
      })

      setSuccess('Booking confirmed successfully!')
      setSelectedServices([])
      setSelectedDate('')
      setSelectedSlot('')

      setTimeout(() => {
        if (onBookingSuccess) {
          onBookingSuccess('queue')
        } else {
          navigate('/customer/appointments')
        }
      }, 2000)
    } catch (err) {
      console.error('Error creating booking:', err)
      setError(err.response?.data?.detail || 'Failed to create booking. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  const formatSlotTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.price), 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)

  const discountAmount = appliedCoupon
    ? (appliedCoupon.discount_type === 'PERCENT'
      ? (totalPrice * appliedCoupon.discount_value / 100)
      : Number(appliedCoupon.discount_value))
    : 0
  const payableAmount = Math.max(totalPrice - discountAmount, 0)

  return (
    <div className="book-slot-layout">
      {/* ─── LEFT: Booking Form ─── */}
      <div className="book-slot-form card">
        <h3>Book a Slot</h3>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-section">
          <label className="label">Select Service(s)</label>
          {services.length === 0 ? (
            <p className="no-services">No services available</p>
          ) : (
            <div className="service-options">
              {services.filter(s => s.is_active).map((s) => (
                <button
                  key={s.id}
                  className={`service-btn ${selectedServices.find(ss => ss.id === s.id) ? 'active' : ''}`}
                  onClick={() => toggleService(s)}
                >
                  <div className="service-info">
                    <span className="service-name">{s.name}</span>
                    <span className="service-meta">₹{s.price} • {s.duration} min</span>
                  </div>
                  {selectedServices.find(ss => ss.id === s.id) && <span className="check-icon">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="form-section">
          <label className="label">Select Date</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setSelectedSlot('')
            }}
            min={today}
          />
        </div>

        <div className="form-section">
          <label className="label">Available Slots</label>
          {!selectedDate ? (
            <p className="hint">Please select a date first</p>
          ) : loadingSlots ? (
            <p className="hint">Loading slots...</p>
          ) : slots.length === 0 ? (
            <p className="hint">No slots available for this date</p>
          ) : (
            <div className="slot-grid">
              {slots.map((slot) => (
                <button
                  key={slot}
                  className={`slot-btn ${selectedSlot === slot ? 'active' : ''}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {formatSlotTime(slot)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Order Summary ─── */}
      <div className="book-slot-sidebar">
        <div className="order-summary card">
          <h3>Order Summary</h3>

          {selectedServices.length === 0 ? (
            <div className="empty-state">
              <p>Select services to see your summary</p>
            </div>
          ) : (
            <>
              <div className="summary-items">
                {selectedServices.map(s => (
                  <div key={s.id} className="summary-item">
                    <span>{s.name}</span>
                    <span>₹{s.price}</span>
                  </div>
                ))}
              </div>

              <div className="summary-divider" />

              <div className="summary-row">
                <span>Subtotal ({selectedServices.length} items)</span>
                <span>₹{totalPrice}</span>
              </div>

              <div className="summary-row">
                <span>Duration</span>
                <span>{totalDuration} min</span>
              </div>

              {appliedCoupon && (
                <div className="summary-row discount">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>− ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="summary-divider" />

              <div className="summary-row total">
                <span>Total</span>
                <span>₹{payableAmount.toFixed(2)}</span>
              </div>
            </>
          )}

          {/* Coupon Input */}
          <div className="coupon-section">
            <label className="label">Have a Coupon?</label>
            {appliedCoupon ? (
              <div className="applied-coupon-box">
                <div className="coupon-info">
                  <span className="coupon-badge">{appliedCoupon.code}</span>
                  <span className="coupon-summary">{appliedCoupon.title}</span>
                </div>
                <button className="remove-coupon-btn" onClick={handleRemoveCoupon}>✕</button>
              </div>
            ) : (
              <div className="coupon-input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="ENTER CODE"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode || couponLoading}
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            )}
            {couponError && <p className="error-hint">{couponError}</p>}
          </div>

          {/* Confirm Button */}
          <button
            className="btn btn-primary btn-block"
            onClick={handleBooking}
            disabled={booking || selectedServices.length === 0 || !selectedDate || !selectedSlot}
          >
            {booking ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookSlot
