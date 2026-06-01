<template>
  <div class="page-fixed-container">
    <header class="page-header">
      <div class="header-left">
        <button type="button" class="btn-back" @click="goToDashboard">←</button>
        <h1>スカウト文新規作成</h1>

        <span :class="['badge-status', form.status]">
          {{ currentStatusLabel }}
        </span>
      </div>
      <div class="header-right">
        <button
          type="button"
          class="btn-secondary"
          :disabled="store.loading"
          @click="handleSubmit('draft')"
        >
          一時保存
        </button>
        <button
          type="button"
          class="btn-primary-green"
          :disabled="store.loading"
          @click="handleSubmit('waiting_leader')"
        >
          営業承認を申請
        </button>
      </div>
    </header>

    <div class="workspace">
      <section class="card column-input">
        <h2>📁 1. 求人情報入力</h2>
        <div class="form-scroll-wrapper">
          <form @submit.prevent class="scrollable-form">
            <div class="form-group-row">
              <label class="form-label compact">
                作成者
                <input
                  v-model="form.creator"
                  type="text"
                  placeholder="テスト太郎"
                  required
                />
              </label>
              <label class="form-label compact">
                求人タイトル
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="エンジニア向けスカウト"
                  required
                />
              </label>
            </div>

            <hr class="separator" />

            <label class="form-label">
              会社名
              <span class="required-soft">(必須)</span>
              <input
                v-model="form.requirement.companyName"
                type="text"
                placeholder="株式会社TechVision"
                required
              />
            </label>

            <label class="form-label">
              職種
              <span class="required-soft">(必須)</span>
              <input
                v-model="form.requirement.jobCategory"
                type="text"
                placeholder="バックエンドエンジニア"
                required
              />
            </label>

            <label class="form-label">
              業務内容
              <span class="required-soft">(必須)</span>
              <textarea
                v-model="form.requirement.jobDescription"
                placeholder="要件定義〜設計・実装・運用まで担当"
                rows="2"
                required
              ></textarea>
            </label>

            <label class="form-label">
              必須スキル
              <textarea
                v-model="form.requirement.requiredSkills"
                placeholder="Java/Kotlin3年以上, AWS, Webアプリ開発"
                rows="2"
              ></textarea>
            </label>

            <label class="form-label">
              勤務地
              <input
                v-model="form.requirement.workLocation"
                type="text"
                placeholder="東京都港区（リモート併用可）"
              />
            </label>

            <label class="form-label">
              給与
              <input
                v-model="form.requirement.salaryInfo"
                type="text"
                placeholder="年収600万円〜800万円"
              />
            </label>

            <label class="form-label">
              求人の魅力
              <span class="required-soft">(必須)</span>
              <input
                v-model="form.requirement.jobAppeal"
                type="text"
                placeholder="自社サービス開発・モダン技術環境・裁量大"
                required
              />
            </label>

            <label class="form-label">
              文章トーン
              <select v-model="form.tone" required>
                <option value="カジュアル">カジュアル</option>
                <option value="熱意">熱意</option>
                <option value="プロフェッショナル">プロフェッショナル</option>
              </select>
            </label>

            <p v-if="generateError" class="message error">
              {{ generateError }}
            </p>
          </form>
        </div>

        <div class="actions">
          <button type="button" class="btn-ai" @click="handleGeneratePrompt">
            ✨ AIで文章を生成
          </button>
        </div>
      </section>

      <section class="card column-edit">
        <div class="card-header-row">
          <h2>⌨️ 2. 文面編集</h2>
          <span class="edit-notice">※直接編集可</span>
        </div>
        <div class="output-container">
          <textarea
            v-model="form.body"
            class="body-textarea"
            placeholder="左の「AIで生成」ボタンを押すか、直接ここに入力してください"
            required
          />
          <div class="char-count">文字数: {{ form.body.length }}文字</div>
        </div>
      </section>

      <section class="card column-check">
        <h2>📊 3. 評価基準チェック</h2>
        <div class="check-scroll-wrapper">
          <p v-if="checkItemsLoading" class="check-item-meta">読み込み中...</p>
          <p v-else-if="checkItemsError" class="message error">
            {{ checkItemsError }}
          </p>
          <p v-else-if="checkItems.length === 0" class="check-item-meta">
            チェック項目がありません。
          </p>

          <div v-else class="check-item-list">
            <label
              v-for="item in checkItems"
              :key="item.id"
              class="check-item-row"
              :for="'check-item-' + item.id"
            >
              <input
                :id="'check-item-' + item.id"
                v-model="checkedItemIds"
                type="checkbox"
                :value="item.id"
              />
              <span class="checkbox-label-text">{{ item.checkTitle }}</span>
            </label>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useScoutStore } from "../store/scoutStore";

import { fetchCheckItems } from "../api/checkItemApi";
import type { CreateScoutPayload } from "../type/scout";
import type { checkItem } from "../type/checkItem";

type ScoutStatus =
  | "draft"
  | "waiting_leader"
  | "waiting_admin"
  | "approved"
  | "remanded";

const store = useScoutStore();
const router = useRouter();

const form = reactive<{
  creator: string;
  title: string;
  status: ScoutStatus;
  requirement: {
    companyName: string;
    jobCategory: string;
    jobDescription: string;
    requiredSkills: string;
    workLocation: string;
    salaryInfo: string;
    jobAppeal: string;
  };
  tone: "カジュアル" | "熱意" | "プロフェッショナル";
  promptText: string;
  body: string;
}>({
  creator: "",
  title: "",
  status: "draft" as ScoutStatus, // 💡 コンポーネント内でリアクティブにステータス表示を切り替えるために追加
  requirement: {
    companyName: "",
    jobCategory: "",
    jobDescription: "",
    requiredSkills: "",
    workLocation: "",
    salaryInfo: "",
    jobAppeal: "",
  },
  tone: "カジュアル",
  promptText: "",
  body: "",
});

const generateError = ref("");
const checkItems = ref<checkItem[]>([]);
const checkedItemIds = ref<string[]>([]);
const checkItemsLoading = ref(false);
const checkItemsError = ref("");

// 💡 提示いただいた関数ロジックを Vue の算出プロパティ（computed）として組み込み
const currentStatusLabel = computed(() => {
  const status = form.status;
  if (status === "approved") return "承認済み";
  if (status === "waiting_leader") return "営業承認者承認待ち";
  if (status === "waiting_admin") return "管理者承認待ち";
  if (status === "remanded") return "差戻し";
  if (status === "draft") return "下書き";
  return "未設定";
});

const allCheckItemsDone = computed(() => {
  return (
    checkItems.value.length > 0 &&
    checkedItemIds.value.length === checkItems.value.length
  );
});

function isFormCompletelyEmpty(): boolean {
  return [
    form.creator,
    form.title,
    form.body,
    form.requirement.companyName,
    form.requirement.jobCategory,
    form.requirement.jobDescription,
    form.requirement.requiredSkills,
    form.requirement.workLocation,
    form.requirement.salaryInfo,
    form.requirement.jobAppeal,
  ].every((value) => !value.trim());
}

function goToDashboard() {
  router.push({ name: "scout-list" });
}

async function loadCheckItems() {
  checkItemsLoading.value = true;
  checkItemsError.value = "";
  try {
    checkItems.value = await fetchCheckItems();
  } catch (error) {
    console.error(error);
    checkItemsError.value = "チェック項目の取得に失敗しました。";
  } finally {
    checkItemsLoading.value = false;
  }
}

function handleGeneratePrompt() {
  const r = form.requirement;
  if (!r.companyName || !r.jobCategory) {
    generateError.value = "会社名と職種を入力してから生成してください。";
    return;
  }
  generateError.value = "";

  form.promptText = [
    "あなたは採用担当です。候補者向けのスカウト文を作成してください。",
    `会社名: ${r.companyName}`,
    `職種: ${r.jobCategory}`,
    `トーン: ${form.tone}`,
  ].join("\n");

  let generatedBody = "";
  if (form.tone === "カジュアル") {
    generatedBody = [
      `${r.companyName}の採用担当です！`,
      `今回は${r.jobCategory}を募集しています。${r.jobDescription}をお任せしたいです。`,
      `スキルは${r.requiredSkills}、勤務地は${r.workLocation}、給与は${r.salaryInfo}です。`,
      `魅力は「${r.jobAppeal}」。まずは気軽にお話しませんか？`,
    ].join("\n");
  } else if (form.tone === "熱意") {
    generatedBody = [
      `${r.companyName}の採用担当です。`,
      `あなたのご経験に強く惹かれ、${r.jobCategory}としてぜひご活躍いただきたいと考えています。`,
      `${r.jobDescription}を中心に、${r.requiredSkills}を活かせる環境です。`,
      `勤務地は${r.workLocation}、給与は${r.salaryInfo}。`,
      `「${r.jobAppeal}」など、当社ならではの魅力も多数。ご応募を心よりお待ちしています！`,
    ].join("\n");
  } else if (form.tone === "プロフェッショナル") {
    generatedBody = [
      `${r.companyName} 採用担当です。`,
      `${r.jobCategory}ポジションにて、${r.jobDescription}を担っていただける方を募集しております。`,
      `必須スキル: ${r.requiredSkills}／勤務地: ${r.workLocation}／給与: ${r.salaryInfo}`,
      `当社の魅力: ${r.jobAppeal}`,
      `ご興味がございましたら、ぜひご連絡ください。`,
    ].join("\n");
  }
  form.body = generatedBody;
}

