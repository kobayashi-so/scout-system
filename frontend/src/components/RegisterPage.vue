<template>
  <section class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <span class="brand-logo">Scout MANAGER</span>
        <h1>ユーザー登録</h1>
        <p class="subtitle">新規ユーザーを登録してからログインしてください。</p>
      </div>

      <div v-if="errorMessage" class="message-box error-message">
        <span class="icon">⚠️</span> {{ errorMessage }}
      </div>

      <form @submit.prevent="handleRegister">
        <label class="form-label">
          ユーザー名
          <input
            v-model="form.userName"
            type="text"
            autocomplete="name"
            placeholder="山田 太郎"
            required
          />
        </label>

        <label class="form-label">
          メールアドレス
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="example@techvision.com"
            required
          />
        </label>

        <label class="form-label">
          権限区分
          <select v-model="form.roleType" required>
            <option value="sales">sales</option>
            <option value="leader">leader</option>
            <option value="admin">admin</option>
          </select>
        </label>

        <label class="form-label">
          パスワード
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            minlength="6"
            placeholder="••••••••"
            required
          />
        </label>

        <label class="form-label">
          パスワード（確認）
          <input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="6"
            placeholder="••••••••"
            required
          />
        </label>

        <button
          type="submit"
          class="btn-register"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? "登録中..." : "登録する" }}
        </button>
      </form>

      <p class="link-row">
        すでに登録済みの場合は
        <RouterLink to="/login">ログイン</RouterLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/authStore";

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  userName: "",
  email: "",
  roleType: "sales" as "sales" | "leader" | "admin",
  password: "",
  confirmPassword: "",
});

const errorMessage = ref("");

async function handleRegister() {
  errorMessage.value = "";

  if (form.password !== form.confirmPassword) {
    errorMessage.value = "パスワード確認が一致しません";
    return;
  }

  try {
    await authStore.register({
      userName: form.userName,
      email: form.email,
      password: form.password,
      roleType: form.roleType,
    });
    await router.push({ name: "scout-list" });
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "ユーザー登録に失敗しました";
  }
}
</script>

<style scoped>
/* 💡 背景：ログイン画面と完全に一致する美しい深緑のコンビネーショングラデーション */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px; /* 入力項目増加に伴い上下の余白を担保 */
  background: linear-gradient(135deg, #165a45 0%, #146531 40%, #083a13 100%);
  font-family: "Manrope", "Noto Sans JP", sans-serif;
  position: relative;
}

/* 💡背景に上質な奥行きを出すための光 */
.auth-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 20% 20%,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 50%
  );
  pointer-events: none;
}

/* 💡 カード：マージンや角丸をログイン画面と共通化 */
.auth-card {
  width: 100%;
  max-width: 420px; /* 入力パーツとのバランスを考え幅を少しだけ最適化 */
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.8);
  z-index: 1;
}

/* ヘッダー周り */
.auth-header {
  margin-bottom: 24px;
}

.brand-logo {
  display: block;
  font-size: 0.9rem;
  font-weight: 800;
  color: #165a45; /* メイン深緑 */
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.5;
}

/* フォーム */
form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

/* インプット・セレクト共通スタイル：フォーカス時に鮮やかな緑(#22c55e)に光る */
input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 11px 14px;
  font-size: 0.9rem;
  color: #1e293b;
  background-color: #fdfdfd;
  transition: all 0.2s;
  box-sizing: border-box;
  width: 100%;
}

/* セレクトボックスの右矢印に下方向のゆとりを持たせる微調整 */
select {
  cursor: pointer;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 16px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding-right: 40px;
}

input:focus,
select:focus {
  outline: none;
  border-color: #3cb47a;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(60, 180, 122, 0.15);
}

input::placeholder {
  color: #94a3b8;
}

/* 登録ボタン：メインカラーの深緑(#165a45)を適用 */
.btn-register {
  margin-top: 8px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #047857 0%, #10b981 100%);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(22, 90, 69, 0.2);
}

.btn-register:hover {
  background: linear-gradient(135deg, #03624a 0%, #0ea571 100%);
  transform: translateY(-1px); /* ホバー時にわずかに浮かす微細なエフェクト */
  box-shadow: 0 6px 16px rgba(22, 90, 69, 0.3);
}

.btn-register:active {
  transform: translateY(0);
}

.btn-register:disabled {
  background: #cbd5e1;
  box-shadow: none;
  cursor: not-allowed;
}

/* フッターリンク */
.link-row {
  margin: 24px 0 0;
  color: #64748b;
  font-size: 0.8rem;
  text-align: center;
}

.link-row a {
  color: #0f766e;
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s;
}

.link-row a:hover {
  text-decoration: underline;
  color: #134e4a;
}

/* 通知メッセージボックス */
.message-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.4;
  margin-bottom: 16px;
}

.message-box .icon {
  font-weight: bold;
}

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
}
</style>
