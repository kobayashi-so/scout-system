<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { checkItem } from "../type/checkItem";
import {
  createCheckItem,
  deleteCheckItem,
  fetchCheckItems,
  updateCheckItem,
} from "../api/checkItemApi";

const items = ref<checkItem[]>([]);
const isLoading = ref(false);

// --- フォームの入力値を管理する変数（is_requiredは削除済み） ---
const inputCheckTitle = ref("");
const selectedItemId = ref<string | null>(null); //「今どの項目を編集対象にしているか」を保持するための状態

const resetForm = () => {
  inputCheckTitle.value = "";
  selectedItemId.value = null;
};

//「サーバーからチェック項目一覧を取得して、画面に表示するデータを更新する」ための関数
const loadItems = async () => {
  isLoading.value = true;
  try {
    items.value = await fetchCheckItems();
  } catch (error) {
    console.error(error);
    alert("チェック項目の取得に失敗しました。");
  } finally {
    isLoading.value = false;
  } //成功/失敗に関係なく必ず読み込み中を終了する
};

// --- ボタンを押したときの関数 ---
const onClickAdd = () => {
  resetForm();
};

const onClickEdit = (item: checkItem) => {
  selectedItemId.value = item.id;
  inputCheckTitle.value = item.checkTitle;
};

//trim()で前後の空白を削除して、空文字だったらアラートを出すようにする
const onClickSave = async () => {
  const trimmedTitle = inputCheckTitle.value.trim();
  if (!trimmedTitle) {
    alert("チェック項目名を入力してください。");
    return;
  }

  try {
    if (selectedItemId.value) {
      await updateCheckItem(selectedItemId.value, trimmedTitle);
    } else {
      await createCheckItem(trimmedTitle);
    }

    await loadItems();
    resetForm();
  } catch (error) {
    console.error(error);
    alert("保存に失敗しました。");
  }
};

const onClickDelete = async (id: string) => {
  const target = items.value.find((item) => item.id === id);
  const checkTitle = target?.checkTitle ?? "この項目";

  const isConfirmed = window.confirm(
    `「${checkTitle}」を削除します。よろしいですか？`,
  );
  if (!isConfirmed) {
    return;
  }

  try {
    await deleteCheckItem(id);
    await loadItems();

    if (selectedItemId.value === id) {
      resetForm();
    }
  } catch (error) {
    console.error(error);
    alert("削除に失敗しました。");
  }
};

onMounted(async () => {
  await loadItems();
});
</script>

<template>
  <div class="management-container">
    <h2>評価基準・チェック項目管理</h2>

    <div class="content-layout">
      <div class="table-section">
        <div class="action-bar"></div>

        <table class="item-table">
          <thead>
            <tr>
              <th>表示順</th>
              <th>チェック項目名</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="3">読み込み中...</td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td colspan="3">チェック項目がありません。</td>
            </tr>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.display_order }}</td>
              <td>{{ item.checkTitle }}</td>
              <td class="action-cell">
                <button class="btn-row-edit" @click="onClickEdit(item)">
                  編集
                </button>
                <button class="btn-row-delete" @click="onClickDelete(item.id)">
                  削除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="form-section">
        <h3 :class="selectedItemId ? 'edit-title' : 'add-title'">
          {{ selectedItemId ? "項目編集" : "項目追加" }}
        </h3>

        <div class="form-group">
          <label>チェック項目名</label>
          <input
            type="text"
            v-model="inputCheckTitle"
            placeholder="項目名を入力（255文字以内）"
          />
        </div>

        <button class="btn-save" @click="onClickSave">保存</button>
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
  background-color: #3cb474; /* 緑四角 */
  color: white;
  padding: 8px;
  border-radius: 4px;
  display: inline-block;
}

.edit-title {
  background-color: #1890ff; /* 青四角 */
  color: white;
  padding: 8px;
  border-radius: 4px;
  display: inline-block;
}

.action-bar {
  margin-bottom: 10px;
}

/* 追加 */
/* テックリーダー指定のボタン色 */
.btn-add {
  background-color: #05ad54; /* 緑四角 */
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
}

.btn-row-edit {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 4px;
}

.btn-row-delete {
  background-color: #f21010; /* 赤四角 */
  color: white;
  border: none;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 4px;
}

.btn-save {
  background-color: #05ad54;
  color: white;
  border: none;
  padding: 8px 16px;
  width: 100%;
  cursor: pointer;
  margin-top: 10px;
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

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 6px;
  box-sizing: border-box;
}
</style>
