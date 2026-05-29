<template>
  <div>
    <!-- ========= TABLE ========= -->
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
                <!-- 詳細ボタン（0529_nobu のモーダル開閉機能） -->
                <button
                  class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200"
                  @click="openDetail(item)"
                >
                  詳細
                </button>

                <!-- 承認・差戻しボタン群（main の権限ロジック機能） -->
                <button
                  v-if="canApprove(item.status)"
                  class="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200"
                  @click="$emit('approve', item)"
                >
                  承認
                </button>
                <button
                  v-if="canFinalApprove(item.status)"
                  class="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                  @click="$emit('final-approve', item)"
                >
                  最終承認
                </button>
                <button
                  v-if="canRemand(item.status)"
                  class="rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200"
                  @click="$emit('remand', item)"
                >
                  差戻し
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ========= MODAL (0529_nobuのモーダル詳細機能) ========= -->
    <div v-if="selectedRow" class="overlay" @click.self="closeDetail">
      <div class="modal">
        <!-- 閉じる -->
        <button class="close" @click="closeDetail">×</button>

        <!-- 中身 -->
        <div class="content">
          <!-- 左カラム：求人詳細情報 -->
          <div class="col">
            <h3 class="title">求人情報</h3>
            <div class="grid space-y-2 text-sm">
              <div><strong>作成者</strong><p>{{ selectedRow.creator }}</p></div>
              <div><strong>求人タイトル</strong><p>{{ selectedRow.title }}</p></div>
              <div><strong>会社名</strong><p>{{ selectedRow.requirement?.companyName }}</p></div>
              <div><strong>職種</strong><p>{{ selectedRow.requirement?.jobCategory }}</p></div>
              <div><strong>業務内容</strong><p>{{ selectedRow.requirement?.jobDescription }}</p></div>
              <div><strong>必須スキル</strong><p>{{ selectedRow.requirement?.requiredSkills }}</p></div>
              <div><strong>勤務地</strong><p>{{ selectedRow.requirement?.workLocation }}</p></div>
              <div><strong>給与</strong><p>{{ selectedRow.requirement?.salaryInfo }}</p></div>
              <div><strong>求人の魅力</strong><p>{{ selectedRow.requirement?.jobAppeal }}</p></div>
              <div><strong>文章トーン</strong><p>{{ selectedRow.tone }}</p></div>
            </div>
          </div>

          <!-- 右カラム：スカウト文プレビュー -->
          <div class="col right-col">
            <h3 class="title">スカウト文</h3>
            <div class="right-body">
              <div class="scout-display-box">
                {{ selectedRow.body || 'スカウト文を表示' }}
              </div>
              <div class="footer">
                <button class="copy-btn" @click="copyBody">
                  文書コピー
                </button>
                <span>{{ copyMessage }}</span>
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

// Props 定義の統合（mainブランチベースにScoutEntityを厳格に指定）
const props = defineProps<{
  rows: ScoutEntity[]
  roleType: RoleType | null
}>()

// Emits 定義（mainブランチ）
defineEmits<{
  (e: 'approve', row: ScoutEntity): void
  (e: 'final-approve', row: ScoutEntity): void
  (e: 'remand', row: ScoutEntity): void
}>()

// モーダル制御用の状態（0529_nobuブランチ）
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
    copyMessage.value = 'コピーしました'
  }
}

function formatDate(v?: string) {
  return v ? new Date(v).toLocaleDateString() : '-'
}

// ステータスに応じたスタイリング（mainブランチのカラフルな配色に統合）
function statusClass(status?: ScoutStatus) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700'
  if (status === 'waiting_leader') return 'bg-amber-100 text-amber-700'
  if (status === 'waiting_admin') return 'bg-blue-100 text-blue-700'
  if (status === 'remanded') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

// 権限制御ロジック（mainブランチ）
function canApprove(status?: ScoutStatus): boolean {
  return props.roleType === 'leader' && status === 'waiting_leader'
}

function canFinalApprove(status?: ScoutStatus): boolean {
  return props.roleType === 'admin' && status === 'waiting_admin'
}

function canRemand(status?: ScoutStatus): boolean {
  return (
    (props.roleType === 'leader' || props.roleType === 'admin') &&
    (status === 'waiting_leader' || status === 'waiting_admin')
  )
}
</script>

<style scoped>
/* 0529_nobuブランチで追加されたモーダル専用CSSをすべて維持 */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  width: 80vw;
  max-width: 1200px;
  height: 75vh;
  background: white;
  border-radius: 46px;
  border: 2px solid #2e7d32;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  position: relative;
  padding: 32px;
}

.close {
  position: absolute;
  top: 20px;
  right: 30px;
  font-size: 32px;
  color: #2e7d32;
  background: transparent;
  border: none;
  cursor: pointer;
}

.content {
  display: flex;
  gap: 40px;
  height: 100%;
}

.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.title {
  font-size: 26px;
  margin-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
  width: 60%;
  padding-bottom: 6px;
}

.right-col {
  align-items: flex-start;
}

.right-body {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 12px;
  min-height: 0;
}

.scout-display-box {
  width: 70%;
  min-width: 320px;
  height: 340px;
  border: 2px solid #000;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  white-space: pre-wrap;
  padding: 16px;
  font-size: 16px;
  line-height: 1.7;
  overflow-y: auto;
}

.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 32px;
}

.footer span {
  font-size: 12px;
  color: #475569;
}

.copy-btn {
  border: 1px solid #000;
  background: #fff;
  color: #111827;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
}

.copy-btn:hover {
  background: #f8fafc;
}

@media (max-width: 1024px) {
  .modal {
    padding: 28px;
    border-radius: 28px;
  }
  .content {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .modal {
    height: 82vh;
    padding: 20px;
  }
  .content {
    flex-direction: column;
    gap: 20px;
  }
  .title {
    width: 100%;
    font-size: 22px;
  }
  .scout-display-box {
    width: 100%;
    min-width: 0;
    height: 260px;
  }
}
</style>