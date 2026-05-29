<template>
  <section class="space-y-6">
    <header class="flex items-end justify-between gap-4">
      <h2 class="text-2xl font-bold text-slate-900">{{ pageTitle }}</h2>
      <p class="text-sm text-slate-500">{{ pageDescription }}</p>
    </header>

    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm max-w-sm">
      <div class="flex items-center gap-3">
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">●</span>
        <div>
          <p class="text-3xl font-bold text-slate-900">{{ filteredRows.length }}</p>
          <p class="text-sm text-slate-500">{{ cardDescription }}</p>
        </div>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">読み込み中...</p>
    <p v-else-if="error" class="text-sm text-rose-600">{{ error }}</p>

    <div v-else class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="px-4 py-3 font-semibold">ID</th>
            <th class="px-4 py-3 font-semibold">求人タイトル</th>
            <th class="px-4 py-3 font-semibold">作成者</th>
            <th class="px-4 py-3 font-semibold">申請日時</th>
            <th class="px-4 py-3 font-semibold">更新日</th>
            <th class="px-4 py-3 font-semibold">アクション</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="row.id" class="border-t border-slate-100">
            <td class="px-4 py-3 text-slate-500">{{ row.id || '-' }}</td>
            <td class="px-4 py-3 font-medium text-slate-800">{{ row.title }}</td>
            <td class="px-4 py-3">{{ row.creator }}</td>
            <td class="px-4 py-3">{{ formatDate(row.createdAt) }}</td>
            <td class="px-4 py-3">{{ formatDate(row.updatedAt || row.createdAt) }}</td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                @click="openReview(row)"
              >
                レビュー
              </button>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-slate-500">対象の承認待ち案件はありません</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchScouts } from '../../api/scoutApi'
import type { ScoutEntity, ScoutStatus } from '../../type/scout'

type ApprovalMode = 'sales' | 'final'
type ScoutRow = ScoutEntity & { updatedAt?: string }

const props = defineProps<{
  mode: ApprovalMode
}>()

const router = useRouter()
const rows = ref<ScoutRow[]>([])
const loading = ref(false)
const error = ref('')

const waitingStatus = computed<ScoutStatus>(() => {
  return props.mode === 'sales' ? 'waiting_leader' : 'waiting_admin'
})

const filteredRows = computed(() => {
  return rows.value
    .filter(row => row.status === waitingStatus.value)
    .sort((a, b) => {
      const timeA = Date.parse(a.createdAt || '')
      const timeB = Date.parse(b.createdAt || '')
      if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0
      if (Number.isNaN(timeA)) return 1
      if (Number.isNaN(timeB)) return -1
      return timeA - timeB
    })
})

const pageTitle = computed(() => {
  return props.mode === 'sales' ? '承認待ち一覧' : '最終承認待ち一覧'
})

const pageDescription = computed(() => {
  return props.mode === 'sales' ? '営業承認待ちの案件のみ表示' : '最終承認待ちの案件のみ表示'
})

const cardDescription = computed(() => {
  return props.mode === 'sales'
    ? 'あなたの営業承認を待っている案件'
    : 'あなたの最終承認を待っている案件'
})

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ja-JP')
}

async function loadRows() {
  loading.value = true
  error.value = ''
  try {
    rows.value = await fetchScouts()
  } catch (e) {
    console.error(e)
    error.value = '承認待ちデータの取得に失敗しました'
  } finally {
    loading.value = false
  }
}

async function openReview(row: ScoutRow) {
  if (!row.id) return

  if (props.mode === 'sales') {
    await router.push(`/reviews/leader/${row.id}`)
    return
  }

  await router.push(`/reviews/admin/${row.id}`)
}

onMounted(() => {
  loadRows()
})
</script>
