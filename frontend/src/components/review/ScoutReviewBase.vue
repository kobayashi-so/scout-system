<template>
  <section class="review-page">
    <header class="review-header review-card">
      <RouterLink to="/list" class="review-back-link"
        >← スカウト文レビュー</RouterLink
      >
      <h2 class="review-title">{{ screenTitle }}</h2>
      <p class="review-status">{{ statusText }}</p>
    </header>

    <p v-if="loading" class="review-loading">レビュー情報を読み込み中...</p>
    <p v-else-if="errorMessage" class="review-error">
      {{ errorMessage }}
    </p>

    <template v-else-if="scout">
      <div class="review-grid">
        <article class="review-card">
          <h3 class="card-title">求人情報</h3>
          <dl class="detail-list">
            <div class="detail-row">
              <dt>職種</dt>
              <dd>{{ scout.requirement?.jobCategory || "-" }}</dd>
            </div>
            <div class="detail-row">
              <dt>会社名</dt>
              <dd>{{ scout.requirement?.companyName || "-" }}</dd>
            </div>
            <div class="detail-row">
              <dt>勤務地</dt>
              <dd>{{ scout.requirement?.workLocation || "-" }}</dd>
            </div>
            <div class="detail-row">
              <dt>給与</dt>
              <dd>{{ scout.requirement?.salaryInfo || "-" }}</dd>
            </div>
          </dl>
        </article>

        <article class="review-card">
          <h3 class="card-title">タイトル情報</h3>
          <dl class="detail-list">
            <div class="detail-row">
              <dt>ID</dt>
              <dd>{{ scout.id }}</dd>
            </div>
            <div class="detail-row">
              <dt>タイトル</dt>
              <dd>{{ scout.title }}</dd>
            </div>
            <div class="detail-row">
              <dt>作成者</dt>
              <dd>{{ scout.creator }}</dd>
            </div>
            <div class="detail-row">
              <dt>ステータス</dt>
              <dd>{{ statusLabel(scout.status) }}</dd>
            </div>
          </dl>
        </article>
      </div>

      <article class="review-card">
        <div class="scout-body-header">
          <h3 class="card-title">スカウト本文（読み取り専用）</h3>
          <button
            v-if="hasPreviousBody"
            type="button"
            class="toggle-previous-btn"
            @click="togglePreviousBody"
          >
            {{ showPreviousBody ? "表示を終了" : "過去のスカウト文" }}
          </button>
        </div>
        <div class="scout-body-box">
          {{ displayedScoutBody }}
        </div>
      </article>

      <article class="review-card">
        <h3 class="card-title">品質チェック（承認時は全チェック必須）</h3>
        <p v-if="isReadOnlyReview" class="readonly-note">
          この画面は閲覧専用です。品質チェックの編集はできません。
        </p>
        <div class="check-list">
          <label
            v-for="item in checkItems"
            :key="item.id"
            class="check-item"
            :class="{ 'is-readonly': isReadOnlyReview || submitting }"
          >
            <input
              type="checkbox"
              class="check-input"
              :checked="selectedCheckIds.includes(item.id)"
              :disabled="isReadOnlyReview || submitting"
              @change="toggleCheck(item.id)"
            />
            <span>{{ item.checkTitle }}</span>
          </label>
          <p v-if="checkItems.length === 0" class="empty-text">
            チェック項目が登録されていません。
          </p>
        </div>
        <p v-if="validationMessage" class="validation-text">
          {{ validationMessage }}
        </p>
      </article>

      <article class="review-card">
        <h3 class="card-title">コメント履歴</h3>
        <div class="comment-list">
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
          <p v-if="comments.length === 0" class="empty-text">
            コメント履歴はありません
          </p>
        </div>
      </article>

      <article class="review-card">
        <h3 class="card-title">差戻しコメント入力</h3>
        <p v-if="isReadOnlyReview" class="readonly-note">
          この画面は閲覧専用です。差戻しコメントの入力はできません。
        </p>
        <label class="comment-label" for="remand-comment">コメント</label>
        <textarea
          id="remand-comment"
          v-model="remandComment"
          class="remand-textarea"
          placeholder="差戻し時はコメント必須"
          :disabled="isReadOnlyReview || submitting"
          @input="remandValidationMessage = ''"
        />
        <p v-if="remandValidationMessage" class="validation-text">
          {{ remandValidationMessage }}
        </p>
      </article>

      <div class="action-row">
        <button
          v-if="showRemandButton"
          type="button"
          class="btn btn-remand"
          :disabled="submitting"
          @click="handleRemand"
        >
          差戻し
        </button>
        <div class="action-right">
          <button
            v-if="showApproveButton"
            type="button"
            class="btn btn-approve"
            :disabled="submitting"
            @click="handleApprove"
          >
            {{ approveLabel }}
          </button>
        </div>
      </div>

      <div
        v-if="showApprovalTextEffect"
        class="approval-rainbow-overlay"
        aria-hidden="true"
      >
        <p class="approval-rainbow-text">承認</p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  approveScout,
  fetchScoutComments,
  fetchScoutDetail,
  finalApproveScout,
  remandScout,
} from "../../api/scoutApi";
import { fetchCheckItems } from "../../api/checkItemApi";
import { useAuthStore } from "../../store/authStore";
import {
  statusLabel,
  type ScoutComment,
  type ScoutEntity,
} from "../../type/scout";
import type { checkItem } from "../../type/checkItem";

