<template>
  <div>
    <header class="header">
      <nav class="nav">
        <template v-if="authStore.isAuthenticated">
          <RouterLink to="/list">一覧</RouterLink>
          <RouterLink to="/create">新規作成</RouterLink>
          <button class="logout-btn" @click="handleLogout">ログアウト</button>
        </template>

        <template v-else>
          <RouterLink to="/login">ログイン</RouterLink>
          <RouterLink to="/register">ユーザー登録</RouterLink>
        </template>
      </nav>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from './store/authStore'

const router = useRouter()
const authStore = useAuthStore()
authStore.hydrateFromStorage()

// ログイン状態に応じてヘッダー表示を切り替える。
async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}
</script>

<style scoped>
.header {
  background: #035823;
  padding: 16px 24px;
}

.nav {
  display: flex;
  gap: 16px;
}

.nav a {
  color: white;
  text-decoration: none;
  font-weight: 600;
}

.nav a.router-link-active {
  color: #90cdf4;
}

.logout-btn {
  background: transparent;
  border: 1px solid #90cdf4;
  color: #90cdf4;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-weight: 600;
}

.main {
  padding: 24px;
}
</style>