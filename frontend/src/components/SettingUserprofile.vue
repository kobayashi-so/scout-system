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

const selectedUser = computed(() => {
  return (
    users.value.find((user) => user.userId === selectedUserId.value) ?? null
  );
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
              <td colspan="4">読み込み中...</td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="4">ユーザーがありません。</td>
            </tr>
            <tr v-for="user in users" :key="user.userId || user.email">
              <td>{{ user.userName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ roleLabelMap[user.roleType] }}</td>
              <td class="action-cell">
                <button
                  class="btn-row-edit"
                  :disabled="!isAdminUser"
                  @click="onClickEdit(user)"
                >
                  編集
                </button>
                <button
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

        <button
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
  padding: 20px;
  font-family: sans-serif;
}

.content-layout {
  display: flex;
  gap: 40px;
  margin-top: 20px;
}

.table-section {
  flex: 2;
}

.form-section {
  flex: 1;
  border: 1px solid #ccc;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.add-title {
  background-color: #3cb474;
  color: white;
  padding: 8px;
  border-radius: 4px;
  display: inline-block;
}

.edit-title {
  background-color: #1890ff;
  color: white;
  padding: 8px;
  border-radius: 4px;
  display: inline-block;
}

.form-group {
  margin-top: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

.selected-user-text {
  margin: 0;
  color: #334155;
}

.hint-text {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
}

.btn-row-edit {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 4px;
}

.btn-row-edit:disabled {
  background-color: #a2a3a4; /* 灰色 管理者ではない人に表示される */
  cursor: not-allowed;
}

.btn-row-delete:disabled {
  background-color: #a2a3a4; /* 灰色 管理者ではない人に表示される */
  cursor: not-allowed;
}

.btn-row-delete {
  background-color: #f21010;
  color: white;
  border: none;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 4px;
}

.btn-save {
  background-color: #05ad54; /* 緑四角 */
  color: white;
  border: none;
  padding: 8px 16px;
  width: 100%;
  cursor: pointer;
  margin-top: 12px;
}

.btn-save:disabled {
  background-color: #a2a3a4; /* 灰色 管理者ではない人に表示される */
  cursor: not-allowed;
}

.item-table {
  width: 100%;
  border-collapse: collapse;
}

.item-table th,
.item-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.item-table th {
  background-color: #f2f2f2;
}

.action-cell {
  display: flex;
  gap: 8px;
}

select {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 8px;
}
</style>
