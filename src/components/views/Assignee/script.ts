import { defineComponent, ref, reactive, onMounted } from 'vue'
import AppShell      from '@/components/layout/AppShell/index.vue'
import TopBar        from '@/components/layout/TopBar/index.vue'
import CategoryBadge from '@/components/shared/CategoryBadge/index.vue'
import ChoreForm     from '@/components/chores/ChoreForm/index.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog/index.vue'
import { useChoresStore }    from '@/stores/chores.js'
import { useAssigneesStore } from '@/stores/assignees.js'

export default defineComponent({
  components: { AppShell, TopBar, CategoryBadge, ChoreForm, ConfirmDialog },
  setup() {
    const choresStore    = useChoresStore()
    const assigneesStore = useAssigneesStore()
    const formOpen       = ref(false)
    const editingChore   = ref(null)

    const confirmState = reactive({ open: false, title: '', message: '', action: null })
    function runConfirm() { confirmState.action?.() }
    function askConfirm(title, message, action) {
      confirmState.title   = title
      confirmState.message = message
      confirmState.action  = action
      confirmState.open    = true
    }

    const recurrenceLabelMap = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
    function recurrenceLabel(r)       { return recurrenceLabelMap[r.type] || `Every ${r.intervalDays}d` }
    function getChoresForAssignee(id) { return choresStore.chores.filter(c => c.assigneeId === id) }
    function openForm()               { editingChore.value = null; formOpen.value = true }
    function editChore(c)             { editingChore.value = c; formOpen.value = true }
    function deleteChore(c)           { askConfirm(`Delete "${c.title}"?`, 'This cannot be undone.', () => choresStore.deleteChore(c.id)) }
    async function onSaved()          { await choresStore.generateAllInstances() }
    onMounted(async ()                => { await assigneesStore.load() })

    return {
      assigneesStore, formOpen, editingChore, confirmState,
      recurrenceLabel, getChoresForAssignee,
      openForm, editChore, deleteChore, onSaved, runConfirm,
    }
  },
})
