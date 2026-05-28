// 権限区分（DB: users.role_type と対応）
export type RoleType = 'sales' | 'leader' | 'admin'

// ユーザー登録APIのリクエスト型
export interface RegisterUserPayload {
  userName: string
  email: string
  password: string
  roleType: RoleType
}

// ログインAPIのリクエスト型
export interface LoginUserPayload {
  email: string
  password: string
}

// ユーザーAPIのレスポンス型（パスワードは返さない）
export interface UserResponse {
  userId?: string
  userName: string
  email: string
  roleType: RoleType
  createdAt?: string
  updatedAt?: string
}
