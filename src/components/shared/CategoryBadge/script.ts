import { defineComponent, computed } from 'vue'
import { useCategoriesStore } from '@/stores/categories.js'

export default defineComponent({
  props: {
    categoryId: { type: Number, default: null },
  },
  setup(props) {
    const store = useCategoriesStore()
    const category = computed(() => store.getById(props.categoryId))
    return { category }
  },
})