const props = defineProps<{
  mode: "leader" | "admin";
}>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const validationMessage = ref("");
const remandValidationMessage = ref("");

const scout = ref<ScoutEntity | null>(null);
const comments = ref<ScoutComment[]>([]);
const checkItems = ref<checkItem[]>([]);
const selectedCheckIds = ref<string[]>([]);
const remandComment = ref("");
const showPreviousBody = ref(false);
const showApprovalTextEffect = ref(false);

const scoutId = computed(() => String(route.params.id || ""));

const screenTitle = computed(() =>
  // 画面レイアウトは共通で、modeだけで文言と承認アクションを切替
  props.mode === "leader" ? "営業承認レビュー画面" : "最終承認レビュー画面",
);

const statusText = computed(() => {
  if (!scout.value?.status) return "対象文書を読み込み中です。";
  return `現在ステータス: ${statusLabel(scout.value.status)}`;
});

const approveLabel = computed(() =>
  props.mode === "leader" ? "営業承認する" : "最終承認する",
);

const isReadOnlyReview = computed(() => {
  if (props.mode === "leader") {
    return authStore.currentUserRoleType !== "leader";
  }

  return authStore.currentUserRoleType !== "admin";
});

const showApproveButton = computed(() => {
  if (!scout.value?.status) return false;
  if (props.mode === "leader") {
    // leaderレビュー画面は waiting_leader のときのみ承認ボタンを表示
    return (
      authStore.currentUserRoleType === "leader" &&
      scout.value.status === "waiting_leader"
    );
  }
  // adminレビュー画面は waiting_admin のときのみ承認ボタンを表示
  return (
    authStore.currentUserRoleType === "admin" &&
    scout.value.status === "waiting_admin"
  );
});

const showRemandButton = computed(() => {
  if (!scout.value?.status) return false;
  if (props.mode === "leader") {
    return (
      authStore.currentUserRoleType === "leader" &&
      scout.value.status === "waiting_leader"
    );
  }
  return (
    authStore.currentUserRoleType === "admin" &&
    scout.value.status === "waiting_admin"
  );
});

const hasPreviousBody = computed(() => {
  return Boolean(scout.value?.previousBody?.trim());
});

const displayedScoutBody = computed(() => {
  if (showPreviousBody.value && hasPreviousBody.value) {
    return scout.value?.previousBody || "";
  }

  return scout.value?.body || "";
});

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP");
}

function togglePreviousBody() {
  if (!hasPreviousBody.value) return;
  showPreviousBody.value = !showPreviousBody.value;
}

function toggleCheck(id: string) {
  if (isReadOnlyReview.value) {
    return;
  }

  validationMessage.value = "";
  if (selectedCheckIds.value.includes(id)) {
    selectedCheckIds.value = selectedCheckIds.value.filter(
      (v: string) => v !== id,
    );
    return;
  }
  selectedCheckIds.value = [...selectedCheckIds.value, id];
}

