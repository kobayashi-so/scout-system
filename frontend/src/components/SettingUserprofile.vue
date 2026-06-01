<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { deleteUser, fetchUsers, updateUserRole } from "../api/userApi";
import { useAuthStore } from "../store/authStore";
import type { RoleType, UserResponse } from "../type/user";

const authStore = useAuthStore();

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
  return users.value.find((user) => user.userId === selectedUserId.value) ?? null;
});

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

  if (isCurrentUser(user)) {
    alert("現在ログイン中の自分自身は削除できません。");
    return;
  }

  const confirmed = window.confirm(
    `「${user.userName}（${roleLabelMap[user.roleType]}）」を削除します。よろしいですか？`,
  );
  if (!confirmed) {
    return;
  }

  try {
    await deleteUser(user.userId, authStore.currentUserRoleType as RoleType);
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
    <h2>ユーザー情報編集</h2>

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
              <td>{{ roleLabelMap[user.roleType] }}</td>
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
                  :disabled="!isAdminUser || isCurrentUser(user)"
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

        <button
          type="button"
          class="btn-save"
          :disabled="!isAdminUser || !selectedUserId"
          @click="onClickSave"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.management-container {
  padding: 24px;
  border: 1px solid #d8e4de;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(6, 34, 28, 0.07);
}

.management-container h2 {
  margin: 0;
  font-size: 1.24rem;
  font-weight: 800;
  color: #10342d;
}

.content-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(300px, 1fr);
  gap: 20px;
  margin-top: 18px;
}

.table-section {
  border: 1px solid #d8e4de;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

.form-section {
  border: 1px solid #d8e4de;
  padding: 20px;
  background-color: #f5faf7;
  border-radius: 12px;
}

.add-title {
  background: linear-gradient(135deg, #047857 0%, #10b981 100%);
  color: #ffffff;
  padding: 8px 10px;
  border-radius: 8px;
  display: inline-block;
}

.edit-title {
  background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
  color: #ffffff;
  padding: 8px 10px;
  border-radius: 8px;
  display: inline-block;
}

.form-group {
  margin-top: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 700;
  color: #31564b;
}

.selected-user-text {
  margin: 0;
  color: #37544c;
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
  border: 1px solid #e6efea;
  padding: 10px 12px;
  text-align: left;
}

.item-table th {
  background-color: #f2f8f5;
  color: #31564b;
}

.state-row {
  text-align: center;
  color: #567168;
}

.action-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-row-edit {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: #ffffff;
  border: none;
  padding: 6px 11px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 700;
}

.btn-row-delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  border: none;
  padding: 6px 11px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 700;
}

.btn-row-edit:disabled,
.btn-row-delete:disabled,
.btn-save:disabled {
  background: #b6c1bc;
  cursor: not-allowed;
}

select {
  width: 100%;
  border: 1px solid #c8d8d1;
  border-radius: 8px;
  padding: 10px 12px;
}

select:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
}

.btn-save {
  background: linear-gradient(135deg, #047857 0%, #10b981 100%);
  color: #ffffff;
  border: none;
  padding: 10px 16px;
  width: 100%;
  cursor: pointer;
  margin-top: 12px;
  border-radius: 8px;
  font-weight: 700;
}

@media (max-width: 1080px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .management-container {
    padding: 18px;
  }
}
</style>
