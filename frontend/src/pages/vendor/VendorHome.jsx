import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { salonService, appointmentService } from '../../services'
import './VendorHome.css'

function VendorHome() {
  const { user } = useAuth()
  const [salons, setSalons] = useState([])
  const [todayAppointments, setTodayAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      const [salonsData, appointmentsData] = await Promise.all([
        salonService.getMySalons(),
        appointmentService.getVendorAppointments({
          date: (() => {
            const now = new Date()
            const y = now.getFullYear()
            const m = String(now.getMonth() + 1).padStart(2, '0')
            const d = String(now.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}`
          })()
        })
      ])

      setSalons(salonsData)
      setTodayAppointments(appointmentsData)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const queueLength = todayAppointments.filter(a => a.status === 'BOOKED').length
  const completedToday = todayAppointments.filter(a => a.status === 'COMPLETED').length
  const cancelledToday = todayAppointments.filter(a => a.status === 'CANCELLED').length
  const totalBookings = todayAppointments.length

  if (loading) {
    return (
      <div className="vendor-home">
        <div className="loading-state">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="vendor-home">
      <div className="page-header">
        <h1>Welcome back, {user?.first_name || user?.username || 'Owner'}</h1>
        <p>{salons.length > 0 ? salons[0].name : 'No salon registered yet'}</p>
      </div>

      {error && <div className="error-state">{error}</div>}

      {salons.length === 0 ? (
        <div className="no-salon-state card">
          <h3>No Salon Registered</h3>
          <p>You need to create a salon first to manage bookings.</p>
          <Link to="/vendor/profile" className="btn btn-primary">
            Create Salon
          </Link>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card card">
              <h4>Queue Length</h4>
              <p className="stat-value">{queueLength}</p>
            </div>
            <div className="stat-card card">
              <h4>Completed Today</h4>
              <p className="stat-value">{completedToday}</p>
            </div>
            <div className="stat-card card">
              <h4>Cancelled Today</h4>
              <p className="stat-value">{cancelledToday}</p>
            </div>
            <div className="stat-card card">
              <h4>Total Bookings</h4>
              <p className="stat-value">{totalBookings}</p>
            </div>
          </div>

          <div className="quick-actions card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <Link to="/vendor/booking-queue" className="btn btn-primary">
                Manage Queue
              </Link>
              <Link to="/vendor/profile" className="btn btn-outline">
                Edit Salon
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default VendorHome
