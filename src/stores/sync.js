import { ref } from 'vue'
import { defineStore } from 'pinia'
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore'
import { auth, firestore } from '@/plugins/firebase.js'
import { db as dexie } from '@/db/index.js'

const SYNC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export const useSyncStore = defineStore('sync', () => {
  const isSyncing = ref(false)
  const lastSyncedAt = ref(null)

  function uid() {
    return auth.currentUser?.uid
  }

  function syncKey() {
    return `lastSyncedAt:${uid()}`
  }

  function loadLastSync() {
    const stored = localStorage.getItem(syncKey())
    lastSyncedAt.value = stored ? new Date(stored) : null
  }

  function shouldAutoSync() {
    if (!lastSyncedAt.value) return true
    return Date.now() - lastSyncedAt.value.getTime() > SYNC_INTERVAL_MS
  }

  function userCol(name) {
    return collection(firestore, 'users', uid(), name)
  }

  async function clearFirestoreCollection(colRef) {
    const snap = await getDocs(colRef)
    if (snap.empty) return
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(firestore)
      snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref))
      await batch.commit()
    }
  }

  async function batchWriteToFirestore(colRef, items) {
    for (let i = 0; i < items.length; i += 400) {
      const batch = writeBatch(firestore)
      items.slice(i, i + 400).forEach(item => {
        const { id, ...data } = item
        batch.set(doc(colRef, String(id)), data)
      })
      await batch.commit()
    }
  }

  async function syncToFirestore() {
    if (!uid()) return
    isSyncing.value = true
    try {
      const [cats, chores, instances] = await Promise.all([
        dexie.categories.toArray(),
        dexie.chores.toArray(),
        dexie.choreInstances.toArray(),
      ])

      await Promise.all([
        clearFirestoreCollection(userCol('categories')),
        clearFirestoreCollection(userCol('chores')),
        clearFirestoreCollection(userCol('choreInstances')),
      ])

      await Promise.all([
        batchWriteToFirestore(userCol('categories'), cats),
        batchWriteToFirestore(userCol('chores'), chores),
        batchWriteToFirestore(userCol('choreInstances'), instances),
      ])

      const now = new Date().toISOString()
      localStorage.setItem(syncKey(), now)
      lastSyncedAt.value = new Date(now)
    } finally {
      isSyncing.value = false
    }
  }

  async function syncFromFirestore() {
    if (!uid()) return
    isSyncing.value = true
    try {
      const fetchCol = async (name) => {
        const snap = await getDocs(userCol(name))
        return snap.docs.map(d => {
          const data = d.data()
          const id = isNaN(Number(d.id)) ? d.id : Number(d.id)
          return { id, ...data }
        })
      }

      const [cats, chores, instances] = await Promise.all([
        fetchCol('categories'),
        fetchCol('chores'),
        fetchCol('choreInstances'),
      ])

      await dexie.transaction('rw', [
        dexie.categories,
        dexie.chores,
        dexie.choreInstances,
      ], async () => {
        await dexie.categories.clear()
        await dexie.chores.clear()
        await dexie.choreInstances.clear()
        if (cats.length) await dexie.categories.bulkAdd(cats)
        if (chores.length) await dexie.chores.bulkAdd(chores)
        if (instances.length) await dexie.choreInstances.bulkAdd(instances)
      })

      const now = new Date().toISOString()
      localStorage.setItem(syncKey(), now)
      lastSyncedAt.value = new Date(now)
    } finally {
      isSyncing.value = false
    }
  }

  async function hasFirestoreData() {
    if (!uid()) return false
    const snap = await getDocs(userCol('chores'))
    return !snap.empty
  }

  async function hasDexieData() {
    const count = await dexie.chores.count()
    return count > 0
  }

  async function clearLocalData() {
    await dexie.transaction('rw', [dexie.categories, dexie.chores, dexie.choreInstances], async () => {
      await dexie.categories.clear()
      await dexie.chores.clear()
      await dexie.choreInstances.clear()
    })
  }

  return {
    isSyncing,
    lastSyncedAt,
    loadLastSync,
    shouldAutoSync,
    syncToFirestore,
    syncFromFirestore,
    hasFirestoreData,
    hasDexieData,
    clearLocalData,
  }
})
