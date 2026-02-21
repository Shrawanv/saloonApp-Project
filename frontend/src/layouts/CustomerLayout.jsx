import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './CustomerLayout.css'

function CustomerLayout() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const getInitials = () => {
    const first = user?.first_name?.[0] || ''
    const last = user?.last_name?.[0] || ''
    if (first || last) return (first + last).toUpperCase()
    return (user?.username?.[0] || '?').toUpperCase()
  }

  const getAvatarUrl = () => {
    if (user?.profile_picture) {
      if (user.profile_picture.startsWith('http')) return user.profile_picture
      return `http://localhost:8000${user.profile_picture.startsWith('/') ? '' : '/'}${user.profile_picture}`
    }
    return null
  }

  const avatarUrl = getAvatarUrl()

  return (
    <div className="customer-layout">
      <header className="customer-header">
        <div className="container header-inner">
          <Link to="/customer/select-salon" className="logo">
            ✂️ SaloQ
          </Link>
          <nav className="customer-nav">
            <Link to="/customer/select-salon">Find Salon</Link>
            <div className="user-profile-dropdown">
              <div className="user-trigger">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="user-avatar-sm user-avatar-img" />
                  : <span className="user-avatar-sm">{getInitials()}</span>
                }
                <span className="user-name">{user?.first_name || user?.username}</span>
                <svg className="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div className="dropdown-content">
                <div className="dropdown-inner">
                  {/* User info header */}
                  <div className="dropdown-user-info">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" className="dropdown-avatar dropdown-avatar-img" />
                      : <span className="dropdown-avatar">{getInitials()}</span>
                    }
                    <div className="dropdown-user-details">
                      <span className="dropdown-user-name">{user?.first_name} {user?.last_name}</span>
                      <span className="dropdown-user-handle">@{user?.username}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  {/* Menu items */}
                  <Link to="/customer/profile" className="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile
                  </Link>
                  <Link to="/customer/appointments" className="dropdown-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Appointments
                  </Link>

                  <div className="dropdown-divider" />

                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log Out
                  </button>
                </div>
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
