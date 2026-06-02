<template>
  <div class="tabs-wrap">
    <div class="tabs-list">
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

    <!-- 右側に差し込める追加コンテンツ用スロット -->
    <div class="tabs-extra">
      <slot name="right" />
    </div>
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
  padding: 8px;
  border: 1px solid #d3e5de;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 253, 250, 0.94) 100%);
  box-shadow: 0 8px 18px rgba(7, 34, 28, 0.06);
}

.tabs-list {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tabs-extra {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}

/* スロット経由で親コンポーネントから挿入された `.tab-btn` にも
   同じスタイルを適用する（scoped のため ::v-deep を使用） */
.tabs-extra ::v-deep(.tab-btn) {
  border: 1px solid #cfe2da;
  border-radius: 999px;
  background: #ffffff;
  color: #37544c;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}
.tabs-extra ::v-deep(.tab-btn:hover) {
  background: #f3f8f5;
  transform: translateY(-1px);
  box-shadow: 0 8px 14px rgba(7, 34, 28, 0.08);
}
.tabs-extra ::v-deep(.tab-btn.is-active) {
  border-color: #0f766e;
  background: linear-gradient(135deg, #047857 0%, #10b981 100%);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(4, 120, 87, 0.22);
}

.tab-btn {
  border: 1px solid #cfe2da;
  border-radius: 999px;
  background: #ffffff;
  color: #37544c;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.tab-btn:hover {
  background: #f3f8f5;
  transform: translateY(-1px);
  box-shadow: 0 8px 14px rgba(7, 34, 28, 0.08);
}

.tab-btn.is-active {
  border-color: #0f766e;
  background: linear-gradient(135deg, #047857 0%, #10b981 100%);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(4, 120, 87, 0.22);
}
</style>