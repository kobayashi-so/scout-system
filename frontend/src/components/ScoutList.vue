<template>
  <section class="scout-list-page">
    <h2 class="mb-4 text-2xl font-bold text-slate-900">
      全ステータスのスカウト文
    </h2>

    <div class="mb-4 flex flex-wrap items-start gap-3">
      <DashboardTabs
        v-if="availableTabs.length > 0"
        v-model="activeTab"
        :tabs="availableTabs"
        @tab-click="onClickTab"
      />

      <div class="mb-4 flex items-center gap-2">
        <button
          v-if="isSalesMyTab"
          type="button"
          class="rounded-full px-4 py-2 text-sm font-semibold transition"
          :class="
            creatorFilter === 'mine'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
          "
          @click="creatorFilter = creatorFilter === 'mine' ? 'all' : 'mine'"
        >
          {{ currentUserNameLabel }}
        </button>

        <button
          type="button"
          class="priority-alert"
          :class="{
            'priority-alert--active': priorityCandidateCount > 0,
            'priority-alert--filtered': priorityFilter,
          }"
          :aria-label="priorityFilter
            ? `優先表示中（${priorityCandidateCount}件）`
            : `優先表示を切り替え（${priorityCandidateCount}件）`"
          @click="priorityFilter = !priorityFilter"
        >
          <span class="priority-bell" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M12 3a4 4 0 00-4 4v1.4a6.9 6.9 0 01-1.6 4.4L5 14.5c-.4.5-.1 1.3.5 1.3h13c.6 0 .9-.8.5-1.3l-1.4-1.7A6.9 6.9 0 0116 8.4V7a4 4 0 00-4-4zm0 18a2.5 2.5 0 002.4-2h-4.8A2.5 2.5 0 0012 21z"
              />
            </svg>
          </span>
          <span
            v-if="priorityCandidateCount > 0"
            class="priority-count"
          >
            {{ priorityCandidateCount }}
          </span>
        </button>

        <p class="priority-hint" :class="{ 'priority-hint--active': priorityFilter }">
          <strong>{{ priorityFilter ? '優先表示中' : '優先ルール' }}</strong>
          <span>最終更新から3日以上経過した未完了の申請を表示</span>
        </p>
      </div>
    </div>

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
      :current-user-name="authStore.currentUserName"
      :is-trash-view="activeTab === 'trash'"
      @open-review="openReview"
      @open-remanded-edit="openRemandedEdit"
      @duplicate-reuse="duplicateAndReuseRow"
      @soft-delete="softDeleteRow"
      @restore="restoreRow"
      @hard-delete="hardDeleteRow"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  duplicateScout,
  fetchScouts,
  hardDeleteScout,
  restoreScout,
  softDeleteScout,
  type ScoutListType,
} from "../api/scoutApi";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "vue-router";
import type { ScoutEntity } from "../type/scout";
import DashboardTabs from "./dashboard/DashboardTabs.vue";
import StatusCards, { type StatusFilterKey } from "./dashboard/StatusCards.vue";
import ScoutTable from "./dashboard/ScoutTable.vue";

type RoleLevel = 1 | 2 | 3;

const authStore = useAuthStore();
const router = useRouter();

const roleLevel = computed<RoleLevel>(() => {
  // 画面タブ制御用にroleを段階値へ変換
  if (authStore.currentUserRoleType === "admin") return 3;
  if (authStore.currentUserRoleType === "leader") return 2;
  return 1;
});

const tabDefs: { key: ScoutListType; label: string; minRole: RoleLevel }[] = [
  { key: "my", label: "全申請文書", minRole: 1 },
  { key: "sales_pending", label: "営業承認者承認待ち", minRole: 2 },
  { key: "final_pending", label: "最終承認待ち", minRole: 3 },
  { key: "trash", label: "ゴミ箱", minRole: 1 },
];

const availableTabs = computed(() =>
  tabDefs
    .filter((t) => roleLevel.value >= t.minRole)
    .map((t) => ({ key: t.key, label: t.label })),
);

const activeTab = ref<ScoutListType>('my')
const selectedStatusCard = ref<StatusFilterKey>('all')
const creatorFilter = ref<'all' | 'mine'>('all')
const priorityFilter = ref(false)

const rows = ref<ScoutEntity[]>([]);
const loading = ref(false);
const error = ref("");

const currentUserNameLabel = computed(
  () => authStore.currentUserName || "ユーザー名",
);

const isSalesMyTab = computed(() => {
  return authStore.currentUserRoleType === "sales" && activeTab.value === "my";
});

function getRowUpdatedTimestamp(row: ScoutEntity): number | null {
  const source = (row as ScoutEntity & { updatedAt?: string }).updatedAt || row.createdAt
  if (!source) return null

  const timestamp = Date.parse(source)
  return Number.isNaN(timestamp) ? null : timestamp
}

