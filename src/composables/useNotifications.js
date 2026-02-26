import { ref } from 'vue'

const permission = ref(Notification.permission)

export function useNotifications() {
  async function requestPermission() {
    if (permission.value === 'default') {
      const result = await Notification.requestPermission()
      permission.value = result
    }
    return permission.value
  }

  /**
   * Schedule a local notification for a chore instance.
   * Uses setTimeout — works for the current session.
   * For persistent reminders, a ServiceWorker periodic sync would be needed.
   */
  function scheduleNotification(title, body, fireAt) {
    if (permission.value !== 'granted') return null

    const delay = fireAt - Date.now()
    if (delay <= 0) return null

    const timerId = setTimeout(() => {
      const iconUrl = new URL('/pwa-192x192.png', window.location.origin).href

      // Try Service Worker first (preferred for PWA)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          icon: iconUrl,
        })
      } else if ('Notification' in window) {
        // Fallback: use Notification API directly
        try {
          new Notification(title, {
            body,
            icon: iconUrl,
            badge: iconUrl,
            tag: 'chore-reminder', // Prevents duplicates
          })
        } catch (e) {
          // Silently fail if notification creation fails
        }
      }
    }, delay)

    return timerId
  }

  /**
   * Schedule a reminder for a chore instance.
   * @param {string} choreTitle
   * @param {string} dateStr - YYYY-MM-DD
   * @param {string} timeSlot - HH:mm
   * @param {number} minutesBefore
   */
  function scheduleChoreReminder(choreTitle, dateStr, timeSlot, minutesBefore) {
    if (!timeSlot || !minutesBefore) return null

    const [hours, minutes] = timeSlot.split(':').map(Number)
    const fireAt = new Date(dateStr)
    fireAt.setHours(hours, minutes - minutesBefore, 0, 0)

    return scheduleNotification(
      `Chore Reminder: ${choreTitle}`,
      `Due at ${timeSlot}`,
      fireAt.getTime()
    )
  }

  return {
    permission,
    requestPermission,
    scheduleNotification,
    scheduleChoreReminder,
  }
}
