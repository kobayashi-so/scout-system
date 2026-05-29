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
              {{ statusLabel(item.status) }}
            </span>
          </td>
          <td class="px-4 py-3">{{ item.creator }}</td>
          <td class="px-4 py-3">{{ formatDate(item.createdAt as string | undefined) }}</td>
          <td class="px-4 py-3">
            <div class="flex gap-2">
              <button
                v-if="canOpenLeaderReview(item.status)"
                class="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                @click="$emit('open-review', item)"
              >
                <!-- 一覧で即承認はせず、レビュー画面でチェック・コメントを必須化する -->
                営業承認レビュー
              </button>
              <button
                v-if="canOpenAdminReview(item.status)"
                class="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                @click="$emit('open-review', item)"
              >
                最終承認レビュー
              </button>
              <span
                v-if="!canOpenLeaderReview(item.status) && !canOpenAdminReview(item.status)"
                class="text-xs text-slate-400"
              >
                操作なし
              </span>
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
import type { RoleType } from '../../type/user'
import { statusLabel, type ScoutEntity, type ScoutStatus } from '../../type/scout'

const props = defineProps<{
  rows: ScoutEntity[]
  roleType: RoleType | null
}>()

defineEmits<{
  (e: 'open-review', row: ScoutEntity): void
}>()

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

function canOpenLeaderReview(status?: ScoutStatus): boolean {
  // leaderは「営業承認待ち」のみレビュー可能
  return props.roleType === 'leader' && status === 'waiting_leader'
}

function canOpenAdminReview(status?: ScoutStatus): boolean {
  // adminは「最終承認待ち」のみレビュー可能
  return props.roleType === 'admin' && status === 'waiting_admin'
}
</script>