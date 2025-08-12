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
        gap: '8px',
        maxWidth: '400px'
    })
    document.body.appendChild(container)
    return container
}

const createNotificationElement = (id, message, type = 'default') => {
    const notification = document.createElement('div')
    notification.id = `notification-${id}`
    notification.className = 'wfx-notification'
    
    // Base styles
    Object.assign(notification.style, {
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        wordWrap: 'break-word',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: `all ${NOTIFICATION_FADE_DURATION}ms ease-in-out`,
        cursor: 'pointer',
        pointerEvents: 'auto',
        position: 'relative',
        overflow: 'hidden'
    })
    
    // Type-specific styling
    const typeStyles = {
        default: { backgroundColor: '#555', color: '#eee', borderLeft: '4px solid #999' },
        success: { backgroundColor: '#4CAF50', color: '#fff', borderLeft: '4px solid #45a049' },
        error: { backgroundColor: '#f44336', color: '#fff', borderLeft: '4px solid #da190b' },
        warning: { backgroundColor: '#ff9800', color: '#000', borderLeft: '4px solid #f57c00' },
        info: { backgroundColor: '#2196F3', color: '#fff', borderLeft: '4px solid #1976D2' }
    }
    
    Object.assign(notification.style, typeStyles[type] || typeStyles.default)
    
    // Create close button
    const closeBtn = document.createElement('span')
    closeBtn.innerHTML = '×'
    Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '4px',
        right: '8px',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        opacity: '0.7',
        lineHeight: '1'
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
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        width: '100%',
        transformOrigin: 'left',
        transform: 'scaleX(1)'
    })
    
    notification.appendChild(closeBtn)
    notification.appendChild(progressBar)
    notification.innerHTML = message + closeBtn.outerHTML + progressBar.outerHTML
    
    // Click to dismiss
    notification.addEventListener('click', () => dismissNotification(id))
    
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
        element.style.transform = 'translateX(0)'
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
    notification.element.style.transform = 'translateX(100%)'
    
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

// Main notification function
const notify = (message, autoRemove = true, duration = NOTIFICATION_DURATION) => {
    return addToQueue(message, 'default', autoRemove, duration)
}

// Type-specific notification functions
const notifySuccess = (message, autoRemove = true, duration = NOTIFICATION_DURATION) => {
    return addToQueue(message, 'success', autoRemove, duration)
}

const notifyError = (message, autoRemove = true, duration = NOTIFICATION_DURATION) => {
    return addToQueue(message, 'error', autoRemove, duration)
}

const notifyWarning = (message, autoRemove = true, duration = NOTIFICATION_DURATION) => {
    return addToQueue(message, 'warning', autoRemove, duration)
}

const notifyInfo = (message, autoRemove = true, duration = NOTIFICATION_DURATION) => {
    return addToQueue(message, 'info', autoRemove, duration)
}

// Utility functions
const dismissAllNotifications = () => {
    // Clear queue
    notificationQueue.length = 0
    
    // Dismiss all visible notifications
    const ids = visibleNotifications.map(n => n.id)
    ids.forEach(id => dismissNotification(id))
}

const getNotificationCount = () => {
    return {
        visible: visibleNotifications.length,
        queued: notificationQueue.length,
        total: visibleNotifications.length + notificationQueue.length
    }
}

// Pause/resume functionality for when user hovers
const pauseNotification = (id) => {
    const notification = visibleNotifications.find(n => n.id === id)
    if (notification && notification.timeout) {
        clearTimeout(notification.timeout)
        const elapsed = Date.now() - notification.startTime
        notification.remainingTime = notification.duration - elapsed
        
        // Pause progress bar
        if (notification.progressBar) {
            notification.progressBar.style.animationPlayState = 'paused'
        }
    }
}

const resumeNotification = (id) => {
    const notification = visibleNotifications.find(n => n.id === id)
    if (notification && notification.remainingTime > 0) {
        notification.startTime = Date.now()
        notification.timeout = setTimeout(() => {
            dismissNotification(id)
        }, notification.remainingTime)
        
        // Resume progress bar
        if (notification.progressBar) {
            notification.progressBar.style.animationPlayState = 'running'
        }
    }
}
