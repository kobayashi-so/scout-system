/** APIから取得するスカウト本体 */
export type ScoutStatus = 'draft' | 'waiting_leader' | 'waiting_admin' | 'approved' | 'remanded'

export interface ScoutEntity {
  id?: string
  createdAt?: string
  creator: string
  title: string
  body: string
  status?: ScoutStatus
  firstApproverId?: string | null
  secondApproverId?: string | null
  requirement?: ScoutJobRequirement
  promptText?: string
}

/** 求人条件 */
export interface ScoutJobRequirement {
  companyName: string
  jobCategory: string
  jobDescription: string
  requiredSkills: string
  workLocation: string
  salaryInfo: string
  jobAppeal: string
}

/** 作成時の送信ペイロード */
export interface CreateScoutPayload {
  creator: string
  title: string
  body: string
  status?: ScoutStatus
  promptText?: string
  requirement: ScoutJobRequirement
  tone: 'カジュアル' | '熱意' | 'プロフェッショナル'
}

export interface WorkflowActionPayload {
  scoutId: string
  userId: string
}

export interface RemandPayload extends WorkflowActionPayload {
  comment: string
}

export function statusLabel(status?: ScoutStatus): string {
  if (status === 'approved') return '承認済み'
  if (status === 'waiting_leader') return 'リーダー承認待ち'
  if (status === 'waiting_admin') return '管理者承認待ち'
  if (status === 'remanded') return '差戻し'
  if (status === 'draft') return '下書き'
  return '未設定'
}

/** 既存のサンプル生成APIレスポンス */
export interface GeneratedScoutSample {
  body: string
}