// Notification system under 'ntf' namespace
window.ntf = (function() {
    const NOTIFICATION_DURATION = 3000 // Default duration
    const NOTIFICATION_CONTAINER_ID = 'wfx__notification_container'
    const NOTIFICATION_FADE_DURATION = 300 // Animation duration
    const MAX_VISIBLE_NOTIFICATIONS = 3

    let notificationQueue = []
    let visibleNotifications = []
    let notificationIdCounter = 0

    const createNotificationContainer = () => {
        const container = document.createElement('div')
        container.id = NOTIFICATION_CONTAINER_ID
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '400px'
        })
        document.body.appendChild(container)
        return container
    }

    const createNotificationElement = (id, message, type = 'default') => {
        const notification = document.createElement('div')
        notification.id = `notification-${id}`
        notification.className = 'wfx-notification'
        
        // Tailwind-inspired base styles
        Object.assign(notification.style, {
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb', // gray-200
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // shadow-lg
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            fontWeight: '400',
            lineHeight: '1.5',
            wordWrap: 'break-word',
            opacity: '0',
            transform: 'translateY(-10px)',
            transition: `all ${NOTIFICATION_FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            cursor: 'pointer',
            pointerEvents: 'auto',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(8px)',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        })
        
        // Tailwind-inspired type-specific styling
        const typeStyles = {
            default: { 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                color: '#374151', // gray-700
                borderColor: '#d1d5db', // gray-300
                borderLeftWidth: '4px',
                borderLeftColor: '#6b7280' // gray-500
            },
            success: { 
                backgroundColor: 'rgba(240, 253, 244, 0.95)', // green-50 with opacity
                color: '#065f46', // green-800
                borderColor: '#a7f3d0', // green-200
                borderLeftWidth: '4px',
                borderLeftColor: '#10b981' // green-500
            },
            error: { 
                backgroundColor: 'rgba(254, 242, 242, 0.95)', // red-50 with opacity
                color: '#991b1b', // red-800
                borderColor: '#fecaca', // red-200
                borderLeftWidth: '4px',
                borderLeftColor: '#ef4444' // red-500
            },
            warning: { 
                backgroundColor: 'rgba(255, 251, 235, 0.95)', // amber-50 with opacity
                color: '#92400e', // amber-800
                borderColor: '#fde68a', // amber-200
                borderLeftWidth: '4px',
                borderLeftColor: '#f59e0b' // amber-500
            },
            info: { 
                backgroundColor: 'rgba(239, 246, 255, 0.95)', // blue-50 with opacity
                color: '#1e40af', // blue-800
                borderColor: '#bfdbfe', // blue-200
                borderLeftWidth: '4px',
                borderLeftColor: '#3b82f6' // blue-500
            }
        }
        
        Object.assign(notification.style, typeStyles[type] || typeStyles.default)
        
        // Create icon based on type
        const icon = document.createElement('span')
        icon.style.flexShrink = '0'
        icon.style.fontSize = '16px'
        icon.style.lineHeight = '1'
        
        const icons = {
            default: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        }
        icon.textContent = icons[type] || icons.default
        
        // Create message container
        const messageContainer = document.createElement('span')
        messageContainer.style.flex = '1'
        messageContainer.textContent = message
        
        // Create close button
        const closeBtn = document.createElement('button')
        closeBtn.innerHTML = '✕'
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            opacity: '0.5',
            lineHeight: '1',
            padding: '4px',
            borderRadius: '4px',
            color: 'inherit',
            flexShrink: '0',
            transition: 'opacity 150ms ease-in-out'
        })
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.opacity = '1'
            closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
        })
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.opacity = '0.5'
            closeBtn.style.backgroundColor = 'transparent'
        })
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            dismissNotification(id)
        })
        
        // Create progress bar for timed notifications
        const progressBar = document.createElement('div')
        Object.assign(progressBar.style, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            height: '2px',
            backgroundColor: notification.style.borderLeftColor || '#6b7280',
            width: '100%',
            transformOrigin: 'left',
            transform: 'scaleX(1)',
            opacity: '0.6'
        })
        
        // Assemble notification
        notification.appendChild(icon)
        notification.appendChild(messageContainer)
        notification.appendChild(closeBtn)
        notification.appendChild(progressBar)
        
        // Click to dismiss (but not on close button)
        notification.addEventListener('click', (e) => {
            if (e.target !== closeBtn) {
                dismissNotification(id)
            }
        })
        
        // Hover effects
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateY(-2px)'
            notification.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' // shadow-xl
        })
        
        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateY(0)'
            notification.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' // shadow-lg
        })
        
        return { element: notification, progressBar }
    }

    const showNotification = (notificationData) => {
        const container = document.getElementById(NOTIFICATION_CONTAINER_ID) || createNotificationContainer()
        const { element, progressBar } = createNotificationElement(
            notificationData.id,
            notificationData.message,
            notificationData.type
        )
        
        container.appendChild(element)
        
        // Trigger slide-in animation
        requestAnimationFrame(() => {
            element.style.opacity = '1'
            element.style.transform = 'translateY(0)'
        })
        
        // Store notification data
        visibleNotifications.push({
            ...notificationData,
            element,
            progressBar,
            startTime: Date.now()
        })
        
        // Start auto-dismiss timer if enabled
        if (notificationData.autoRemove && notificationData.duration > 0) {
            startProgressAnimation(notificationData.id, notificationData.duration)
            notificationData.timeout = setTimeout(() => {
                dismissNotification(notificationData.id)
            }, notificationData.duration)
        }
    }

    const startProgressAnimation = (id, duration) => {
        const notification = visibleNotifications.find(n => n.id === id)
        if (notification && notification.progressBar) {
            notification.progressBar.style.transition = `transform ${duration}ms linear`
            requestAnimationFrame(() => {
                notification.progressBar.style.transform = 'scaleX(0)'
            })
        }
    }

    const dismissNotification = (id) => {
        const notificationIndex = visibleNotifications.findIndex(n => n.id === id)
        if (notificationIndex === -1) return
        
        const notification = visibleNotifications[notificationIndex]
        
        // Clear timeout if exists
        if (notification.timeout) {
            clearTimeout(notification.timeout)
        }
        
        // Animate out
        notification.element.style.opacity = '0'
        notification.element.style.transform = 'translateY(-10px)'
        
        // Remove from arrays
        visibleNotifications.splice(notificationIndex, 1)
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element)
            }
            
            // Clean up container if no notifications
            if (visibleNotifications.length === 0) {
                const container = document.getElementById(NOTIFICATION_CONTAINER_ID)
                if (container) {
                    container.remove()
                }
            }
            
            // Process queue
            processQueue()
        }, NOTIFICATION_FADE_DURATION)
    }

    const processQueue = () => {
        while (visibleNotifications.length < MAX_VISIBLE_NOTIFICATIONS && notificationQueue.length > 0) {
            const nextNotification = notificationQueue.shift()
            showNotification(nextNotification)
        }
    }

    const addToQueue = (message, type = 'default', autoRemove = true, duration = NOTIFICATION_DURATION) => {
        const id = ++notificationIdCounter
        
        const notificationData = {
            id,
            message,
            type,
            autoRemove,
            duration,
            timeout: null
        }
        
        if (visibleNotifications.length < MAX_VISIBLE_NOTIFICATIONS) {
            showNotification(notificationData)
        } else {
            notificationQueue.push(notificationData)
        }
        
        return id // Return ID for manual dismissal
    }

    // Public API
    return {
        // Main notification function
        show: (message, autoRemove = true, duration = NOTIFICATION_DURATION) => {
            return addToQueue(message, 'default', autoRemove, duration)
        },
        
        // Type-specific notification functions
        success: (message, autoRemove = true, duration = NOTIFICATION_DURATION) => {
            return addToQueue(message, 'success', autoRemove, duration)
        },
        
        error: (message, autoRemove = true, duration = NOTIFICATION_DURATION) => {
            return addToQueue(message, 'error', autoRemove, duration)
        },
        
        warning: (message, autoRemove = true, duration = NOTIFICATION_DURATION) => {
            return addToQueue(message, 'warning', autoRemove, duration)
        },
        
        info: (message, autoRemove = true, duration = NOTIFICATION_DURATION) => {
            return addToQueue(message, 'info', autoRemove, duration)
        },
        
        // Utility functions
        dismiss: dismissNotification,
        
        dismissAll: () => {
            // Clear queue
            notificationQueue.length = 0
            
            // Dismiss all visible notifications
            const ids = visibleNotifications.map(n => n.id)
            ids.forEach(id => dismissNotification(id))
        },
        
        getCount: () => {
            return {
                visible: visibleNotifications.length,
                queued: notificationQueue.length,
                total: visibleNotifications.length + notificationQueue.length
            }
        },
        
        // Configuration
        setMaxVisible: (max) => {
            if (max > 0) {
                MAX_VISIBLE_NOTIFICATIONS = max
            }
        },
        
        setDefaultDuration: (duration) => {
            if (duration > 0) {
                NOTIFICATION_DURATION = duration
            }
        }
    }
})();