function validateBeforeApprove(): boolean {
  if (checkItems.value.length === 0) {
    validationMessage.value =
      "チェック項目がありません。評価基準・チェック項目を設定してください。";
    return false;
  }

  // 要件: 承認時は全チェック必須
  const allChecked = checkItems.value.every((item: checkItem) =>
    selectedCheckIds.value.includes(item.id),
  );
  if (!allChecked) {
    validationMessage.value =
      "承認するには品質チェックを全て完了してください。";
    return false;
  }

  return true;
}

async function loadReviewData() {
  if (!scoutId.value) {
    errorMessage.value = "対象のスカウトIDが不正です";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    // レビュー画面で必要な3情報を同時取得
    const [scoutResponse, commentsResponse, checkItemsResponse] =
      await Promise.all([
        fetchScoutDetail(scoutId.value),
        fetchScoutComments(scoutId.value),
        fetchCheckItems(),
      ]);

    scout.value = scoutResponse;
    showPreviousBody.value = false;
    comments.value = commentsResponse;
    checkItems.value = [...checkItemsResponse].sort(
      (a, b) => a.display_order - b.display_order,
    );
  } catch (error) {
    console.error(error);
    errorMessage.value = "レビュー情報の取得に失敗しました";
  } finally {
    loading.value = false;
  }
}

async function handleApprove() {
  if (!scout.value?.id || !authStore.currentUserId) {
    errorMessage.value =
      "承認に必要なユーザー情報が不足しています。再ログインしてください。";
    return;
  }

  if (!validateBeforeApprove()) {
    return;
  }

  submitting.value = true;
  errorMessage.value = "";

  try {
    // modeに応じて承認APIを切替（UIは共通）
    if (props.mode === "leader") {
      await approveScout({
        scoutId: scout.value.id,
        userId: authStore.currentUserId,
      });
    } else {
      await finalApproveScout({
        scoutId: scout.value.id,
        userId: authStore.currentUserId,
      });

      await playFinalApprovalEffects();
    }

    await router.push("/list");
  } catch (error) {
    console.error(error);
    errorMessage.value = "承認処理に失敗しました";
  } finally {
    submitting.value = false;
  }
}

async function playFinalApprovalEffects() {
  // テキスト演出と効果音を同時に開始。音声が使えない環境でも処理は継続する。
  await Promise.allSettled([playApprovalTextEffect(), playApprovalSoundEffect()]);
}

async function playApprovalTextEffect() {
  showApprovalTextEffect.value = true;
  await wait(1200);
  showApprovalTextEffect.value = false;
}

async function playApprovalSoundEffect() {
  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextCtor) {
    return;
  }

  const context = new AudioContextCtor();

  try {
    if (context.state === "suspended") {
      await context.resume();
    }

    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.connect(context.destination);

    const start = context.currentTime + 0.01;
    scheduleKyuinTone(context, master, {
      start,
      duration: 0.23,
      fromHz: 480,
      toHz: 1550,
      gainPeak: 0.09,
      detuneCents: -8,
    });
    scheduleKyuinTone(context, master, {
      start: start + 0.16,
      duration: 0.28,
      fromHz: 400,
      toHz: 1710,
      gainPeak: 0.082,
      detuneCents: 11,
    });
    scheduleKyuinTone(context, master, {
      start: start + 0.31,
      duration: 0.34,
      fromHz: 350,
      toHz: 1890,
      gainPeak: 0.07,
      detuneCents: -3,
    });
    scheduleImpactHit(context, master, start + 0.42);

    await wait(980);
  } catch (error) {
    console.warn("Approval sound effect could not be played", error);
  } finally {
    await context.close().catch(() => undefined);
  }
}

function scheduleKyuinTone(
  context: AudioContext,
  destination: GainNode,
  options: {
    start: number;
    duration: number;
    fromHz: number;
    toHz: number;
    gainPeak: number;
    detuneCents: number;
  },
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sawtooth";
  oscillator.detune.setValueAtTime(options.detuneCents, options.start);
  oscillator.frequency.setValueAtTime(options.fromHz, options.start);
  oscillator.frequency.exponentialRampToValueAtTime(
    options.toHz,
    options.start + options.duration,
  );

  gain.gain.setValueAtTime(0.0001, options.start);
  gain.gain.exponentialRampToValueAtTime(
    options.gainPeak,
    options.start + 0.055,
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    options.start + options.duration,
  );

  oscillator.connect(gain);
  gain.connect(destination);

  oscillator.start(options.start);
  oscillator.stop(options.start + options.duration + 0.03);
}

function confettiStyle(piece: number): { [key: string]: string } {
  const angle = `${(piece * 31) % 360}deg`;
  const distance = `${170 + (piece % 8) * 26}px`;
  const hue = String((piece * 29) % 360);
  const delay = `${(piece % 7) * 0.02}s`;
  const duration = `${0.62 + (piece % 5) * 0.11}s`;

  return {
    "--piece-angle": angle,
    "--piece-distance": distance,
    "--piece-hue": hue,
    animationDelay: delay,
    animationDuration: duration,
  };
}

function beamStyle(beam: number): { [key: string]: string } {
  return {
    "--beam-angle": `${(beam * 20) % 360}deg`,
    "--beam-hue": String((beam * 23) % 360),
    animationDelay: `${(beam % 6) * 0.035}s`,
    animationDuration: `${0.5 + (beam % 4) * 0.09}s`,
  };
}

function sparkStyle(spark: number): { [key: string]: string } {
  return {
    "--spark-angle": `${(spark * 53) % 360}deg`,
    "--spark-distance": `${90 + (spark % 10) * 18}px`,
    "--spark-hue": String((spark * 31 + 120) % 360),
    animationDelay: `${(spark % 9) * 0.03}s`,
    animationDuration: `${0.44 + (spark % 5) * 0.08}s`,
  };
}

function scheduleImpactHit(
  context: AudioContext,
  destination: GainNode,
  start: number,
) {
  const low = context.createOscillator();
  const high = context.createOscillator();
  const gain = context.createGain();

  low.type = "triangle";
  low.frequency.setValueAtTime(170, start);
  low.frequency.exponentialRampToValueAtTime(54, start + 0.28);

  high.type = "square";
  high.frequency.setValueAtTime(960, start);
  high.frequency.exponentialRampToValueAtTime(320, start + 0.18);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.07, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);

  low.connect(gain);
  high.connect(gain);
  gain.connect(destination);

  low.start(start);
  high.start(start);
  low.stop(start + 0.36);
  high.stop(start + 0.24);
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function handleRemand() {
  remandValidationMessage.value = "";

  if (!showRemandButton.value) {
    errorMessage.value = "この画面では差戻しできません";
    return;
  }

  if (!scout.value?.id || !authStore.currentUserId) {
    errorMessage.value =
      "差戻しに必要なユーザー情報が不足しています。再ログインしてください。";
    return;
  }

  // 要件: 差戻し時はコメント必須
  if (!remandComment.value.trim()) {
    remandValidationMessage.value = "差戻しコメントは必須です";
    return;
  }

  submitting.value = true;
  errorMessage.value = "";

  try {
    await remandScout({
      scoutId: scout.value.id,
      userId: authStore.currentUserId,
      comment: remandComment.value.trim(),
    });

    // 差戻し後は画面遷移せず、その場で最新状態を再取得する
    await loadReviewData();
  } catch (error) {
    console.error(error);
    const statusCode = (error as any)?.response?.status;
    errorMessage.value = `差戻し処理に失敗しました (error code: ${statusCode ?? "unknown"})`;
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  authStore.hydrateFromStorage();
  loadReviewData();
});
</script>

<style scoped>
.review-page {
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px;
}

.review-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.review-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #dbe4ef;
  border-radius: 14px;
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  padding: 20px;
}

.review-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.review-back-link {
  align-self: flex-start;
  font-size: 14px;
  font-weight: 600;
}

.review-eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.readonly-note {
  margin: 0 0 10px;
  font-size: 12px;
  color: #64748b;
}

.review-title {
  margin: 0;
  font-size: 30px;
  line-height: 1.3;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.01em;
}

.review-status {
  margin: 0;
  font-size: 14px;
  color: #475569;
}

