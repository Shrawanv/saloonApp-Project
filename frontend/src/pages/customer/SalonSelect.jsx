import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { salonService } from '../../services'
import './SalonSelect.css'

function SalonSelect() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSalons()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        fetchSalons(search)
      } else {
        fetchSalons()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const fetchSalons = async (searchQuery = '') => {
    try {
      setLoading(true)
      setError('')
      const data = searchQuery 
        ? await salonService.searchSalons(searchQuery)
        : await salonService.getSalons()
      setSalons(data)
    } catch (err) {
      console.error('Error fetching salons:', err)
      setError('Failed to load salons. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isSalonOpen = (salon) => {
    if (!salon.is_active) return false
    
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    
    return currentTime >= salon.opening_time?.slice(0, 5) && 
           currentTime <= salon.closing_time?.slice(0, 5)
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Find a Salon</h1>
        <p>Scan QR or search for your salon</p>
      </div>

      <div className="salon-select-actions">
        <button className="qr-btn card" onClick={() => setShowQR(!showQR)}>
          <span className="qr-icon">📱</span>
          <span>Scan QR Code</span>
        </button>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search salon name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {showQR && (
        <div className="qr-scanner-placeholder card">
          <div className="qr-placeholder">QR Scanner (camera access required)</div>
        </div>
      )}

      <div className="salon-list">
        <h3>Available Salons</h3>
        
        {loading && <div className="loading-state">Loading salons...</div>}
        
        {error && <div className="error-state">{error}</div>}
        
        {!loading && !error && salons.length === 0 && (
          <div className="empty-state">
            {search ? `No salons found for "${search}"` : 'No salons available'}
          </div>
        )}

        {!loading && salons.map((salon) => {
          const isOpen = isSalonOpen(salon)
          return (
            <div
              key={salon.id}
              className="salon-card card"
              onClick={() => navigate(`/customer/dashboard/${salon.id}`)}
            >
              <div className="salon-avatar">✂️</div>
              <div className="salon-info">
                <h4>{salon.name}</h4>
                <p className="salon-address">Pincode: {salon.pincode}</p>
                <div className="salon-meta">
                  <span className="services-count">
                    {salon.services_count || 0} services
                  </span>
                  <span className={`status ${isOpen ? 'open' : 'closed'}`}>
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                  {isOpen && salon.queue_length > 0 && (
                    <span className="queue">Queue: {salon.queue_length}</span>
                  )}
                </div>
              </div>
              <span className="arrow">→</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SalonSelect
