import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './CustomerLayout.css'

function CustomerLayout() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="customer-layout">
      <header className="customer-header">
        <div className="container header-inner">
          <Link to="/customer/select-salon" className="logo">
            ✂️ SaloQ
          </Link>
          <nav className="customer-nav">
            <Link to="/customer/select-salon">Find Salon</Link>
            <Link to="/customer/appointments">My Appointments</Link>
            <div className="user-profile-dropdown">
              <span className="user-name">{user?.first_name || user?.username} ▾</span>
              <div className="dropdown-content">
                <Link to="/customer/profile" className="dropdown-item">
                  <span className="dropdown-icon">👤</span> Profile
                </Link>
                <button className="dropdown-item logout-btn" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span> Logout
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>
      <main className="customer-main">
        <Outlet />
      </main>
    </div>
  )
}

export default CustomerLayout
