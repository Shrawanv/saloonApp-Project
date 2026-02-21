import { useState } from 'react'
import './SettingsSupport.css'

const SETTINGS_TABS = [
  { id: 'support', label: 'Support / Raise Ticket' },
  { id: 'faq', label: 'FAQs / Help' },
]

const FAQ_DATA = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'How do I set up my salon profile?',
        a: 'Go to "My Profile" from the sidebar and fill in your salon details — name, mobile, pincode, opening/closing time. You can also upload a logo from the "Gallery & Branding" page.'
      },
      {
        q: 'How do I add services to my salon?',
        a: 'Navigate to "My Profile" → "Services" tab. Click "Add Service" and enter the service name, price, and duration. You can toggle services on or off at any time.'
      },
      {
        q: 'How does the QR code check-in work?',
        a: 'Each salon gets a unique QR code (on "My Profile" → "QR Code" tab). Customers scan it to check in directly into your live queue. You can print or download this QR to display in your salon.'
      },
    ]
  },
  {
    category: 'Bookings & Queue',
    items: [
      {
        q: 'How do I manage walk-in customers?',
        a: 'Go to "Booking & Queue" and click the "+ Add Walk-in" button. Enter the customer name, mobile, select services and a time slot. You can optionally mark them as checked-in immediately.'
      },
      {
        q: 'Can I cancel or reschedule a booking?',
        a: 'Yes. In the "Booking & Queue" page, find the appointment and click "Cancel". Rescheduling is done by cancelling the old one and creating a new booking for the desired time.'
      },
      {
        q: 'What does "Confirm" (check-in) mean?',
        a: 'When a customer arrives, clicking "Confirm" marks them as physically present. This updates the live queue and estimated wait times for other customers.'
      },
    ]
  },
  {
    category: 'Payments & Coupons',
    items: [
      {
        q: 'How do I accept payments?',
        a: 'Go to "Payment & Billing", select the completed appointment, and choose either Cash or Online (QR). The payment status will be recorded and shown on the receipt.'
      },
      {
        q: 'How do coupon codes work?',
        a: 'You can create coupons from the "Communication" page. Customers enter the coupon code during booking. The discount is automatically calculated and shown on the bill. Coupons can be percentage-based or flat discounts.'
      },
      {
        q: 'Can I print bills/receipts?',
        a: 'Yes! On the "Payment & Billing" page, select an appointment and click "Print Bill". The receipt includes the salon header, services, pricing, coupon discounts, and payment status.'
      },
    ]
  },
  {
    category: 'Reports & Analytics',
    items: [
      {
        q: 'What kind of reports can I see?',
        a: 'The Reports page shows three categories: Ratings & Feedback (customer reviews), Frequent Customers (top visitors), and Earnings Summary (revenue charts by day/week/month).'
      },
      {
        q: 'How is earnings data calculated?',
        a: 'Earnings are based on completed appointments. The chart shows revenue trends over time. If coupons were used, the discounted amount is reflected in the earnings.'
      },
    ]
  },
]

function SettingsSupport() {
  const [activeTab, setActiveTab] = useState('support')
  const [openFaq, setOpenFaq] = useState(null) // index key like "0-1"
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'general', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const toggleFaq = (key) => {
    setOpenFaq(openFaq === key ? null : key)
  }

  const handleTicketSubmit = async (e) => {
    e.preventDefault()
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) return

    setSubmitting(true)
    // Simulate submission (can be wired to a real API later)
    await new Promise(resolve => setTimeout(resolve, 1200))
    setSubmitting(false)
    setSubmitSuccess(true)
    setTicketForm({ subject: '', category: 'general', description: '' })

    // Clear success message after 5 seconds
    setTimeout(() => setSubmitSuccess(false), 5000)
  }

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

      {/* ─── Support Ticket Tab ─── */}
      {activeTab === 'support' && (
        <div className="tab-content card">
          <div className="section-header">
            <h3>Raise a Support Ticket</h3>
          </div>
          <p className="section-desc">
            Having an issue or need help? Fill out the form below and our team will get back to you within 24 hours.
          </p>

          {submitSuccess && (
            <div className="success-message">
              ✅ Your support ticket has been submitted successfully! We'll get back to you soon.
            </div>
          )}

          <form className="support-form" onSubmit={handleTicketSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Brief summary of your issue"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-control"
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                >
                  <option value="general">General Inquiry</option>
                  <option value="billing">Billing Issue</option>
                  <option value="booking">Booking Problem</option>
                  <option value="technical">Technical Issue</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                placeholder="Describe your issue in detail. Include steps to reproduce if applicable."
                rows={5}
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !ticketForm.subject.trim() || !ticketForm.description.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      )}

      {/* ─── FAQ Tab ─── */}
      {activeTab === 'faq' && (
        <div className="tab-content card">
          <div className="section-header">
            <h3>Frequently Asked Questions</h3>
          </div>
          <p className="section-desc">
            Find answers to common questions about managing your salon.
          </p>

          <div className="faq-categories">
            {FAQ_DATA.map((category, catIdx) => (
              <div key={catIdx} className="faq-category">
                <h4 className="faq-category-title">{category.category}</h4>
                <div className="faq-items">
                  {category.items.map((item, itemIdx) => {
                    const key = `${catIdx}-${itemIdx}`
                    const isOpen = openFaq === key
                    return (
                      <div key={key} className={`faq-item ${isOpen ? 'open' : ''}`}>
                        <button className="faq-question" onClick={() => toggleFaq(key)}>
                          <span>{item.q}</span>
                          <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                        </button>
                        {isOpen && (
                          <div className="faq-answer">
                            <p>{item.a}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsSupport
