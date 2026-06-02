<template>
  <section class="approval-queue">
    <header class="page-header">
      <h2 class="page-title">{{ pageTitle }}</h2>
      <p class="page-description">{{ pageDescription }}</p>
    </header>

    <div class="summary-card">
      <div class="summary-content">
        <span class="summary-icon">●</span>
        <div>
          <p class="summary-count">{{ filteredRows.length }}</p>
          <p class="summary-description">{{ cardDescription }}</p>
        </div>
      </div>
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
              <button
                type="button"
                class="review-button"
                @click="openReview(row)"
              >
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
  display: grid;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.page-description {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.summary-card {
  max-width: 24rem;
  border: 1px solid #d8e4de;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  padding: 20px;
  box-shadow: 0 10px 24px rgba(6, 34, 28, 0.07);
}

.summary-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: #d1fae5;
  color: #047857;
}

.summary-count {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
}

.summary-description {
  margin: 0;
  font-size: 14px;
  color: #64748b;
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
  border: 1px solid #d8e4de;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(6, 34, 28, 0.07);
}

.approval-table {
  min-width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.approval-table thead {
  background: #f2f8f5;
  color: #475569;
}

.approval-table th,
.approval-table td {
  padding: 12px 16px;
}

.approval-table th {
  font-weight: 600;
}

.approval-table tbody tr {
  border-top: 1px solid #f1f5f9;
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
</style>
