/** APIから取得するスカウト本体 */
export interface ScoutEntity {
  id?: string
  createdAt?: string
  creator: string
  title: string
  body: string
  status?: string
  requirement?: ScoutJobRequirement
  promptText?: string
}

/** 求人条件 */
export interface ScoutJobRequirement {
  companyName: string
  jobCategory: string
  jobDescription?: string
  requiredSkills?: string
  workLocation?: string
  salaryInfo: string
  jobAppeal?: string
}

/** 作成時の送信ペイロード */
export interface CreateScoutPayload {
  creator: string
  title: string
  body: string
  status?: string
  promptText: string
  requirement: ScoutJobRequirement
}

/** 既存のサンプル生成APIレスポンス */
export interface GeneratedScoutSample {
  body: string
}