import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { salonService, serviceService, authService, mediaService } from '../../services'
import MediaUploader from '../../components/MediaUploader'
import ImageCropperModal from '../../components/ImageCropperModal'
import './VendorProfile.css'

const PROFILE_TABS = [
  { id: 'salon', label: 'My Salon' },
  { id: 'services', label: 'Services & Pricing' },
]

function formatTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function VendorProfile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('salon')
  const [salons, setSalons] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Logo upload
  const [selectedLogo, setSelectedLogo] = useState(null)
  const [showLogoCropper, setShowLogoCropper] = useState(false)

  const [isEditingSalon, setIsEditingSalon] = useState(false)
  const [salonForm, setSalonForm] = useState({
    name: '',
    mobile: '',
    pincode: '',
    opening_time: '09:00',
    closing_time: '20:00',
    break_start_time: '',
    break_end_time: '',
    max_capacity_per_slot: 1,
  })

  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: '',
    duration: 30,
  })
  const [editingService, setEditingService] = useState(null)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [updatingPassword, setUpdatingPassword] = useState(false)

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

  const getLogoUrl = () => {
    if (salon?.logo) {
      if (salon.logo.startsWith('http')) return salon.logo
      const base = 'http://localhost:8000'
      return `${base}${salon.logo.startsWith('/') ? '' : '/'}${salon.logo}`
    }
    return null
  }

  const handleLogoSelect = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedLogo(reader.result)
      setShowLogoCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handleLogoCropComplete = async (croppedBlob) => {
    setShowLogoCropper(false)
    if (!salon) return
    try {
      const file = new File([croppedBlob], 'salon-logo.jpg', { type: 'image/jpeg' })
      await mediaService.uploadSalonLogo(salon.id, file)
      setSuccess('Salon logo updated!')
      fetchData()
    } catch (err) {
      console.error('Logo upload error:', err)
      setError('Failed to upload salon logo')
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
      setIsEditingSalon(false)
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
        await serviceService.createService({ ...baseData, salon_id: salons[0].id })
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
    setServiceForm({ name: service.name, price: service.price, duration: service.duration })
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

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match!')
      return
    }
    setUpdatingPassword(true)
    try {
      await authService.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      })
      setSuccess('Password updated successfully!')
      setShowPasswordModal(false)
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      const msg = err.response?.data?.old_password?.[0] || err.response?.data?.detail || 'Failed to update password.'
      setError(msg)
    } finally {
      setUpdatingPassword(false)
    }
  }

  const salon = salons[0] || null

  if (loading) {
    return (
      <div className="vendor-profile-page">
        <div className="vp-loading">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="vendor-profile-page">

      {/* Vendor Header */}
      <div className="vp-header card">
        <div className="vp-logo-container">
          {getLogoUrl() ? (
            <img src={getLogoUrl()} alt="Salon logo" className="vp-logo-img" />
          ) : (
            <div className="vp-logo-placeholder">🏪</div>
          )}
          {salon && (
            <MediaUploader
              onUpload={handleLogoSelect}
              label="Change Photo"
              className="vp-logo-uploader"
            />
          )}
        </div>
        {salon ? (
          <>
            <h2 className="vp-name">{salon.name}</h2>
            <p className="vp-username">@{user?.username}</p>
          </>
        ) : (
          <>
            <h2 className="vp-name">{user?.first_name || user?.username}{user?.last_name ? ` ${user.last_name}` : ''}</h2>
            <p className="vp-username">@{user?.username}</p>
          </>
        )}
        <button
          className="btn btn-ghost btn-sm vp-password-btn"
          onClick={() => setShowPasswordModal(true)}
        >
          Update Password
        </button>
      </div>

      {/* Tabs */}
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

      {showLogoCropper && (
        <ImageCropperModal
          image={selectedLogo}
          onCropComplete={handleLogoCropComplete}
          onCancel={() => setShowLogoCropper(false)}
        />
      )}

      <div className="tab-content card">

        {/* MY SALON TAB */}
        {activeTab === 'salon' && (
          <div className="salon-section">
            <div className="vp-section-header">
              <h3>{salon ? 'Salon Info' : 'Create Your Salon'}</h3>
              {salon && !isEditingSalon && (
                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingSalon(true)}>
                  Edit Salon
                </button>
              )}
            </div>

            {isEditingSalon || !salon ? (
              <form onSubmit={handleSalonSubmit} className="vp-edit-form">
                <div className="form-group">
                  <label>Salon Name</label>
                  <input
                    type="text"
                    value={salonForm.name}
                    onChange={(e) => setSalonForm({ ...salonForm, name: e.target.value })}
                    placeholder="e.g. Glamour Studio"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mobile</label>
                    <input
                      type="tel"
                      value={salonForm.mobile}
                      onChange={(e) => setSalonForm({ ...salonForm, mobile: e.target.value })}
                      placeholder="10-digit number"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={salonForm.pincode}
                      onChange={(e) => setSalonForm({ ...salonForm, pincode: e.target.value })}
                      placeholder="Area pincode"
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
                      onChange={(e) => setSalonForm({ ...salonForm, opening_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Closing Time</label>
                    <input
                      type="time"
                      value={salonForm.closing_time}
                      onChange={(e) => setSalonForm({ ...salonForm, closing_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Break Start <span className="optional">(optional)</span></label>
                    <input
                      type="time"
                      value={salonForm.break_start_time}
                      onChange={(e) => setSalonForm({ ...salonForm, break_start_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Break End <span className="optional">(optional)</span></label>
                    <input
                      type="time"
                      value={salonForm.break_end_time}
                      onChange={(e) => setSalonForm({ ...salonForm, break_end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Max Customers per Slot</label>
                  <input
                    type="number"
                    value={salonForm.max_capacity_per_slot}
                    onChange={(e) => setSalonForm({ ...salonForm, max_capacity_per_slot: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                    required
                  />
                </div>

                <div className="vp-form-actions">
                  {salon && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setIsEditingSalon(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : (salon ? 'Save Changes' : 'Create Salon')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="salon-details-grid">
                <div className="salon-detail-item">
                  <span className="label">Salon Name</span>
                  <span className="value">{salon.name}</span>
                </div>
                <div className="salon-detail-item">
                  <span className="label">Mobile</span>
                  <span className="value">{salon.mobile}</span>
                </div>
                <div className="salon-detail-item">
                  <span className="label">Pincode</span>
                  <span className="value">{salon.pincode}</span>
                </div>
                <div className="salon-detail-item">
                  <span className="label">Working Hours</span>
                  <span className="value">{formatTime(salon.opening_time)} — {formatTime(salon.closing_time)}</span>
                </div>
                <div className="salon-detail-item">
                  <span className="label">Break Time</span>
                  <span className="value">
                    {salon.break_start_time
                      ? `${formatTime(salon.break_start_time)} — ${formatTime(salon.break_end_time)}`
                      : 'No break'}
                  </span>
                </div>
                <div className="salon-detail-item">
                  <span className="label">Max per Slot</span>
                  <span className="value">{salon.max_capacity_per_slot} customer{salon.max_capacity_per_slot !== 1 ? 's' : ''}</span>
                </div>
                <div className="salon-detail-item">
                  <span className="label">Status</span>
                  <span className={`vp-status-badge ${salon.is_active ? 'active' : 'inactive'}`}>
                    {salon.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="salon-detail-item">
                  <span className="label">Services</span>
                  <span className="value">{salon.services_count} active</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="services-management">

            {/* Add / Edit form */}
            <div className="vp-section-header">
              <h3>{editingService ? 'Edit Service' : 'Add Service'}</h3>
              {editingService && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setEditingService(null); setServiceForm({ name: '', price: '', duration: 30 }) }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {salons.length === 0 && (
              <div className="vp-warning">
                Please create your salon first before adding services.
              </div>
            )}

            <form onSubmit={handleServiceSubmit} className="vp-edit-form vp-service-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Service Name</label>
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="e.g. Haircut"
                    required
                    disabled={salons.length === 0}
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 300"
                    required
                    disabled={salons.length === 0}
                  />
                </div>
                <div className="form-group">
                  <label>Duration (min)</label>
                  <input
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    min="5"
                    placeholder="e.g. 30"
                    required
                    disabled={salons.length === 0}
                  />
                </div>
              </div>
              <div className="vp-form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving || salons.length === 0}>
                  {saving ? 'Saving...' : (editingService ? 'Update Service' : 'Add Service')}
                </button>
              </div>
            </form>

            {/* Services list */}
            <div className="services-list">
              <div className="vp-section-header">
                <h3>Your Services <span className="vp-count">{services.length}</span></h3>
              </div>

              {services.length === 0 ? (
                <div className="vp-empty-state">
                  <p>✂️ No services yet. Add your first service above!</p>
                </div>
              ) : (
                <div className="service-cards">
                  {services.map((service) => (
                    <div key={service.id} className={`service-card ${!service.is_active ? 'service-card--inactive' : ''}`}>
                      <div className="service-card-info">
                        <span className="service-card-name">{service.name}</span>
                        <div className="service-card-meta">
                          <span className="service-price">₹{parseFloat(service.price).toFixed(0)}</span>
                          <span className="service-dot">·</span>
                          <span className="service-duration">{service.duration} min</span>
                        </div>
                      </div>
                      <div className="service-card-right">
                        <span className={`vp-status-badge ${service.is_active ? 'active' : 'inactive'}`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <div className="service-card-actions">
                          <button className="btn btn-sm btn-outline" onClick={() => handleEditService(service)}>Edit</button>
                          <button className="btn btn-sm btn-outline" onClick={() => handleToggleService(service.id)}>
                            {service.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn btn-sm btn-outline danger" onClick={() => handleDeleteService(service.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Update Password</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={updatingPassword}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingPassword}>
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorProfile
