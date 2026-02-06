import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { salonService, serviceService } from '../../services'
import './CustomerDashboard.css'

import SalonProfile from '../../components/customer/SalonProfile'
import LiveQueue from '../../components/customer/LiveQueue'
import BookSlot from '../../components/customer/BookSlot'
import PriceList from '../../components/customer/PriceList'
import RatingSection from '../../components/customer/RatingSection'
import FeedbackSection from '../../components/customer/FeedbackSection'

const TABS = [
  { id: 'profile', label: 'Profile', icon: '🏪' },
  { id: 'queue', label: 'Live Queue', icon: '📋' },
  { id: 'book', label: 'Book Slot', icon: '📅' },
  { id: 'prices', label: 'Price List', icon: '💰' },
  { id: 'rating', label: 'Rating', icon: '⭐' },
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

  useEffect(() => {
    fetchSalonData()
  }, [salonId])

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
        return <LiveQueue salonId={salonId} />
      case 'book':
        return <BookSlot salonId={salonId} services={services} salon={salon} />
      case 'prices':
        return <PriceList services={services} />
      case 'rating':
        return <RatingSection salonId={salonId} />
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
