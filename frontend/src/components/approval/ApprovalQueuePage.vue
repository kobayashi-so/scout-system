<template>
  <section class="approval-queue">
    <header class="page-header">
      <div>
        <p class="eyebrow">APPROVAL</p>
        <h2 class="page-title">{{ pageTitle }}</h2>
        <p class="page-description">{{ pageDescription }}</p>
      </div>
      <div class="header-badge">
        <span class="header-badge__label">待機件数</span>
        <strong>{{ filteredRows.length }}</strong>
        <p class="header-badge__description">{{ cardDescription }}</p>
      </div>
    </header>

    <div class="status-panel">
      <div class="status-panel__dot" aria-hidden="true"></div>
      <p class="status-panel__text">
        表示中: {{ props.mode === "sales" ? "営業承認" : "管理者承認" }}
      </p>
    </div>

    <p v-if="loading" class="status-message">読み込み中...</p>
    <p v-else-if="error" class="status-message status-error">{{ error }}</p>

    <div v-else class="table-wrapper">
      <table class="approval-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>求人タイトル</th>
            <th>作成者</th>
            <th>申請日時</th>
            <th>更新日</th>
            <th>アクション</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="row.id">
            <td class="cell-id">{{ row.id || "-" }}</td>
            <td class="cell-title">{{ row.title }}</td>
            <td>{{ row.creator }}</td>
            <td>{{ formatDate(row.createdAt) }}</td>
            <td>{{ formatDate(row.updatedAt || row.createdAt) }}</td>
            <td>
              <button type="button" class="review-button" @click="openReview(row)">
                レビュー
              </button>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="6" class="empty-message">
              対象の承認待ち案件はありません
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchScouts } from "../../api/scoutApi";
import type { ScoutEntity, ScoutStatus } from "../../type/scout";

type ApprovalMode = "sales" | "final";
type ScoutRow = ScoutEntity & { updatedAt?: string };

const props = defineProps<{
  mode: ApprovalMode;
}>();

const router = useRouter();
const rows = ref<ScoutRow[]>([]);
const loading = ref(false);
const error = ref("");

const waitingStatus = computed<ScoutStatus>(() => {
  return props.mode === "sales" ? "waiting_leader" : "waiting_admin";
});

const filteredRows = computed(() => {
  return rows.value
    .filter((row) => row.status === waitingStatus.value)
    .sort((a, b) => {
      const timeA = Date.parse(a.createdAt || "");
      const timeB = Date.parse(b.createdAt || "");
      if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
      if (Number.isNaN(timeA)) return 1;
      if (Number.isNaN(timeB)) return -1;
      return timeA - timeB;
    });
});

const pageTitle = computed(() => {
  return props.mode === "sales" ? "承認待ち一覧" : "管理者承認待ち一覧";
});

const pageDescription = computed(() => {
  return props.mode === "sales"
    ? "営業承認者承認待ちの案件のみ表示"
    : "管理者承認待ちの案件のみ表示";
});

const cardDescription = computed(() => {
  return props.mode === "sales"
    ? "あなたの営業承認者承認を待っている案件"
    : "あなたの管理者承認を待っている案件";
});

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ja-JP");
}

async function loadRows() {
  loading.value = true;
  error.value = "";
  try {
    rows.value = await fetchScouts();
  } catch (e) {
    console.error(e);
    error.value = "承認待ちデータの取得に失敗しました";
  } finally {
    loading.value = false;
  }
}

async function openReview(row: ScoutRow) {
  if (!row.id) return;

  if (props.mode === "sales") {
    await router.push(`/reviews/leader/${row.id}`);
    return;
  }

  await router.push(`/reviews/admin/${row.id}`);
}

onMounted(() => {
  loadRows();
});
</script>

<style scoped>
.approval-queue {
  padding: 24px;
  display: grid;
  gap: 14px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.09em;
  color: #0d9488;
  font-weight: 800;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #10342d;
}

.page-description {
  margin: 8px 0 0;
  font-size: 13px;
  color: #46665c;
}

.header-badge {
  flex-shrink: 0;
  min-width: 138px;
  max-width: 250px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.25);
  background: linear-gradient(135deg, rgba(240, 253, 250, 0.95) 0%, rgba(209, 250, 229, 0.88) 100%);
}

.header-badge__label {
  display: block;
  color: #0f766e;
  font-size: 11px;
  font-weight: 700;
}

.header-badge strong {
  margin-top: 2px;
  display: block;
  font-size: 24px;
  line-height: 1;
  color: #065f46;
}

.header-badge__description {
  margin: 8px 0 0;
  color: #3f6359;
  font-size: 12px;
}

.status-panel {
  border: 1px solid #d3e5de;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 253, 250, 0.94) 100%);
  box-shadow: 0 10px 22px rgba(7, 34, 28, 0.07);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-panel__dot {
  width: 9px;
  height: 9px;
  border-radius: 9999px;
  background: #10b981;
  box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.14);
}

.status-panel__text {
  margin: 0;
  color: #31564b;
  font-size: 13px;
  font-weight: 700;
}

.status-message {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.status-error {
  color: #e11d48;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #d3e5de;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 253, 250, 0.94) 100%);
  box-shadow: 0 10px 22px rgba(7, 34, 28, 0.07);
}

.approval-table {
  min-width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.approval-table thead {
  background: #f3faf7;
  color: #0f3d2e;
}

.approval-table th,
.approval-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e3eee9;
}

.approval-table th {
  font-weight: 600;
  font-size: 13px;
}

.cell-id {
  color: #64748b;
}

.cell-title {
  color: #1e293b;
  font-weight: 500;
}

.empty-message {
  padding: 32px 16px;
  text-align: center;
  color: #64748b;
}

.review-button {
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #9d40e4 0%, #bb5fcb 100%);
  color: #ffffff;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.review-button:hover {
  background: linear-gradient(135deg, #8b0aed 0%, #41034b 100%);
}

@media (max-width: 980px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-badge {
    max-width: none;
  }
}
</style>
