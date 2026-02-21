import { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './Toast.css'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const timersRef = useRef({})
    const startTimesRef = useRef({})
    const location = useLocation()

    // Clear all toasts on route change
    useEffect(() => {
        Object.values(timersRef.current).forEach(clearTimeout)
        timersRef.current = {}
        startTimesRef.current = {}
        setToasts([])
    }, [location.pathname])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
            delete timersRef.current[id]
        }, 300)
    }, [])

    const addToast = useCallback((message, type = 'error', duration = 10000) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type, exiting: false, duration }])

        if (duration > 0) {
            startTimesRef.current[id] = { start: Date.now(), remaining: duration }
            timersRef.current[id] = setTimeout(() => removeToast(id), duration)
        }

        return id
    }, [removeToast])

    const pauseToast = useCallback((id) => {
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id])
            delete timersRef.current[id]
            const info = startTimesRef.current[id]
            if (info) {
                const elapsed = Date.now() - info.start
                info.remaining = Math.max(info.remaining - elapsed, 1000)
            }
        }
    }, [])

    const resumeToast = useCallback((id) => {
        const info = startTimesRef.current[id]
        if (info && !timersRef.current[id]) {
            info.start = Date.now()
            timersRef.current[id] = setTimeout(() => removeToast(id), info.remaining)
        }
    }, [removeToast])

    const value = useMemo(() => ({
        toast: {
            error: (msg, duration) => addToast(msg, 'error', duration),
            success: (msg, duration) => addToast(msg, 'success', duration),
            warning: (msg, duration) => addToast(msg, 'warning', duration),
            info: (msg, duration) => addToast(msg, 'info', duration),
        },
        addToast,
        removeToast,
    }), [addToast, removeToast])

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast container — renders at viewport top-right */}
            <div className="toast-container" role="alert" aria-live="polite">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}
                        onMouseEnter={() => pauseToast(t.id)}
                        onMouseLeave={() => resumeToast(t.id)}
                    >
                        <span className="toast-icon">
                            {t.type === 'success' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                            {t.type === 'error' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            )}
                            {t.type === 'warning' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            )}
                            {t.type === 'info' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            )}
                        </span>
                        <span className="toast-message">{t.message}</span>
                        <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Close">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context.toast
}

export default ToastContext
