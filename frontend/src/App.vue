<template>
  <div class="min-h-screen bg-slate-100 text-slate-800">
    <template v-if="authStore.isAuthenticated">
      <div class="mx-auto flex min-h-screen max-w-[1440px]">
        <AppSidebar
          :user-name="userName"
          :user-email="userEmail"
          :user-role="userRole"
          :collapsed="isSidebarCollapsed"
          @toggle-collapse="isSidebarCollapsed = !isSidebarCollapsed"
          @logout="handleLogout"
        />

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
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./store/authStore";
import AppSidebar from "./components/layout/AppSidebar.vue";

const router = useRouter();
const authStore = useAuthStore();
const isSidebarCollapsed = ref(false);

const userName = computed(() => {
  if (authStore.currentUserName) return authStore.currentUserName;
  if (authStore.currentUserEmail?.includes("@")) {
    return authStore.currentUserEmail.split("@")[0];
  }
  return "ユーザー";
});
const userEmail = computed(() => authStore.currentUserEmail || "-");
const userRole = computed(() => authStore.currentUserRoleType || "ゲスト");

async function handleLogout() {
  const shouldLogout = window.confirm("ログアウトしますか？");
  if (!shouldLogout) {
    return;
  }

  authStore.logout();
  await router.push("/login");
}
</script>
