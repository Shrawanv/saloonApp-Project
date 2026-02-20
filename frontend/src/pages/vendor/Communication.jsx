import { useState } from 'react'
import './Communication.css'

const COMM_TABS = [
  { id: 'chat', label: 'In-app Chat' },
  { id: 'appointments', label: 'Accept / Reschedule' },
  { id: 'broadcast', label: 'Broadcast Offers' },
]

function Communication() {
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="communication-page">
      <div className="page-header">
        <h1>Communication Tools</h1>
        <p>Chat with customers and manage appointment requests</p>
      </div>

      <div className="profile-tabs">
        {COMM_TABS.map((tab) => (
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
        {activeTab === 'chat' && (
          <div className="empty-state">
            <p>💬 In-app chat with customers — coming soon!</p>
          </div>
        )}
        {activeTab === 'appointments' && (
          <div className="empty-state">
            <p>📅 Accept, reschedule, or cancel appointments — coming soon!</p>
          </div>
        )}
        {activeTab === 'broadcast' && (
          <div className="empty-state">
            <p>📣 Broadcast offers to your customers — coming soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Communication
