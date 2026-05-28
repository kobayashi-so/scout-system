import { defineStore } from 'pinia'

const AUTH_STORAGE_KEY = 'scout-auth-user'
const REGISTERED_USER_KEY = 'scout-registered-user'
const FALLBACK_KEYS = ['loggedInUser', 'authUser', 'user', 'registeredUser'] as const

export interface AuthUser {
  name: string
  role: string
  roleLevel: number
}

interface RawUserLike {
  name?: unknown
  fullName?: unknown
  username?: unknown
  creator?: unknown
  role?: unknown
  position?: unknown
  roleLevel?: unknown
}

interface AuthState {
  currentUser: AuthUser | null
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toRoleLevel(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.min(3, Math.floor(value)))
  }
  return 1
}

function normalizeUser(raw: RawUserLike | null): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null

  const name =
    toStringOrEmpty(raw.name) ||
    toStringOrEmpty(raw.fullName) ||
    toStringOrEmpty(raw.username) ||
    toStringOrEmpty(raw.creator)

  if (!name) return null

  const role = toStringOrEmpty(raw.role) || toStringOrEmpty(raw.position) || '営業担当'
  const roleLevel = toRoleLevel(raw.roleLevel)

  return { name, role, roleLevel }
}

function readStorageUser(storageKey: string): AuthUser | null {
  if (typeof window === 'undefined') return null

  const raw = localStorage.getItem(storageKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as RawUserLike
    return normalizeUser(parsed)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    currentUser: null,
  }),

  actions: {
    hydrateCurrentUser() {
      const fromAuth = readStorageUser(AUTH_STORAGE_KEY)
      if (fromAuth) {
        this.currentUser = fromAuth
        return
      }

      const fromRegistered = readStorageUser(REGISTERED_USER_KEY)
      if (fromRegistered) {
        this.currentUser = fromRegistered
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fromRegistered))
        return
      }

      for (const key of FALLBACK_KEYS) {
        const fallbackUser = readStorageUser(key)
        if (fallbackUser) {
          this.currentUser = fallbackUser
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackUser))
          return
        }
      }
    },

    setCurrentUser(user: AuthUser) {
      this.currentUser = user
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    },

    clearCurrentUser() {
      this.currentUser = null
      localStorage.removeItem(AUTH_STORAGE_KEY)
    },
  },
})
