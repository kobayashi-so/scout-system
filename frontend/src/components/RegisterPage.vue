<template>
  <section class="auth-page">
    <div class="auth-card">
      <h1>ユーザー登録</h1>
      <p class="subtitle">新規ユーザーを登録してからログインしてください。</p>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <!-- 新規ユーザー登録フォーム（usersテーブル設計に合わせた項目） -->
      <form @submit.prevent="handleRegister">
        <!-- ユーザー名入力 -->
        <label>
          ユーザー名
          <input v-model="form.userName" type="text" autocomplete="name" required />
        </label>

        <!-- メールアドレス入力 -->
        <label>
          メールアドレス
          <input v-model="form.email" type="email" autocomplete="email" required />
        </label>

        <!-- 権限区分選択（sales/leader/admin） -->
        <label>
          権限区分
          <select v-model="form.roleType" required>
            <option value="sales">sales</option>
            <option value="leader">leader</option>
            <option value="admin">admin</option>
          </select>
        </label>

        <!-- パスワード入力 -->
        <label>
          パスワード
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            minlength="6"
            required
          />
        </label>

        <!-- パスワード確認入力 -->
        <label>
          パスワード（確認）
          <input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="6"
            required
          />
        </label>

        <button type="submit">登録する</button>
      </form>

      <p class="link-row">
        すでに登録済みの場合は
        <RouterLink to="/login">ログイン</RouterLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore'

const authStore = useAuthStore()
const router = useRouter()

// usersテーブル設計に合わせたフォームデータ
const form = reactive({
  userName: '', // ユーザー名
  email: '', // メールアドレス
  roleType: 'sales' as 'sales' | 'leader' | 'admin', // 権限区分
  password: '', // パスワード
  confirmPassword: '', // パスワード確認
})

const errorMessage = ref('')

// 新規登録処理
async function handleRegister() {
  errorMessage.value = ''

  // パスワードと確認用が一致しない場合はエラー表示
  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'パスワード確認が一致しません'
    return
  }

  try {
    // 入力値をストア経由でlocalStorageに保存
    await authStore.register({
      userName: form.userName,
      email: form.email,
      password: form.password,
      roleType: form.roleType,
    })
    // 登録API成功時にセッション保存まで完了するため、そのまま一覧へ遷移
    await router.push({ name: 'scout-list' })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'ユーザー登録に失敗しました'
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
  background: linear-gradient(160deg, #ecfeff, #fef3c7);
}

.auth-card {
  width: 100%;
  max-width: 460px;
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

input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px;
  font-size: 1rem;
}

button {
  margin-top: 8px;
  border: none;
  border-radius: 10px;
  background: #0ea5e9;
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

.error-message {
  margin: 0 0 12px;
  color: #b91c1c;
  font-size: 0.9rem;
}
</style>
