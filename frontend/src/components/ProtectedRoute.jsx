import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role?.toLowerCase()
    const hasRole = allowedRoles.some(role => role.toLowerCase() === userRole)
    
    if (!hasRole) {
      if (userRole === 'vendor') {
        return <Navigate to="/vendor" replace />
      } else {
        return <Navigate to="/customer/select-salon" replace />
      }
    }
  }

  return children
}

export default ProtectedRoute
