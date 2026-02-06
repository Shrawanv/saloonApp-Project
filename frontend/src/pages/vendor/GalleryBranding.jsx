import { useState } from 'react'
import './GalleryBranding.css'

const GALLERY_TABS = [
  { id: 'portfolio', label: 'Portfolio Images' },
  { id: 'social', label: 'Social Media Handles' },
]

function GalleryBranding() {
  const [activeTab, setActiveTab] = useState('portfolio')

  return (
    <div className="gallery-branding-page">
      <h1>Gallery & Branding</h1>

      <div className="vendor-tabs">
        {GALLERY_TABS.map((tab) => (
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
        {activeTab === 'portfolio' && (
          <div>
            <h3>Upload/Edit Portfolio Images</h3>
            <p>Before/after shots (max based on plan)</p>
          </div>
        )}
        {activeTab === 'social' && (
          <div>
            <h3>Social Media Handles</h3>
            <div className="social-icons">
              <span>Instagram</span>
              <span>Facebook</span>
              <span>Twitter</span>
              <span>YouTube</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GalleryBranding
