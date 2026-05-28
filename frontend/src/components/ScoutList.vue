<template>
  <section>
    <h2 class="mb-4 text-2xl font-bold text-slate-900">全ステータスのスカウト文</h2>

    <DashboardTabs v-model="activeTab" :tabs="availableTabs" />

    <StatusCards
      :stats="statusStats"
      :selected-key="selectedStatusCard"
      @select="selectedStatusCard = $event"
    />

    <p v-if="loading" class="mb-3 text-sm text-slate-500">読み込み中...</p>
    <p v-else-if="error" class="mb-3 text-sm text-rose-600">{{ error }}</p>

    <ScoutTable v-else :rows="displayRows" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchScouts, fetchScoutsByType, type ScoutListType } from '../api/scoutApi'
import type { ScoutEntity } from '../type/scout'
import DashboardTabs from './dashboard/DashboardTabs.vue'
import StatusCards, { type StatusFilterKey } from './dashboard/StatusCards.vue'
import ScoutTable from './dashboard/ScoutTable.vue'

type RoleLevel = 1 | 2 | 3

const roleLevel = ref<RoleLevel>(1)

const tabDefs: { key: ScoutListType; label: string; minRole: RoleLevel }[] = [
  { key: 'my', label: '全申請文書', minRole: 1 },
  { key: 'sales_pending', label: '営業承認待ち', minRole: 2 },
  { key: 'final_pending', label: '最終承認待ち', minRole: 3 },
]

const availableTabs = computed(() =>
  tabDefs
    .filter(t => roleLevel.value >= t.minRole)
    .map(t => ({ key: t.key, label: t.label })),
)

const activeTab = ref<ScoutListType>('my')
const selectedStatusCard = ref<StatusFilterKey>('all')

const rows = ref<ScoutEntity[]>([])
const loading = ref(false)
const error = ref('')

function resolveInitialTab(role: RoleLevel): ScoutListType {
  if (role >= 3) return 'final_pending'
  if (role >= 2) return 'sales_pending'
  return 'my'
}

async function loadRows() {
  loading.value = true
  error.value = ''
  try {
    if (activeTab.value === 'my') {
      rows.value = await fetchScouts()
    } else {
      rows.value = await fetchScoutsByType(activeTab.value)
    }
  } catch (e) {
    console.error(e)
    error.value = 'スカウト文の取得に失敗しました'
  } finally {
    loading.value = false
  }
}

const displayRows = computed(() => {
  let filteredRows = rows.value

  if (selectedStatusCard.value === 'approved') {
    filteredRows = filteredRows.filter((r: ScoutEntity) => r.status === '承認済み')
  }
  if (selectedStatusCard.value === 'salesPending') {
    filteredRows = filteredRows.filter((r: ScoutEntity) => r.status === '営業承認待ち')
  }
  if (selectedStatusCard.value === 'finalPending') {
    filteredRows = filteredRows.filter((r: ScoutEntity) => r.status === '最終承認待ち')
  }
  if (selectedStatusCard.value === 'rejected') {
    filteredRows = filteredRows.filter((r: ScoutEntity) => r.status === '差戻し中')
  }

  return filteredRows
})

const statusStats = computed(() => ({
  approved: rows.value.filter((r: ScoutEntity) => r.status === '承認済み').length,
  salesPending: rows.value.filter((r: ScoutEntity) => r.status === '営業承認待ち').length,
  finalPending: rows.value.filter((r: ScoutEntity) => r.status === '最終承認待ち').length,
  rejected: rows.value.filter((r: ScoutEntity) => r.status === '差戻し中').length,
}))

watch(activeTab, () => {
  loadRows()
})

onMounted(() => {
  activeTab.value = resolveInitialTab(roleLevel.value)
  loadRows()
})
</script>