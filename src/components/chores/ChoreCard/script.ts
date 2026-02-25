import { defineComponent, computed, ref } from 'vue'
import CategoryBadge from '@/components/shared/CategoryBadge/index.vue'
import { useChoresStore } from '@/stores/chores.js'
import { useCategoriesStore } from '@/stores/categories.js'
import dayjs from 'dayjs'

export default defineComponent({
  components: { CategoryBadge },
  props: {
    instance: { type: Object, required: true },
  },
  emits: ['edit'],
  setup(props) {
    const choresStore = useChoresStore()
    const categoriesStore = useCategoriesStore()

    const chore = computed(() => choresStore.getChoreById(props.instance.choreId))
    const category = computed(() =>
      categoriesStore.categories.find(c => c.id === chore.value?.categoryId)
    )
    const accentColor = computed(() => category.value?.color ?? 'var(--c-primary)')
    const isOverdue = computed(() => {
      if (props.instance.status !== 'pending') return false
      const today = dayjs().format('YYYY-MM-DD')
      if (props.instance.date < today) return true
      if (props.instance.date === today && props.instance.timeSlot) {
        const [h, m] = props.instance.timeSlot.split(':').map(Number)
        return dayjs().isAfter(dayjs().startOf('day').add(h, 'hour').add(m, 'minute'))
      }
      return false
    })

    function formatTime(timeStr) {
      if (!timeStr) return ''
      const [h, m] = timeStr.split(':').map(Number)
      const period = h >= 12 ? 'PM' : 'AM'
      const hour = h % 12 || 12
      return `${hour}:${String(m).padStart(2, '0')} ${period}`
    }

    const toggling = ref(false)

    async function handleDone() {
      if (toggling.value) return
      toggling.value = true
      await choresStore.setInstanceStatus(
        props.instance.id,
        props.instance.status === 'done' ? 'pending' : 'done'
      )
      toggling.value = false
    }
    async function handleSkip() {
      if (toggling.value) return
      toggling.value = true
      await choresStore.setInstanceStatus(
        props.instance.id,
        props.instance.status === 'skipped' ? 'pending' : 'skipped'
      )
      toggling.value = false
    }

    return { chore, accentColor, isOverdue, toggling, formatTime, handleDone, handleSkip }
  },
})
