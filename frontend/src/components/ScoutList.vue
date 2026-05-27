<template>
  <div class="page-container">

    <h2 class="page-title">全ステータスのスカウト文</h2>

    <p v-if="store.loading" class="state-message">読み込み中...</p>
    <p v-else-if="store.error" class="state-message error-message">{{ store.error }}</p>
    <p v-else-if="store.scouts.length === 0" class="state-message">データがありません</p>

    <div v-else>
      <div class="status-cards">
        <div class="card approved">
          <div class="card-icon">✓</div>
          <div class="card-info">
            <span class="card-count">{{ countByStatus('承認済み') }}</span>
            <span class="card-label">承認済み</span>
          </div>
        </div>
        <div class="card waiting-sales">
          <div class="card-icon">🕒</div>
          <div class="card-info">
            <span class="card-count">{{ countByStatus('営業承認待ち') }}</span>
            <span class="card-label">営業承認待ち</span>
          </div>
        </div>
        <div class="card waiting-final">
          <div class="card-icon">🛡️</div>
          <div class="card-info">
            <span class="card-count">{{ countByStatus('最終承認待ち') }}</span>
            <span class="card-label">最終承認待ち</span>
          </div>
        </div>
        <div class="card rejected">
          <div class="card-icon">↩</div>
          <div class="card-info">
            <span class="card-count">{{ countByStatus('差戻し中') }}</span>
            <span class="card-label">差戻し中</span>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="scout-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>求人タイトル</th>
              <th>ステータス</th>
              <th>作成者</th>
              <th>更新日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="scout in store.scouts" :key="scout.id">
              <td class="col-id">#S-{{ scout.id }}</td>
              <td class="col-title">
                <strong>{{ scout.title }}</strong>
                <p class="title-sub">{{ scout.body }}</p>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(scout.status)">
                  {{ scout.status || '未設定' }}
                </span>
              </td>
              <td>{{ scout.creator || '未設定' }}</td>
              <td>{{ formatDate(scout.createdat) }}</td>
              <td class="col-action">
                <button v-if="scout.status === '差戻し中'" class="action-btn">✏️</button>
                <button v-else class="action-btn">👁️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useScoutStore } from '../store/scoutStore'

const store = useScoutStore()

onMounted(() => {
  store.loadScouts()
})

// 日付フォーマット（YYYY/MM/DD 形式に変換）
function formatDate(value: string | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}`
}

// 各ステータスの件数を自動集計するロジック
function countByStatus(status: string) {
  return String(store.scouts.filter(s => s.status === status).length).padStart(2, '0')
}

// ステータスに応じた色分け用CSSクラスを返す
function getStatusClass(status: string | undefined) {
  if (status === '承認済み') return 'badge-approved'
  if (status === '営業承認待ち') return 'badge-waiting-sales'
  if (status === '最終承認待ち') return 'badge-waiting-final'
  if (status === '差戻し中') return 'badge-rejected'
  return 'badge-default'
}
</script>

<style scoped>
/* 全体のベースレイアウト */
.page-container {
  padding: 30px;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #334155;
}

/* タイトル */
.page-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #0f172a;
}

/* メッセージ表示 */
.state-message {
  text-align: center;
  padding: 4px;
  color: #64748b;
}
.error-message {
  color: #ef4444;
}

/* ステータス集計カード */
.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
.card {
  display: flex;
  align-items: center;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 15px;
}
.card-info {
  display: flex;
  flex-direction: column;
}
.card-count {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}
.card-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

/* カードごとの色付け */
.card.approved { border-bottom: 4px solid #10b981; }
.card.approved .card-icon { background: #d1fae5; color: #10b981; }

.card.waiting-sales { border-bottom: 4px solid #f59e0b; }
.card.waiting-sales .card-icon { background: #fef3c7; color: #f59e0b; }

.card.waiting-final { border-bottom: 4px solid #3b82f6; }
.card.waiting-final .card-icon { background: #dbeafe; color: #3b82f6; }

.card.rejected { border-bottom: 4px solid #ef4444; }
.card.rejected .card-icon { background: #fee2e2; color: #ef4444; }

/* テーブルのスタイル */
.table-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.scout-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}
.scout-table th {
  background-color: #f8fafc;
  color: #64748b;
  font-weight: 600;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.scout-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.scout-table tbody tr:hover {
  background-color: #f8fafc;
}

/* テーブル内のパーツ調整 */
.col-id {
  color: #94a3b8;
  font-weight: 500;
}
.col-title strong {
  color: #1e293b;
  font-size: 14px;
}
.title-sub {
  font-size: 12px;
  color: #94a3b8;
  margin: 4px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

/* ステータスバッジ */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.badge-approved { background-color: #d1fae5; color: #065f46; }
.badge-waiting-sales { background-color: #fef3c7; color: #92400e; }
.badge-waiting-final { background-color: #dbeafe; color: #1e40af; }
.badge-rejected { background-color: #fee2e2; color: #991b1b; }
.badge-default { background-color: #e2e8f0; color: #475569; }

/* 操作ボタン */
.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}
.action-btn:hover {
  background-color: #e2e8f0;
}
.col-action {
  text-align: center;
  width: 60px;
}
</style>