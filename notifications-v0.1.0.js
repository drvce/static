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
        
        // Notification card base styles
        Object.assign(notification.style, {
            padding: '20px 24px',
            borderRadius: '24px',
            border: 'none',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
            fontSize: '15px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: '500',
            lineHeight: '1.4',
            wordWrap: 'break-word',
            opacity: '0',
            transform: 'translateY(-10px) scale(0.95)',
            transition: `all ${NOTIFICATION_FADE_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
            cursor: 'pointer',
            pointerEvents: 'auto',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '64px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
        })
        
        // Card-style type-specific colors
        const typeStyles = {
            default: { 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                color: '#1f2937'
            },
            success: { 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#059669'
            },
            error: { 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#dc2626'
            },
            warning: { 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#d97706'
            },
            info: { 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#2563eb'
            }
        }
        
        Object.assign(notification.style, typeStyles[type] || typeStyles.default)
        
        // Create icon container with circular background
        const iconContainer = document.createElement('div')
        Object.assign(iconContainer.style, {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: '0',
            fontSize: '18px',
            fontWeight: '600',
            marginTop: '2px'
        })
        
        // Icon background colors based on type
        const iconBackgrounds = {
            default: { backgroundColor: '#f3f4f6', color: '#6b7280' },
            success: { backgroundColor: '#dcfce7', color: '#16a34a' },
            error: { backgroundColor: '#fee2e2', color: '#dc2626' },
            warning: { backgroundColor: '#fef3c7', color: '#d97706' },
            info: { backgroundColor: '#dbeafe', color: '#2563eb' }
        }
        
        Object.assign(iconContainer.style, iconBackgrounds[type] || iconBackgrounds.default)
        
        const icons = {
            default: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        }
        iconContainer.textContent = icons[type] || icons.default
        
        // Create message container
        const messageContainer = document.createElement('span')
        messageContainer.style.flex = '1'
        messageContainer.textContent = message
        
        // Create close button
        const closeBtn = document.createElement('button')
        closeBtn.innerHTML = '×'
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            fontSize: '20px',
            fontWeight: '300',
            cursor: 'pointer',
            opacity: '0.4',
            lineHeight: '1',
            padding: '8px',
            borderRadius: '50%',
            color: '#6b7280',
            flexShrink: '0',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms ease-in-out',
            position: 'absolute',
            top: '16px',
            right: '16px'
        })
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.opacity = '0.8'
            closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.08)'
        })
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.opacity = '0.4'
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
            height: '3px',
            backgroundColor: notification.style.color || '#6b7280',
            width: '100%',
            transformOrigin: 'left',
            transform: 'scaleX(1)',
            opacity: '0.3',
            borderRadius: '0 0 24px 24px'
        })
        
        // Assemble notification
        notification.appendChild(iconContainer)
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
            notification.style.transform = 'translateY(-4px) scale(1.02)'
            notification.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)'
        })
        
        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateY(0) scale(1)'
            notification.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
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
            element.style.transform = 'translateY(0) scale(1)'
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
        notification.element.style.transform = 'translateY(-10px) scale(0.95)'
        
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