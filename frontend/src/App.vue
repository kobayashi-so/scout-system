<template>
  <div class="min-h-screen bg-slate-100 text-slate-800">
    <template v-if="authStore.isAuthenticated">
      <div class="mx-auto flex min-h-screen max-w-[1440px]">
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
              スカウト文新規作成
            </RouterLink>

            <RouterLink
              to="/settings"
              class="block w-full cursor-not-allowed rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-400"
              title="設定画面は後続実装"
            >
              設定
            </RouterLink>

            <button
              type="button"
              class="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              @click="handleLogout"
            >
              ログアウト
            </button>
          </nav>

          <div class="sidebar-user" aria-label="ログインユーザー情報">
            <div class="sidebar-avatar">{{ userInitial }}</div>
            <div class="sidebar-user-meta">
              <p class="sidebar-user-name">{{ userEmail }}</p>
              <p class="sidebar-user-role">{{ userRole }}</p>
            </div>
          </div>
        </aside>

        <main class="min-w-0 flex-1 p-4 md:p-6">
          <RouterView />
        </main>
      </div>
    </template>
    <template v-else>
      <RouterView />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './store/authStore'

const router = useRouter()
const authStore = useAuthStore()

const userEmail = computed(() => authStore.currentUserEmail || '未ログイン')
const userRole = computed(() => authStore.currentUserRoleType || 'ゲスト')
const userInitial = computed(() => {
  const first = userEmail.value.trim().charAt(0)
  return first || '?'
})

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}
</script>
