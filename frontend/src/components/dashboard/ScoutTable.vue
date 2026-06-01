<template>
  <div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="px-4 py-3 font-semibold">ID</th>
            <th class="px-4 py-3 font-semibold">求人タイトル</th>
            <th class="px-4 py-3 font-semibold">ステータス</th>
            <th class="px-4 py-3 font-semibold">作成者</th>
            <th class="px-4 py-3 font-semibold">
              <div class="flex items-center gap-2">
                <span>更新日</span>
                <button type="button" class="sort-btn" @click="toggleDateSort">
                  {{ sortOrder === "asc" ? "昇順" : "降順" }}
                </button>
              </div>
            </th>
            <th class="px-4 py-3 font-semibold">アクション</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in sortedRows"
            :key="item.id"
            class="border-t border-slate-100"
          >
            <td class="px-4 py-3 text-slate-500">{{ item.id || "-" }}</td>
            <td class="px-4 py-3 font-medium text-slate-800">
              {{ item.title }}
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-1 text-xs font-semibold"
                :class="statusClass(item.status)"
              >
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td class="px-4 py-3">{{ item.creator }}</td>
            <td class="px-4 py-3">{{ formatDate(item.createdAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200 text-slate-700"
                  @click="openDetail(item)"
                >
                  詳細
                </button>

                <!-- 営業担当が下書き文書を編集画面へ開く導線 -->
                <button
                  v-if="canOpenDraftEdit(item.status, item.creator)"
                  class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200 text-slate-700"
                  @click="$emit('open-remanded-edit', item)"
                >
                  編集
                </button>

                <button
                  v-if="canOpenLeaderReview(item.status)"
                  class="review-action-btn"
                  @click="$emit('open-review', item)"
                >
                  レビュー
                </button>
                <button
                  v-if="canOpenAdminReview(item.status)"
                  class="review-action-btn"
                  @click="$emit('open-review', item)"
                >
                  レビュー
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-slate-500">
              データがありません
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedRow" class="overlay" @click.self="closeDetail">
      <div class="modal">
        <button class="close" @click="closeDetail">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="content">
          <div class="col left-col">
            <h3 class="title">📁 求人情報</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>作成者</strong>
                <p>{{ selectedRow.creator }}</p>
              </div>
              <div class="info-item">
                <strong>求人タイトル</strong>
                <p>{{ selectedRow.title }}</p>
              </div>
              <div class="info-item">
                <strong>会社名</strong>
                <p>{{ selectedRow.requirement?.companyName || "-" }}</p>
              </div>
              <div class="info-item">
                <strong>職種</strong>
                <p>{{ selectedRow.requirement?.jobCategory || "-" }}</p>
              </div>
              <div class="info-item">
                <strong>業務内容</strong>
                <p>{{ selectedRow.requirement?.jobDescription || "-" }}</p>
              </div>
              <div class="info-item">
                <strong>必須スキル</strong>
                <p>{{ selectedRow.requirement?.requiredSkills || "-" }}</p>
              </div>
              <div class="info-item">
                <strong>勤務地</strong>
                <p>{{ selectedRow.requirement?.workLocation || "-" }}</p>
              </div>
              <div class="info-item">
                <strong>給与</strong>
                <p>{{ selectedRow.requirement?.salaryInfo || "-" }}</p>
              </div>
              <div class="info-item">
                <strong>求人の魅力</strong>
                <p>{{ selectedRow.requirement?.jobAppeal || "-" }}</p>
              </div>
              <div class="info-item">
                <strong>文章トーン</strong>
                <p>{{ selectedRow.requirement?.tone || "-" }}</p>
              </div>
            </div>
          </div>

          <div class="col right-col">
            <h3 class="title">📝 スカウト文プレビュー</h3>
            <div class="right-body">
              <div class="scout-display-box">
                {{ selectedRow.body || "スカウト文がありません。" }}
              </div>
              <div class="footer">
                <span v-if="copyMessage" class="copy-toast">{{
                  copyMessage
                }}</span>
                <div class="footer-actions">
                  <button class="action-btn copy-btn" @click="copyBody">
                    🗎 文章をコピーする
                  </button>
                  <button
                    v-if="!props.isTrashView"
                    class="action-btn duplicate-btn"
                    @click="confirmDuplicateReuse"
                  >
                    複製して再利用
                  </button>
                  <button class="action-btn delete-btn" @click="confirmDelete">
                    {{ props.isTrashView ? "復元" : "削除" }}
                  </button>
                  <button
                    v-if="props.isTrashView"
                    class="action-btn hard-delete-btn"
                    @click="confirmHardDelete"
                  >
                    完全削除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { fetchScoutDetail } from "../../api/scoutApi";
import type { RoleType } from "../../type/user";
import {
  statusLabel,
  type ScoutEntity,
  type ScoutStatus,
} from "../../type/scout";

const props = defineProps<{
  rows: ScoutEntity[]
  roleType: RoleType | null
  currentUserName?: string | null
  isTrashView?: boolean
}>()

// エミット定義（2個目のレビュー画面行き専用に統一）
const emit = defineEmits<{
  (e: "open-review", row: ScoutEntity): void;
  (e: "open-remanded-edit", row: ScoutEntity): void;
  (e: "duplicate-reuse", row: ScoutEntity): void;
  (e: "soft-delete", row: ScoutEntity): void;
  (e: "restore", row: ScoutEntity): void;
  (e: "hard-delete", row: ScoutEntity): void;
}>();

// モーダル制御用のリアクティブステート
const selectedRow = ref<ScoutEntity | null>(null);
const copyMessage = ref("");
const sortOrder = ref<"asc" | "desc">("asc");

const sortedRows = computed(() => {
  const list = [...props.rows];

  list.sort((a, b) => {
    const timeA = getRowDateTimestamp(a);
    const timeB = getRowDateTimestamp(b);

    if (timeA === null && timeB === null) return 0;
    if (timeA === null) return 1;
    if (timeB === null) return -1;

    return sortOrder.value === "asc" ? timeA - timeB : timeB - timeA;
  });

  return list;
});

async function openDetail(item: ScoutEntity) {
  copyMessage.value = "";
  selectedRow.value = item;

  if (!item.id) {
    return;
  }

  try {
    // 一覧レスポンスでは不足しうる求人情報を詳細APIから再取得
    selectedRow.value = await fetchScoutDetail(item.id);
  } catch (error) {
    console.error(error);
  }
}

function closeDetail() {
  selectedRow.value = null;
}

function toggleDateSort() {
  sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
}

async function copyBody() {
  if (selectedRow.value?.body) {
    await navigator.clipboard.writeText(selectedRow.value.body);
    copyMessage.value = "クリップボードにコピーしました！";
    setTimeout(() => {
      copyMessage.value = "";
    }, 3000);
  }
}

function confirmDelete() {
  if (!selectedRow.value) return;

  if (props.isTrashView) {
    if (window.confirm("このスカウト文を元に戻しますか")) {
      emit("restore", selectedRow.value);
      closeDetail();
    }
    return;
  }

  if (window.confirm("このスカウト文をゴミ箱へ移動しますか")) {
    emit("soft-delete", selectedRow.value);
    closeDetail();
  }
}

function confirmHardDelete() {
  if (!selectedRow.value) return;

  if (
    window.confirm(
      "このスカウト文を完全削除します。元に戻せません。実行しますか",
    )
  ) {
    emit("hard-delete", selectedRow.value);
    closeDetail();
  }
}

function confirmDuplicateReuse() {
  if (!selectedRow.value) return;

  if (window.confirm("この文書を複製して下書きとして再利用しますか")) {
    emit("duplicate-reuse", selectedRow.value);
    closeDetail();
  }
}

function formatDate(value: string | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ja-JP");
}

function getRowDateTimestamp(row: ScoutEntity): number | null {
  const source =
    (row as ScoutEntity & { updatedAt?: string }).updatedAt || row.createdAt;
  if (!source) return null;

  const timestamp = Date.parse(source);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function statusClass(status?: ScoutStatus) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "waiting_leader") return "bg-amber-100 text-amber-700";
  if (status === "waiting_admin") return "bg-blue-100 text-blue-700";
  if (status === "remanded") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

// 💡 権限とステータスに応じたボタンの表示ロジック関数
function canOpenLeaderReview(status?: ScoutStatus): boolean {
  return props.roleType === "leader" && status === "waiting_leader";
}

function canOpenAdminReview(status?: ScoutStatus): boolean {
  return props.roleType === "admin" && status === "waiting_admin";
}

function canOpenDraftEdit(status?: ScoutStatus, creator?: string): boolean {
  if (!status || (status !== "draft" && status !== "remanded")) {
    return false;
  }

  const currentUserName = (props.currentUserName || "").trim();
  const rowCreator = (creator || "").trim();

  return currentUserName.length > 0 && currentUserName === rowCreator;
}
</script>

<style scoped>
/* モーダルおよびパーツデザイン用のクリーンなCSSスタイル */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal {
  width: 90vw;
  max-width: 1100px;
  height: 80vh;
  max-height: 750px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  position: relative;
  padding: 32px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.close {
  position: absolute;
  top: 24px;
  right: 24px;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.content {
  display: flex;
  gap: 32px;
  height: 100%;
  min-height: 0;
}

.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #f1f5f9;
}

.left-col {
  overflow-y: auto;
  padding-right: 8px;
}

.left-col::-webkit-scrollbar {
  width: 6px;
}
.left-col::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 10px 14px;
}

.info-item strong {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.info-item p {
  margin: 0;
  font-size: 0.9rem;
  color: #334155;
  font-weight: 500;
  white-space: pre-wrap;
  line-height: 1.5;
}

.right-col {
  height: 100%;
}

.right-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.scout-display-box {
  width: 100%;
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fafafa;
  white-space: pre-wrap;
  padding: 20px;
  font-size: 0.95rem;
  line-height: 1.7;
  color: #1e293b;
  overflow-y: auto;
  box-sizing: border-box;
}

.scout-display-box::-webkit-scrollbar {
  width: 6px;
}
.scout-display-box::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.footer {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  flex-shrink: 0;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.action-btn {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.review-action-btn {
  border-radius: 0.375rem;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.review-action-btn:hover {
  background: #bfdbfe;
}

.copy-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.delete-btn {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #be123c;
}

.delete-btn:hover {
  background: #ffe4e6;
  border-color: #fda4af;
  color: #9f1239;
}

.hard-delete-btn {
  background: #881337;
  border-color: #881337;
  color: #fff;
}

.hard-delete-btn:hover {
  background: #6b102b;
  border-color: #6b102b;
}

.copy-toast {
  font-size: 0.8rem;
  color: #10b981;
  font-weight: 600;
  background: #ecfdf5;
  padding: 6px 12px;
  border-radius: 6px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sort-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.sort-btn:hover {
  background: #f8fafc;
}

@media (max-width: 1024px) {
  .modal {
    padding: 24px;
    height: 85vh;
  }
  .content {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .modal {
    height: 90vh;
    max-height: none;
    padding: 20px;
  }

  .content {
    flex-direction: column;
    overflow-y: auto;
    gap: 24px;
  }

  .left-col {
    overflow-y: visible;
    height: auto;
  }

  .scout-display-box {
    height: 280px;
    flex: none;
  }
}
</style>
