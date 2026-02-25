import { defineComponent, ref, watch } from 'vue'
import dayjs from 'dayjs'

export default defineComponent({
  props: {
    modelValue: { type: Object, default: null },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    const recurrenceTypes = [
      { label: 'None',    value: '' },
      { label: 'Daily',   value: 'daily' },
      { label: 'Weekly',  value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
      { label: 'Custom',  value: 'custom' },
    ]

    const localType         = ref(props.modelValue?.type || '')
    const localDaysOfWeek   = ref(props.modelValue?.daysOfWeek   ? [...props.modelValue.daysOfWeek] : [])
    const localDayOfMonth   = ref(props.modelValue?.dayOfMonth   || dayjs().date())
    const localIntervalDays = ref(props.modelValue?.intervalDays || 7)
    const localStartDate    = ref(props.modelValue?.startDate    || dayjs().format('YYYY-MM-DD'))
    const localEndDate      = ref(props.modelValue?.endDate      || '')

    // Sync state when the form opens with an existing chore (edit mode)
    watch(() => props.modelValue, (val) => {
      localType.value         = val?.type         || ''
      localDaysOfWeek.value   = val?.daysOfWeek   ? [...val.daysOfWeek] : []
      localDayOfMonth.value   = val?.dayOfMonth   || dayjs().date()
      localIntervalDays.value = val?.intervalDays || 7
      localStartDate.value    = val?.startDate    || dayjs().format('YYYY-MM-DD')
      localEndDate.value      = val?.endDate      || ''
    })

    function selectType(val) {
      localType.value = localType.value === val && val !== '' ? '' : val
      // Smart defaults so recurrence actually generates instances
      if (localType.value === 'weekly' && localDaysOfWeek.value.length === 0) {
        localDaysOfWeek.value = [dayjs().day()]
      }
      if (localType.value === 'monthly') {
        localDayOfMonth.value = dayjs().date()
      }
    }

    function toggleDay(idx) {
      const i = localDaysOfWeek.value.indexOf(idx)
      if (i === -1) localDaysOfWeek.value.push(idx)
      else localDaysOfWeek.value.splice(i, 1)
    }

    function emitValue() {
      if (!localType.value) {
        emit('update:modelValue', null)
        return
      }
      const rule = {
        type:      localType.value,
        startDate: localStartDate.value,
        endDate:   localEndDate.value || undefined,
      }
      if (localType.value === 'weekly')  rule.daysOfWeek   = [...localDaysOfWeek.value]
      if (localType.value === 'monthly') rule.dayOfMonth   = localDayOfMonth.value
      if (localType.value === 'custom')  rule.intervalDays = localIntervalDays.value
      emit('update:modelValue', rule)
    }

    watch(
      [localType, localDaysOfWeek, localDayOfMonth, localIntervalDays, localStartDate, localEndDate],
      emitValue,
      { deep: true }
    )

    return {
      weekDays, recurrenceTypes,
      localType, localDaysOfWeek, localDayOfMonth, localIntervalDays,
      localStartDate, localEndDate,
      selectType, toggleDay,
    }
  },
})
