import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router'
import { useAuthStore } from '../store/authStore'

import ScoutPage from '../components/ScoutPage.vue'
import ScoutList from '../components/ScoutList.vue'
import LoginPage from '../components/LoginPage.vue'
import RegisterPage from '../components/RegisterPage.vue'
import SettingCheckItem from '../components/SettingCheckItem.vue'

// 認証導線: ルート初期表示はログイン画面。
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
  },
  {
    path: '/list',
    name: 'scout-list',
    component: ScoutList,
    meta: { requiresAuth: true },
  },
  {
    path: '/create',
    name: 'scout-create',
    component: ScoutPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/setting',
    redirect: '/settings',
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingCheckItem,
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 認証ガード:
// - 未ログインで保護画面へ行った場合はログインへリダイレクト
// - ログイン済みでログイン/登録へ来た場合は一覧へ戻す
router.beforeEach((to) => {
  const authStore = useAuthStore()
  authStore.hydrateFromStorage()

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    return { name: 'scout-list' }
  }

  return true
})
