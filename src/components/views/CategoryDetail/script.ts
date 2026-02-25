import { defineComponent, ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppShell     from '@/components/layout/AppShell/index.vue'
import TopBar       from '@/components/layout/TopBar/index.vue'
import ChoreForm    from '@/components/chores/ChoreForm/index.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog/index.vue'
import { useChoresStore }     from '@/stores/chores.js'
import { useCategoriesStore } from '@/stores/categories.js'

export default defineComponent({
  components: { AppShell, TopBar, ChoreForm, ConfirmDialog },
  setup() {
    const route           = useRoute()
    const choresStore     = useChoresStore()
    const categoriesStore = useCategoriesStore()

    const categoryId = computed(() => Number(route.params.id))
    const category   = computed(() => categoriesStore.getById(categoryId.value))
    const chores     = computed(() =>
      choresStore.chores.filter(c => c.categoryId === categoryId.value)
    )

    const formOpen     = ref(false)
    const editingChore = ref(null)

    const confirmState = reactive({ open: false, title: '', message: '', action: null })
    function runConfirm() { confirmState.action?.() }

    function openForm()    { editingChore.value = null; formOpen.value = true }
    function editChore(c)  { editingChore.value = c; formOpen.value = true }
    function deleteChore(c) {
      Object.assign(confirmState, {
        title:   `Delete "${c.title}"?`,
        message: 'This cannot be undone.',
        action:  () => choresStore.deleteChore(c.id),
        open:    true,
      })
    }
    async function togglePause(c) { await choresStore.togglePause(c.id) }
    async function onSaved()      { await choresStore.generateAllInstances() }

    const recurrenceLabelMap = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
    function recurrenceLabel(r) {
      return recurrenceLabelMap[r.type] || `Every ${r.intervalDays}d`
    }

    onMounted(async () => {
      await choresStore.generateAllInstances()
    })

    return {
      categoryId, category, chores,
      formOpen, editingChore,
      confirmState, runConfirm,
      openForm, editChore, deleteChore, togglePause, onSaved,
      recurrenceLabel,
    }
  },
})
