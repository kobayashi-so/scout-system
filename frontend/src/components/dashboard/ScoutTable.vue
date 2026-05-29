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
                {{ item.status || '未設定' }}
              </span>
            </td>
            <td class="px-4 py-3">{{ item.creator }}</td>
            <td class="px-4 py-3">{{ formatDate(item.createdAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200"
                  @click="openDetail(item)"
                >
                  詳細
                </button>
                <button class="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200">
                  編集
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ========= MODAL ========= -->
    <div v-if="selectedRow" class="overlay" @click.self="closeDetail">
      <div class="modal">

        <!-- 閉じる -->
        <button class="close" @click="closeDetail">×</button>

        <!-- 中身 -->
        <div class="content">
          
          <!-- 左 -->
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

          <!-- 右 -->
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

const props = defineProps<{ rows: any[] }>()

const selectedRow = ref<any | null>(null)
const copyMessage = ref('')

function openDetail(item: any) {
  selectedRow.value = item
  copyMessage.value = ''
}

function closeDetail() {
  selectedRow.value = null
}

async function copyBody() {
  await navigator.clipboard.writeText(selectedRow.value.body)
  copyMessage.value = 'コピーしました'
}

function formatDate(v?: string) {
  return v ? new Date(v).toLocaleDateString() : '-'
}

function statusClass(status?: string) {
  return 'bg-slate-100 text-slate-700'
}
</script>

<style scoped>
/* 背景 */
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

/* モーダル */
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

/* 閉じる */
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

/* レイアウト */
.content {
  display: flex;
  gap: 40px;
  height: 100%;
}

/* カラム */
.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

/* タイトル */
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

/* フッター */
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

/* コピー */
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