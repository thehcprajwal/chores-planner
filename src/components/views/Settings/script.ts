import { defineComponent, ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppShell      from '@/components/layout/AppShell/index.vue'
import TopBar        from '@/components/layout/TopBar/index.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog/index.vue'
import { useCategoriesStore } from '@/stores/categories.js'
import { useChoresStore }     from '@/stores/chores.js'
import { useSyncStore }       from '@/stores/sync.js'

export default defineComponent({
  components: { AppShell, TopBar, ConfirmDialog },
  setup() {
    const categoriesStore = useCategoriesStore()
    const choresStore     = useChoresStore()
    const syncStore       = useSyncStore()
    const fileInput       = ref(null)

    const snackbar = ref({ show: false, text: '', color: 'success' })
    function showSnack(text, color = 'success') { snackbar.value = { show: true, text, color } }

    const confirmState  = reactive({ open: false, title: '', message: '', confirmLabel: 'Delete', danger: true, action: null })
    const pendingImport = ref(null)
    function runConfirm() { confirmState.action?.() }
    function askConfirm(title, message, action, confirmLabel = 'Delete', danger = true) {
      Object.assign(confirmState, { title, message, action, confirmLabel, danger, open: true })
    }

    async function exportData() {
      const data = await choresStore.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `chores-backup-${dayjs().format('YYYY-MM-DD')}.json`
      a.click()
      URL.revokeObjectURL(url)
      showSnack('Backup downloaded!')
    }
    function triggerImport() { fileInput.value?.click() }
    async function importData(event) {
      const file = event.target.files[0]
      if (!file) return
      let data
      try { data = JSON.parse(await file.text()) } catch { showSnack('Invalid JSON', 'error'); return }
      pendingImport.value = data
      event.target.value = ''
      askConfirm('Replace all data?', 'This will overwrite everything with the backup file. This cannot be undone.', async () => {
        try {
          await choresStore.importData(pendingImport.value)
          await categoriesStore.load()
          showSnack('Imported successfully!')
        } catch (e) { showSnack(`Failed: ${e.message}`, 'error') }
        pendingImport.value = null
      }, 'Replace', true)
    }

    async function syncNow() {
      try {
        await syncStore.syncToFirestore()
        showSnack('Synced to cloud!')
      } catch (e) {
        showSnack('Sync failed. Check your connection.', 'error')
      }
    }

    const lastSyncLabel = computed(() => {
      if (!syncStore.lastSyncedAt) return 'Never synced'
      return `Last synced ${dayjs(syncStore.lastSyncedAt).format('MMM D, YYYY [at] h:mm A')}`
    })

    onMounted(() => {
      syncStore.loadLastSync()
    })

    return {
      fileInput, snackbar,
      confirmState, runConfirm,
      exportData, triggerImport, importData,
      syncStore, syncNow, lastSyncLabel,
    }
  },
})
