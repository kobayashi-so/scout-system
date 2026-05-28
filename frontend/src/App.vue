<template>
  <div>
    <header class="header">
      <nav class="nav">
        <RouterLink to="/list">一覧</RouterLink>

        <RouterLink to="/create">
          新規作成
        </RouterLink>

        <RouterLink to="/settings">
         設定
        </RouterLink>
      </nav>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
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
  color: #d6f490;
}

.main {
  padding: 24px;
}
</style>