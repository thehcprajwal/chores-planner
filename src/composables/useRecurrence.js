import dayjs from 'dayjs'

/**
 * Generates occurrence dates for a chore's recurrence rule
 * between startDate and endDate (exclusive).
 */
export function expandRecurrence(chore, fromDate, toDate) {
  if (!chore.recurrence || chore.isPaused) return []

  const { type, daysOfWeek, dayOfMonth, intervalDays, startDate, endDate } = chore.recurrence
  const start = dayjs(startDate)
  const from = dayjs(fromDate)
  const to = dayjs(toDate)
  const ruleEnd = endDate ? dayjs(endDate) : null

  const dates = []
  let cursor = start.isBefore(from) ? from : start

  // Clamp to rule end
  const actualEnd = ruleEnd && ruleEnd.isBefore(to) ? ruleEnd : to

  while (!cursor.isAfter(actualEnd)) {
    const dateStr = cursor.format('YYYY-MM-DD')

    switch (type) {
      case 'daily':
        dates.push(dateStr)
        cursor = cursor.add(1, 'day')
        break

      case 'weekly': {
        // daysOfWeek: 0=Sun, 1=Mon, ... 6=Sat
        const dow = cursor.day()
        if (daysOfWeek && daysOfWeek.includes(dow)) {
          dates.push(dateStr)
        }
        cursor = cursor.add(1, 'day')
        break
      }

      case 'monthly': {
        // dayOfMonth: 1–31
        if (cursor.date() === dayOfMonth) {
          dates.push(dateStr)
        }
        cursor = cursor.add(1, 'day')
        break
      }

      case 'custom': {
        // intervalDays: every N days from startDate
        const diff = cursor.diff(start, 'day')
        if (diff >= 0 && intervalDays && diff % intervalDays === 0) {
          dates.push(dateStr)
        }
        cursor = cursor.add(1, 'day')
        break
      }

      default:
        cursor = cursor.add(1, 'day')
    }
  }

  return dates
}

/**
 * Returns true if a chore should occur on a given date string (YYYY-MM-DD).
 */
export function choreOccursOn(chore, dateStr) {
  if (!chore.recurrence || chore.isPaused) return false

  const { type, daysOfWeek, dayOfMonth, intervalDays, startDate, endDate } = chore.recurrence
  const date = dayjs(dateStr)
  const start = dayjs(startDate)

  if (date.isBefore(start)) return false
  if (endDate && date.isAfter(dayjs(endDate))) return false

  switch (type) {
    case 'daily':
      return true
    case 'weekly':
      return daysOfWeek ? daysOfWeek.includes(date.day()) : false
    case 'monthly':
      return date.date() === dayOfMonth
    case 'custom':
      return intervalDays ? date.diff(start, 'day') % intervalDays === 0 : false
    default:
      return false
  }
}
