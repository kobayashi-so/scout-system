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
            <th class="px-4 py-3 font-semibold">更新日</th>
            <th class="px-4 py-3 font-semibold">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in rows"
            :key="item.id"
            class="border-t border-slate-100"
          >
            <td class="px-4 py-3 text-slate-500">{{ item.id || '-' }}</td>
            <td class="px-4 py-3 font-medium text-slate-800">{{ item.title }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-1 text-xs font-semibold" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td class="px-4 py-3">{{ item.creator }}</td>
            <td class="px-4 py-3">{{ formatDate(item.createdAt as string | undefined) }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200 text-slate-700"
                  @click="openDetail(item)"
                >
                  詳細
                </button>

                <button
                  v-if="canOpenLeaderReview(item.status)"
                  class="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                  @click="$emit('open-review', item)"
                >
                  営業承認レビュー
                </button>
                <button
                  v-if="canOpenAdminReview(item.status)"
                  class="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                  @click="$emit('open-review', item)"
                >
                  最終承認レビュー
                </button>

              </div>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-slate-500">データがありません</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedRow" class="overlay" @click.self="closeDetail">
      <div class="modal">
        <button class="close" @click="closeDetail">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div class="content">
          <div class="col left-col">
            <h3 class="title">📁 求人情報</h3>
            <div class="info-grid">
              <div class="info-item"><strong>作成者</strong><p>{{ selectedRow.creator }}</p></div>
              <div class="info-item"><strong>求人タイトル</strong><p>{{ selectedRow.title }}</p></div>
              <div class="info-item"><strong>会社名</strong><p>{{ selectedRow.requirement?.companyName }}</p></div>
              <div class="info-item"><strong>職種</strong><p>{{ selectedRow.requirement?.jobCategory }}</p></div>
              <div class="info-item"><strong>業務内容</strong><p>{{ selectedRow.requirement?.jobDescription }}</p></div>
              <div class="info-item"><strong>必須スキル</strong><p>{{ selectedRow.requirement?.requiredSkills }}</p></div>
              <div class="info-item"><strong>勤務地</strong><p>{{ selectedRow.requirement?.workLocation }}</p></div>
              <div class="info-item"><strong>給与</strong><p>{{ selectedRow.requirement?.salaryInfo }}</p></div>
              <div class="info-item"><strong>求人の魅力</strong><p>{{ selectedRow.requirement?.jobAppeal }}</p></div>
              <div class="info-item"><strong>文章トーン</strong><p>{{ selectedRow.tone }}</p></div>
            </div>
          </div>

          <div class="col right-col">
            <h3 class="title">📝 スカウト文プレビュー</h3>
            <div class="right-body">
              <div class="scout-display-box">
                {{ selectedRow.body || 'スカウト文がありません。' }}
              </div>
              <div class="footer">
                <button class="copy-btn" @click="copyBody">
                  🗎 文章をコピーする
                </button>
                <span v-if="copyMessage" class="copy-toast">{{ copyMessage }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RoleType } from '../../type/user'
import { statusLabel, type ScoutEntity, type ScoutStatus } from '../../type/scout'

const props = defineProps<{
  rows: ScoutEntity[]
  roleType: RoleType | null
}>()

// エミット定義（2個目のレビュー画面行き専用に統一）
defineEmits<{
  (e: 'open-review', row: ScoutEntity): void
}>()

// モーダル制御用のリアクティブステート
const selectedRow = ref<ScoutEntity | null>(null)
const copyMessage = ref('')

function openDetail(item: ScoutEntity) {
  selectedRow.value = item
  copyMessage.value = ''
}

function closeDetail() {
  selectedRow.value = null
}

async function copyBody() {
  if (selectedRow.value?.body) {
    await navigator.clipboard.writeText(selectedRow.value.body)
    copyMessage.value = 'クリップボードにコピーしました！'
    setTimeout(() => {
      copyMessage.value = ''
    }, 3000)
  }
}

function formatDate(value: string | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ja-JP')
}

function statusClass(status?: ScoutStatus) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700'
  if (status === 'waiting_leader') return 'bg-amber-100 text-amber-700'
  if (status === 'waiting_admin') return 'bg-blue-100 text-blue-700'
  if (status === 'remanded') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

// 💡 権限とステータスに応じたボタンの表示ロジック関数
function canOpenLeaderReview(status?: ScoutStatus): boolean {
  return props.roleType === 'leader' && status === 'waiting_leader'
}

function canOpenAdminReview(status?: ScoutStatus): boolean {
  return props.roleType === 'admin' && status === 'waiting_admin'
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
  gap: 16px;
  flex-shrink: 0;
}

.copy-btn {
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

.copy-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
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
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
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