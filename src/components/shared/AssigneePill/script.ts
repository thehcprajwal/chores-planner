import { defineComponent, computed } from 'vue'
import { useAssigneesStore } from '@/stores/assignees.js'

export default defineComponent({
  props: {
    assigneeId: { type: Number, default: null },
  },
  setup(props) {
    const store = useAssigneesStore()
    const assignee = computed(() => store.getById(props.assigneeId))
    return { assignee }
  },
})
