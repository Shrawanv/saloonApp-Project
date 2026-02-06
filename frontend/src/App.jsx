import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import CustomerLayout from './layouts/CustomerLayout'
import VendorLayout from './layouts/VendorLayout'

// Auth
import LoginPage from './pages/auth/LoginPage'

// Guest Pages (view-only, no login)
import GuestLayout from './layouts/GuestLayout'
import GuestSalonSelect from './pages/guest/GuestSalonSelect'
import GuestDashboard from './pages/guest/GuestDashboard'

// Customer Pages
import SalonSelect from './pages/customer/SalonSelect'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import MyAppointments from './pages/customer/MyAppointments'

// Vendor Pages
import VendorHome from './pages/vendor/VendorHome'
import BookingQueue from './pages/vendor/BookingQueue'
import PaymentBilling from './pages/vendor/PaymentBilling'
import Communication from './pages/vendor/Communication'
import Reports from './pages/vendor/Reports'
import GalleryBranding from './pages/vendor/GalleryBranding'
import SettingsSupport from './pages/vendor/SettingsSupport'
import VendorProfile from './pages/vendor/VendorProfile'

function App() {
  const { isAuthenticated, getUserRole } = useAuth()

  const LoginRoute = () => {
    if (isAuthenticated()) {
      const role = getUserRole()
      if (role === 'vendor') {
        return <Navigate to="/vendor" replace />
      }
      return <Navigate to="/customer/select-salon" replace />
    }
    return <LoginPage />
  }

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated() ? (
          getUserRole() === 'vendor' ? 
            <Navigate to="/vendor" replace /> : 
            <Navigate to="/customer/select-salon" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      <Route path="/login" element={<LoginRoute />} />

      {/* Guest Routes (browse without login) */}
      <Route path="/guest" element={<GuestLayout />}>
        <Route index element={<GuestSalonSelect />} />
        <Route path="select-salon" element={<GuestSalonSelect />} />
        <Route path="dashboard/:salonId" element={<GuestDashboard />} />
      </Route>

      {/* Customer Routes */}
      <Route path="/customer" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <CustomerLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="select-salon" replace />} />
        <Route path="select-salon" element={<SalonSelect />} />
        <Route path="dashboard/:salonId" element={<CustomerDashboard />} />
        <Route path="appointments" element={<MyAppointments />} />
      </Route>

      {/* Vendor Routes */}
      <Route path="/vendor" element={
        <ProtectedRoute allowedRoles={['vendor']}>
          <VendorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<VendorHome />} />
        <Route path="booking-queue" element={<BookingQueue />} />
        <Route path="payment-billing" element={<PaymentBilling />} />
        <Route path="communication" element={<Communication />} />
        <Route path="reports" element={<Reports />} />
        <Route path="gallery-branding" element={<GalleryBranding />} />
        <Route path="settings-support" element={<SettingsSupport />} />
        <Route path="profile" element={<VendorProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
