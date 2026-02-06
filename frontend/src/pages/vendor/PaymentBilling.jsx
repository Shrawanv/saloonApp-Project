import { useState } from 'react'
import './PaymentBilling.css'

const PAYMENT_TABS = [
  { id: 'mode', label: 'Accept Payment' },
  { id: 'bill', label: 'Generate Bill' },
]

function PaymentBilling() {
  const [activeTab, setActiveTab] = useState('mode')

  return (
    <div className="payment-billing-page">
      <h1>Payment & Billing</h1>

      <div className="vendor-tabs">
        {PAYMENT_TABS.map((tab) => (
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
        {activeTab === 'mode' && (
          <div className="payment-options">
            <h3>Customer Done - Collect Payment</h3>
            <button className="payment-btn">Cash</button>
            <button className="payment-btn">Online (QR)</button>
          </div>
        )}
        {activeTab === 'bill' && (
          <div>
            <h3>Generate Digital Bill / Invoice</h3>
            <p>Select customer to view/generate bill</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentBilling
