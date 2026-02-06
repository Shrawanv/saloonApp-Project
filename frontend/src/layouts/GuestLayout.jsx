import { Outlet, Link } from 'react-router-dom'
import './GuestLayout.css'

function GuestLayout() {
  return (
    <div className="guest-layout">
      <header className="guest-header">
        <div className="container header-inner">
          <Link to="/guest/select-salon" className="logo">
            ✂️ SaloQ
          </Link>
          <div className="guest-badge">Guest View</div>
          <nav className="guest-nav">
            <Link to="/guest/select-salon">Browse Salons</Link>
            <Link to="/login" className="btn btn-primary btn-sm">
              Login to Book
            </Link>
          </nav>
        </div>
      </header>
      <main className="guest-main">
        <Outlet />
      </main>
    </div>
  )
}

export default GuestLayout
