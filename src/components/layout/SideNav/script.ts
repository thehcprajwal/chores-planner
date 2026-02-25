import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
    const navItems = [
      { to: '/today',      label: 'Today',      icon: 'mdi-calendar-today' },
      { to: '/week',       label: 'Week',       icon: 'mdi-calendar-week' },
      { to: '/month',      label: 'Month',      icon: 'mdi-calendar-month-outline' },
      { to: '/categories', label: 'Categories', icon: 'mdi-tag-outline' },
      { to: '/history',    label: 'History',    icon: 'mdi-history' },
      { to: '/settings',   label: 'Settings',   icon: 'mdi-cog-outline' },
    ]
    return { navItems }
  },
})
