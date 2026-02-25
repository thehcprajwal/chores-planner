import { defineComponent, ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import RecurrenceEditor from '@/components/chores/RecurrenceEditor/index.vue'
import { useChoresStore } from '@/stores/chores.js'
import { useCategoriesStore } from '@/stores/categories.js'
import { useNotifications } from '@/composables/useNotifications.js'
import dayjs from 'dayjs'

export default defineComponent({
  components: { RecurrenceEditor },
  props: {
    isOpen:            { type: Boolean, default: false },
    editChore:         { type: Object,  default: null },
    editInstance:      { type: Object,  default: null },
    defaultCategoryId: { type: Number,  default: null },
  },
  emits: ['update:isOpen', 'saved'],
  setup(props, { emit }) {
    const { mobile } = useDisplay()

    const choresStore     = useChoresStore()
    const categoriesStore = useCategoriesStore()
    const { requestPermission } = useNotifications()

    const formRef       = ref(null)
    const isEditing     = ref(false)
    const showEditScope = ref(false)
    const dateDialog    = ref(false)
    const timeDialog    = ref(false)
    const categoryError = ref(false)
    let pendingChanges  = null

    const reminderOptions = [
      { label: 'No reminder',   value: null },
      { label: '15 min before', value: 15 },
      { label: '30 min before', value: 30 },
      { label: '1 hour before', value: 60 },
    ]

    const defaultForm = () => ({
      title: '',
      description: '',
      categoryId: props.defaultCategoryId ?? null,
      date: dayjs().format('YYYY-MM-DD'),
      timeSlot: null,
      recurrence: null,
      reminderMinutesBefore: null,
    })

    const form = ref(defaultForm())

    const isOpen = ref(props.isOpen)
    watch(() => props.isOpen, v => { isOpen.value = v })
    watch(isOpen, v => { emit('update:isOpen', v) })

    watch(() => props.isOpen, (open) => {
      if (open) {
        if (props.editChore) {
          isEditing.value = true
          form.value = {
            title:                 props.editChore.title,
            description:           props.editChore.description || '',
            categoryId:            props.editChore.categoryId,
            date:                  props.editInstance?.date || dayjs().format('YYYY-MM-DD'),
            timeSlot:              props.editChore.timeSlot || null,
            recurrence:            props.editChore.recurrence ? { ...props.editChore.recurrence } : null,
            reminderMinutesBefore: props.editChore.reminderMinutesBefore || null,
          }
        } else {
          isEditing.value = false
          form.value = defaultForm()
        }
      }
    })

    const selectedCategory = computed(() =>
      categoriesStore.categories.find(c => c.id === form.value.categoryId)
    )
    const selectedReminderLabel = computed(() => {
      const opt = reminderOptions.find(o => o.value === form.value.reminderMinutesBefore)
      return opt ? opt.label : 'Reminder'
    })

    function formatTime(timeStr) {
      if (!timeStr) return ''
      const [h, m] = timeStr.split(':').map(Number)
      const period = h >= 12 ? 'PM' : 'AM'
      const hour = h % 12 || 12
      return `${hour}:${String(m).padStart(2, '0')} ${period}`
    }

    const datePickerModel = computed(() => {
      if (!form.value.date) return null
      const [y, m, d] = form.value.date.split('-').map(Number)
      return new Date(y, m - 1, d)
    })
    function onDateSelected(val) {
      const date = Array.isArray(val) ? val[0] : val
      if (date) {
        form.value.date = dayjs(date).format('YYYY-MM-DD')
        dateDialog.value = false
      }
    }

    const timePickerModel = computed(() => form.value.timeSlot || '')
    function onTimeSelected(val) {
      if (val) form.value.timeSlot = val.substring(0, 5)
    }

    function formatDateLabel(dateStr) {
      if (!dateStr) return 'Today'
      const d = dayjs(dateStr)
      if (d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) return 'Today'
      if (d.format('YYYY-MM-DD') === dayjs().add(1, 'day').format('YYYY-MM-DD')) return 'Tomorrow'
      return d.format('MMM D')
    }

    function close() { isOpen.value = false }

    async function handleSubmit() {
      const { valid } = await formRef.value.validate()
      if (!valid) return
      if (!form.value.categoryId) { categoryError.value = true; return }
      if (isEditing.value && props.editChore?.recurrence) {
        pendingChanges = { ...form.value }
        showEditScope.value = true
        return
      }
      await saveChore()
    }

    async function applyEdit(scope) {
      showEditScope.value = false
      if (scope === 'instance') {
        await choresStore.editInstance(props.editInstance.id, {
          date: pendingChanges.date,
          timeSlot: pendingChanges.timeSlot || null,
        })
      } else {
        const changes = {
          title:                 pendingChanges.title,
          description:           pendingChanges.description,
          categoryId:            pendingChanges.categoryId,
          timeSlot:              pendingChanges.timeSlot || null,
          recurrence:            pendingChanges.recurrence,
          reminderMinutesBefore: pendingChanges.reminderMinutesBefore,
        }
        await choresStore.editAllFuture(props.editChore.id, changes, props.editInstance.date)
      }
      emit('saved')
      close()
    }

    async function saveChore() {
      if (form.value.reminderMinutesBefore) {
        await requestPermission()
      }
      const choreData = {
        title:                 form.value.title,
        description:           form.value.description,
        categoryId:            form.value.categoryId,
        timeSlot:              form.value.timeSlot || null,
        recurrence:            form.value.recurrence || null,
        reminderMinutesBefore: form.value.reminderMinutesBefore || null,
      }
      if (isEditing.value) {
        await choresStore.updateChore(props.editChore.id, choreData)
        if (!props.editChore.recurrence && props.editInstance) {
          await choresStore.editInstance(props.editInstance.id, {
            date: form.value.date,
            timeSlot: form.value.timeSlot || null,
          })
        }
      } else if (form.value.recurrence) {
        choreData.recurrence.startDate = choreData.recurrence.startDate || form.value.date
        await choresStore.addChore(choreData)
      } else {
        await choresStore.addOneOffChore({ ...choreData, date: form.value.date })
      }
      emit('saved')
      close()
    }

    return {
      mobile, form, formRef, isEditing, isOpen, showEditScope, dateDialog, timeDialog,
      categoryError, reminderOptions, categoriesStore,
      selectedCategory, selectedReminderLabel,
      formatTime, datePickerModel, timePickerModel,
      onDateSelected, onTimeSelected, formatDateLabel,
      close, handleSubmit, applyEdit,
    }
  },
})
