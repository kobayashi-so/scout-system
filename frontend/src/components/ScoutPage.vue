<template>
  <div class="page-fixed-container">
    <header class="page-header">
      <h1>スカウト文新規作成</h1>
    </header>

    <div class="workspace">
      
      <section class="card input-side">
        <h2>求人情報入力</h2>
        <form @submit.prevent="handleSubmit" class="scrollable-form">
          <div class="form-group-row">
            <label class="form-label compact">
              作成者
              <input v-model="form.creator" type="text" placeholder="テスト太郎" required />
            </label>
            <label class="form-label compact">
              求人タイトル
              <input v-model="form.title" type="text" placeholder="エンジニア向けスカウト" required />
            </label>
          </div>

          <hr class="separator" />

          <label class="form-label">
            会社名
            <input v-model="form.requirement.companyName" type="text" placeholder="株式会社TechVision" required />
          </label>

          <label class="form-label">
            職種
            <input v-model="form.requirement.jobCategory" type="text" placeholder="バックエンドエンジニア" required />
          </label>

          <label class="form-label">
            業務内容
            <input v-model="form.requirement.jobDescription" type="text" placeholder="要件定義〜設計・実装・運用まで担当" required />
          </label>

          <label class="form-label">
            必須スキル
            <input v-model="form.requirement.requiredSkills" type="text" placeholder="Java/Kotlin3年以上, AWS, Webアプリ開発" required />
          </label>

          <label class="form-label">
            勤務地
            <input v-model="form.requirement.workLocation" type="text" placeholder="東京都港区（リモート併用可）" required />
          </label>

          <label class="form-label">
            給与
            <input v-model="form.requirement.salaryInfo" type="text" placeholder="年収600万円〜800万円" required />
          </label>

          <label class="form-label">
            求人の魅力
            <input v-model="form.requirement.jobAppeal" type="text" placeholder="自社サービス開発・モダン技術環境・裁量大" required />
          </label>

          <label class="form-label">
            文章トーン
            <select v-model="form.tone" required>
              <option value="カジュアル">カジュアル</option>
              <option value="熱意">熱意</option>
              <option value="プロフェッショナル">プロフェッショナル</option>
            </select>
          </label>
          
          <div class="actions">
            <button type="button" class="btn-ai" @click="handleGeneratePrompt">
              ✨ AIで生成（サンプル）
            </button>
          </div>
        </form>
      </section>

      <section class="card output-side">
        <h2>スカウト文プレビュー・編集</h2>
        <div class="output-container">
          <label class="form-label full-height">
            本文（送信内容）
            <textarea v-model="form.body" class="body-textarea" placeholder="左の「AIで生成」ボタンを押すか、直接ここに入力してください" required />
          </label>

          <p v-if="generateError" class="message error">{{ generateError }}</p>

          <div class="submit-zone">
            <button type="button" class="btn-submit" :disabled="store.loading" @click="handleSubmit">
              作成する
            </button>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { useScoutStore } from '../store/scoutStore'
import type { CreateScoutPayload } from '../type/scout'

const store = useScoutStore()

const form = reactive<{
  creator: string
  title: string
  requirement: {
    companyName: string
    jobCategory: string
    jobDescription: string
    requiredSkills: string
    workLocation: string
    salaryInfo: string
    jobAppeal: string
  }
  tone: 'カジュアル' | '熱意' | 'プロフェッショナル'
  promptText: string
  body: string
}>({
  creator: '',
  title: '',
  requirement: {
    companyName: '',
    jobCategory: '',
    jobDescription: '',
    requiredSkills: '',
    workLocation: '',
    salaryInfo: '',
    jobAppeal: '',
  },
  tone: 'カジュアル',
  promptText: '',
  body: '',
})

const generateError = ref('')

function handleGeneratePrompt() {
  const r = form.requirement
  
  if (!r.companyName || !r.jobCategory) {
    generateError.value = '会社名と職種を入力してから生成してください。'
    return
  }
  generateError.value = ''

  form.promptText = [
    'あなたは採用担当です。候補者向けのスカウト文を作成してください。',
    `会社名: ${r.companyName}`,
    `職種: ${r.jobCategory}`,
    `トーン: ${form.tone}`,
  ].join('\n')

  let generatedBody = ''
  if (form.tone === 'カジュアル') {
    generatedBody = [
      `${r.companyName}の採用担当です！`,
      `今回は${r.jobCategory}を募集しています。${r.jobDescription}をお任せしたいです。`,
      `スキルは${r.requiredSkills}、勤務地は${r.workLocation}、給与は${r.salaryInfo}です。`,
      `魅力は「${r.jobAppeal}」。まずは気軽にお話しませんか？`,
    ].join('\n')
  } else if (form.tone === '熱意') {
    generatedBody = [
      `${r.companyName}の採用担当です。`,
      `あなたのご経験に強く惹かれ、${r.jobCategory}としてぜひご活躍いただきたいと考えています。`,
      `${r.jobDescription}を中心に、${r.requiredSkills}を活かせる環境です。`,
      `勤務地は${r.workLocation}、給与は${r.salaryInfo}。`,
      `「${r.jobAppeal}」など、当社ならではの魅力も多数。ご応募を心よりお待ちしています！`,
    ].join('\n')
  } else if (form.tone === 'プロフェッショナル') {
    generatedBody = [
      `${r.companyName} 採用担当です。`,
      `${r.jobCategory}ポジションにて、${r.jobDescription}を担っていただける方を募集しております。`,
      `必須スキル: ${r.requiredSkills}／勤務地: ${r.workLocation}／給与: ${r.salaryInfo}`,
      `当社の魅力: ${r.jobAppeal}`,
      `ご興味がございましたら、ぜひご連絡ください。`,
    ].join('\n')
  }
  
  form.body = generatedBody
}

