import { useState } from 'react'
import './Reports.css'

const REPORT_TABS = [
  { id: 'ratings', label: 'Ratings & Feedback' },
  { id: 'customers', label: 'Frequent Customers' },
  { id: 'earnings', label: 'Earnings Summary' },
]

function Reports() {
  const [activeTab, setActiveTab] = useState('ratings')

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports</h1>
        <p>Insights on ratings, customers, and earnings</p>
      </div>

      <div className="profile-tabs">
        {REPORT_TABS.map((tab) => (
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
        {activeTab === 'ratings' && (
          <div className="empty-state">
            <p>⭐ Ratings and customer feedback analytics — coming soon!</p>
          </div>
        )}
        {activeTab === 'customers' && (
          <div className="empty-state">
            <p>👥 Frequent customer visit & earnings breakdown — coming soon!</p>
          </div>
        )}
        {activeTab === 'earnings' && (
          <div className="empty-state">
            <p>💰 Daily / weekly / monthly earnings summary — coming soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
