import { Outlet, Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './VendorLayout.css'

const SIDEBAR_LINKS = [
  { path: '', label: 'Home', icon: '🏠' },
  { path: 'booking-queue', label: 'Booking & Queue', icon: '📋' },
  { path: 'payment-billing', label: 'Payment & Billing', icon: '💳' },
  { path: 'communication', label: 'Communication', icon: '💬' },
  { path: 'reports', label: 'Reports', icon: '📊' },
  { path: 'gallery-branding', label: 'Gallery & Branding', icon: '🖼️' },
  { path: 'settings-support', label: 'Settings & Support', icon: '⚙️' },
  { path: 'profile', label: 'My Profile', icon: '👤' },
]

function VendorLayout() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="vendor-layout">
      <aside className="vendor-sidebar">
        <div className="sidebar-header">
          <Link to="/vendor" className="sidebar-logo">✂️ SaloQ</Link>
          <span className="sidebar-role">Vendor</span>
          {user && <span className="sidebar-user">{user.first_name || user.username}</span>}
        </div>
        <nav className="sidebar-nav">
          {SIDEBAR_LINKS.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path ? `/vendor/${path}` : '/vendor'}
              end={!path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
          <button className="sidebar-link logout-btn" onClick={handleLogout}>
            <span className="sidebar-icon">🚪</span>
            Logout
          </button>
        </nav>
      </aside>
      <div className="vendor-content">
        <Outlet />
      </div>
    </div>
  )
}

export default VendorLayout
