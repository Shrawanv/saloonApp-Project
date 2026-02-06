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
      <h1>Reports</h1>

      <div className="vendor-tabs">
        {REPORT_TABS.map((tab) => (
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
        {activeTab === 'ratings' && (
          <div>
            <h3>Overall Rating: 4.5</h3>
            <p>Customer-wise ratings and feedback</p>
          </div>
        )}
        {activeTab === 'customers' && (
          <div>
            <h3>Frequent Customers</h3>
            <p>Visit count plus total earning per customer</p>
          </div>
        )}
        {activeTab === 'earnings' && (
          <div>
            <h3>Earnings Summary</h3>
            <p>Daily/Weekly/Monthly date wise collection</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
