import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db/index.js'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])

  async function load() {
    categories.value = await db.categories.toArray()
  }

  async function add(category) {
    const id = await db.categories.add(category)
    categories.value.push({ ...category, id })
    return id
  }

  async function update(id, changes) {
    await db.categories.update(id, changes)
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) Object.assign(categories.value[idx], changes)
  }

  async function remove(id) {
    await db.categories.delete(id)
    categories.value = categories.value.filter(c => c.id !== id)
  }

  function getById(id) {
    return categories.value.find(c => c.id === id) || null
  }

  return { categories, load, add, update, remove, getById }
})
