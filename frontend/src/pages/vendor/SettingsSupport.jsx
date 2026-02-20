import { useState } from 'react'
import './SettingsSupport.css'

const SETTINGS_TABS = [
  { id: 'support', label: 'Support / Raise Ticket' },
  { id: 'faq', label: 'FAQs / Help' },
]

function SettingsSupport() {
  const [activeTab, setActiveTab] = useState('support')

  return (
    <div className="settings-support-page">
      <div className="page-header">
        <h1>Settings &amp; Support</h1>
        <p>Get help or raise a support ticket</p>
      </div>

      <div className="profile-tabs">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content card">
        {activeTab === 'support' && (
          <div className="empty-state">
            <p>🎫 Support ticket submission — coming soon!</p>
          </div>
        )}
        {activeTab === 'faq' && (
          <div className="empty-state">
            <p>❓ FAQs and help topics — coming soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsSupport
