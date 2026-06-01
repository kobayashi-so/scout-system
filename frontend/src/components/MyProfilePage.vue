<template>
  <section class="profile-page">
    <header class="page-header">
      <h1 class="page-title">ユーザー情報</h1>
      <p class="page-subtitle">
        名前・メールアドレス・パスワードを編集できます。
      </p>
    </header>

    <p v-if="errorMessage" class="message error">
      {{ errorMessage }}
    </p>
    <p v-if="successMessage" class="message success">
      {{ successMessage }}
    </p>

    <form class="profile-form" @submit.prevent="handleSave">
      <div class="form-row">
        <label class="form-label" for="user-name"> 名前 </label>
        <input
          id="user-name"
          v-model="form.userName"
          type="text"
          class="form-input"
          placeholder="山田 太郎"
        />
      </div>

      <div class="form-row">
        <label class="form-label" for="user-email"> メールアドレス </label>
        <input
          id="user-email"
          v-model="form.email"
          type="email"
          class="form-input"
          placeholder="example@company.com"
        />
      </div>

      <hr class="divider" />

      <p class="password-section-title">
        <span class="password-section-badge">
          パスワード変更（必要なときのみ入力）
        </span>
      </p>

      <div class="form-row">
        <label class="form-label" for="current-password">
          現在のパスワード
        </label>
        <input
          id="current-password"
          v-model="form.currentPassword"
          type="password"
          class="form-input"
          placeholder="現在のパスワード"
        />
      </div>

      <div class="form-row">
        <label class="form-label" for="new-password"> 新しいパスワード </label>
        <input
          id="new-password"
          v-model="form.newPassword"
          type="password"
          class="form-input"
          placeholder="6文字以上"
        />
      </div>

      <div class="form-row">
        <label class="form-label" for="new-password-confirm">
          新しいパスワード（確認）
        </label>
        <input
          id="new-password-confirm"
          v-model="newPasswordConfirm"
          type="password"
          class="form-input"
          placeholder="確認用に再入力"
        />
      </div>

      <div class="actions">
        <button type="submit" :disabled="saving" class="save-button">
          {{ saving ? "保存中..." : "保存する" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { updateMyProfile } from "../api/userApi";
import { useAuthStore } from "../store/authStore";

const authStore = useAuthStore();
const router = useRouter();

authStore.hydrateFromStorage();

const form = reactive({
  userName: authStore.currentUserName ?? "",
  email: authStore.currentUserEmail ?? "",
  currentPassword: "",
  newPassword: "",
});

const newPasswordConfirm = ref("");
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

async function handleSave() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!authStore.currentUserId) {
    errorMessage.value =
      "ユーザー情報が取得できません。再ログインしてください。";
    return;
  }

  if (!form.userName.trim()) {
    errorMessage.value = "名前を入力してください。";
    return;
  }

  if (!form.email.trim()) {
    errorMessage.value = "メールアドレスを入力してください。";
    return;
  }

  const currentPassword = form.currentPassword.trim();
  const newPassword = form.newPassword.trim();
  const newPasswordConfirmTrimmed = newPasswordConfirm.value.trim();

  // 新しいパスワードを入力したときだけパスワード変更として扱う
  const willChangePassword =
    newPassword.length > 0 || newPasswordConfirmTrimmed.length > 0;

  if (willChangePassword) {
    if (!currentPassword) {
      errorMessage.value = "パスワード変更時は現在のパスワードが必要です。";
      return;
    }

    if (newPassword.length < 6) {
      errorMessage.value = "新しいパスワードは6文字以上で入力してください。";
      return;
    }

    if (newPassword !== newPasswordConfirmTrimmed) {
      errorMessage.value = "パスワードが一致していません";
      return;
    }
  }

  const confirmMessage = "この内容でユーザー情報を更新します。よろしいですか？";
  if (!window.confirm(confirmMessage)) {
    return;
  }

  saving.value = true;
  try {
    await updateMyProfile(authStore.currentUserId, {
      userName: form.userName.trim(),
      email: form.email.trim().toLowerCase(),
      ...(willChangePassword
        ? {
            currentPassword,
            newPassword,
          }
        : {}),
    });

    window.alert("保存成功後、ログイン画面に移動します。");
    authStore.logout();
    await router.push({ name: "login", query: { profileUpdated: "1" } });
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.message || "ユーザー情報の更新に失敗しました。";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.profile-page {
  margin: 0 auto;
  width: 100%;
  max-width: 768px;
  border: 1px solid #d8e4de;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  padding: 24px;
  box-shadow: 0 10px 24px rgba(6, 34, 28, 0.07);
}

.page-header {
  margin-bottom: 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.message {
  margin-bottom: 14px;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.875rem;
}

.message.error {
  background: #fff1f2;
  color: #be123c;
}

.message.success {
  background: #ecfdf5;
  color: #047857;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.form-input {
  width: 100%;
  border: 1px solid #c8d8d1;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
}

.divider {
  border: 0;
  border-top: 1px solid #e2e8f0;
  margin: 6px 0;
}

.password-section-title {
  margin: 2px 0;
}

.password-section-badge {
  display: inline-block;
  background-color: #8bf7c3;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
}

.actions {
  padding-top: 8px;
}

.save-button {
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #047857 0%, #10b981 100%);
  color: #ffffff;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover {
  background: linear-gradient(135deg, #03624a 0%, #0ea571 100%);
}

.save-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
