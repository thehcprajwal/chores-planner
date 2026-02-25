import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useSyncStore } from '@/stores/sync.js'
import { useCategoriesStore } from '@/stores/categories.js'
import { useChoresStore } from '@/stores/chores.js'

export default defineComponent({
  setup() {
    const router          = useRouter()
    const authStore       = useAuthStore()
    const syncStore       = useSyncStore()
    const categoriesStore = useCategoriesStore()
    const choresStore     = useChoresStore()

    const loading = ref(false)
    const error   = ref('')

    async function signInWithGoogle() {
      loading.value = true
      error.value = ''
      try {
        await authStore.signInWithGoogle()

        const currentUid = authStore.user.uid
        const prevUid = localStorage.getItem('activeUid')

        syncStore.loadLastSync()

        let hasDexie: boolean
        let hasFirestore: boolean

        if (prevUid && prevUid !== currentUid) {
          // Different user — wipe whatever is in local DB first
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

        router.push('/today')
      } catch (e) {
        error.value = 'Sign in failed. Please try again.'
      } finally {
        loading.value = false
      }
    }

    return { signInWithGoogle, loading, error, authStore }
  },
})
