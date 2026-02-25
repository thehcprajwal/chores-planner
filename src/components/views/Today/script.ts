import { defineComponent, ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppShell  from '@/components/layout/AppShell/index.vue'
import TopBar    from '@/components/layout/TopBar/index.vue'
import ChoreCard from '@/components/chores/ChoreCard/index.vue'
import ChoreForm from '@/components/chores/ChoreForm/index.vue'
import { useChoresStore } from '@/stores/chores.js'

export default defineComponent({
  components: { AppShell, TopBar, ChoreCard, ChoreForm },
  setup() {
    const choresStore = useChoresStore()
    const today       = dayjs().format('YYYY-MM-DD')

    const dayOfWeek    = dayjs().format('dddd').toUpperCase()
    const formattedDate = dayjs().format('MMMM D, YYYY')
    const dayNumber    = dayjs().format('D')

    const formOpen        = ref(false)
    const editingChore    = ref(null)
    const editingInstance = ref(null)

    const todayInstances = computed(() => choresStore.getInstancesForDate(today))
    const overdue        = computed(() =>
      choresStore.instances.filter(i => i.date < today && i.status === 'pending')
    )
    const pendingCount = computed(() =>
      todayInstances.value.filter(i => i.status === 'pending').length
    )
    const overdueCount = computed(() => overdue.value.length)

    const groupedBySlot = computed(() => {
      const groups = {}
      const sorted = [...todayInstances.value].sort((a, b) =>
        (a.timeSlot || '99:99').localeCompare(b.timeSlot || '99:99')
      )
      for (const inst of sorted) {
        const key = inst.timeSlot || 'unscheduled'
        if (!groups[key]) groups[key] = []
        groups[key].push(inst)
      }
      return groups
    })

    function openForm()          { editingChore.value = null; editingInstance.value = null; formOpen.value = true }
    function onEdit(chore, inst) { editingChore.value = chore; editingInstance.value = inst; formOpen.value = true }
    async function onSaved()     { await choresStore.generateAllInstances() }
    onMounted(async ()           => { await choresStore.generateAllInstances() })

    return {
      dayOfWeek, formattedDate, dayNumber,
      formOpen, editingChore, editingInstance,
      todayInstances, overdue, pendingCount, overdueCount, groupedBySlot,
      openForm, onEdit, onSaved,
    }
  },
})
