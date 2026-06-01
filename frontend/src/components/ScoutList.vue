<template>
  <section>
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
          class="rounded-full px-4 py-2 text-sm font-semibold transition"
          :class="priorityFilter
            ? 'bg-slate-900 text-white'
            : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'"
          @click="priorityFilter = !priorityFilter"
        >
          優先（{{ priorityCandidateCount }}）
        </button>

        <div class="h-10 w-10 flex items-center justify-center" aria-label="優先件数アラート">
          <span
            v-if="priorityCandidateCount > 0"
            class="text-3xl font-extrabold leading-none text-rose-600"
          >
            !
          </span>
        </div>
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
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000
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
