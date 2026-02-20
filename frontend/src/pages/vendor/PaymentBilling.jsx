import { useState, useEffect, useRef } from 'react'
import { salonService, appointmentService } from '../../services'
import './PaymentBilling.css'

function PaymentBilling() {
  const [salons, setSalons] = useState([])
  const [selectedSalon, setSelectedSalon] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const billRef = useRef()

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true)
        const salonsData = await salonService.getMySalons()
        setSalons(salonsData)
        if (salonsData.length > 0) {
          const salonId = salonsData[0].id
          setSelectedSalon(salonId)
          // Fetch appointments for the first salon immediately to avoid double loading state
          const aptsData = await appointmentService.getVendorAppointments({
            salon: salonId,
            status: 'COMPLETED',
            page_size: 50
          })
          setAppointments(aptsData)
        }
      } catch (err) {
        console.error('Error initializing data:', err)
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [])

  // This second effect now only handles manual salon changes, not the initial mount
  const isFirstRun = useRef(true)
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (selectedSalon) {
      fetchRecentAppointments()
    }
  }, [selectedSalon])

  const fetchSalons = async () => {
    // Kept for manual refresh if needed, but primary init is now in useEffect
    try {
      const data = await salonService.getMySalons()
      setSalons(data)
    } catch (err) {
      console.error('Error fetching salons:', err)
    }
  }

  const fetchRecentAppointments = async () => {
    try {
      setLoading(true)
      const data = await appointmentService.getVendorAppointments({
        salon: selectedSalon,
        status: 'COMPLETED',
        page_size: 50
      })
      setAppointments(data)
    } catch (err) {
      console.error('Error fetching appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAppointment = (id) => {
    const apt = appointments.find(a => a.id === parseInt(id))
    setSelectedAppointment(apt)
  }

  const handleAcceptPayment = async (mode) => {
    if (!selectedAppointment) return

    // If online, show QR first
    if (mode === 'Online' && !showQR) {
      setShowQR(true)
      return
    }

    try {
      setUpdating(true)
      const payload = {
        payment_status: 'PAID',
        payment_mode: mode.toUpperCase()
      }

      // Also mark as COMPLETED if it was BOOKED
      if (selectedAppointment.status === 'BOOKED') {
        payload.status = 'COMPLETED'
      }

      await appointmentService.updateAppointmentStatus(selectedAppointment.id, payload.status, null, payload)

      alert(`Payment of Rs. ${selectedAppointment.total_amount} recorded via ${mode}`)
      setShowQR(false)

      // Refresh data
      await fetchRecentAppointments()
      // Refresh current selection
      const data = await appointmentService.getVendorAppointments({ salon: selectedSalon, page_size: 50 })
      const updatedApt = data.find(a => a.id === selectedAppointment.id)
      setSelectedAppointment(updatedApt)
    } catch (err) {
      console.error('Error updating payment:', err)
      alert('Failed to process payment')
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const selectedSalonData = salons.find(s => s.id === selectedSalon)

  return (
    <div className="payment-billing-page">
      <div className="no-print">
        <div className="page-header">
          <h1>Payment &amp; Billing</h1>
          <p>Select a salon and appointment to generate a bill</p>
        </div>

        <div className="billing-config card">
          <div className="config-row">
            <div className="config-item">
              <label>Select Salon:</label>
              <select
                value={selectedSalon || ''}
                onChange={(e) => {
                  setSelectedSalon(parseInt(e.target.value))
                  setSelectedAppointment(null)
                }}
              >
                {salons.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="config-item">
              <label>Select Customer/Appointment:</label>
              <select
                value={selectedAppointment?.id || ''}
                onChange={(e) => handleSelectAppointment(e.target.value)}
              >
                <option value="">-- Select Customer --</option>
                {appointments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.user_name || a.guest_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading billing data...</div>
      ) : selectedAppointment ? (
        <div className="billing-container">
          <div className="bill-card card" id="printable-bill" ref={billRef}>
            <div className="bill-header">
              <h2>{selectedSalonData?.name}</h2>
              <div className="salon-details">
                <p>Mobile: {selectedSalonData?.mobile}</p>
                <p>Pincode: {selectedSalonData?.pincode}</p>
              </div>
              <div className="bill-meta">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Bill #: {selectedAppointment.id}</span>
              </div>
            </div>

            <div className="bill-section customer-section">
              <h4>Customer Details</h4>
              <p><strong>Name:</strong> {selectedAppointment.user_name || selectedAppointment.guest_name}</p>
              {selectedAppointment.guest_mobile && (
                <p><strong>Mobile:</strong> {selectedAppointment.guest_mobile}</p>
              )}
            </div>

            <div className="bill-section services-section">
              <h4>Services</h4>
              <table className="bill-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th className="text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAppointment.services_details?.map((service, index) => (
                    <tr key={index}>
                      <td>{service.name}</td>
                      <td className="text-right">Rs. {service.price}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th className="text-left">Total</th>
                    <th className="text-right">Rs. {selectedAppointment.total_amount}</th>
                  </tr>
                  {selectedAppointment.payment_status === 'PAID' && (
                    <tr className="payment-info">
                      <td colSpan="2" className="text-right">
                        <span className="paid-badge">PAID via {selectedAppointment.payment_mode}</span>
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            <div className="bill-footer">
              <p>Thank you for visiting {selectedSalonData?.name}!</p>
            </div>
          </div>

          <div className="billing-actions no-print">
            {selectedAppointment.payment_status !== 'PAID' ? (
              <div className="payment-actions card">
                <h4>Accept Payment</h4>
                <div className="action-group">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAcceptPayment('Cash')}
                    disabled={updating}
                  >
                    💵 Cash
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleAcceptPayment('Online')}
                    disabled={updating}
                  >
                    📱 Online (QR)
                  </button>
                </div>
              </div>
            ) : (
              <div className="payment-status-card card">
                <h4>Payment Received</h4>
                <p className="paid-success">
                  Marked as PAID via {selectedAppointment.payment_mode}
                </p>
              </div>
            )}

            <div className="other-actions">
              <button className="btn btn-outline btn-full" onClick={handlePrint}>
                Print Bill
              </button>
            </div>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="empty-state no-print">
            <p>Please select a customer to generate a bill.</p>
          </div>
        )
      )}

      {showQR && (
        <div className="modal-overlay">
          <div className="qr-modal card">
            <h3>Scan QR to Pay</h3>
            <div className="qr-placeholder">
              <div className="qr-box">
                <span className="qr-icon">QR</span>
              </div>
              <p>UPI ID: salon@{selectedSalonData?.name.toLowerCase().replace(/\s/g, '')}</p>
              <p className="amount-text">Amount: Rs. {selectedAppointment?.total_amount}</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => handleAcceptPayment('Online')}>
                Confirm Payment Received
              </button>
              <button className="btn btn-outline" onClick={() => setShowQR(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default PaymentBilling
