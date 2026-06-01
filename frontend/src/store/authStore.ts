import { defineStore } from "pinia";
import { loginUser, registerUser } from "../api/authApi";
import type { RegisterUserPayload, RoleType, UserResponse } from "../type/user";

// 認証ストアの状態型。現在のログイン状態・メール・権限・初期化済みかを保持
interface AuthState {
  isAuthenticated: boolean; // ログイン済みか
  loading: boolean; // 認証系APIの実行中フラグ
  currentUserId: string | null; // 現在ログイン中ユーザーのID
  currentUserName: string | null; // 現在ログイン中ユーザー名
  currentUserEmail: string | null; // 現在ログイン中のメールアドレス
  currentUserRoleType: RoleType | null; // 現在ログイン中ユーザーの権限
  initialized: boolean; // ストア初期化済みか
}

// 新規登録時に受け取るデータ型（usersテーブルのカラム名に合わせる）
type RegisterPayload = RegisterUserPayload;

const AUTH_STORAGE_KEY = "scout_auth_user";

interface AuthSession {
  userId: string | null;
  userName?: string;
  email?: string;
  roleType?: RoleType;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    isAuthenticated: false,
    loading: false,
    currentUserId: null,
    currentUserName: null,
    currentUserEmail: null,
    currentUserRoleType: null,
    initialized: false,
  }),

  actions: {
    // ページリロード時にlocalStorageからログイン状態・権限を復元
    hydrateFromStorage() {
      if (this.initialized) return;

      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        try {
          // 既存セッションを復元
          const session = JSON.parse(raw) as AuthSession;
          this.currentUserId = session.userId ?? null;
          this.currentUserEmail = session.email ?? null;
          this.currentUserRoleType = session.roleType ?? null;

          // 旧セッション(userName未保存)との後方互換
          if (session.userName?.trim()) {
            this.currentUserName = session.userName;
          } else if (session.email?.includes("@")) {
            this.currentUserName = session.email.split("@")[0] || null;
          } else {
            this.currentUserName = null;
          }

          this.isAuthenticated = Boolean(
            this.currentUserEmail && this.currentUserRoleType,
          );
        } catch {
          // 破損データがあれば未ログイン扱いで安全に継続
          this.currentUserId = null;
          this.currentUserName = null;
          this.currentUserEmail = null;
          this.currentUserRoleType = null;
          this.isAuthenticated = false;
        }
      }

      this.initialized = true;
    },

    // 新規ユーザーをAPI経由でusersテーブルに登録する。
    async register(payload: RegisterPayload) {
      this.loading = true;
      try {
        const user = await registerUser({
          ...payload,
          email: payload.email.trim().toLowerCase(),
        });

        this.setSession(user);
      } finally {
        this.loading = false;
      }
    },

    // メールアドレスとパスワードで認証し、権限もストアにセット
    async login(email: string, password: string) {
      this.loading = true;
      try {
        const user = await loginUser({
          email: email.trim().toLowerCase(),
          password,
        });

        this.setSession(user);
      } finally {
        this.loading = false;
      }
    },

    // ログアウト時は状態と保存済みセッションをクリアする。
    logout() {
      this.currentUserId = null;
      this.currentUserName = null;
      this.currentUserEmail = null;
      this.currentUserRoleType = null;
      this.isAuthenticated = false;
      this.initialized = true;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    },

    setSession(user: UserResponse) {
      // 認証成功時の共通セッション反映処理
      this.currentUserId = user.userId ?? this.currentUserId;
      this.currentUserName =
        user.userName ?? this.currentUserName ?? this.currentUserEmail;
      this.currentUserEmail = user.email ?? this.currentUserEmail;
      this.currentUserRoleType = user.roleType ?? this.currentUserRoleType;
      this.isAuthenticated = true;
      this.initialized = true;

      if (!this.currentUserEmail || !this.currentUserRoleType) {
        // セッション情報が不足するレスポンスは安全側で拒否
        this.isAuthenticated = false;
        return;
      }

      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          userId: this.currentUserId ?? null,
          userName: this.currentUserName,
          email: this.currentUserEmail,
          roleType: this.currentUserRoleType,
        }),
      );
    },
  },
});
