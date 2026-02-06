import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { salonService, appointmentService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import './BookSlot.css'

function BookSlot({ salonId, services = [], salon }) {
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

  const today = new Date().toISOString().split('T')[0]

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
        service_ids: selectedServices.map(s => s.id)
      })

      setSuccess('Booking confirmed successfully!')
      setSelectedServices([])
      setSelectedDate('')
      setSelectedSlot('')
      
      setTimeout(() => {
        navigate('/customer/appointments')
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

  return (
    <div className="book-slot card">
      <h3>Book a Slot</h3>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="form-section">
        <label>Select Service(s)</label>
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
                <span>{s.name}</span>
                <span>₹{s.price} • {s.duration} min</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedServices.length > 0 && (
        <div className="selection-summary">
          <p>Selected: {selectedServices.length} service(s)</p>
          <p>Total: ₹{totalPrice} • {totalDuration} min</p>
        </div>
      )}

      <div className="form-section">
        <label>Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value)
            setSelectedSlot('')
          }}
          min={today}
        />
      </div>

      <div className="form-section">
        <label>Available Slots</label>
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

      <button 
        className="btn btn-primary btn-block"
        onClick={handleBooking}
        disabled={booking || selectedServices.length === 0 || !selectedDate || !selectedSlot}
      >
        {booking ? 'Booking...' : 'Confirm Booking'}
      </button>
    </div>
  )
}

export default BookSlot
