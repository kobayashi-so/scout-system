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

            <!-- ▼▼▼ 設定メニュー（アコーディオン化） ▼▼▼ -->
            <div class="pt-2">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium transition hover:bg-white/10 whitespace-nowrap"
                :class="{ 'bg-white/10': isSettingsActive || isSettingsOpen }"
                @click="isSettingsOpen = !isSettingsOpen"
              >
                <span>設定</span>
                <!-- 矢印（文字で表現して巨大化を防止） -->
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

              <!-- サブメニュー項目 -->
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
            <!-- ▲▲▲ 設定メニュー（アコーディオン化） ▲▲▲ -->

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
import { computed, ref, watchEffect } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./store/authStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// --- アコーディオンの制御用ステート ---
const isSettingsOpen = ref(false);

// 現在のルートが「/settings」から始まるかどうかを判定
const isSettingsActive = computed(() => {
  return route.path.startsWith("/settings");
});

// 現在のページが設定内のページなら、自動的にアコーディオンを開く
watchEffect(() => {
  if (isSettingsActive.value) {
    isSettingsOpen.value = true;
  }
});
// ------------------------------------

const userEmail = computed(() => authStore.currentUserEmail || "未ログイン");
const userRole = computed(() => authStore.currentUserRoleType || "ゲスト");
const userInitial = computed(() => {
  const first = userEmail.value.trim().charAt(0);
  return first || "?";
});

async function handleLogout() {
  authStore.logout();
  await router.push("/login");
}
</script>
