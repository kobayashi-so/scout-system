import { defineStore } from 'pinia'
import { loginUser, registerUser } from '../api/authApi'
import type { RegisterUserPayload, RoleType, UserResponse } from '../type/user'

// 認証ストアの状態型。現在のログイン状態・メール・権限・初期化済みかを保持
interface AuthState {
  isAuthenticated: boolean // ログイン済みか
  currentUserId: string | null // 現在ログイン中ユーザーのID
  currentUserEmail: string | null // 現在ログイン中のメールアドレス
  currentUserRoleType: RoleType | null // 現在ログイン中ユーザーの権限
  initialized: boolean // ストア初期化済みか
}

// 新規登録時に受け取るデータ型（usersテーブルのカラム名に合わせる）
type RegisterPayload = RegisterUserPayload

const AUTH_STORAGE_KEY = 'scout_auth_user'

interface AuthSession {
  userId: string | null
  email: string
  roleType: RoleType
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    currentUserId: null,
    currentUserEmail: null,
    currentUserRoleType: null,
    initialized: false,
  }),

  actions: {
    // ページリロード時にlocalStorageからログイン状態・権限を復元
    hydrateFromStorage() {
      if (this.initialized) return

      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (raw) {
        try {
          // 既存セッションを復元
          const session = JSON.parse(raw) as AuthSession
          this.currentUserId = session.userId ?? null
          this.currentUserEmail = session.email
          this.currentUserRoleType = session.roleType
          this.isAuthenticated = true
        } catch {
          // 破損データがあれば未ログイン扱いで安全に継続
          this.currentUserId = null
          this.currentUserEmail = null
          this.currentUserRoleType = null
          this.isAuthenticated = false
        }
      }

      this.initialized = true
    },

    // 新規ユーザーをAPI経由でusersテーブルに登録する。
    async register(payload: RegisterPayload) {
      const user = await registerUser({
        ...payload,
        email: payload.email.trim().toLowerCase(),
      })

      this.setSession(user)
    },

    // メールアドレスとパスワードで認証し、権限もストアにセット
    async login(email: string, password: string) {
      const user = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      })

      this.setSession(user)
    },

    // ログアウト時は状態と保存済みセッションをクリアする。
    logout() {
      this.currentUserId = null
      this.currentUserEmail = null
      this.currentUserRoleType = null
      this.isAuthenticated = false
      this.initialized = true
      localStorage.removeItem(AUTH_STORAGE_KEY)
    },

    setSession(user: UserResponse) {
      // 認証成功時の共通セッション反映処理
      this.currentUserId = user.userId ?? null
      this.currentUserEmail = user.email
      this.currentUserRoleType = user.roleType
      this.isAuthenticated = true
      this.initialized = true
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          userId: user.userId ?? null,
          email: user.email,
          roleType: user.roleType,
        }),
      )
    },
  },
})
