<template>
  <section class="auth-page">
    <div class="auth-card">
      <h1>ログイン</h1>
      <p class="subtitle">登録済みアカウントでスカウト一覧にアクセスできます。</p>

      <p v-if="registeredMessage" class="success-message">{{ registeredMessage }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <form @submit.prevent="handleLogin">
        <label>
          メールアドレス
          <input v-model="form.email" type="email" autocomplete="email" required />
        </label>

        <label>
          パスワード
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            minlength="6"
            required
          />
        </label>

        <button type="submit">ログイン</button>
      </form>

      <p class="link-row">
        アカウントをお持ちでない場合は
        <RouterLink to="/register">ユーザー登録</RouterLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore'

const authStore = useAuthStore()
authStore.hydrateFromStorage()

const route = useRoute()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const errorMessage = ref('')

// 登録完了後は query(registered=1) で成功メッセージを表示する。
const registeredMessage = computed(() => {
  return route.query.registered === '1'
    ? 'ユーザー登録が完了しました。ログインしてください。'
    : ''
})

async function handleLogin() {
  errorMessage.value = ''

  try {
    await authStore.login(form.email, form.password)
    // 認証ガードから遷移してきた場合は元画面へ、それ以外は一覧へ。
    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/list'
    await router.push(redirectPath)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'ログインに失敗しました'
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 90px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #e0f2fe, #fef9c3);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
}

h1 {
  margin: 0;
  font-size: 1.6rem;
  color: #0f172a;
}

.subtitle {
  margin: 8px 0 20px;
  color: #475569;
  font-size: 0.95rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
  color: #1e293b;
}

input {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px;
  font-size: 1rem;
}

button {
  margin-top: 8px;
  border: none;
  border-radius: 10px;
  background: #0284c7;
  color: white;
  font-weight: 700;
  padding: 10px 16px;
  cursor: pointer;
}

.link-row {
  margin: 16px 0 0;
  color: #475569;
  font-size: 0.9rem;
}

.link-row a {
  color: #0369a1;
  font-weight: 700;
}

.success-message {
  margin: 0 0 12px;
  color: #166534;
  font-size: 0.9rem;
}

.error-message {
  margin: 0 0 12px;
  color: #b91c1c;
  font-size: 0.9rem;
}
</style>
