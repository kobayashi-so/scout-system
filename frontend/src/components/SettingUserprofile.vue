<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { deleteUser, fetchUsers, updateUserRole } from "../api/userApi";
import { useAuthStore } from "../store/authStore";
import type { RoleType, UserResponse } from "../type/user";

const authStore = useAuthStore();
const router = useRouter();

const users = ref<UserResponse[]>([]);
const isLoading = ref(false);

const selectedUserId = ref<string | null>(null);
const selectedRoleType = ref<RoleType>("sales");

const roleOptions: { label: string; value: RoleType }[] = [
  { label: "作成者", value: "sales" },
  { label: "営業承認者", value: "leader" },
  { label: "管理者", value: "admin" },
];

const roleLabelMap: Record<RoleType, string> = {
  sales: "作成者",
  leader: "営業承認者",
  admin: "管理者",
};

const isAdminUser = computed(() => authStore.currentUserRoleType === "admin");

const isCurrentUser = (user: UserResponse) => {
  return user.userId === authStore.currentUserId;
};

const selectedUser = computed(() => {
  return (
    users.value.find((user) => user.userId === selectedUserId.value) ?? null
  );
});

const adminUserCount = computed(
  () => users.value.filter((user) => user.roleType === "admin").length,
);

const resetForm = () => {
  selectedUserId.value = null;
  selectedRoleType.value = "sales";
};

const loadUsers = async () => {
  isLoading.value = true;
  try {
    users.value = await fetchUsers();
  } catch (error) {
    console.error(error);
    alert("ユーザー情報の取得に失敗しました。");
  } finally {
    isLoading.value = false;
  }
};

const onClickEdit = (user: UserResponse) => {
  selectedUserId.value = user.userId ?? null;
  selectedRoleType.value = user.roleType;
};

const onClickSave = async () => {
  if (!isAdminUser.value) {
    alert("ロール変更は管理者のみ実行できます。");
    return;
  }

  if (!selectedUserId.value) {
    alert("編集対象のユーザーを選択してください。");
    return;
  }

  try {
    await updateUserRole(
      selectedUserId.value,
      selectedRoleType.value,
      authStore.currentUserRoleType as RoleType,
    );
    await loadUsers();
    resetForm();
  } catch (error) {
    console.error(error);
    alert("ユーザー情報の更新に失敗しました。");
  }
};

const onClickDelete = async (user: UserResponse) => {
  if (!isAdminUser.value) {
    alert("ユーザー削除は管理者のみ実行できます。");
    return;
  }

  if (!user.userId) {
    alert("対象ユーザーのIDが取得できません。");
    return;
  }

  const confirmed = window.confirm(
    `「${user.userName}（${roleLabelMap[user.roleType]}）」を削除します。よろしいですか？`,
  );
  if (!confirmed) {
    return;
  }

  try {
    const deletedSelf = isCurrentUser(user);
    await deleteUser(user.userId, authStore.currentUserRoleType as RoleType);

    if (deletedSelf) {
      authStore.logout();
      await router.push("/login");
      return;
    }

    await loadUsers();

    if (selectedUserId.value === user.userId) {
      resetForm();
    }
  } catch (error) {
    console.error(error);
    alert("ユーザー削除に失敗しました。");
  }
};

onMounted(async () => {
  await loadUsers();
});
</script>

<template>
  <div class="management-container">
    <header class="page-header">
      <div>
        <p class="eyebrow">SETTINGS</p>
        <h2>ユーザー情報編集</h2>
        <p class="page-description">
          ユーザーのロール変更と削除を行います。編集・削除は管理者のみ実行できます。
        </p>
      </div>
      <div class="header-badges">
        <div class="header-badge">
          <span class="header-badge__label">登録ユーザー</span>
          <strong>{{ users.length }}</strong>
        </div>
        <div class="header-badge">
          <span class="header-badge__label">管理者</span>
          <strong>{{ adminUserCount }}</strong>
        </div>
      </div>
    </header>

    <div class="content-layout">
      <div class="table-section">
        <table class="item-table">
          <thead>
            <tr>
              <th>ユーザー名</th>
              <th>メールアドレス</th>
              <th>ロール</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="4" class="state-row">読み込み中...</td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="4" class="state-row">ユーザーがありません。</td>
            </tr>
            <tr v-for="user in users" :key="user.userId || user.email">
              <td>{{ user.userName }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-chip">{{ roleLabelMap[user.roleType] }}</span>
              </td>
              <td class="action-cell">
                <button
                  type="button"
                  class="btn-row-edit"
                  :disabled="!isAdminUser"
                  @click="onClickEdit(user)"
                >
                  編集
                </button>
                <button
                  type="button"
                  class="btn-row-delete"
                  :disabled="!isAdminUser"
                  @click="onClickDelete(user)"
                >
                  削除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="form-section">
        <h3 :class="selectedUserId ? 'edit-title' : 'add-title'">
          {{ selectedUserId ? "ユーザー編集" : "ユーザー選択" }}
        </h3>

        <div class="form-group">
          <label>対象ユーザー</label>
          <p class="selected-user-text">
            {{
              selectedUser
                ? `${selectedUser.userName}（${selectedUser.email}）`
                : "一覧の「編集」ボタンからユーザーを選択してください。"
            }}
          </p>
        </div>

        <div class="form-group">
          <label>ロール</label>
          <select
            v-model="selectedRoleType"
            :disabled="!isAdminUser || !selectedUserId"
          >
            <option
              v-for="option in roleOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <p v-if="!isAdminUser" class="hint-text">
            ロール変更は管理者のみ実行できます。
          </p>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn-save"
            :disabled="!isAdminUser || !selectedUserId"
            @click="onClickSave"
          >
            保存
          </button>

          <button
            v-if="selectedUserId"
            type="button"
            class="btn-cancel"
            @click="resetForm"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.management-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.09em;
  color: #0d9488;
  font-weight: 800;
}