async function handleSubmit() {
  // 本文が空欄の場合、エラーメッセージを表示して処理を中断
  if (!form.body) {
    generateError.value = '本文が空欄です。';
    return;
  }

  // フォームデータを CreateScoutPayload 型に整形
  const payload: CreateScoutPayload = {
    creator: form.creator.trim(), // 作成者名をトリムしてセット
    title: form.title.trim(), // タイトルをトリムしてセット
    body: form.body.trim(), // 本文をトリムしてセット
    tone: form.tone, // 選択された文章トーンをセット
    requirement: {
      companyName: form.requirement.companyName.trim(), // 会社名
      jobCategory: form.requirement.jobCategory.trim(), // 職種
      jobDescription: form.requirement.jobDescription.trim(), // 業務内容
      requiredSkills: form.requirement.requiredSkills.trim(), // 必須スキル
      workLocation: form.requirement.workLocation.trim(), // 勤務地
      salaryInfo: form.requirement.salaryInfo.trim(), // 給与情報
      jobAppeal: form.requirement.jobAppeal.trim(), // 求人の魅力
    },
  };

  try {
    // データをバックエンドに送信
    await store.addScout(payload);

    // フォームをクリア
    form.creator = '';
    form.title = '';
    form.requirement.companyName = '';
    form.requirement.jobCategory = '';
    form.requirement.jobDescription = '';
    form.requirement.requiredSkills = '';
    form.requirement.workLocation = '';
    form.requirement.salaryInfo = '';
    form.requirement.jobAppeal = '';
    form.body = '';
    generateError.value = ''; // エラーメッセージをリセット
  } catch (error) {
    // データ送信に失敗した場合、エラーメッセージを表示
    generateError.value = 'データの保存に失敗しました。';
    console.error(error); // エラー内容をコンソールに出力
  }
}

onMounted(() => {
  store.loadScouts()
})
</script>

<style scoped>
/* 💡 クラス名をテンプレートと一致させ、画面を100%固定 */
.page-fixed-container {
  display: flex;
  flex-direction: column;
  height: 90vh;           /* 画面縦幅をブラウザウィンドウに完全固定 */
  max-width: 1440px;
  margin: 0 auto;
  padding: 12px 10px;       /* 余白を詰めてよりコンパクトに */
  box-sizing: border-box;
  font-family: system-ui, sans-serif;
  color: #1a202c;
  background-color: #fff;
  overflow: hidden;        /* 外側のスクロールを絶対に禁止 */
}

/* ヘッダー */
.page-header {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.page-header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

/* 2カラム構造：残りの高さをすべて使い切る */
.workspace {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;           /* 内部スクロールを機能させる最重要コード */
}

/* 各カードの共通スタイル */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.card h2 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
  border-left: 4px solid #3182ce;
  padding-left: 8px;
  flex-shrink: 0;
}

/* 左右カラムの幅割合 */
.input-side {
  flex: 4;
  min-width: 0;
}

.output-side {
  flex: 3;
  min-width: 0;
}

/* 💡 左カラム：入力フォームを内部スクロール化（パーツの隙間を小さく） */
.scrollable-form {
  overflow-y: auto;        /* 溢れたらここだけスクロール */
  padding-right: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;                /* パーツ間の隙間を12px→8pxに縮小 */
  flex: 1;
}

/* スクロールバーのデザインを極細に */
.scrollable-form::-webkit-scrollbar {
  width: 4px;
}
.scrollable-form::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 2px;
}

.form-group-row {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
button {
  align-self: flex-start;
  padding: 8px 16px;
  background: #05ad54;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.78rem;      /* 文字を少し小さく */
  font-weight: 600;
  color: #475569;
  flex-shrink: 0;
}

.form-label.compact {
  flex: 1;
}
.btn-secondary {
  background: #fff;
  color:  #05ad54;
  border: 1px solid  #05ad54;
}

.form-label.full-height {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* インプットのpaddingを縮小して高さを抑える */
input,
select,
textarea {
  padding: 6px 10px;       /* 10px→6pxにして縦幅を大幅カット */
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.88rem;
  color: #1e293b;
  background-color: #fff;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #3182ce;
}

/* 右カラム：テキストエリアを上下いっぱいに引き伸ばす */
.output-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.body-textarea {
  flex: 1;
  resize: none;
  line-height: 1.5;
  font-family: inherit;
  height: 100%;
}

.separator {
  border: 0;
  border-top: 1px solid #e2e8f0;
  margin: 2px 0;
  flex-shrink: 0;
}

/* AI生成ボタン */
.actions {
  margin-top: 2px;
  flex-shrink: 0;
}

.btn-ai {
  width: 100%;
  padding: 8px;            /* ボタンも少しスリムに */
  background-color: #ebf8ff;
  color: #2b6cb0;
  border: 1px dashed #63b3ed;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
}

/* 下部送信エリア */
.submit-zone {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.btn-submit {
  padding: 6px 20px;
  background: #3182ce;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.message.error {
  color: #dc2626;
  font-weight: 600;
  margin: 4px 0 0;
  font-size: 0.8rem;
}
</style>