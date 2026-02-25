import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db/index.js'

export const useAssigneesStore = defineStore('assignees', () => {
  const assignees = ref([])

  async function load() {
    assignees.value = await db.assignees.toArray()
  }

  async function add(assignee) {
    const id = await db.assignees.add(assignee)
    assignees.value.push({ ...assignee, id })
    return id
  }

  async function update(id, changes) {
    await db.assignees.update(id, changes)
    const idx = assignees.value.findIndex(a => a.id === id)
    if (idx !== -1) Object.assign(assignees.value[idx], changes)
  }

  async function remove(id) {
    await db.assignees.delete(id)
    assignees.value = assignees.value.filter(a => a.id !== id)
  }

  function getById(id) {
    return assignees.value.find(a => a.id === id) || null
  }

  return { assignees, load, add, update, remove, getById }
})
