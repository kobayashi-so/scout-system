<template>
  <div class="status-grid">
    <button
      type="button"
      class="status-card tone-emerald"
      :class="{ 'status-card-active': selectedKey === 'approved' }"
      @click="$emit('select', selectedKey === 'approved' ? 'all' : 'approved')"
    >
      <p class="label">承認済み件数</p>
      <p class="count">{{ stats.approved }}</p>
    </button>
    <button
      type="button"
      class="status-card tone-amber"
      :class="{ 'status-card-active': selectedKey === 'salesPending' }"
      @click="$emit('select', selectedKey === 'salesPending' ? 'all' : 'salesPending')"
    >
      <p class="label">営業承認者承認待ち件数</p>
      <p class="count">{{ stats.salesPending }}</p>
    </button>
    <button
      type="button"
      class="status-card tone-sky"
      :class="{ 'status-card-active': selectedKey === 'finalPending' }"
      @click="$emit('select', selectedKey === 'finalPending' ? 'all' : 'finalPending')"
    >
      <p class="label">管理者承認待ち件数</p>
      <p class="count">{{ stats.finalPending }}</p>
    </button>
    <button
      type="button"
      class="status-card tone-rose"
      :class="{ 'status-card-active': selectedKey === 'rejected' }"
      @click="$emit('select', selectedKey === 'rejected' ? 'all' : 'rejected')"
    >
      <p class="label">差戻し件数</p>
      <p class="count">{{ stats.rejected }}</p>
    </button>
  </div>
</template>

<script setup lang="ts">
export type StatusFilterKey = 'all' | 'approved' | 'salesPending' | 'finalPending' | 'rejected'

defineProps<{
  stats: {
    approved: number
    salesPending: number
    finalPending: number
    rejected: number
  }
  selectedKey: StatusFilterKey
}>()

defineEmits<{
  (e: 'select', value: StatusFilterKey): void
}>()
</script>

<style scoped>
.status-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.status-card {
  border: 1px solid #d8e4de;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(6, 34, 28, 0.06);
  text-align: left;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(6, 34, 28, 0.1);
}

.label {
  margin: 0;
  font-size: 12px;
  color: #567168;
  font-weight: 700;
}

.count {
  margin: 8px 0 0;
  font-size: 28px;
  font-weight: 800;
}

.tone-emerald .count {
  color: #047857;
}

.tone-amber .count {
  color: #b45309;
}

.tone-sky .count {
  color: #0369a1;
}

.tone-rose .count {
  color: #be123c;
}

.status-card-active {
  border-color: #0f766e;
  box-shadow: 0 0 0 2px rgba(15, 118, 110, 0.25);
  background: linear-gradient(180deg, #ffffff 0%, #f5fcf9 100%);
}

@media (min-width: 640px) {
  .status-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .status-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>