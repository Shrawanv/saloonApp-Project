import { useState } from 'react'
import './SettingsSupport.css'

const SETTINGS_TABS = [
  { id: 'language', label: 'Language Preferences' },
  { id: 'support', label: 'Support / Raise Ticket' },
  { id: 'faq', label: 'FAQs / Help' },
]

function SettingsSupport() {
  const [activeTab, setActiveTab] = useState('language')

  return (
    <div className="settings-support-page">
      <h1>Settings & Support</h1>

      <div className="vendor-tabs">
        {SETTINGS_TABS.map((tab) => (
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
        {activeTab === 'language' && <p>Select language (placeholder for translations)</p>}
        {activeTab === 'support' && (
          <div>
            <h3>Raise a Ticket</h3>
            <select>
              <option>Select issue type</option>
            </select>
            <textarea placeholder="Enter details..."></textarea>
            <button className="btn btn-primary">Submit</button>
          </div>
        )}
        {activeTab === 'faq' && <p>FAQs and Help topics</p>}
      </div>
    </div>
  )
}

export default SettingsSupport
