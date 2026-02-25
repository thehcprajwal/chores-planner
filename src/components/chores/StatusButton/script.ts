import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    status: { type: String, default: 'pending' },
  },
  emits: ['done', 'skip'],
  setup() {
    return {}
  },
})
