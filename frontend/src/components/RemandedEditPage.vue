<template>
  <div class="page-fixed-container">
    <header class="page-header">
      <div class="header-left">
        <RouterLink to="/list" class="btn-back">←</RouterLink>
        <h1>{{ pageTitle }}</h1>
      </div>
      <div v-if="!loading && form && scout" class="header-right">
        <button
          type="button"
          class="btn-secondary"
          :disabled="submitting"
          @click="goBack"
        >
          キャンセル
        </button>
        <button
          type="button"
          class="btn-primary-green"
          :disabled="submitting"
          @click="handleResubmit"
        >
          {{ submitButtonLabel }}
        </button>
      </div>
    </header>

    <p v-if="loading" class="check-item-meta">読み込み中...</p>
    <!-- エラー時もフォームは消さず、ユーザーがそのまま編集を続けられるようにする -->
    <p v-if="!loading && errorMessage" class="message error">
      {{ errorMessage }}
    </p>

    <div v-if="!loading && form && scout" class="workspace">
      <section class="card column-input">
        <h2>📁 1. 求人情報入力</h2>
        <div class="form-scroll-wrapper">
          <form @submit.prevent class="scrollable-form">
            <label class="form-label">
              会社名
              <input v-model="form.requirement.companyName" type="text" />
            </label>

            <label class="form-label">
              職種
              <input v-model="form.requirement.jobCategory" type="text" />
            </label>

            <label class="form-label">
              勤務地
              <input v-model="form.requirement.workLocation" type="text" />
            </label>

            <label class="form-label">
              給与
              <input v-model="form.requirement.salaryInfo" type="text" />
            </label>

            <label class="form-label">
              業務内容
              <textarea v-model="form.requirement.jobDescription" rows="2" />
            </label>

            <label class="form-label">
              必須スキル
              <textarea v-model="form.requirement.requiredSkills" rows="2" />
            </label>

            <label class="form-label">
              求人の魅力
              <textarea v-model="form.requirement.jobAppeal" rows="2" />
            </label>

            <label class="form-label">
              文章トーン
              <select v-model="form.tone">
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
          <label class="form-label">
            タイトル
            <input v-model="form.title" type="text" />
          </label>
          <textarea v-model="form.body" class="body-textarea" rows="10" />
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
              :for="'remand-check-item-' + item.id"
            >
              <input
                :id="'remand-check-item-' + item.id"
                v-model="checkedItemIds"
                type="checkbox"
                :value="item.id"
              />
              <span class="checkbox-label-text">{{ item.checkTitle }}</span>
            </label>
          </div>

          <hr class="separator" />
          <h3 class="sub-title">💬 差戻しコメント履歴</h3>

          <article
            v-for="comment in comments"
            :key="comment.commentId"
            class="comment-item"
          >
            <p class="comment-meta">
              {{ formatDate(comment.createdAt) }} / {{ comment.authorId }}
            </p>
            <p class="comment-body">{{ comment.content }}</p>
          </article>
          <p v-if="comments.length === 0" class="check-item-meta">
            差戻しコメントはありません。
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchCheckItems } from "../api/checkItemApi";
import {
  fetchScoutComments,
  fetchScoutDetail,
  resubmitRemandedScout,
} from "../api/scoutApi";
import type { checkItem } from "../type/checkItem";
import type {
  ResubmitRemandedPayload,
  ScoutComment,
  ScoutEntity,
} from "../type/scout";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const generateError = ref("");
const checkItems = ref<checkItem[]>([]);
const checkedItemIds = ref<string[]>([]);
const checkItemsLoading = ref(false);
const checkItemsError = ref("");

const scout = ref<ScoutEntity | null>(null);
const comments = ref<ScoutComment[]>([]);
const form = ref<ResubmitRemandedPayload | null>(null);

const pageTitle = ref("文書の編集");
const submitButtonLabel = ref("修正して再申請");

const scoutId = String(route.params.id || "");

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP");
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
  if (!form.value) return;

  const r = form.value.requirement;
  if (!r.companyName || !r.jobCategory) {
    generateError.value = "会社名と職種を入力してから生成してください。";
    return;
  }
  generateError.value = "";

  let generatedBody = "";
  if (form.value.tone === "カジュアル") {
    generatedBody = [
      `${r.companyName}の採用担当です！`,
      `今回は${r.jobCategory}を募集しています。${r.jobDescription}をお任せしたいです。`,
      `スキルは${r.requiredSkills}、勤務地は${r.workLocation}、給与は${r.salaryInfo}です。`,
      `魅力は「${r.jobAppeal}」。まずは気軽にお話しませんか？`,
    ].join("\n");
  } else if (form.value.tone === "熱意") {
    generatedBody = [
      `${r.companyName}の採用担当です。`,
      `あなたのご経験に強く惹かれ、${r.jobCategory}としてぜひご活躍いただきたいと考えています。`,
      `${r.jobDescription}を中心に、${r.requiredSkills}を活かせる環境です。`,
      `勤務地は${r.workLocation}、給与は${r.salaryInfo}。`,
      `「${r.jobAppeal}」など、当社ならではの魅力も多数。ご応募を心よりお待ちしています！`,
    ].join("\n");
  } else {
    generatedBody = [
      `${r.companyName} 採用担当です。`,
      `${r.jobCategory}ポジションにて、${r.jobDescription}を担っていただける方を募集しております。`,
      `必須スキル: ${r.requiredSkills}／勤務地: ${r.workLocation}／給与: ${r.salaryInfo}`,
      `当社の魅力: ${r.jobAppeal}`,
      `ご興味がございましたら、ぜひご連絡ください。`,
    ].join("\n");
  }

  form.value.body = generatedBody;
}

