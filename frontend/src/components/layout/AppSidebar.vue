<template>
  <aside class="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
    <h1 class="mt-6 mb-6 text-lg font-bold">Scout System</h1>

    <nav class="space-y-2">
        <RouterLink
        to="/list"
        class="block rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
        active-class="bg-slate-900 text-white hover:bg-slate-900"
      >
        ダッシュボード
      </RouterLink>
      
      <RouterLink
        to="/create"
        class="block rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
        active-class="bg-slate-900 text-white hover:bg-slate-900"
      >
        スカウト新規作成
      </RouterLink>

      <!-- ロールが leader または admin の場合のみ承認トグルを表示 -->
      <template v-if="userRole === 'leader' || userRole === 'admin'">
        <div>
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium transition hover:bg-white/10 whitespace-nowrap"
            :class="{ 'bg-white/10': isApprovalActive || isApprovalOpen }"
            @click="isApprovalOpen = !isApprovalOpen"
          >
            <span>承認</span>
            <span
              class="transition-transform duration-200 inline-block text-xs"
              :style="
                isApprovalOpen
                  ? 'transform: rotate(180deg); margin-left: 6px;'
                  : 'margin-left: 6px;'
              "
            >
              ▼
            </span>
          </button>

          <div v-show="isApprovalOpen" class="mt-2 space-y-1 pl-6">
            <RouterLink
              to="/approval/sales"
              class="block rounded-lg px-3 py-2 text-xs font-medium transition hover:bg-white/10 whitespace-nowrap overflow-hidden text-ellipsis"
              active-class="bg-[#1cb05b]"
              style="display: block"
            >
              <span class="inline-block w-4 text-emerald-600 mr-1">📝</span>営業承認
            </RouterLink>
            <RouterLink
              to="/approval/final"
              class="block rounded-lg px-3 py-2 text-xs font-medium transition hover:bg-white/10 whitespace-nowrap overflow-hidden text-ellipsis"
              active-class="bg-[#1cb05b]"
              style="display: block"
            >
              <span class="inline-block w-4 text-emerald-600 mr-1">📝</span>最終承認
            </RouterLink>
          </div>
        </div>
      </template>

      <div>
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium transition hover:bg-white/10 whitespace-nowrap"
          :class="{ 'bg-white/10': isSettingsActive || isSettingsOpen }"
          @click="isSettingsOpen = !isSettingsOpen"
        >
          <span>設定</span>
          <span
            class="transition-transform duration-200 inline-block text-xs"
            :style="
              isSettingsOpen
                ? 'transform: rotate(180deg); margin-left: 6px;'
                : 'margin-left: 6px;'
            "
          >
            ▼
          </span>
        </button>

        <div v-show="isSettingsOpen" class="mt-2 space-y-1 pl-6">
          <RouterLink
            to="/settings/evaluations"
            class="block rounded-lg px-3 py-2 text-xs font-medium transition hover:bg-white/10 whitespace-nowrap overflow-hidden text-ellipsis"
            active-class="bg-[#1cb05b]"
            style="display: block"
          >
            評価基準・チェック項目管理
          </RouterLink>
          <RouterLink
            to="/settings/profile"
            class="block rounded-lg px-3 py-2 text-xs font-medium transition hover:bg-white/10 whitespace-nowrap overflow-hidden text-ellipsis"
            active-class="bg-[#1cb05b]"
            style="display: block"
          >
            ユーザー情報編集
          </RouterLink>
        </div>
      </div>
    </nav>

    <div class="sidebar-bottom">
      <button
        type="button"
        class="mb-4 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        @click="$emit('logout')"
      >
        ログアウト
      </button>
      <div class="sidebar-user" aria-label="ログインユーザー情報">
        <div class="sidebar-avatar">{{ userInitial }}</div>
        <div class="sidebar-user-meta">
          <p class="sidebar-user-name">{{ userEmail }}</p>
          <p class="sidebar-user-role">{{ userRole }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  userEmail: string
  userRole: string
}>()

defineEmits<{
  (e: 'logout'): void
}>()

const route = useRoute()
const isApprovalOpen = ref(false)
const isSettingsOpen = ref(false)

const isApprovalActive = computed(() => route.path.startsWith('/approval'))
const isSettingsActive = computed(() => route.path.startsWith('/settings'))

const userInitial = computed(() => {
  const first = props.userEmail.trim().charAt(0)
  return first || '?'
})

watchEffect(() => {
  if (isApprovalActive.value) isApprovalOpen.value = true
  if (isSettingsActive.value) isSettingsOpen.value = true
})

// userRoleをpropsから参照できるように
const userRole = computed(() => props.userRole)
</script>
