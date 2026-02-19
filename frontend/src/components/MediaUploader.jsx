import React, { useState, useRef } from 'react'
import './MediaUploader.css'

const MediaUploader = ({
    onUpload,
    accept = "image/*",
    label = "Upload File",
    maxSizeMB = 5,
    multiple = false
}) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    const handleFileChange = async (e) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setLoading(true)
        setError(null)

        try {
            if (multiple) {
                // Handle multiple files if needed (not fully implemented in this simple version)
                for (let file of files) {
                    if (file.size > maxSizeMB * 1024 * 1024) {
                        throw new Error(`File ${file.name} is too large. Max size is ${maxSizeMB}MB.`)
                    }
                    await onUpload(file)
                }
            } else {
                const file = files[0]
                if (file.size > maxSizeMB * 1024 * 1024) {
                    throw new Error(`File is too large. Max size is ${maxSizeMB}MB.`)
                }
                await onUpload(file)
            }
        } catch (err) {
            setError(err.message || 'Upload failed')
        } finally {
            setLoading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="media-uploader">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={accept}
                style={{ display: 'none' }}
                multiple={multiple}
            />
            <button
                className={`btn ${loading ? 'btn-loading' : 'btn-primary'}`}
                onClick={handleClick}
                disabled={loading}
            >
                {loading ? 'Uploading...' : label}
            </button>
            {error && <p className="uploader-error">{error}</p>}
        </div>
    )
}

export default MediaUploader
