import { defineComponent, computed } from 'vue'

export default defineComponent({
  props: {
    modelValue:   { type: Boolean, required: true },
    title:        { type: String,  required: true },
    message:      { type: String,  default: '' },
    confirmLabel: { type: String,  default: 'Delete' },
    danger:       { type: Boolean, default: true },
  },
  emits: ['update:modelValue', 'confirm'],
  setup(props, { emit }) {
    const model = computed({
      get: () => props.modelValue,
      set: val => emit('update:modelValue', val),
    })
    function cancel()        { model.value = false }
    function handleConfirm() { emit('confirm'); model.value = false }
    return { model, cancel, handleConfirm }
  },
})
