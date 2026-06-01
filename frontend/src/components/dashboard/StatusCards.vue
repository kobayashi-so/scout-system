<template>
  <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <button
      type="button"
      class="status-card rounded-xl border border-emerald-200 bg-white p-4"
      :class="{ 'status-card-active': selectedKey === 'approved' }"
      @click="$emit('select', selectedKey === 'approved' ? 'all' : 'approved')"
    >
      <p class="text-xs text-slate-500">承認済み件数</p>
      <p class="mt-1 text-2xl font-bold text-emerald-600">{{ stats.approved }}</p>
    </button>
    <button
      type="button"
      class="status-card rounded-xl border border-amber-200 bg-white p-4"
      :class="{ 'status-card-active': selectedKey === 'salesPending' }"
      @click="$emit('select', selectedKey === 'salesPending' ? 'all' : 'salesPending')"
    >
      <p class="text-xs text-slate-500">営業承認者承認待ち件数</p>
      <p class="mt-1 text-2xl font-bold text-amber-600">{{ stats.salesPending }}</p>
    </button>
    <button
      type="button"
      class="status-card rounded-xl border border-blue-200 bg-white p-4"
      :class="{ 'status-card-active': selectedKey === 'finalPending' }"
      @click="$emit('select', selectedKey === 'finalPending' ? 'all' : 'finalPending')"
    >
      <p class="text-xs text-slate-500">管理者承認待ち件数</p>
      <p class="mt-1 text-2xl font-bold text-blue-600">{{ stats.finalPending }}</p>
    </button>
    <button
      type="button"
      class="status-card rounded-xl border border-rose-200 bg-white p-4"
      :class="{ 'status-card-active': selectedKey === 'rejected' }"
      @click="$emit('select', selectedKey === 'rejected' ? 'all' : 'rejected')"
    >
      <p class="text-xs text-slate-500">差戻し件数</p>
      <p class="mt-1 text-2xl font-bold text-rose-600">{{ stats.rejected }}</p>
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