<template>
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
          <td class="px-4 py-3">{{ formatDate(item.createdAt as string | undefined) }}</td>
          <td class="px-4 py-3">
            <div class="flex gap-2">
              <button class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200">詳細</button>
              <button class="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200">編集</button>
            </div>
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td colspan="6" class="px-4 py-8 text-center text-slate-500">データがありません</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { ScoutEntity } from '../../type/scout'

defineProps<{ rows: ScoutEntity[] }>()

function formatDate(value: string | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ja-JP')
}

function statusClass(status?: string) {
  if (status === '承認済み') return 'bg-emerald-100 text-emerald-700'
  if (status === '営業承認待ち') return 'bg-amber-100 text-amber-700'
  if (status === '最終承認待ち') return 'bg-blue-100 text-blue-700'
  if (status === '差戻し中') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}
</script>