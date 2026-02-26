import { createApp } from 'vue'
import { createPinia } from 'pinia'
import dayjs from 'dayjs'
import './styles/tokens.css'
import './styles/global.css'
import './styles/patterns.css'
import App from './App.vue'
import { router } from './router/index.js'
import vuetify from './plugins/vuetify.js'
import { useAuthStore } from './stores/auth.js'
import { useSyncStore } from './stores/sync.js'
import { useCategoriesStore } from './stores/categories.js'
import { useChoresStore } from './stores/chores.js'
import { useNotifications } from './composables/useNotifications.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

router.isReady().then(async () => {
  const authStore = useAuthStore()
  const user = await authStore.waitForReady()

  if (user) {
    const syncStore = useSyncStore()
    const categoriesStore = useCategoriesStore()
    const choresStore = useChoresStore()

    const currentUid = user.uid
    const prevUid = localStorage.getItem('activeUid')

    syncStore.loadLastSync()

    let hasDexie, hasFirestore

    if (prevUid && prevUid !== currentUid) {
      // Different user's data is sitting in local DB — wipe it
      await syncStore.clearLocalData()
      hasDexie = false
      hasFirestore = await syncStore.hasFirestoreData()
    } else {
      ;[hasDexie, hasFirestore] = await Promise.all([
        syncStore.hasDexieData(),
        syncStore.hasFirestoreData(),
      ])
    }

    localStorage.setItem('activeUid', currentUid)

    if (!hasDexie && hasFirestore) {
      await syncStore.syncFromFirestore()
    } else if (syncStore.shouldAutoSync()) {
      syncStore.syncToFirestore().catch(console.error)
    }

    await Promise.all([
      categoriesStore.load(),
      choresStore.load(),
    ])

    await choresStore.generateAllInstances()

    // Schedule reminders for all today's pending chores that have time + reminder set
    const today = dayjs().format('YYYY-MM-DD')
    const { scheduleChoreReminder } = useNotifications()

    for (const instance of choresStore.instances) {
      if (instance.date !== today || instance.status !== 'pending') continue
      const chore = choresStore.chores.find(c => c.id === instance.choreId)
      if (!chore?.timeSlot || !chore?.reminderMinutesBefore) continue
      scheduleChoreReminder(chore.title, today, chore.timeSlot, chore.reminderMinutesBefore)
    }
  }
})

app.mount('#app')
