import { useState, useEffect } from 'react'
import { salonService, appointmentService } from '../../services'
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

  useEffect(() => {
    fetchSalons()
  }, [])

  useEffect(() => {
    if (selectedSalon) {
      fetchAppointments()
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
        params.status = 'BOOKED'
        params.confirmed = 'true'
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
      alert('Failed to update appointment status')
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
    } catch (err) {
      console.error('Error confirming appointment:', err)
      alert('Failed to update confirmation status')
    } finally {
      setUpdating(null)
    }
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BOOKED': return 'badge-pending'
      case 'COMPLETED': return 'badge-completed'
      case 'CANCELLED': return 'badge-cancelled'
      default: return ''
    }
  }

  if (salons.length === 0 && !loading) {
    return (
      <div className="booking-queue-page">
        <h1>Booking & Queue Management</h1>
        <div className="no-salon card">
          <p>You need to create a salon first to manage bookings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-queue-page">
      <h1>Booking & Queue Management</h1>

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

      <div className="vendor-tabs">
        {VENDOR_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`vendor-tab ${activeTab === tab.id ? 'active' : ''}`}
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

        <h3>{activeTab === 'live' ? "Today's Queue" : 'All Appointments'}</h3>

        {loading ? (
          <p className="loading">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="empty">No appointments found</p>
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
                <div className="status-container">
                  {apt.status !== 'BOOKED' && (
                    <span className={`status-badge ${getStatusBadge(apt.status)}`}>
                      {apt.status}
                    </span>
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
    </div>
  )
}

export default BookingQueue
