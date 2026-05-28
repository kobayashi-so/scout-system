<template>
  <div class="min-h-screen bg-slate-100 text-slate-800">
    <div class="mx-auto flex min-h-screen max-w-[1440px]">
      <aside class="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
        <h1 class="mb-6 text-lg font-bold">Scout System</h1>

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
            スカウト文新規作成
          </RouterLink>

          <button
            type="button"
            class="block w-full cursor-not-allowed rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-400"
            title="設定画面は後続実装"
          >
            設定
          </button>
        </nav>

        <div class="sidebar-user" aria-label="ログインユーザー情報">
          <div class="sidebar-avatar">{{ userInitial }}</div>
          <div class="sidebar-user-meta">
            <p class="sidebar-user-name">{{ userName }}</p>
            <p class="sidebar-user-role">{{ userRole }}</p>
          </div>
        </div>
      </aside>

      <main class="min-w-0 flex-1 p-4 md:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from './store/authStore'

const authStore = useAuthStore()

const userName = computed(() => authStore.currentUser?.name || '未ログイン')
const userRole = computed(() => authStore.currentUser?.role || 'ゲスト')
const userInitial = computed(() => {
  const first = userName.value.trim().charAt(0)
  return first || '?'
})

onMounted(() => {
  authStore.hydrateCurrentUser()
})
</script>