//未入力時の確認アラート
async function handleSubmit(status: ScoutStatus) {
  if (isFormCompletelyEmpty()) {
    if (status === "draft") {
      window.alert(
        "一時保存できません。入力フォームに内容を入力してください。",
      );
    } else {
      window.alert(
        "承認申請できません。入力フォームに内容を入力してください。",
      );
    }
    return;
  }

  if (
    !form.requirement.companyName.trim() ||
    !form.requirement.jobCategory.trim() ||
    !form.requirement.jobDescription.trim() ||
    !form.requirement.jobAppeal.trim()
  ) {
    generateError.value = "会社名・職種・業務内容・求人の魅力は必須項目です。";
    return;
  }

  if (!allCheckItemsDone.value) {
    generateError.value = "チェック項目をすべて確認してください。";
    return;
  }
  if (!form.body) {
    generateError.value = "本文が空欄です。";
    return;
  }

  //申請、一時保存の確認アラートを追加
  const confirmMessage =
    status === "draft"
      ? "この内容で一時保存します。よろしいですか？"
      : "この内容で承認を申請します。よろしいですか？";

  if (!window.confirm(confirmMessage)) {
    return;
  }

  const payload: CreateScoutPayload = {
    creator: form.creator.trim(),
    title: form.title.trim(),
    body: form.body.trim(),
    tone: form.tone,
    status: status, // バックエンドへは英名文字列 ('draft' など) を送信
    requirement: {
      companyName: form.requirement.companyName.trim(),
      jobCategory: form.requirement.jobCategory.trim(),
      jobDescription: form.requirement.jobDescription.trim(),
      requiredSkills: form.requirement.requiredSkills.trim(),
      workLocation: form.requirement.workLocation.trim(),
      salaryInfo: form.requirement.salaryInfo.trim(),
      jobAppeal: form.requirement.jobAppeal.trim(),
    },
  };

  try {
    await store.addScout(payload);

    // 💡 保存に成功したら画面の表示ステータスも更新する
    form.status = status;

    // 入力項目をクリア
    form.requirement.companyName = "";
    form.requirement.jobCategory = "";
    form.requirement.jobDescription = "";
    form.requirement.requiredSkills = "";
    form.requirement.workLocation = "";
    form.requirement.salaryInfo = "";
    form.requirement.jobAppeal = "";
    form.body = "";
    generateError.value = "";
    checkedItemIds.value = [];
  } catch (error) {
    generateError.value = "データの保存に失敗しました。";
    console.error(error);
  }
}

onMounted(async () => {
  await Promise.all([store.loadScouts(), loadCheckItems()]);
});
</script>

<style scoped>
/* 基本固定レイアウトは継続 */
.page-fixed-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 93vh;
  max-height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
  padding: 16px 24px;
  background-color: #ffffff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-back {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #64748b;
  padding: 0;
}

.page-header h1 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
}

/* 💡 動的ステータスバッジの汎用スタイル */
.badge-status {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 600;
  background-color: #f1f5f9;
  color: #64748b;
}

/* 💡 各ステータスに応じたカラー定義（お好みに合わせて微調整してください） */
.badge-status.draft {
  background-color: #f1f5f9;
  color: #475569;
}
.badge-status.waiting_leader {
  background-color: #fef3c7;
  color: #d97706;
}
.badge-status.waiting_admin {
  background-color: #fee2e2;
  color: #dc2626;
}
.badge-status.approved {
  background-color: #dcfce7;
  color: #16a34a;
}
.badge-status.remanded {
  background-color: #f3e8ff;
  color: #7c3aed;
}

.header-right {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-primary-green {
  background-color: #00c77b;
  border: none;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.workspace {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
  height: calc(100% - 60px);
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.card h2 {
  margin: 0 0 16px 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #004d34;
  flex-shrink: 0;
}

.column-input {
  flex: 1.3;
  min-width: 0;
}
.column-edit {
  flex: 1.1;
  min-width: 0;
}
.column-check {
  flex: 0.9;
  min-width: 0;
}

.form-scroll-wrapper {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
  margin-bottom: 12px;
  min-height: 0;
}

.form-scroll-wrapper::-webkit-scrollbar,
.check-scroll-wrapper::-webkit-scrollbar {
  width: 5px;
}
.form-scroll-wrapper::-webkit-scrollbar-thumb,
.check-scroll-wrapper::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

.scrollable-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group-row {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.form-label.compact {
  flex: 1;
}

.separator {
  border: 0;
  border-top: 1px solid #e2e8f0;
  margin: 2px 0;
  flex-shrink: 0;
}

input[type="text"],
select,
textarea {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #1e293b;
  box-sizing: border-box;
  background-color: #ffffff;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #00c77b;
}

.actions {
  flex-shrink: 0;
  padding-top: 4px;
}

.btn-ai {
  width: 100%;
  padding: 10px;
  background-color: #004d34;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.card-header-row h2 {
  margin: 0;
}
.edit-notice {
  font-size: 0.75rem;
  color: #00c77b;
  font-weight: 500;
}

.output-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.body-textarea {
  flex: 1;
  resize: none;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 12px;
  font-size: 0.85rem;
  line-height: 1.6;
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 8px;
  flex-shrink: 0;
}

.check-scroll-wrapper {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.check-item-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.check-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #334155;
}

.check-item-row input[type="checkbox"] {
  accent-color: #00c77b;
  width: 15px;
  height: 15px;
}

.checkbox-label-text {
  font-weight: 500;
}

.message.error {
  color: #ef4444;
  font-size: 0.8rem;
}

.required-soft {
  color: #ef4444;
  font-size: 12px;
  margin-left: 4px;
}
</style>
