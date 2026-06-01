<template>
  <div class="tabs-wrap">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="tab-btn"
      :class="{ 'is-active': tab.key === modelValue }"
      @click="onClickTab(tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface TabItem {
  key: 'my' | 'sales_pending' | 'final_pending' | 'trash'
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

<style scoped>
.tabs-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  border: 1px solid #d8e4de;
  border-radius: 999px;
  background: #ffffff;
  color: #37544c;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.tab-btn:hover {
  background: #f3f8f5;
}

.tab-btn.is-active {
  border-color: #0f766e;
  background: linear-gradient(135deg, #047857 0%, #10b981 100%);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(4, 120, 87, 0.22);
}
</style>