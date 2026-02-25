import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  setup() {
    const route = useRoute()
    const activeTab = computed(() => route.path)

    const navItems = [
      { to: '/today',     label: 'Today',    icon: 'mdi-calendar-today-outline',  iconActive: 'mdi-calendar-today' },
      { to: '/week',      label: 'Week',     icon: 'mdi-calendar-week-outline',   iconActive: 'mdi-calendar-week' },
      { to: '/month',     label: 'Month',    icon: 'mdi-calendar-month-outline',  iconActive: 'mdi-calendar-month' },
      { to: '/history',   label: 'History',  icon: 'mdi-history',                 iconActive: 'mdi-history' },
      { to: '/settings',  label: 'Settings', icon: 'mdi-cog-outline',             iconActive: 'mdi-cog' },
    ]

    return { activeTab, navItems }
  },
})
