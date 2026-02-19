import { useAuth } from '../../context/AuthContext'
import { mediaService } from '../../services'
import MediaUploader from '../../components/MediaUploader'
import './CustomerProfile.css'

function CustomerProfile() {
    const { user, setUser } = useAuth()

    const handleAvatarUpload = async (file) => {
        try {
            const updatedUser = await mediaService.uploadProfilePicture(file)
            setUser(updatedUser)
            alert('Profile picture updated successfully!')
        } catch (err) {
            console.error('Error uploading avatar:', err)
            alert('Failed to upload profile picture')
        }
    }

    const getAvatarUrl = () => {
        if (user?.profile_picture) {
            // If it's a full URL (already has http), use it, otherwise prepend base
            if (user.profile_picture.startsWith('http')) return user.profile_picture
            return `http://localhost:8000${user.profile_picture}`
        }
        return null
    }

    return (
        <div className="container">
            <div className="profile-page card">
                <div className="profile-header">
                    <div className="profile-avatar-container">
                        {getAvatarUrl() ? (
                            <img src={getAvatarUrl()} alt="Avatar" className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar">👤</div>
                        )}
                        <MediaUploader
                            onUpload={handleAvatarUpload}
                            label="Change Photo"
                            className="avatar-uploader"
                        />
                    </div>
                    <h2>{user?.first_name} {user?.last_name}</h2>
                    <p className="profile-email">{user?.email}</p>
                </div>

                <div className="profile-details">
                    <h3>Account Information</h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="label">Username</span>
                            <span className="value">{user?.username}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Role</span>
                            <span className="value">Customer</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomerProfile
