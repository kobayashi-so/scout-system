<template>
  <div class="page-fixed-container">
    <header class="page-header">
      <div class="header-left">
        <button type="button" class="btn-back" @click="goToDashboard">←</button>
        <div class="title-block">
          <p class="eyebrow">SCOUT BUILDER</p>
          <h1>スカウト文新規作成</h1>
          <p class="title-description">
            求人情報入力から文面作成、評価チェックまでを一画面で完了できます。
          </p>
        </div>

        <span :class="['badge-status', form.status]">
          {{ currentStatusLabel }}
        </span>
      </div>
      <div class="header-right">
        <span class="progress-badge">
          チェック {{ checkedItemIds.length }} / {{ checkItems.length }}
        </span>
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
        <h2>1. 求人情報入力</h2>
        <div class="form-scroll-wrapper">
          <form @submit.prevent class="scrollable-form">
            <div class="form-group-row">
              <label class="form-label">
                <span class="form-label-head">
                  求人タイトル
                  <span class="required-soft">(必須)</span>
                </span>
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
              <span class="form-label-head">
                会社名
                <span class="required-soft">(必須)</span>
              </span>
              <input
                v-model="form.requirement.companyName"
                type="text"
                placeholder="株式会社TechVision"
                required
              />
            </label>

            <label class="form-label">
              <span class="form-label-head">
                職種
                <span class="required-soft">(必須)</span>
              </span>
              <input
                v-model="form.requirement.jobCategory"
                type="text"
                placeholder="バックエンドエンジニア"
                required
              />
            </label>

            <label class="form-label">
              <span class="form-label-head">
                業務内容
                <span class="required-soft">(必須)</span>
              </span>
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
              <span class="form-label-head">
                求人の魅力
                <span class="required-soft">(必須)</span>
              </span>
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

            <hr class="separator" />

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
          <h2>2. 文面編集</h2>
          <span class="edit-notice">※直接編集可</span>
        </div>
        <div class="output-container">
          <textarea
            v-model="form.body"
            class="body-textarea"
            placeholder="左の「AIで生成」ボタンを押すか、直接ここに入力してください"
            :maxlength="maxBodyLength"
            required
          />
          <div class="char-count" :class="{ 'char-count-error': isBodyLengthInvalid }">
            文字数: {{ bodyLength }}文字（{{ minBodyLength }}〜{{ maxBodyLength }}文字）
          </div>
        </div>
      </section>

      <section class="card column-check">
        <h2>3. 評価基準チェック</h2>
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
    <!-- フォーム全体のエラーを目立たせる固定表示（ページ下部、オーバーレイ） -->
    <div v-if="generateError" class="form-error-bar" role="alert" aria-live="assertive">
      <svg class="error-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="currentColor" d="M11.001 8h2v5h-2zM11 14h2v2h-2z"/>
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      </svg>
      <div class="form-error-text">{{ generateError }}</div>
      <button type="button" class="form-error-close" @click="generateError = ''" aria-label="エラーを閉じる">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useScoutStore } from '../store/scoutStore'
import { useAuthStore } from '../store/authStore'

import { fetchCheckItems } from "../api/checkItemApi";
import type { CreateScoutPayload } from "../type/scout";
import type { checkItem } from "../type/checkItem";

type ScoutStatus =
  | "draft"
  | "waiting_leader"
  | "waiting_admin"
  | "approved"
  | "remanded";

const store = useScoutStore()
const authStore = useAuthStore()
const router = useRouter()

const form = reactive<{
  title: string
  status: ScoutStatus
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
  title: '',
  status: 'draft' as ScoutStatus, // 💡 コンポーネント内でリアクティブにステータス表示を切り替えるために追加
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
const minBodyLength = 10;
const maxBodyLength = 1000;

const bodyLength = computed(() => form.body.trim().length);
const isBodyLengthInvalid = computed(
  () => bodyLength.value > 0 && (bodyLength.value < minBodyLength || bodyLength.value > maxBodyLength),
);

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

  const requiredSkillsText = r.requiredSkills.trim();
  const workLocationText = r.workLocation.trim();
  const salaryInfoText = r.salaryInfo.trim();

  form.promptText = [
    "あなたは採用担当です。候補者向けのスカウト文を作成してください。",
    `会社名: ${r.companyName}`,
    `職種: ${r.jobCategory}`,
    `トーン: ${form.tone}`,
  ].join("\n");

  let generatedBody = "";
  if (form.tone === "カジュアル") {
    const detailParts = [
      requiredSkillsText ? `スキルは${requiredSkillsText}` : "",
      workLocationText ? `勤務地は${workLocationText}` : "",
      salaryInfoText ? `給与は${salaryInfoText}` : "",
    ].filter((part) => part);

    generatedBody = [
      `${r.companyName}の採用担当です！`,
      `今回は${r.jobCategory}を募集しています。${r.jobDescription}をお任せしたいです。`,
      detailParts.length > 0 ? `${detailParts.join("、")}です。` : "",
      `魅力は「${r.jobAppeal}」。まずは気軽にお話しませんか？`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");
  } else if (form.tone === "熱意") {
    const roleLine = requiredSkillsText
      ? `${r.jobDescription}を中心に、${requiredSkillsText}を活かせる環境です。`
      : `${r.jobDescription}を中心にご活躍いただける環境です。`;

    const conditionParts = [
      workLocationText ? `勤務地は${workLocationText}` : "",
      salaryInfoText ? `給与は${salaryInfoText}` : "",
    ].filter((part) => part);

    generatedBody = [
      `${r.companyName}の採用担当です。`,
      `あなたのご経験に強く惹かれ、${r.jobCategory}としてぜひご活躍いただきたいと考えています。`,
      roleLine,
      conditionParts.length > 0 ? `${conditionParts.join("、")}。` : "",
      `「${r.jobAppeal}」など、当社ならではの魅力も多数。ご応募を心よりお待ちしています！`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");
  } else if (form.tone === "プロフェッショナル") {
    const conditionParts = [
      requiredSkillsText ? `必須スキル: ${requiredSkillsText}` : "",
      workLocationText ? `勤務地: ${workLocationText}` : "",
      salaryInfoText ? `給与: ${salaryInfoText}` : "",
    ].filter((part) => part);

    generatedBody = [
      `${r.companyName} 採用担当です。`,
      `${r.jobCategory}ポジションにて、${r.jobDescription}を担っていただける方を募集しております。`,
      conditionParts.length > 0 ? conditionParts.join("／") : "",
      `当社の魅力: ${r.jobAppeal}`,
      `ご興味がございましたら、ぜひご連絡ください。`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");
  }
  form.body = generatedBody;
}

//未入力時の確認アラート
async function handleSubmit(status: ScoutStatus) {
  const creatorName =
    authStore.currentUserName?.trim() || authStore.currentUserEmail?.trim()
  if (!creatorName) {
    generateError.value = '作成者情報が取得できません。再ログインしてください。'
    return
  }

  if (status === 'waiting_leader' && !allCheckItemsDone.value) {
    generateError.value = "チェック項目をすべて確認してください。";
    return;
  }

  if (bodyLength.value < minBodyLength || bodyLength.value > maxBodyLength) {
    generateError.value = `本文は${minBodyLength}文字以上${maxBodyLength}文字以下で入力してください。`;
    return;
  }

  if (status === 'draft' && isFormCompletelyEmpty()) {
    generateError.value = '入力項目が空のため保存できません。'
    return
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
    creator: creatorName,
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
    form.title = ''
    form.requirement.companyName = ''
    form.requirement.jobCategory = ''
    form.requirement.jobDescription = ''
    form.requirement.requiredSkills = ''
    form.requirement.workLocation = ''
    form.requirement.salaryInfo = ''
    form.requirement.jobAppeal = ''
    form.promptText = ''
    form.body = ''
    generateError.value = ''
    checkedItemIds.value = []

    if (status === 'waiting_leader' || status === 'draft') {
      await router.push({ name: 'scout-list' })
    }
  } catch (error) {
    generateError.value = "データの保存に失敗しました。";
    console.error(error);
  }
}

onMounted(async () => {
  authStore.hydrateFromStorage()
  await Promise.all([store.loadScouts(), loadCheckItems()])
})
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
  padding: 0;
  background: transparent;
  position: relative;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
  flex-shrink: 0;
  border: 1px solid #d3e5de;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 253, 250, 0.94) 100%);
  box-shadow: 0 10px 22px rgba(7, 34, 28, 0.07);
  padding: 14px 16px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.09em;
  color: #0d9488;
  font-weight: 800;
}

.title-description {
  margin: 0;
  font-size: 12px;
  color: #4a6a60;
}

.btn-back {
  background: #ffffff;
  border: 1px solid #c7ddd5;
  border-radius: 9px;
  width: 34px;
  height: 34px;
  font-size: 1rem;
  cursor: pointer;
  color: #31564b;
  padding: 0;
}

.page-header h1 {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 700;
  color: #10342d;
}

/* 💡 動的ステータスバッジの汎用スタイル */
.badge-status {
  font-size: 0.74rem;
  padding: 6px 10px;
  border-radius: 9999px;
  font-weight: 700;
  background-color: #f1f5f9;
  color: #64748b;
  margin-top: 2px;
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
  align-items: center;
  gap: 12px;
}

.progress-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid #c7ddd5;
  border-radius: 9999px;
  background: #ffffff;
  color: #2f564b;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.btn-secondary {
  background-color: #ffffff;
  border: 1px solid #c7ddd5;
  color: #475569;
  padding: 9px 16px;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-primary-green {
  background-color: #00c77b;
  border: none;
  color: #ffffff;
  padding: 9px 16px;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.workspace {
  display: flex;
  gap: 14px;
  flex: 1;
  min-height: 0;
  height: calc(100% - 60px);
}

.card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 253, 250, 0.94) 100%);
  border: 1px solid #d3e5de;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 22px rgba(7, 34, 28, 0.07);
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.card h2 {
  margin: 0 0 14px 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f3d2e;
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
  gap: 5px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #31564b;
}

.form-label-head {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
  padding: 8px 10px;
  border: 1px solid #c7ddd5;
  border-radius: 9px;
  font-size: 0.85rem;
  color: #12352d;
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
  border-radius: 9px;
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
  font-weight: 700;
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
  border: 1px solid #c7ddd5;
  border-radius: 9px;
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
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #31564b;
  line-height: 1.45;
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

/* フォーム最下部に表示する目立つエラーバー */
.form-error-bar {
  position: absolute;
  left: 50%;
  right: 24px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(90deg, #ef4444, #dc2626);
  color: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.18);
  z-index: 60;
  font-weight: 700;
  animation: slideUpFade 220ms ease-out;
}
.form-error-bar .error-icon {
  flex: 0 0 auto;
  color: rgba(255,255,255,0.95);
}
.form-error-bar .form-error-text {
  flex: 1 1 auto;
  font-size: 0.95rem;
  line-height: 1.3;
}
.form-error-close {
  background: rgba(255,255,255,0.12);
  color: #fff;
  border: none;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

@keyframes slideUpFade {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.required-soft {
  color: #ef4444;
  font-size: 12px;
  margin-left: 4px;
}

@media (max-width: 1200px) {
  .workspace {
    flex-direction: column;
    height: auto;
    overflow: auto;
  }

  .card {
    min-height: 300px;
  }
}

@media (max-width: 860px) {
  .page-fixed-container {
    height: auto;
    max-height: none;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .header-right {
    flex-wrap: wrap;
  }
}
</style>