function isPriorityRow(row: ScoutEntity, nowMs: number): boolean {
  if (!row.status) return false
  if (row.status === 'draft' || row.status === 'approved') return false

  const updatedAt = getRowUpdatedTimestamp(row)
  if (updatedAt === null) return false

  // 更新日時が3日以上前のものを優先とみなす（10秒にしたいときは threeDaysMs を 10 * 1000 に変更）
  //3 * 24 * 60 * 60 * 1000 = 3日をミリ秒に換算
  const threeDaysMs = 20 * 1000
  return nowMs - updatedAt >= threeDaysMs
}

function resolveInitialTab(role: RoleLevel): ScoutListType {
  if (role >= 3) return "final_pending";
  if (role >= 2) return "sales_pending";
  return "my";
}

async function loadRows() {
  loading.value = true;
  error.value = "";
  try {
    rows.value = await fetchScouts({
      includeDeleted: activeTab.value === "trash",
    });
  } catch (e) {
    console.error(e);
    error.value = "スカウト文の取得に失敗しました";
  } finally {
    loading.value = false;
  }
}

const displayRows = computed(() => {
  const nowMs = Date.now()
  let filteredRows = rows.value;

  if (activeTab.value === "trash") {
    return filteredRows.filter((r: ScoutEntity) => !!r.deletedAt);
  }

  filteredRows = filteredRows.filter((r: ScoutEntity) => !r.deletedAt);

  // レビュー対象タブはバックエンド未実装のtypeパラメータを使わず、フロントで絞り込む
  if (activeTab.value === "sales_pending") {
    filteredRows = filteredRows.filter(
      (r: ScoutEntity) => r.status === "waiting_leader",
    );
  }
  if (activeTab.value === "final_pending") {
    filteredRows = filteredRows.filter(
      (r: ScoutEntity) => r.status === "waiting_admin",
    );
  }

  if (selectedStatusCard.value === "approved") {
    filteredRows = filteredRows.filter(
      (r: ScoutEntity) => r.status === "approved",
    );
  }
  if (selectedStatusCard.value === "salesPending") {
    filteredRows = filteredRows.filter(
      (r: ScoutEntity) => r.status === "waiting_leader",
    );
  }
  if (selectedStatusCard.value === "finalPending") {
    filteredRows = filteredRows.filter(
      (r: ScoutEntity) => r.status === "waiting_admin",
    );
  }
  if (selectedStatusCard.value === "rejected") {
    filteredRows = filteredRows.filter(
      (r: ScoutEntity) => r.status === "remanded",
    );
  }

  if (isSalesMyTab.value && creatorFilter.value === "mine") {
    const currentUserName = authStore.currentUserName?.trim();
    filteredRows = filteredRows.filter((r: ScoutEntity) => {
      return Boolean(currentUserName) && r.creator.trim() === currentUserName;
    });
  }

  if (priorityFilter.value) {
    filteredRows = filteredRows.filter((r: ScoutEntity) => isPriorityRow(r, nowMs))
  }

  return filteredRows
})

const priorityCandidateCount = computed(() => {
  const nowMs = Date.now()
  let candidateRows = rows.value.filter((r: ScoutEntity) => !r.deletedAt)

  if (isSalesMyTab.value && creatorFilter.value === 'mine') {
    const currentUserName = authStore.currentUserName?.trim()
    candidateRows = candidateRows.filter((r: ScoutEntity) => {
      return Boolean(currentUserName) && r.creator.trim() === currentUserName
    })
  }

  return candidateRows.filter((r: ScoutEntity) => isPriorityRow(r, nowMs)).length
})

const statusStats = computed(() => ({
  approved: rows.value.filter(
    (r: ScoutEntity) => !r.deletedAt && r.status === "approved",
  ).length,
  salesPending: rows.value.filter(
    (r: ScoutEntity) => !r.deletedAt && r.status === "waiting_leader",
  ).length,
  finalPending: rows.value.filter(
    (r: ScoutEntity) => !r.deletedAt && r.status === "waiting_admin",
  ).length,
  rejected: rows.value.filter(
    (r: ScoutEntity) => !r.deletedAt && r.status === "remanded",
  ).length,
}));

const roleType = computed(() => authStore.currentUserRoleType);

function onClickTab(tab: ScoutListType) {
  creatorFilter.value = 'all'
  priorityFilter.value = false

  if (tab === "my") {
    selectedStatusCard.value = "all";
    return;
  }

  if (tab === "sales_pending") {
    selectedStatusCard.value = "salesPending";
    return;
  }

  if (tab === "trash") {
    selectedStatusCard.value = "all";
    return;
  }

  selectedStatusCard.value = "finalPending";
}

