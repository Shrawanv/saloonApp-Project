import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { mediaService, customerService, authService } from '../../services'
import MediaUploader from '../../components/MediaUploader'
import ImageCropperModal from '../../components/ImageCropperModal'
import './CustomerProfile.css'

function CustomerProfile() {
    const { user, setUser } = useAuth()
    const [selectedImage, setSelectedImage] = useState(null)
    const [showCropper, setShowCropper] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        mobile: '',
        pincode: ''
    })
    const [updating, setUpdating] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    })
    const [updatingPassword, setUpdatingPassword] = useState(false)
    const [profileSuccess, setProfileSuccess] = useState('')
    const [profileError, setProfileError] = useState('')

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                mobile: user.mobile || '',
                pincode: user.pincode || ''
            })
        }
    }, [user])

    const onFileSelect = (file) => {
        const reader = new FileReader()
        reader.onload = () => {
            setSelectedImage(reader.result)
            setShowCropper(true)
        }
        reader.readAsDataURL(file)
    }

    const handleCropComplete = async (croppedBlob) => {
        setShowCropper(false)
        try {
            const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })
            const updatedUser = await mediaService.uploadProfilePicture(file)
            setUser(updatedUser)
            setProfileSuccess('Profile picture updated successfully!')
            setProfileError('')
            setTimeout(() => setProfileSuccess(''), 5000)
        } catch (err) {
            console.error('Error uploading avatar:', err)
            setProfileError('Failed to upload profile picture')
            setProfileSuccess('')
        }
    }

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        setUpdating(true)
        try {
            const updatedUser = await customerService.updateProfile(formData)
            setUser(updatedUser)
            setIsEditing(false)
            setProfileSuccess('Profile updated successfully!')
            setProfileError('')
            setTimeout(() => setProfileSuccess(''), 5000)
        } catch (err) {
            console.error('Error updating profile:', err)
            setProfileError('Failed to update profile. Please check the information provided.')
            setProfileSuccess('')
        } finally {
            setUpdating(false)
        }
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        if (passwordData.new_password !== passwordData.confirm_password) {
            setProfileError('New passwords do not match!')
            setProfileSuccess('')
            return
        }
        setUpdatingPassword(true)
        try {
            await authService.changePassword({
                old_password: passwordData.old_password,
                new_password: passwordData.new_password,
                confirm_password: passwordData.confirm_password
            })
            setProfileSuccess('Password updated successfully!')
            setProfileError('')
            setTimeout(() => setProfileSuccess(''), 5000)
            setShowPasswordModal(false)
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
        } catch (err) {
            console.error('Error updating password:', err)
            const errorMsg = err.response?.data?.old_password || err.response?.data?.detail || 'Failed to update password.'
            setProfileError(errorMsg)
            setProfileSuccess('')
        } finally {
            setUpdatingPassword(false)
        }
    }

    const getAvatarUrl = () => {
        if (user?.profile_picture) {
            if (user.profile_picture.startsWith('http')) return user.profile_picture
            const baseUrl = 'http://localhost:8000'
            const path = user.profile_picture.startsWith('/') ? user.profile_picture : `/${user.profile_picture}`
            return `${baseUrl}${path}`
        }
        return null
    }

    return (
        <div className="container">
            <div className="profile-page card">
                <div className="profile-header">
                    {profileSuccess && <div className="success-message">{profileSuccess}</div>}
                    {profileError && <div className="error-message">{profileError}</div>}
                    <div className="profile-avatar-container">
                        {getAvatarUrl() ? (
                            <img src={getAvatarUrl()} alt="Avatar" className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar">👤</div>
                        )}
                        <MediaUploader
                            onUpload={onFileSelect}
                            label="Change Photo"
                            className="avatar-uploader"
                        />
                    </div>
                    <h2>{user?.first_name} {user?.last_name}</h2>
                    <p className="profile-email">@{user?.username}</p>
                </div>

                {showCropper && (
                    <ImageCropperModal
                        image={selectedImage}
                        onCropComplete={handleCropComplete}
                        onCancel={() => setShowCropper(false)}
                    />
                )}

                <div className="profile-details-section">
                    <div className="section-header">
                        <h3>Account Information</h3>
                        {!isEditing && (
                            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <form className="edit-profile-form" onSubmit={handleProfileUpdate}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        placeholder="Enter last name"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Phone Number (Mobile)</label>
                                <input
                                    type="text"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    placeholder="Enter your mobile number"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Address (Pincode)</label>
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    placeholder="Enter your pincode"
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setIsEditing(false)}
                                    disabled={updating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={updating}
                                >
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="label">First Name</span>
                                <span className="value">{user?.first_name || 'Not set'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Last Name</span>
                                <span className="value">{user?.last_name || 'Not set'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Email Address</span>
                                <span className="value">{user?.email}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Phone Number</span>
                                <span className="value">{user?.mobile}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Username</span>
                                <span className="value">@{user?.username}</span>
                            </div>
                            <div className="detail-item password-action">
                                <span className="label">Password</span>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowPasswordModal(true)}
                                    style={{ padding: '0.4rem 0.8rem', marginTop: '0.25rem' }}
                                >
                                    Update Password
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {showPasswordModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Update Password</h3>
                            <form onSubmit={handlePasswordChange}>
                                <div className="form-group">
                                    <label>Old Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.old_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={() => setShowPasswordModal(false)}
                                        disabled={updatingPassword}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={updatingPassword}
                                    >
                                        {updatingPassword ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CustomerProfile
