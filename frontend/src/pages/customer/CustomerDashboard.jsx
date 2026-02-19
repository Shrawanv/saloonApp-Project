import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { salonService, serviceService, appointmentService } from '../../services'
import './CustomerDashboard.css'

import SalonProfile from '../../components/customer/SalonProfile'
import LiveQueue from '../../components/customer/LiveQueue'
import BookSlot from '../../components/customer/BookSlot'
import PriceList from '../../components/customer/PriceList'
import FeedbackSection from '../../components/customer/FeedbackSection'

const TABS = [
  { id: 'profile', label: 'Profile', icon: '🏪' },
  { id: 'queue', label: 'Live Queue', icon: '📋' },
  { id: 'book', label: 'Book Slot', icon: '📅' },
  { id: 'prices', label: 'Price List', icon: '💰' },
  { id: 'feedback', label: 'Feedback', icon: '💬' },
]

function CustomerDashboard() {
  const { salonId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkInStatus, setCheckInStatus] = useState({ success: false, message: '' })

  useEffect(() => {
    fetchSalonData()
    handleCheckInFromURL()
  }, [salonId])

  const handleCheckInFromURL = async () => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkin') === 'true') {
      setActiveTab('queue')
      // Auto-checkin if logged in
      const user = localStorage.getItem('user')
      if (user) {
        try {
          const res = await appointmentService.checkIn({ salon_id: salonId })
          setCheckInStatus({ success: true, message: 'Check-in successful! Welcome to ' + (salon?.name || 'the salon') })
        } catch (err) {
          setCheckInStatus({ success: false, message: err.response?.data?.detail || 'Check-in failed. Please try again.' })
        }
      }
    }
  }

  const fetchSalonData = async () => {
    try {
      setLoading(true)
      setError('')

      const [salonData, servicesData] = await Promise.all([
        salonService.getSalonById(salonId),
        serviceService.getServicesBySalon(salonId)
      ])

      setSalon(salonData)
      setServices(servicesData)
    } catch (err) {
      console.error('Error fetching salon data:', err)
      setError('Failed to load salon. Please try again.')
    } finally {
      setLoading(false)
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

  const renderTabContent = () => {
    if (loading) return <div className="loading-state">Loading...</div>
    if (error) return <div className="error-state">{error}</div>

    switch (activeTab) {
      case 'profile':
        return <SalonProfile salon={salon} />
      case 'queue':
        return <LiveQueue salonId={salonId} onTabChange={setActiveTab} />
      case 'book':
        return <BookSlot salonId={salonId} services={services} salon={salon} onBookingSuccess={setActiveTab} />
      case 'prices':
        return <PriceList services={services} />
      case 'feedback':
        return <FeedbackSection salonId={salonId} />
      default:
        return <SalonProfile salon={salon} />
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-state">Loading salon...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-state">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/customer/select-salon')}>
          Back to Salons
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>{salon?.name || 'Salon'}</h1>
        <p>
          Pincode: {salon?.pincode} •
          Open: {formatTime(salon?.opening_time)} - {formatTime(salon?.closing_time)}
        </p>
        {checkInStatus.message && (
          <div className={`checkin-banner ${checkInStatus.success ? 'success' : 'error'}`}>
            {checkInStatus.message}
            <button onClick={() => setCheckInStatus({ success: false, message: '' })}>✕</button>
          </div>
        )}
      </div>

      <div className="dashboard-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">{renderTabContent()}</div>
    </div>
  )
}

export default CustomerDashboard