h2 {
  margin: 0;
}

.page-description {
  margin: 8px 0 0;
  color: #46665c;
  font-size: 13px;
}

.header-badges {
  display: flex;
  gap: 10px;
}

.header-badge {
  flex-shrink: 0;
  min-width: 90px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.25);
  background: linear-gradient(135deg, rgba(240, 253, 250, 0.95) 0%, rgba(209, 250, 229, 0.88) 100%);
  text-align: center;
}

.header-badge__label {
  display: block;
  color: #0f766e;
  font-size: 11px;
  font-weight: 700;
}

.header-badge strong {
  margin-top: 2px;
  display: block;
  font-size: 24px;
  line-height: 1;
  color: #065f46;
}

.content-layout {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.table-section {
  flex: 2;
  border: 1px solid #d3e5de;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 253, 250, 0.94) 100%);
  box-shadow: 0 10px 22px rgba(7, 34, 28, 0.07);
}

.form-section {
  flex: 1;
  border: 1px solid #cfe4dc;
  padding: 18px;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.96) 0%, rgba(241, 250, 246, 0.9) 100%);
  border-radius: 14px;
  box-shadow: 0 10px 22px rgba(7, 34, 28, 0.07);
}

.add-title {
  margin-top: 0;
  background: linear-gradient(135deg, #02664a 0%, #039d88 100%);
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 10px;
  display: inline-block;
  box-shadow: 0 8px 16px rgba(2, 102, 74, 0.24);
}

.edit-title {
  margin-top: 0;
  background: linear-gradient(135deg, #41ba73 0%, #43b3a6 100%);
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 10px;
  display: inline-block;
  box-shadow: 0 8px 16px rgba(41, 153, 113, 0.22);
}

.form-group {
  margin: 16px 0 6px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 700;
  color: #184339;
}

.selected-user-text {
  margin: 0;
  color: #37544c;
  line-height: 1.5;
}

.hint-text {
  margin-top: 6px;
  color: #567168;
  font-size: 12px;
}

.item-table {
  width: 100%;
  border-collapse: collapse;
}

.item-table th,
.item-table td {
  border-bottom: 1px solid #e3eee9;
  padding: 11px 12px;
  text-align: left;
}

.item-table th {
  background: #f3faf7;
  color: #0f3d2e;
  font-size: 13px;
}

.item-table tbody tr:hover {
  background: #f8fcfa;
}

.state-row {
  text-align: center;
  color: #567168;
}

.role-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
}

.action-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-row-edit {
  background: linear-gradient(135deg, #41ba73 0%, #43b3a6 100%);
  color: #ffffff;
  border: none;
  padding: 6px 11px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 700;
}

.btn-row-edit:hover {
  background: linear-gradient(135deg, #07afa1 0%, #0665a5 100%);
  border-color: #b8d1c7;
}

.btn-row-delete {
  background: linear-gradient(135deg, #8a2828 0%, #d10202 100%);
  color: #ffffff;
  border: none;
  padding: 6px 11px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 700;
}

.btn-row-delete:hover {
  background: linear-gradient(135deg, #ed3a04 0%, #ff0e06 100%);
}

.btn-row-edit:disabled,
.btn-row-delete:disabled,
.btn-save:disabled {
  background: #b6c1bc;
  cursor: not-allowed;
}

select {
  width: 100%;
  border: 1px solid #c7ddd5;
  border-radius: 10px;
  padding: 10px 12px;
  background: #ffffff;
  color: #12352d;
}

select:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
}

/* 保存ボタン */
.btn-save {
  background: linear-gradient(135deg, #02664a 0%, #039d88 100%);
  color: #ffffff;
  border: none;
  padding: 10px 16px;
  width: 100%;
  cursor: pointer;
  border-radius: 10px;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.btn-save:hover {
  filter: brightness(1.04);
  transform: translateY(-1px);
  box-shadow: 0 10px 16px rgba(5, 120, 87, 0.24);
}

.form-actions {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-cancel {
  border: 1px solid #c7ddd5;
  border-radius: 10px;
  background: #ffffff;
  color: #31574d;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.btn-cancel:hover {
  background: #f3faf7;
  color: #17473c;
}

@media (max-width: 1080px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-badges {
    flex-wrap: wrap;
  }

  .content-layout {
    flex-direction: column;
  }

  .management-container {
    padding: 6px;
  }
}
</style>
