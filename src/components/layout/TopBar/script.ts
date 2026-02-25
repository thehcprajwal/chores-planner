import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

export default defineComponent({
  props: {
    title:    { type: String, default: '' },
    subtitle: { type: String, default: '' },
    back:     { type: Boolean, default: false },
  },
  setup() {
    const authStore = useAuthStore()
    const router    = useRouter()

    function goBack() { router.back() }

    const user        = computed(() => authStore.user)
    const userInitial = computed(() =>
      user.value?.displayName?.charAt(0)?.toUpperCase()
      || user.value?.email?.charAt(0)?.toUpperCase()
      || '?'
    )

    async function logout() {
      await authStore.logout()
      router.push('/login')
    }

    return { user, userInitial, logout, goBack }
  },
})
