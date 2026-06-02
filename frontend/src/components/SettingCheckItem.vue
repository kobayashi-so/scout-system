<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { checkItem } from "../type/checkItem";
import {
  createCheckItem,
  deleteCheckItem,
  fetchCheckItems,
  updateCheckItem,
} from "../api/checkItemApi";

const items = ref<checkItem[]>([]);
const isLoading = ref(false);
const maxCheckTitleLength = 50;

// --- フォームの入力値を管理する変数（is_requiredは削除済み） ---
const inputCheckTitle = ref("");
const selectedItemId = ref<string | null>(null); //「今どの項目を編集対象にしているか」を保持するための状態

const trimmedInputTitle = computed(() => inputCheckTitle.value.trim());
const currentLength = computed(() => inputCheckTitle.value.length);
const titleLengthError = computed(
  () => currentLength.value > maxCheckTitleLength,
);
const isSaveDisabled = computed(
  () =>
    !trimmedInputTitle.value ||
    titleLengthError.value ||
    isLoading.value,
);

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

const onClickEdit = (item: checkItem) => {
  selectedItemId.value = item.id;
  inputCheckTitle.value = item.checkTitle.slice(0, maxCheckTitleLength);
};

const onInputCheckTitle = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.value.length > maxCheckTitleLength) {
    inputCheckTitle.value = target.value.slice(0, maxCheckTitleLength);
    return;
  }

  inputCheckTitle.value = target.value;
};

//trim()で前後の空白を削除して、空文字だったらアラートを出すようにする
const onClickSave = async () => {
  const trimmedTitle = trimmedInputTitle.value;
  if (!trimmedTitle) {
    alert("チェック項目名を入力してください。");
    return;
  }

  if (trimmedTitle.length > maxCheckTitleLength) {
    alert(`チェック項目名は${maxCheckTitleLength}文字以内で入力してください。`);
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
    <header class="page-header">
      <div>
        <p class="eyebrow">SETTINGS</p>
        <h2>評価基準・チェック項目管理</h2>
        <p class="page-description">
          評価チェックに使用する項目を管理します。項目名は50文字以内で登録できます。
        </p>
      </div>
      <div class="header-badge">
        <span class="header-badge__label">登録件数</span>
        <strong>{{ items.length }}</strong>
      </div>
    </header>

    <div class="content-layout">
      <div class="table-section">
        <table class="item-table">
          <thead>
            <tr>
              <th class="col-order">表示順</th>
              <th class="col-title">チェック項目名</th>
              <th class="col-action">操作</th>
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
              <td>
                <div class="check-title-scroll">{{ item.checkTitle }}</div>
              </td>
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
            :maxlength="maxCheckTitleLength"
            placeholder="項目名を入力（50文字以内）"
            @input="onInputCheckTitle"
          />
          <p class="input-meta" :class="{ 'is-limit': titleLengthError }">
            <span>{{ currentLength }} / {{ maxCheckTitleLength }}</span>
            <span v-if="titleLengthError" class="input-error"
              >文字数が上限を超えています</span
            >
          </p>
        </div>

        <div class="form-actions">
          <button class="btn-save" :disabled="isSaveDisabled" @click="onClickSave">
            保存
          </button>
          <button
            v-if="selectedItemId"
            class="btn-cancel"
            type="button"
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

.header-badge {
  flex-shrink: 0;
  min-width: 96px;
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
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 253, 250, 0.94) 100%);
  box-shadow: 0 10px 22px rgba(7, 34, 28, 0.07);
  overflow: hidden;
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
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
  display: inline-block;
  box-shadow: 0 8px 16px rgba(2, 102, 74, 0.24);
}

.edit-title {
  margin-top: 0;
  background: linear-gradient(135deg, #41ba73 0%, #43b3a6 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
  display: inline-block;
  box-shadow: 0 8px 16px rgba(41, 153, 113, 0.22);
}

.btn-row-edit {
  background: linear-gradient(
    135deg,
    #41ba73 0%,
    #43b3a6 100%
  ); /* 青水緑四角 */
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 700;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.btn-row-edit:hover {
  background: linear-gradient(135deg, #07afa1 0%, #0665a5 100%);
  border-color: #b8d1c7;
}

.btn-row-delete {
  background: linear-gradient(135deg, #8a2828 0%, #d10202 100%); /* 赤黒四角 */
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 8px;
  font-weight: 700;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.btn-row-delete:hover {
  background: linear-gradient(135deg, #ed3a04 0%, #ff0e06 100%);
}

.btn-save {
  background: linear-gradient(135deg, #02664a 0%, #039d88 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  width: 100%;
  cursor: pointer;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.btn-save:hover {
  filter: brightness(1.04);
  transform: translateY(-1px);
  box-shadow: 0 10px 16px rgba(5, 120, 87, 0.24);
}

.btn-save:disabled {
  cursor: not-allowed;
  filter: grayscale(0.18);
  opacity: 0.62;
  transform: none;
  box-shadow: none;
}

.item-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.col-order {
  width: 88px;
}

.col-action {
  width: 170px;
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

.action-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.check-title-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  padding-bottom: 2px;
}

.check-title-scroll::-webkit-scrollbar {
  height: 3px;
}

.check-title-scroll::-webkit-scrollbar-thumb {
  background-color: #bfd7ce;
  border-radius: 9999px;
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

.form-group input {
  width: 100%;
  padding: 10px 12px;
  box-sizing: border-box;
  border: 1px solid #c7ddd5;
  border-radius: 10px;
  background: #ffffff;
  font-size: 14px;
  color: #12352d;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

.input-meta {
  margin: 6px 2px 0;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: #4d6d63;
}

.input-meta.is-limit {
  color: #dc2626;
}

.input-error {
  font-weight: 700;
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

@media (max-width: 980px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .content-layout {
    flex-direction: column;
  }

  .header-badge {
    width: fit-content;
  }
}
</style>
