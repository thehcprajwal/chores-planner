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
    const weekOffset      = ref(0)
    const formOpen        = ref(false)
    const editingChore    = ref(null)
    const editingInstance = ref(null)

    const weekStart = computed(() => dayjs().startOf('week').add(weekOffset.value, 'week'))
    const weekLabel = computed(() => {
      const end = weekStart.value.add(6, 'day')
      return `${weekStart.value.format('MMM D')} – ${end.format('MMM D')}`
    })
    const weekDays = computed(() =>
      Array.from({ length: 7 }, (_, i) => {
        const d = weekStart.value.add(i, 'day')
        return {
          dateStr: d.format('YYYY-MM-DD'),
          dayName: d.format('ddd'),
          dayNum:  d.date(),
          isToday: d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'),
        }
      })
    )

    function chipStatus(inst) {
      if (inst.status === 'done')    return 'done'
      if (inst.status === 'skipped') return 'skip'
      if (choresStore.isOverdue(inst)) return 'overdue'
      return 'default'
    }
    function getInstancesForDate(d) { return choresStore.getInstancesForDate(d) }
    function getChore(inst)         { return choresStore.getChoreById(inst.choreId) }
    function prevWeek()             { weekOffset.value-- }
    function nextWeek()             { weekOffset.value++ }
    function openForm()             { editingChore.value = null; editingInstance.value = null; formOpen.value = true }
    function openEditForInstance(inst) {
      editingInstance.value = inst
      editingChore.value    = choresStore.getChoreById(inst.choreId)
      formOpen.value        = true
    }
    async function onSaved() { await choresStore.generateAllInstances() }
    onMounted(async ()       => { await choresStore.generateAllInstances() })

    return {
      weekLabel, weekDays, formOpen, editingChore, editingInstance,
      chipStatus, getInstancesForDate, getChore,
      prevWeek, nextWeek, openForm, openEditForInstance, onSaved,
    }
  },
})
