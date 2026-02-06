import { useState } from 'react'
import './Communication.css'

const COMM_TABS = [
  { id: 'chat', label: 'In-app Chat' },
  { id: 'appointments', label: 'Accept / Reschedule / Cancel' },
  { id: 'broadcast', label: 'Broadcast Offers' },
]

function Communication() {
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="communication-page">
      <h1>Communication Tools</h1>

      <div className="vendor-tabs">
        {COMM_TABS.map((tab) => (
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
        {activeTab === 'chat' && <p>In-app chat with customers (placeholder)</p>}
        {activeTab === 'appointments' && (
          <div>
            <h3>Appointment Requests</h3>
            <p>View, Accept, Reschedule, or Cancel appointments</p>
          </div>
        )}
        {activeTab === 'broadcast' && <p>Broadcast offers to followers (placeholder)</p>}
      </div>
    </div>
  )
}

export default Communication
