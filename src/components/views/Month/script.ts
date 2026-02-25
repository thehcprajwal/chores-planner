import { defineComponent, ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppShell from '@/components/layout/AppShell/index.vue'
import TopBar   from '@/components/layout/TopBar/index.vue'
import ChoreForm from '@/components/chores/ChoreForm/index.vue'
import { useChoresStore } from '@/stores/chores.js'

export default defineComponent({
  components: { AppShell, TopBar, ChoreForm },
  setup() {
    const choresStore     = useChoresStore()
    const monthOffset     = ref(0)
    const formOpen        = ref(false)
    const editingChore    = ref(null)
    const editingInstance = ref(null)

    const currentMonth = computed(() => dayjs().startOf('month').add(monthOffset.value, 'month'))
    const monthLabel   = computed(() => currentMonth.value.format('MMMM YYYY'))

    const calendarCells = computed(() => {
      const start      = currentMonth.value
      const daysInMonth = start.daysInMonth()
      const firstDow   = start.day()
      const cells      = []
      for (let i = 0; i < firstDow; i++)
        cells.push({ key: `e-${i}`, dayNum: null, dateStr: null, isToday: false })
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = start.date(d).format('YYYY-MM-DD')
        cells.push({ key: dateStr, dayNum: d, dateStr, isToday: dateStr === dayjs().format('YYYY-MM-DD') })
      }
      return cells
    })

    function chipStatus(inst) {
      if (inst.status === 'done')    return 'done'
      if (inst.status === 'skipped') return 'skip'
      if (choresStore.isOverdue(inst)) return 'overdue'
      return 'default'
    }
    function getInstancesForDate(d) { return choresStore.getInstancesForDate(d) }
    function getChore(inst)         { return choresStore.getChoreById(inst.choreId) }
    function prevMonth()            { monthOffset.value-- }
    function nextMonth()            { monthOffset.value++ }
    function openForm()             { editingChore.value = null; editingInstance.value = null; formOpen.value = true }
    function openEditForInstance(inst) {
      editingInstance.value = inst
      editingChore.value    = choresStore.getChoreById(inst.choreId)
      formOpen.value        = true
    }
    async function onSaved() { await choresStore.generateAllInstances() }
    onMounted(async ()       => { await choresStore.generateAllInstances() })

    return {
      monthLabel, calendarCells, formOpen, editingChore, editingInstance,
      chipStatus, getInstancesForDate, getChore,
      prevMonth, nextMonth, openForm, openEditForInstance, onSaved,
    }
  },
})
