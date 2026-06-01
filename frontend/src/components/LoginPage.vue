<template>
  <section class="auth-page">
    <div class="auth-card">
      <!-- アプリのロゴを模したヘッダー -->
      <div class="auth-header">
        <span class="brand-logo">ScoutForge</span>
        <h1>ログイン</h1>
        <p class="subtitle">
          登録済みアカウントでスカウト一覧にアクセスできます。
        </p>
      </div>

      <!-- メッセージ表示エリア -->
      <div v-if="registeredMessage" class="message-box success-message">
        <span class="icon">✓</span> {{ registeredMessage }}
      </div>
      <div v-if="profileUpdatedMessage" class="message-box success-message">
        <span class="icon">✓</span> {{ profileUpdatedMessage }}
      </div>
      <div v-if="errorMessage" class="message-box error-message">
        <span class="icon">⚠️</span> {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin">
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
          パスワード
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            minlength="6"
            placeholder="••••••••"
            required
          />
        </label>

        <button type="submit" class="btn-login" :disabled="authStore.loading">
          {{ authStore.loading ? "認証中..." : "ログイン" }}
        </button>
      </form>

      <p class="link-row">
        アカウントをお持ちでない場合は
        <RouterLink to="/register">ユーザー登録</RouterLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../store/authStore";

const authStore = useAuthStore();
authStore.hydrateFromStorage();

const route = useRoute();
const router = useRouter();

const form = reactive({
  email: "",
  password: "",
});

const errorMessage = ref("");

const registeredMessage = computed(() => {
  return route.query.registered === "1"
    ? "ユーザー登録が完了しました。ログインしてください。"
    : "";
});

const profileUpdatedMessage = computed(() => {
  return route.query.profileUpdated === "1"
    ? "保存成功後、ログイン画面に移動しました。再ログインしてください。"
    : "";
});

async function handleLogin() {
  errorMessage.value = "";

  try {
    await authStore.login(form.email, form.password);
    const redirectPath =
      typeof route.query.redirect === "string" ? route.query.redirect : "/list";
    await router.push(redirectPath);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "ログインに失敗しました";
  }
}
</script>

<style scoped>
/* 💡 背景：#22c55eをベースにした、透明感と奥行きのある綺麗なコンビネーショングラデーション */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #165a45 0%, #146531 40%, #083a13 100%);
  font-family: "Manrope", "Noto Sans JP", sans-serif;
  position: relative;
}

/* 💡背景にさらに上質な奥行きを出すためのガラス風の抽象的な光（お好みで） */
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

/* 💡 カード：背景が鮮やかになった分、カードのドロップシャドウを深くして立体感を強調 */
.auth-card {
  width: 100%;
  max-width: 400px;
  background: rgba(
    255,
    255,
    255,
    0.98
  ); /* ほんの少しだけ透けさせて背景と馴染ませる */
  border-radius: 20px; /* 少し丸みを広げてさらにモダンに */
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

/* インプット：フォーカス時に鮮やかな緑(#22c55e)に光る */
input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 11px 14px;
  font-size: 0.9rem;
  color: #1e293b;
  background-color: #fdfdfd;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: #22c55e; /* 鮮やかな緑 */
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

input::placeholder {
  color: #94a3b8;
}

/* ログインボタン：メインカラーの深緑(#165a45)を適用 */
.btn-login {
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

.btn-login:hover {
  background: linear-gradient(135deg, #03624a 0%, #0ea571 100%);
  transform: translateY(-1px); /* ホバー時にわずかに浮かす微細なエフェクト */
  box-shadow: 0 6px 16px rgba(22, 90, 69, 0.3);
}

.btn-login:active {
  transform: translateY(0);
}

.btn-login:disabled {
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

.success-message {
  background-color: #ecfdf5;
  border: 1px solid #d1fae5;
  color: #165a45;
}

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
}
</style>