function ensureActorId(): string | null {
  // 旧セッション（userId未保存）を明示的に検知
  if (!authStore.currentUserId) {
    error.value = "ユーザー情報が古いため、再ログインしてください";
    return null;
  }

  return authStore.currentUserId;
}

async function openReview(item: ScoutEntity) {
  if (!item.id) return;
  const actorId = ensureActorId();
  if (!actorId) return;

  // ロールに応じて同一UIの別モード画面へ遷移
  if (authStore.currentUserRoleType === "leader") {
    await router.push(`/reviews/leader/${item.id}`);
    return;
  }

  if (authStore.currentUserRoleType === "admin") {
    await router.push(`/reviews/admin/${item.id}`);
    return;
  }

  error.value = "このアカウントではレビュー画面を開けません";
}

async function openRemandedEdit(item: ScoutEntity) {
  if (!item.id) return;
  // 編集画面は文書IDでルーティングして、初期値は詳細APIから復元する
  await router.push(`/scouts/${item.id}/remanded-edit`);
}

async function duplicateAndReuseRow(item: ScoutEntity) {
  if (!item.id) return;

  const actorId = ensureActorId();
  if (!actorId) return;

  try {
    const duplicated = await duplicateScout(item.id, { userId: actorId });
    if (!duplicated.id) {
      throw new Error("duplicated id missing");
    }

    await loadRows();
    await router.push(`/scouts/${duplicated.id}/remanded-edit`);
  } catch (e) {
    console.error(e);
    error.value = "複製に失敗しました";
  }
}

async function softDeleteRow(item: ScoutEntity) {
  if (!item.id) return;

  try {
    await softDeleteScout(item.id);
    await loadRows();
  } catch (e) {
    console.error(e);
    error.value = "削除に失敗しました";
  }
}

async function restoreRow(item: ScoutEntity) {
  if (!item.id) return;

  try {
    await restoreScout(item.id);
    await loadRows();
  } catch (e) {
    console.error(e);
    error.value = "復元に失敗しました";
  }
}

async function hardDeleteRow(item: ScoutEntity) {
  if (!item.id) return;

  try {
    await hardDeleteScout(item.id);
    await loadRows();
  } catch (e) {
    console.error(e);
    error.value = "完全削除に失敗しました";
  }
}

watch(activeTab, () => {
  loadRows();
});

onMounted(() => {
  authStore.hydrateFromStorage();
  activeTab.value = resolveInitialTab(roleLevel.value);
  loadRows();
});
</script>

<style scoped>
.scout-list-page {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 255, 252, 0.88) 100%);
}

.priority-alert {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: radial-gradient(circle at 28% 24%, #f8fafc 0%, #e2e8f0 65%, #cbd5e1 100%);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.priority-alert:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.16);
}

.priority-alert:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.32), 0 10px 18px rgba(15, 23, 42, 0.12);
}

.priority-bell {
  display: inline-flex;
  color: #475569;
}

.priority-bell svg {
  width: 1.18rem;
  height: 1.18rem;
  fill: currentColor;
}

.priority-alert--active {
  border-color: rgba(248, 113, 113, 0.55);
  background: radial-gradient(circle at 28% 24%, #fff7ed 0%, #fee2e2 60%, #fecaca 100%);
}

.priority-alert--active .priority-bell {
  color: #dc2626;
}

.priority-alert--filtered {
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.22), 0 10px 18px rgba(15, 23, 42, 0.14);
}

.priority-count {
  position: absolute;
  top: -0.24rem;
  right: -0.24rem;
  min-width: 1.1rem;
  height: 1.1rem;
  border-radius: 9999px;
  padding: 0 0.28rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: 1.5px solid #fff;
  animation: priorityPulse 1.8s ease-in-out infinite;
}

.priority-hint {
  margin: 0;
  padding: 0.45rem 0.7rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(241, 245, 249, 0.88) 100%);
  color: #475569;
  font-size: 0.74rem;
  line-height: 1.2;
  display: inline-flex;
  align-items: baseline;
  gap: 0.36rem;
  white-space: nowrap;
}

.priority-hint strong {
  color: #0f172a;
  font-weight: 700;
}

.priority-hint--active {
  border-color: rgba(20, 184, 166, 0.38);
  background: linear-gradient(135deg, rgba(240, 253, 250, 0.94) 0%, rgba(209, 250, 229, 0.9) 100%);
  color: #0f766e;
}

@media (max-width: 760px) {
  .priority-hint {
    white-space: normal;
    max-width: 100%;
  }
}

@keyframes priorityPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.36);
  }
  50% {
    transform: scale(1.07);
    box-shadow: 0 0 0 6px rgba(220, 38, 38, 0);
  }
}
</style>
