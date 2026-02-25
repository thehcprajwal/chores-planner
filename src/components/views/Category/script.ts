import { defineComponent, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell     from '@/components/layout/AppShell/index.vue'
import TopBar       from '@/components/layout/TopBar/index.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog/index.vue'
import { useChoresStore }     from '@/stores/chores.js'
import { useCategoriesStore } from '@/stores/categories.js'

export default defineComponent({
  components: { AppShell, TopBar, ConfirmDialog },
  setup() {
    const router          = useRouter()
    const choresStore     = useChoresStore()
    const categoriesStore = useCategoriesStore()

    const colorPalette = [
      '#EF4444','#F97316','#F59E0B','#10B981','#06B6D4',
      '#3B82F6','#5B5FDE','#8B5CF6','#EC4899','#64748B',
    ]
    const iconOptions = [
      { key: 'tag',           mdi: 'mdi-tag' },
      { key: 'dollar-sign',   mdi: 'mdi-currency-usd' },
      { key: 'user',          mdi: 'mdi-account' },
      { key: 'sparkles',      mdi: 'mdi-auto-fix' },
      { key: 'car',           mdi: 'mdi-car' },
      { key: 'bike',          mdi: 'mdi-bicycle' },
      { key: 'home',          mdi: 'mdi-home' },
      { key: 'heart',         mdi: 'mdi-heart' },
      { key: 'leaf',          mdi: 'mdi-leaf' },
      { key: 'wrench',        mdi: 'mdi-wrench' },
      { key: 'shopping-cart', mdi: 'mdi-cart' },
    ]
    const mdiIconMap = Object.fromEntries(iconOptions.map(o => [o.key, o.mdi]))

    const confirmState = reactive({ open: false, title: '', message: '', action: null })
    function runConfirm() { confirmState.action?.() }
    function askConfirm(title, message, action) {
      Object.assign(confirmState, { title, message, action, open: true })
    }

    const catFormOpen = ref(false)
    const editingCat  = ref(null)
    const catForm     = ref({ name: '', color: '#5B5FDE', icon: 'tag' })

    function openCategoryForm(cat = null) {
      editingCat.value = cat
      catForm.value = cat
        ? { name: cat.name, color: cat.color, icon: cat.icon }
        : { name: '', color: '#5B5FDE', icon: 'tag' }
      catFormOpen.value = true
    }
    async function saveCategoryForm() {
      if (!catForm.value.name.trim()) return
      if (editingCat.value) {
        await categoriesStore.update(editingCat.value.id, catForm.value)
      } else {
        await categoriesStore.add({ ...catForm.value })
      }
      catFormOpen.value = false
    }
    function deleteCategory(cat) {
      catFormOpen.value = false
      askConfirm(
        `Delete "${cat.name}"?`,
        'All chores in this category will lose their category.',
        () => categoriesStore.remove(cat.id)
      )
    }

    function getChoreCount(catId) {
      return choresStore.chores.filter(c => c.categoryId === catId).length
    }

    function goToCategory(id) {
      router.push(`/categories/${id}`)
    }

    onMounted(async () => {
      await categoriesStore.load()
      await choresStore.generateAllInstances()
    })

    return {
      categoriesStore,
      mdiIconMap, colorPalette, iconOptions,
      catFormOpen, editingCat, catForm,
      confirmState, runConfirm,
      openCategoryForm, saveCategoryForm, deleteCategory,
      getChoreCount, goToCategory,
    }
  },
})
