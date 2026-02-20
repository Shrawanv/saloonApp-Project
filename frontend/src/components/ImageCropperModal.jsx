import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../utils/cropImage'
import './ImageCropperModal.css'

const ImageCropperModal = ({ image, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

    const onCropChange = (crop) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom) => {
        setZoom(zoom)
    }

    const onCropAreaComplete = useCallback((_croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleCropSave = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels)
            onCropComplete(croppedImage)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="cropper-modal-overlay">
            <div className="cropper-modal-container">
                <div className="cropper-header">
                    <h3>Crop Your Photo</h3>
                    <p>Drag and zoom to adjust</p>
                </div>

                <div className="cropper-wrapper">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropAreaComplete}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="cropper-controls">
                    <div className="zoom-slider">
                        <span>Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="zoom-range"
                        />
                    </div>

                    <div className="cropper-actions">
                        <button className="btn btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleCropSave}>
                            Crop & Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ImageCropperModal