.card-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.scout-body-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.toggle-previous-btn {
  border: 1px solid #b8c5d8;
  border-radius: 999px;
  background: #ffffff;
  color: #1f2937;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.toggle-previous-btn:hover {
  background: #f8fafc;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}

.detail-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px;
  font-size: 14px;
}

.detail-row dt {
  color: #64748b;
}

.detail-row dd {
  margin: 0;
  color: #1f2937;
  font-weight: 600;
}

.scout-body-box {
  max-height: 290px;
  overflow-y: auto;
  border: 1px solid #d7e2ee;
  border-radius: 10px;
  background: linear-gradient(180deg, #f9fbfe 0%, #f4f7fb 100%);
  padding: 14px;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border: 1px solid #d9e3ef;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  background: #fdfefe;
}

.check-item.is-readonly {
  cursor: not-allowed;
  opacity: 0.8;
}

.check-item.is-readonly span {
  cursor: not-allowed;
}

.check-input {
  margin-top: 2px;
}

.check-input:disabled {
  cursor: not-allowed;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-item {
  background: #f8fafc;
  border: 1px solid #dbe4ef;
  border-radius: 8px;
  padding: 12px;
}

.comment-meta {
  margin: 0 0 6px;
  font-size: 12px;
  color: #6b7280;
}

.comment-body {
  margin: 0;
  font-size: 14px;
  color: #111827;
}

.comment-label {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.remand-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #c4d0df;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
}

.remand-textarea:disabled {
  cursor: not-allowed;
  background: #f1f5f9;
  color: #64748b;
}

.remand-textarea:disabled::placeholder {
  color: #94a3b8;
}

.remand-textarea:focus {
  outline: none;
  border-color: #0ea5a4;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-right {
  display: flex;
  justify-content: flex-end;
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-remand {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.btn-remand:hover {
  background: #b91c1c;
}

.btn-approve {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.btn-approve:hover {
  background: #15803d;
}

.approval-rainbow-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(circle at center, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 56%),
    conic-gradient(
      from 0deg,
      rgba(239, 68, 68, 0.08),
      rgba(245, 158, 11, 0.08),
      rgba(34, 197, 94, 0.08),
      rgba(59, 130, 246, 0.08),
      rgba(236, 72, 153, 0.08),
      rgba(239, 68, 68, 0.08)
    ),
    linear-gradient(180deg, rgba(2, 6, 23, 0.12) 0%, rgba(2, 6, 23, 0.28) 100%);
  animation: approval-strobe 0.19s steps(2, jump-none) 6;
}

.approval-flash {
  position: absolute;
  width: min(86vw, 780px);
  aspect-ratio: 1;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 70%);
  mix-blend-mode: screen;
  animation: approval-flash 0.5s ease-out forwards;
}

.approval-rings {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.approval-ring {
  position: absolute;
  width: min(30vw, 300px);
  aspect-ratio: 1;
  border-radius: 999px;
  border: 5px solid rgba(255, 255, 255, 0.7);
  opacity: 0;
  transform: scale(0.4);
  animation: approval-ring-burst 0.88s ease-out forwards;
}

.approval-confetti {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.approval-beams {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.approval-beam {
  --beam-angle: 0deg;
  --beam-hue: 170;
  position: absolute;
  width: min(8vw, 54px);
  height: min(45vh, 350px);
  border-radius: 999px;
  background: linear-gradient(
    to top,
    hsla(var(--beam-hue), 100%, 62%, 0),
    hsla(var(--beam-hue), 100%, 70%, 0.88),
    hsla(var(--beam-hue), 100%, 78%, 0)
  );
  mix-blend-mode: screen;
  transform: rotate(var(--beam-angle)) translateY(30px) scaleY(0.4);
  transform-origin: 50% 70%;
  opacity: 0;
  animation-name: approval-beam-burst;
  animation-fill-mode: forwards;
  animation-timing-function: cubic-bezier(0.1, 0.72, 0.15, 1);
}

.approval-piece {
  --piece-angle: 0deg;
  --piece-distance: 200px;
  --piece-hue: 180;
  position: absolute;
  width: 14px;
  height: 8px;
  border-radius: 999px;
  background: hsl(var(--piece-hue), 92%, 58%);
  box-shadow: 0 0 12px hsla(var(--piece-hue), 100%, 70%, 0.85);
  transform: rotate(var(--piece-angle)) translateX(0) scale(0.2);
  opacity: 0;
  animation-name: approval-piece-burst;
  animation-timing-function: cubic-bezier(0.15, 0.78, 0.19, 1);
  animation-fill-mode: forwards;
}

.approval-sparks {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.approval-spark {
  --spark-angle: 0deg;
  --spark-distance: 120px;
  --spark-hue: 220;
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: hsl(var(--spark-hue), 100%, 72%);
  box-shadow:
    0 0 12px hsla(var(--spark-hue), 100%, 70%, 0.95),
    0 0 28px hsla(var(--spark-hue), 100%, 72%, 0.62);
  opacity: 0;
  transform: rotate(var(--spark-angle)) translateX(0) scale(0.25);
  animation-name: approval-spark-burst;
  animation-fill-mode: forwards;
  animation-timing-function: cubic-bezier(0.12, 0.88, 0.22, 1);
}

.approval-rainbow-text {
  position: relative;
  z-index: 2;
  margin: 0;
  font-size: clamp(88px, 22vw, 250px);
  font-weight: 900;
  letter-spacing: 0.1em;
  line-height: 1;
  background: linear-gradient(
    90deg,
    #ef4444 0%,
    #f97316 16%,
    #facc15 32%,
    #22c55e 48%,
    #06b6d4 64%,
    #3b82f6 80%,
    #ec4899 100%
  );
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.75);
  text-shadow:
    0 12px 44px rgba(16, 24, 40, 0.38),
    0 0 22px rgba(255, 255, 255, 0.65);
  animation: approval-rainbow-pop 1.2s cubic-bezier(0.12, 0.72, 0.2, 1) forwards;
}

@keyframes approval-strobe {
  0% {
    filter: hue-rotate(0deg) saturate(1.05);
  }
  100% {
    filter: hue-rotate(40deg) saturate(1.3);
  }
}

@keyframes approval-flash {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  35% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.25);
  }
}

@keyframes approval-ring-burst {
  0% {
    opacity: 0;
    transform: scale(0.35);
  }
  28% {
    opacity: 0.75;
  }
  100% {
    opacity: 0;
    transform: scale(2.4);
  }
}

@keyframes approval-piece-burst {
  0% {
    opacity: 0;
    transform: rotate(var(--piece-angle)) translateX(0) scale(0.25);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(calc(var(--piece-angle) + 120deg)) translateX(var(--piece-distance)) scale(1);
  }
}

@keyframes approval-beam-burst {
  0% {
    opacity: 0;
    transform: rotate(var(--beam-angle)) translateY(26px) scaleY(0.3);
  }
  24% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(var(--beam-angle)) translateY(-32px) scaleY(1.24);
  }
}

@keyframes approval-spark-burst {
  0% {
    opacity: 0;
    transform: rotate(var(--spark-angle)) translateX(0) scale(0.2);
  }
  18% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(calc(var(--spark-angle) + 90deg)) translateX(var(--spark-distance)) scale(1);
  }
}

@keyframes approval-rainbow-pop {
  0% {
    opacity: 0;
    transform: scale(0.45) rotate(-8deg) translateY(20px);
    background-position: 0% 50%;
    filter: saturate(1.35);
  }
  36% {
    opacity: 1;
    transform: scale(1.18) rotate(3deg) translateY(-2px);
    background-position: 100% 50%;
  }
  100% {
    opacity: 0;
    transform: scale(1.42) rotate(0deg) translateY(-14px);
    background-position: 200% 50%;
    filter: saturate(1.05);
  }
}

.validation-text {
  margin: 10px 0 0;
  font-size: 14px;
  color: #dc2626;
}

.empty-text {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.review-loading {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.review-error {
  margin: 0;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  padding: 12px;
  font-size: 14px;
}

a {
  text-decoration: none;
  color: #464feb;
}

@media (max-width: 900px) {
  .review-grid {
    grid-template-columns: 1fr;
  }

  .review-title {
    font-size: 24px;
  }

  .detail-row {
    grid-template-columns: 92px 1fr;
  }
}
</style>
