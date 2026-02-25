import { defineComponent } from 'vue'
import { useDisplay } from 'vuetify'
import SideNav from '@/components/layout/SideNav/index.vue'
import BottomNav from '@/components/layout/BottomNav/index.vue'

export default defineComponent({
  components: { SideNav, BottomNav },
  setup() {
    const { mobile } = useDisplay()
    return { mobile }
  },
})
