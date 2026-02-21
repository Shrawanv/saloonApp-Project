import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { mediaService, salonService } from '../../services'
import MediaUploader from '../../components/MediaUploader'
import './GalleryBranding.css'

const GalleryBranding = () => {
  const { user } = useAuth()
  const [salon, setSalon] = useState(null)
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [gallerySuccess, setGallerySuccess] = useState('')
  const [galleryError, setGalleryError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchSalonData()
  }, [])

  const fetchSalonData = async () => {
    try {
      setLoading(true)
      // Assuming vendor has at least one salon, we take the first one for now
      const salons = await salonService.getMySalons()
      if (salons && salons.length > 0) {
        const salonData = salons[0]
        setSalon(salonData)

        // Fetch gallery
        const galleryData = await mediaService.getSalonGalleryMedia(salonData.id)
        setGallery(galleryData)
      }
    } catch (err) {
      console.error('Error fetching salon data:', err)
      setError('Failed to load salon data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (file) => {
    try {
      const updatedSalon = await mediaService.uploadSalonLogo(salon.id, file)
      setSalon(updatedSalon)
      setGallerySuccess('Logo updated successfully!')
      setGalleryError('')
      setTimeout(() => setGallerySuccess(''), 5000)
    } catch (err) {
      console.error('Error uploading logo:', err)
      setGalleryError('Failed to upload logo')
      setGallerySuccess('')
    }
  }

  const handleGalleryUpload = async (file) => {
    try {
      const mediaType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'
      const newMedia = await mediaService.uploadSalonGalleryMedia(salon.id, file, mediaType)
      setGallery([newMedia, ...gallery])
      setGallerySuccess('Media uploaded successfully!')
      setGalleryError('')
      setTimeout(() => setGallerySuccess(''), 5000)
    } catch (err) {
      console.error('Error uploading media:', err)
      setGalleryError('Failed to upload media')
      setGallerySuccess('')
    }
  }

  const handleDeleteMedia = async (mediaId) => {
    try {
      await mediaService.deleteGalleryMedia(mediaId)
      setGallery(gallery.filter(m => m.id !== mediaId))
      setGallerySuccess('Media deleted.')
      setGalleryError('')
      setShowDeleteConfirm(null)
      setTimeout(() => setGallerySuccess(''), 5000)
    } catch (err) {
      console.error('Error deleting media:', err)
      setGalleryError('Failed to delete media')
      setGallerySuccess('')
      setShowDeleteConfirm(null)
    }
  }

  const getMediaUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `http://localhost:8000${path}`
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">{error}</div>
  if (!salon) return <div className="no-salon">No salon found. Please create one first.</div>

  return (
    <div className="gallery-branding-container">
      <header className="page-header">
        <h1>Gallery & Branding</h1>
        <p>Manage your salon's visual identity and showcase your work.</p>
      </header>

      {gallerySuccess && <div className="success-message">{gallerySuccess}</div>}
      {galleryError && <div className="error-message">{galleryError}</div>}

      <section className="branding-section card">
        <div className="section-header">
          <div className="header-text">
            <h3>Salon Branding</h3>
            <p className="section-desc">Manage your official salon logo used for profile and receipts.</p>
          </div>
          <MediaUploader onUpload={handleLogoUpload} label="Change Logo" />
        </div>

        <div className="logo-management">
          <div className="logo-preview-container">
            <div className="logo-preview">
              {salon.logo ? (
                <img src={getMediaUrl(salon.logo)} alt="Salon Logo" />
              ) : (
                <div className="logo-placeholder">No Logo</div>
              )}
            </div>
          </div>
          <div className="logo-info">
            <h4>Logo Preview</h4>
            <p>This is how your logo appears to customers. Recommended size: 500x500px.</p>
          </div>
        </div>
      </section>

      <section className="gallery-section card">
        <div className="section-header">
          <div className="header-text">
            <h3>Work Gallery</h3>
            <p className="section-desc">Showcase your best haircuts, styles, and salon environment.</p>
          </div>
          <MediaUploader
            onUpload={handleGalleryUpload}
            label="Upload Media"
            accept="image/*,video/*"
            multiple={true}
          />
        </div>

        <div className="gallery-grid">
          {gallery.map(item => (
            <div key={item.id} className="gallery-item">
              {item.media_type === 'IMAGE' ? (
                <img src={getMediaUrl(item.file)} alt="Gallery" />
              ) : (
                <video src={getMediaUrl(item.file)} controls />
              )}
              <button
                className="delete-btn"
                onClick={() => setShowDeleteConfirm(item.id)}
                title="Delete item"
              >
                &times;
              </button>
            </div>
          ))}
          {gallery.length === 0 && (
            <div className="empty-gallery">
              Your gallery is empty. Start uploading photos of your work!
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center', padding: '2.5rem' }}>
            <h3>Delete Media?</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Are you sure you want to delete this item? This cannot be undone.</p>
            <div className="modal-actions" style={{ flexDirection: 'row', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleDeleteMedia(showDeleteConfirm)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GalleryBranding