async function loadPage() {
  if (!scoutId) {
    errorMessage.value = "対象IDが不正です";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    // 差戻し編集に必要な詳細情報とコメント履歴を同時取得
    const [detail, commentRows] = await Promise.all([
      fetchScoutDetail(scoutId),
      fetchScoutComments(scoutId),
    ]);

    if (detail.status !== "remanded" && detail.status !== "draft") {
      errorMessage.value = "差戻し文書または下書き文書のみ編集できます";
      return;
    }

    pageTitle.value =
      detail.status === "draft" ? "下書き文書の編集" : "差戻し文書の修正";
    submitButtonLabel.value =
      detail.status === "draft" ? "更新して申請" : "修正して再申請";

    scout.value = detail;
    comments.value = commentRows;
    // APIの既存値をそのまま入力欄の初期値へ展開
    form.value = {
      title: detail.title,
      body: detail.body,
      tone:
        (detail.requirement?.tone as ResubmitRemandedPayload["tone"]) ||
        "プロフェッショナル",
      requirement: {
        companyName: detail.requirement?.companyName || "",
        jobCategory: detail.requirement?.jobCategory || "",
        jobDescription: detail.requirement?.jobDescription || "",
        requiredSkills: detail.requirement?.requiredSkills || "",
        workLocation: detail.requirement?.workLocation || "",
        salaryInfo: detail.requirement?.salaryInfo || "",
        jobAppeal: detail.requirement?.jobAppeal || "",
      },
    };
  } catch (error) {
    console.error(error);
    errorMessage.value = "画面の初期表示に失敗しました";
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push("/list");
}

function isFormCompletelyEmpty(payload: ResubmitRemandedPayload): boolean {
  return [
    payload.title,
    payload.body,
    payload.requirement.companyName,
    payload.requirement.jobCategory,
    payload.requirement.jobDescription,
    payload.requirement.requiredSkills,
    payload.requirement.workLocation,
    payload.requirement.salaryInfo,
    payload.requirement.jobAppeal,
  ].every((value) => !value.trim());
}

async function handleResubmit() {
  if (!form.value) return;

  if (isFormCompletelyEmpty(form.value)) {
    window.alert(
      "入力フォームが未入力です。内容を入力してから操作してください。",
    );
    return;
  }

  if (!form.value.title.trim() || !form.value.body.trim()) {
    errorMessage.value = "タイトルと本文は必須です";
    return;
  }

  submitting.value = true;
  errorMessage.value = "";

  try {
    // 差戻し/下書き文書を更新して再申請（status: remanded|draft -> waiting_leader）
    await resubmitRemandedScout(scoutId, form.value);
    await router.push("/list");
  } catch (error: any) {
    console.error(error);
    errorMessage.value =
      error?.response?.data?.message || "再申請に失敗しました";
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadPage();
  loadCheckItems();
});
</script>

<style scoped>
/* 新規作成画面(ScoutPage)と同じ3カラムレイアウト */
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
  text-decoration: none;
}

.page-header h1 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
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

.actions {
  flex-shrink: 0;
  padding-top: 4px;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
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

.card-header-row {
  display: grid;
  grid-template-columns: 1fr auto;
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
  margin-bottom: 12px;
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

.separator {
  border: 0;
  border-top: 1px solid #e2e8f0;
  margin: 10px 0 12px;
}

.sub-title {
  margin: 0 0 10px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #004d34;
}

.comment-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #f3f4f6;
  margin-bottom: 10px;
}

.comment-meta {
  margin: 0 0 6px;
  font-size: 12px;
  color: #6b7280;
}

.btn-secondary:disabled,
.btn-primary-green:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-body {
  margin: 0;
}

.check-item-meta {
  color: #64748b;
  font-size: 0.8rem;
}

.message.error {
  color: #ef4444;
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .page-fixed-container {
    height: auto;
    max-height: none;
    overflow: auto;
  }

  .workspace {
    flex-direction: column;
    height: auto;
  }

  .column-input,
  .column-edit,
  .column-check {
    flex: none;
    height: auto;
  }
}
</style>
