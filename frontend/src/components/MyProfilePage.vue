<template>
  <section
    class="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
  >
    <header class="mb-6 border-b border-slate-100 pb-4">
      <h1 class="text-xl font-bold text-slate-900">ユーザー情報</h1>
      <p class="mt-1 text-sm text-slate-500">
        名前・メールアドレス・パスワードを編集できます。
      </p>
    </header>

    <p
      v-if="errorMessage"
      class="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700"
    >
      {{ errorMessage }}
    </p>
    <p
      v-if="successMessage"
      class="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
    >
      {{ successMessage }}
    </p>

    <form class="space-y-4" @submit.prevent="handleSave">
      <div>
        <label
          class="mb-1 block text-sm font-medium text-slate-700"
          for="user-name"
        >
          名前
        </label>
        <input
          id="user-name"
          v-model="form.userName"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          placeholder="山田 太郎"
        />
      </div>

      <div>
        <label
          class="mb-1 block text-sm font-medium text-slate-700"
          for="user-email"
        >
          メールアドレス
        </label>
        <input
          id="user-email"
          v-model="form.email"
          type="email"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          placeholder="example@company.com"
        />
      </div>

      <hr class="border-slate-200" />

      <div>
        <p class="mb-2 text-sm font-semibold text-slate-800">
          パスワード変更（必要なときのみ入力）
        </p>

        <label
          class="mb-1 block text-sm font-medium text-slate-700"
          for="current-password"
        >
          現在のパスワード
        </label>
        <input
          id="current-password"
          v-model="form.currentPassword"
          type="password"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          placeholder="現在のパスワード"
        />
      </div>

      <div>
        <label
          class="mb-1 block text-sm font-medium text-slate-700"
          for="new-password"
        >
          新しいパスワード
        </label>
        <input
          id="new-password"
          v-model="form.newPassword"
          type="password"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          placeholder="6文字以上"
        />
      </div>

      <div>
        <label
          class="mb-1 block text-sm font-medium text-slate-700"
          for="new-password-confirm"
        >
          新しいパスワード（確認）
        </label>
        <input
          id="new-password-confirm"
          v-model="newPasswordConfirm"
          type="password"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          placeholder="確認用に再入力"
        />
      </div>

      <div class="pt-2">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {{ saving ? "保存中..." : "保存する" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { updateMyProfile } from "../api/userApi";
import { useAuthStore } from "../store/authStore";

const authStore = useAuthStore();

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

  const willChangePassword =
    form.currentPassword.length > 0 || form.newPassword.length > 0;
  if (willChangePassword) {
    if (!form.currentPassword) {
      errorMessage.value = "パスワード変更時は現在のパスワードが必要です。";
      return;
    }

    if (!form.newPassword || form.newPassword.length < 6) {
      errorMessage.value = "新しいパスワードは6文字以上で入力してください。";
      return;
    }

    if (form.newPassword !== newPasswordConfirm.value) {
      errorMessage.value = "新しいパスワード（確認）が一致しません。";
      return;
    }
  }

  const confirmMessage = "この内容でユーザー情報を更新します。よろしいですか？";
  if (!window.confirm(confirmMessage)) {
    return;
  }

  saving.value = true;
  try {
    const updatedUser = await updateMyProfile(authStore.currentUserId, {
      userName: form.userName.trim(),
      email: form.email.trim().toLowerCase(),
      ...(willChangePassword
        ? {
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
          }
        : {}),
    });

    authStore.setSession(updatedUser);

    form.currentPassword = "";
    form.newPassword = "";
    newPasswordConfirm.value = "";
    successMessage.value = "ユーザー情報を更新しました。";
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.message || "ユーザー情報の更新に失敗しました。";
  } finally {
    saving.value = false;
  }
}
</script>
