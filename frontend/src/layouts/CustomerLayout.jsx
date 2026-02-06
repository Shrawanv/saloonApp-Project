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
            <span className="user-name">{user?.first_name || user?.username}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Logout
            </button>
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
