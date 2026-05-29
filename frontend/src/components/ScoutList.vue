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

    <ScoutTable
      v-else
      :rows="displayRows"
      :role-type="roleType"
      @approve="handleApprove"
      @final-approve="handleFinalApprove"
      @remand="handleRemand"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  approveScout,
  fetchScouts,
  finalApproveScout,
  remandScout,
  type ScoutListType,
} from '../api/scoutApi'
import { useAuthStore } from '../store/authStore'
import type { ScoutEntity } from '../type/scout'
import DashboardTabs from './dashboard/DashboardTabs.vue'
import StatusCards, { type StatusFilterKey } from './dashboard/StatusCards.vue'
import ScoutTable from './dashboard/ScoutTable.vue'

type RoleLevel = 1 | 2 | 3

const authStore = useAuthStore()

const roleLevel = computed<RoleLevel>(() => {
  if (authStore.currentUserRoleType === 'admin') return 3
  if (authStore.currentUserRoleType === 'leader') return 2
  return 1
})

const tabDefs: { key: ScoutListType; label: string; minRole: RoleLevel }[] = [
  { key: 'my', label: '全申請文書', minRole: 1 },
  { key: 'sales_pending', label: '営業承認者承認待ち', minRole: 2 },
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
    rows.value = await fetchScouts()
  } catch (e) {
    console.error(e)
    error.value = 'スカウト文の取得に失敗しました'
  } finally {
    loading.value = false
  }
}

const displayRows = computed(() => {
  let filteredRows = rows.value

  if (activeTab.value === 'sales_pending') {
    filteredRows = filteredRows.filter((r: ScoutEntity) => r.status === 'waiting_leader')
  }
  if (activeTab.value === 'final_pending') {
    filteredRows = filteredRows.filter((r: ScoutEntity) => r.status === 'waiting_admin')
  }

  if (selectedStatusCard.value === 'approved') {
    filteredRows = filteredRows.filter((r: ScoutEntity) => r.status === 'approved')
  }
  if (selectedStatusCard.value === 'salesPending') {
    filteredRows = filteredRows.filter((r: ScoutEntity) => r.status === 'waiting_leader')
  }
  if (selectedStatusCard.value === 'finalPending') {
    filteredRows = filteredRows.filter((r: ScoutEntity) => r.status === 'waiting_admin')
  }
  if (selectedStatusCard.value === 'rejected') {
    filteredRows = filteredRows.filter((r: ScoutEntity) => r.status === 'remanded')
  }

  return filteredRows
})

const statusStats = computed(() => ({
  approved: rows.value.filter((r: ScoutEntity) => r.status === 'approved').length,
  salesPending: rows.value.filter((r: ScoutEntity) => r.status === 'waiting_leader').length,
  finalPending: rows.value.filter((r: ScoutEntity) => r.status === 'waiting_admin').length,
  rejected: rows.value.filter((r: ScoutEntity) => r.status === 'remanded').length,
}))

const roleType = computed(() => authStore.currentUserRoleType)

function ensureActorId(): string | null {
  if (!authStore.currentUserId) {
    error.value = 'ユーザー情報が古いため、再ログインしてください'
    return null
  }

  return authStore.currentUserId
}

async function handleApprove(item: ScoutEntity) {
  if (!item.id) return
  const actorId = ensureActorId()
  if (!actorId) return

  try {
    await approveScout({ scoutId: item.id, userId: actorId })
    await loadRows()
  } catch (e) {
    console.error(e)
    error.value = '承認に失敗しました'
  }
}

async function handleFinalApprove(item: ScoutEntity) {
  if (!item.id) return
  const actorId = ensureActorId()
  if (!actorId) return

  try {
    await finalApproveScout({ scoutId: item.id, userId: actorId })
    await loadRows()
  } catch (e) {
    console.error(e)
    error.value = '最終承認に失敗しました'
  }
}

async function handleRemand(item: ScoutEntity) {
  if (!item.id) return
  const actorId = ensureActorId()
  if (!actorId) return

  const comment = window.prompt('差し戻しコメントを入力してください')
  if (!comment?.trim()) return

  try {
    await remandScout({
      scoutId: item.id,
      userId: actorId,
      comment: comment.trim(),
    })
    await loadRows()
  } catch (e) {
    console.error(e)
    error.value = '差し戻しに失敗しました'
  }
}

watch(activeTab, () => {
  loadRows()
})

onMounted(() => {
  authStore.hydrateFromStorage()
  activeTab.value = resolveInitialTab(roleLevel.value)
  loadRows()
})
</script>