import { defineStore } from 'pinia'
import { ref } from 'vue'
import dayjs from 'dayjs'
import { db } from '@/db/index.js'
import { expandRecurrence } from '@/composables/useRecurrence.js'

// Strip Vue Proxy wrappers so IndexedDB structured clone doesn't fail
function toPlain(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export const useChoresStore = defineStore('chores', () => {
  const chores = ref([])
  const instances = ref([])

  // ── Load ──────────────────────────────────────────────────────────────────

  async function load() {
    chores.value = await db.chores.toArray()
    instances.value = await db.choreInstances.toArray()
  }

  // ── Chore CRUD ────────────────────────────────────────────────────────────

  async function addChore(chore) {
    const now = dayjs().toISOString()
    const data = toPlain({ ...chore, isPaused: false, createdAt: now })
    const id = await db.chores.add(data)
    const newChore = { ...data, id }
    chores.value.push(newChore)
    await generateInstances(newChore)
    return id
  }

  async function updateChore(id, changes) {
    const plain = toPlain(changes)
    await db.chores.update(id, plain)
    const idx = chores.value.findIndex(c => c.id === id)
    if (idx !== -1) Object.assign(chores.value[idx], plain)
  }

  async function deleteChore(id) {
    await db.chores.delete(id)
    await db.choreInstances.where('choreId').equals(id).delete()
    chores.value = chores.value.filter(c => c.id !== id)
    instances.value = instances.value.filter(i => i.choreId !== id)
  }

  async function togglePause(id) {
    const chore = chores.value.find(c => c.id === id)
    if (!chore) return
    const newPaused = !chore.isPaused
    await updateChore(id, { isPaused: newPaused })
  }

  // ── Instance Management ───────────────────────────────────────────────────

  /**
   * Generate ChoreInstance records for the next 60 days for all recurring chores.
   * Called on app open and daily via service worker.
   */
  async function generateAllInstances() {
    const today = dayjs().format('YYYY-MM-DD')
    const until = dayjs().add(60, 'day').format('YYYY-MM-DD')
    for (const chore of chores.value) {
      await generateInstances(chore, today, until)
    }
    instances.value = await db.choreInstances.toArray()
  }

  async function generateInstances(chore, from, to) {
    const today = from || dayjs().format('YYYY-MM-DD')
    const until = to || dayjs().add(60, 'day').format('YYYY-MM-DD')

    if (!chore.recurrence) {
      // One-off chore — only create an instance if none exists yet (don't re-create if date was moved)
      const inMemory = instances.value.some(i => i.choreId === chore.id)
      if (inMemory) return
      const existing = await db.choreInstances.where('choreId').equals(chore.id).first().catch(() => null)
      if (existing) {
        if (!instances.value.find(i => i.id === existing.id)) instances.value.push(existing)
        return
      }
      await ensureInstance(chore, today)
      return
    }

    const dates = expandRecurrence(chore, today, until)
    for (const date of dates) {
      await ensureInstance(chore, date)
    }
  }

  async function ensureInstance(chore, date) {
    // Check in-memory first (fast) before hitting DB
    const inMemory = instances.value.find(
      i => i.choreId === chore.id && i.date === date
    )
    if (inMemory) return

    // Double-check DB in case we loaded a partial set
    const existing = await db.choreInstances
      .where('choreId').equals(chore.id)
      .and(i => i.date === date)
      .first()
      .catch(() => null)

    if (existing) {
      // Sync back to memory if missing
      if (!instances.value.find(i => i.id === existing.id)) {
        instances.value.push(existing)
      }
      return
    }

    {
      const id = await db.choreInstances.add({
        choreId: chore.id,
        date,
        status: 'pending',
        timeSlot: chore.timeSlot || null,
        isOverridden: false,
        completedAt: null,
      })
      instances.value.push({
        id,
        choreId: chore.id,
        date,
        status: 'pending',
        timeSlot: chore.timeSlot || null,
        isOverridden: false,
        completedAt: null,
      })
    }
  }

  // ── One-off chore: create single instance ─────────────────────────────────

  async function addOneOffChore(chore) {
    const now = dayjs().toISOString()
    const date = chore.date || dayjs().format('YYYY-MM-DD')
    const choreData = toPlain({
      title: chore.title,
      description: chore.description || '',
      categoryId: chore.categoryId,
      timeSlot: chore.timeSlot || null,
      recurrence: null,
      isPaused: false,
      reminderMinutesBefore: chore.reminderMinutesBefore || null,
      createdAt: now,
    })
    const id = await db.chores.add(choreData)
    const newChore = { ...choreData, id }
    chores.value.push(newChore)

    // Create the single instance
    const instanceId = await db.choreInstances.add({
      choreId: id,
      date,
      status: 'pending',
      timeSlot: chore.timeSlot || null,
      isOverridden: false,
      completedAt: null,
    })
    instances.value.push({
      id: instanceId,
      choreId: id,
      date,
      status: 'pending',
      timeSlot: chore.timeSlot || null,
      isOverridden: false,
      completedAt: null,
    })

    return id
  }

  // ── Instance Status ───────────────────────────────────────────────────────

  async function setInstanceStatus(instanceId, status) {
    const completedAt = status === 'done' ? dayjs().toISOString() : null
    await db.choreInstances.update(instanceId, { status, completedAt })
    const idx = instances.value.findIndex(i => i.id === instanceId)
    if (idx !== -1) {
      instances.value[idx].status = status
      instances.value[idx].completedAt = completedAt
    }
  }

  // ── Edit recurring instance ───────────────────────────────────────────────

  /**
   * Edit a single instance (mark as overridden).
   */
  async function editInstance(instanceId, changes) {
    await db.choreInstances.update(instanceId, { ...changes, isOverridden: true })
    const idx = instances.value.findIndex(i => i.id === instanceId)
    if (idx !== -1) Object.assign(instances.value[idx], changes, { isOverridden: true })
  }

  /**
   * Edit all future instances of a recurring chore (update template + regenerate).
   */
  async function editAllFuture(choreId, changes, fromDate) {
    // Update the chore template
    await updateChore(choreId, changes)
    // Delete future non-overridden instances
    const toDelete = instances.value.filter(
      i => i.choreId === choreId && i.date >= fromDate && !i.isOverridden
    )
    for (const inst of toDelete) {
      await db.choreInstances.delete(inst.id)
    }
    instances.value = instances.value.filter(
      i => !(i.choreId === choreId && i.date >= fromDate && !i.isOverridden)
    )
    // Regenerate
    const chore = chores.value.find(c => c.id === choreId)
    if (chore) await generateInstances(chore, fromDate)
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  function getInstancesForDate(dateStr) {
    return instances.value.filter(i => i.date === dateStr)
  }

  function getInstancesForRange(from, to) {
    return instances.value.filter(i => i.date >= from && i.date <= to)
  }

  function getChoreById(id) {
    return chores.value.find(c => c.id === id) || null
  }

  function isOverdue(instance) {
    if (instance.status !== 'pending') return false
    const today = dayjs().format('YYYY-MM-DD')
    if (instance.date < today) return true
    if (instance.date === today && instance.timeSlot) {
      const [h, m] = instance.timeSlot.split(':').map(Number)
      return dayjs().isAfter(dayjs().startOf('day').add(h, 'hour').add(m, 'minute'))
    }
    return false
  }

  // ── Export / Import ───────────────────────────────────────────────────────

  async function exportData() {
    const [cats, assignees, allChores, allInstances] = await Promise.all([
      db.categories.toArray(),
      db.assignees.toArray(),
      db.chores.toArray(),
      db.choreInstances.toArray(),
    ])
    return {
      version: 1,
      exportedAt: dayjs().toISOString(),
      categories: cats,
      assignees,
      chores: allChores,
      choreInstances: allInstances,
    }
  }

  async function importData(data) {
    if (!data || data.version !== 1) throw new Error('Invalid backup format')
    await db.transaction('rw', [db.categories, db.assignees, db.chores, db.choreInstances], async () => {
      await db.categories.clear()
      await db.assignees.clear()
      await db.chores.clear()
      await db.choreInstances.clear()
      await db.categories.bulkAdd(data.categories)
      await db.assignees.bulkAdd(data.assignees)
      await db.chores.bulkAdd(data.chores)
      await db.choreInstances.bulkAdd(data.choreInstances)
    })
    await load()
  }

  return {
    chores,
    instances,
    load,
    addChore,
    addOneOffChore,
    updateChore,
    deleteChore,
    togglePause,
    generateAllInstances,
    setInstanceStatus,
    editInstance,
    editAllFuture,
    getInstancesForDate,
    getInstancesForRange,
    getChoreById,
    isOverdue,
    exportData,
    importData,
  }
})
