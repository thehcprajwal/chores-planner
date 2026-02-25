import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          // Brand — rich indigo-purple, used decisively not timidly
          primary:           '#5B5FDE',
          'primary-darken-1':'#4347C9',

          secondary:         '#78716C', // Warm stone-gray (Todoist-inspired)

          success:           '#059669', // Emerald
          warning:           '#D97706', // Amber
          error:             '#DC2626', // Red
          info:              '#2563EB',

          // Surfaces — warm off-white (Notion's exact approach)
          background:        '#F7F6F3', // Notion sidebar: #F7F6F3
          surface:           '#FFFFFF',
          'surface-variant': '#F0EEE9', // Warmer hover/secondary surface

          // Text — warm near-blacks, never pure #000
          'on-background':        '#1C1917', // Warm near-black (Todoist Zeus: #25221E)
          'on-surface':           '#1C1917',
          'on-surface-variant':   '#78716C', // Warm muted (Notion: #787774)
        },
      },
      dark: {
        colors: {
          primary:           '#818CF8', // Indigo-400 on dark
          'primary-darken-1':'#6366F1',
          secondary:         '#A8A29E',
          success:           '#34D399',
          warning:           '#FBBF24',
          error:             '#F87171',
          info:              '#60A5FA',
          background:        '#1C1917', // Warm dark (not purple-tinted like Linear)
          surface:           '#292524', // Warm dark surface
          'surface-variant': '#3C3836',
          'on-background':        '#F5F5F4',
          'on-surface':           '#F5F5F4',
          'on-surface-variant':   '#A8A29E',
        },
      },
    },
  },
  defaults: {
    // Flat by default — no elevation shadows on cards (like Todoist/Notion)
    VCard:      { rounded: 'lg', elevation: 0 },
    VBtn:       { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VSelect:    { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VTextarea:  { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VChip:      { rounded: 'md' },
    VList:      { bgColor: 'transparent' },
    VListItem:  { rounded: 'lg' },
    VDivider:   { color: 'rgba(0,0,0,0.07)' },
  },
})
