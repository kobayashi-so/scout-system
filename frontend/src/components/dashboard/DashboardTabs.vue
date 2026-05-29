<template>
  <div class="mb-4 flex flex-wrap items-center gap-2">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="rounded-full px-4 py-2 text-sm font-semibold transition"
      :class="tab.key === modelValue
        ? 'bg-slate-900 text-white'
        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'"
      @click="onClickTab(tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface TabItem {
  key: 'my' | 'sales_pending' | 'final_pending'
  label: string
}

defineProps<{
  modelValue: TabItem['key']
  tabs: TabItem[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TabItem['key']): void
  (e: 'tab-click', value: TabItem['key']): void
}>()

function onClickTab(tabKey: TabItem['key']) {
  emit('update:modelValue', tabKey)
  emit('tab-click', tabKey)
}
</script>