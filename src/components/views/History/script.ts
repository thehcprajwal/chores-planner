import { defineComponent, ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppShell from '@/components/layout/AppShell/index.vue'
import CategoryBadge from '@/components/shared/CategoryBadge/index.vue'
import { useChoresStore } from '@/stores/chores.js'
import { useCategoriesStore } from '@/stores/categories.js'

export default defineComponent({
  components: { AppShell, CategoryBadge },
  setup() {
    const choresStore     = useChoresStore()
    const categoriesStore = useCategoriesStore()

    const today        = dayjs().format('YYYY-MM-DD')
    const statusFilter = ref<'all' | 'done' | 'skipped'>('all')
    const rangeFilter  = ref<'7' | '30' | 'all'>('30')

    const cutoffDate = computed(() => {
      if (rangeFilter.value === 'all') return null
      return dayjs().subtract(Number(rangeFilter.value), 'day').format('YYYY-MM-DD')
    })

    const resolved = computed(() =>
      choresStore.instances
        .filter(i => {
          if (i.status === 'pending') return false
          if (i.date > today) return false
          if (cutoffDate.value && i.date < cutoffDate.value) return false
          if (statusFilter.value === 'done'    && i.status !== 'done')    return false
          if (statusFilter.value === 'skipped' && i.status !== 'skipped') return false
          return true
        })
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
    )

    // Group by date — keys are already sorted desc from outer sort
    const grouped = computed(() => {
      const map: Record<string, typeof resolved.value> = {}
      for (const inst of resolved.value) {
        if (!map[inst.date]) map[inst.date] = []
        map[inst.date].push(inst)
      }
      return map
    })

    const sortedDates = computed(() => Object.keys(grouped.value))

    function labelForDate(dateStr: string): string {
      const d    = dayjs(dateStr)
      const diff = dayjs(today).diff(d, 'day')
      if (diff === 0) return 'Today'
      if (diff === 1) return 'Yesterday'
      return d.format('ddd, MMM D')
    }

    function choreFor(choreId: number) {
      return choresStore.getChoreById(choreId)
    }

    function categoryFor(choreId: number) {
      const chore = choresStore.getChoreById(choreId)
      if (!chore?.categoryId) return null
      return categoriesStore.getById(chore.categoryId)
    }

    function accentColorFor(choreId: number): string {
      return categoryFor(choreId)?.color || 'var(--c-border-strong)'
    }

    function completionTime(inst: any): string | null {
      if (!inst.completedAt) return null
      return dayjs(inst.completedAt).format('h:mm A')
    }

    onMounted(async () => {
      await choresStore.generateAllInstances()
    })

    return {
      statusFilter,
      rangeFilter,
      grouped,
      sortedDates,
      labelForDate,
      choreFor,
      accentColorFor,
      completionTime,
    }
  },
})
