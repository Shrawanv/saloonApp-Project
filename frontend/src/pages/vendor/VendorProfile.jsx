import { useState, useEffect } from 'react'
import { salonService, serviceService } from '../../services'
import './VendorProfile.css'

const PROFILE_TABS = [
  { id: 'salon', label: 'My Salon' },
  { id: 'services', label: 'Services & Pricing' },
]

function VendorProfile() {
  const [activeTab, setActiveTab] = useState('salon')
  const [salons, setSalons] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [salonForm, setSalonForm] = useState({
    name: '',
    mobile: '',
    pincode: '',
    opening_time: '09:00',
    closing_time: '20:00',
    break_start_time: '',
    break_end_time: '',
    slot_duration: 30,
    max_capacity_per_slot: 1,
  })

  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: '',
    duration: 30,
  })
  const [editingService, setEditingService] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [salonsData, servicesData] = await Promise.all([
        salonService.getMySalons(),
        serviceService.getMyServices()
      ])
      
      setSalons(salonsData)
      setServices(servicesData)
      
      if (salonsData.length > 0) {
        const salon = salonsData[0]
        setSalonForm({
          name: salon.name || '',
          mobile: salon.mobile || '',
          pincode: salon.pincode || '',
          opening_time: salon.opening_time?.slice(0, 5) || '09:00',
          closing_time: salon.closing_time?.slice(0, 5) || '20:00',
          break_start_time: salon.break_start_time?.slice(0, 5) || '',
          break_end_time: salon.break_end_time?.slice(0, 5) || '',
          slot_duration: salon.slot_duration || 30,
          max_capacity_per_slot: salon.max_capacity_per_slot || 1,
        })
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSalonSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      if (salons.length > 0) {
        await salonService.updateSalon(salons[0].id, salonForm)
        setSuccess('Salon updated successfully!')
      } else {
        await salonService.createSalon(salonForm)
        setSuccess('Salon created successfully!')
      }
      fetchData()
    } catch (err) {
      console.error('Error saving salon:', err)
      setError(err.response?.data?.detail || 'Failed to save salon')
    } finally {
      setSaving(false)
    }
  }

  const handleServiceSubmit = async (e) => {
    e.preventDefault()
    if (salons.length === 0) {
      setError('Please create a salon first')
      return
    }
    
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const baseData = {
        name: serviceForm.name,
        price: parseFloat(serviceForm.price),
        duration: parseInt(serviceForm.duration),
      }

      if (editingService) {
        await serviceService.updateService(editingService.id, baseData)
        setSuccess('Service updated successfully!')
      } else {
        await serviceService.createService({
          ...baseData,
          salon_id: salons[0].id,
        })
        setSuccess('Service created successfully!')
      }
      
      setServiceForm({ name: '', price: '', duration: 30 })
      setEditingService(null)
      fetchData()
    } catch (err) {
      console.error('Error saving service:', err)
      setError(err.response?.data?.detail || 'Failed to save service')
    } finally {
      setSaving(false)
    }
  }

  const handleEditService = (service) => {
    setEditingService(service)
    setServiceForm({
      name: service.name,
      price: service.price,
      duration: service.duration,
    })
  }

  const handleDeleteService = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    
    try {
      await serviceService.deleteService(id)
      setSuccess('Service deleted successfully!')
      fetchData()
    } catch (err) {
      console.error('Error deleting service:', err)
      setError('Failed to delete service')
    }
  }

  const handleToggleService = async (id) => {
    try {
      await serviceService.toggleService(id)
      fetchData()
    } catch (err) {
      console.error('Error toggling service:', err)
    }
  }

  if (loading) {
    return (
      <div className="vendor-profile-page">
        <h1>My Profile</h1>
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="vendor-profile-page">
      <h1>My Profile</h1>

      <div className="vendor-tabs profile-tabs">
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`vendor-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="tab-content card">
        {activeTab === 'salon' && (
          <form onSubmit={handleSalonSubmit} className="salon-form">
            <h3>{salons.length > 0 ? 'Edit Salon' : 'Create Salon'}</h3>
            
            <div className="form-group">
              <label>Salon Name</label>
              <input
                type="text"
                value={salonForm.name}
                onChange={(e) => setSalonForm({...salonForm, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Mobile</label>
                <input
                  type="tel"
                  value={salonForm.mobile}
                  onChange={(e) => setSalonForm({...salonForm, mobile: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={salonForm.pincode}
                  onChange={(e) => setSalonForm({...salonForm, pincode: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Opening Time</label>
                <input
                  type="time"
                  value={salonForm.opening_time}
                  onChange={(e) => setSalonForm({...salonForm, opening_time: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Closing Time</label>
                <input
                  type="time"
                  value={salonForm.closing_time}
                  onChange={(e) => setSalonForm({...salonForm, closing_time: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Break Start (optional)</label>
                <input
                  type="time"
                  value={salonForm.break_start_time}
                  onChange={(e) => setSalonForm({...salonForm, break_start_time: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Break End (optional)</label>
                <input
                  type="time"
                  value={salonForm.break_end_time}
                  onChange={(e) => setSalonForm({...salonForm, break_end_time: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Slot Duration (minutes)</label>
                <input
                  type="number"
                  value={salonForm.slot_duration}
                  onChange={(e) => setSalonForm({...salonForm, slot_duration: parseInt(e.target.value)})}
                  min="15"
                  max="120"
                  required
                />
              </div>
              <div className="form-group">
                <label>Max Capacity per Slot</label>
                <input
                  type="number"
                  value={salonForm.max_capacity_per_slot}
                  onChange={(e) => setSalonForm({...salonForm, max_capacity_per_slot: parseInt(e.target.value)})}
                  min="1"
                  max="10"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (salons.length > 0 ? 'Update Salon' : 'Create Salon')}
            </button>
          </form>
        )}

        {activeTab === 'services' && (
          <div className="services-management">
            <form onSubmit={handleServiceSubmit} className="service-form">
              <h3>{editingService ? 'Edit Service' : 'Add Service'}</h3>
              
              {salons.length === 0 && (
                <p className="warning">Please create a salon first before adding services.</p>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Service Name</label>
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                    required
                    disabled={salons.length === 0}
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                    min="0"
                    required
                    disabled={salons.length === 0}
                  />
                </div>
                <div className="form-group">
                  <label>Duration (min)</label>
                  <input
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({...serviceForm, duration: e.target.value})}
                    min="5"
                    required
                    disabled={salons.length === 0}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving || salons.length === 0}>
                  {saving ? 'Saving...' : (editingService ? 'Update' : 'Add Service')}
                </button>
                {editingService && (
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => {
                      setEditingService(null)
                      setServiceForm({ name: '', price: '', duration: 30 })
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="services-list">
              <h3>Current Services</h3>
              {services.length === 0 ? (
                <p className="empty">No services added yet</p>
              ) : (
                <table className="services-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Price</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service.id} className={!service.is_active ? 'inactive' : ''}>
                        <td>{service.name}</td>
                        <td>₹{service.price}</td>
                        <td>{service.duration} min</td>
                        <td>
                          <span className={`status ${service.is_active ? 'active' : 'inactive'}`}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="actions">
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleEditService(service)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleToggleService(service.id)}
                          >
                            {service.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button 
                            className="btn btn-sm btn-outline danger"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VendorProfile
