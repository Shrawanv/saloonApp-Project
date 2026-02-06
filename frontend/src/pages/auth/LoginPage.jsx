import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './LoginPage.css'

function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [userType, setUserType] = useState('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [regData, setRegData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    mobile: '',
    pincode: '',
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login({ username, password })
    
    if (!result.success) {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (regData.password !== regData.password_confirm) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const userData = {
      ...regData,
      role: userType.toUpperCase(),
    }

    const result = await register(userData)
    
    if (!result.success) {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleRegDataChange = (field, value) => {
    setRegData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-header">
          <h1>✂️ SaloQ</h1>
          <p>Book slots & manage your salon visits</p>
        </div>

        <div className="user-type-tabs">
          <button
            className={`tab ${userType === 'customer' ? 'active' : ''}`}
            onClick={() => setUserType('customer')}
          >
            Customer
          </button>
          <button
            className={`tab ${userType === 'vendor' ? 'active' : ''}`}
            onClick={() => setUserType('vendor')}
          >
            Vendor
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="First name"
                  value={regData.first_name}
                  onChange={(e) => handleRegDataChange('first_name', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={regData.last_name}
                  onChange={(e) => handleRegDataChange('last_name', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Choose a username"
                value={regData.username}
                onChange={(e) => handleRegDataChange('username', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={regData.email}
                onChange={(e) => handleRegDataChange('email', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={regData.mobile}
                onChange={(e) => handleRegDataChange('mobile', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                placeholder="Enter pincode"
                value={regData.pincode}
                onChange={(e) => handleRegDataChange('pincode', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Create password"
                value={regData.password}
                onChange={(e) => handleRegDataChange('password', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={regData.password_confirm}
                onChange={(e) => handleRegDataChange('password_confirm', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Creating account...' : `Register as ${userType === 'vendor' ? 'Vendor' : 'Customer'}`}
            </button>
          </form>
        )}

        <div className="login-options">
          <button
            className="link-btn"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
          >
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
          <Link to="/guest/select-salon" className="guest-browse-btn">
            👀 Browse as Guest — view services without login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
