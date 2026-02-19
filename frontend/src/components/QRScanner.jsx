import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

/**
 * QRScanner Component
 * NOTE: Requires 'html5-qrcode' package.
 * npm install html5-qrcode
 */
const QRScanner = ({ onScanSuccess, onScanFailure, fps = 10, qrbox = 250, aspectRatio = 1.0 }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps, qrbox, aspectRatio },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, []);

    return (
        <div id="qr-reader" style={{ width: '100%' }}></div>
    );
};

export default QRScanner;
