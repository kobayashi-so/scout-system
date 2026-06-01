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

const inputCheckTitle = ref("");
const selectedItemId = ref<string | null>(null);

const resetForm = () => {
  inputCheckTitle.value = "";
  selectedItemId.value = null;
};

const loadItems = async () => {
  isLoading.value = true;
  try {
    items.value = await fetchCheckItems();
  } catch (error) {
    console.error(error);
    alert("チェック項目の取得に失敗しました。");
  } finally {
    isLoading.value = false;
  }
};

const onClickEdit = (item: checkItem) => {
  selectedItemId.value = item.id;
  inputCheckTitle.value = item.checkTitle;
};

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
              <td colspan="3" class="state-row">読み込み中...</td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td colspan="3" class="state-row">チェック項目がありません。</td>
            </tr>
            <tr v-for="item in items" :key="item.id">
              <td class="order-cell">{{ item.display_order }}</td>
              <td>{{ item.checkTitle }}</td>
              <td class="action-cell">
                <button type="button" class="btn-row-edit" @click="onClickEdit(item)">
                  編集
                </button>
                <button type="button" class="btn-row-delete" @click="onClickDelete(item.id)">
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
            v-model="inputCheckTitle"
            type="text"
            placeholder="項目名を入力（255文字以内）"
          />
        </div>

        <button type="button" class="btn-save" @click="onClickSave">保存</button>
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

.order-cell {
  width: 80px;
  color: #567168;
  font-weight: 700;
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

.form-group {
  margin: 14px 0 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 700;
  color: #31564b;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #c8d8d1;
  border-radius: 8px;
  box-sizing: border-box;
}

.form-group input:focus {
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
