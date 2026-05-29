import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "../store/authStore";

import ScoutPage from "../components/ScoutPage.vue";
import ScoutList from "../components/ScoutList.vue";
import LoginPage from "../components/LoginPage.vue";
import RegisterPage from "../components/RegisterPage.vue";
import SettingCheckItem from "../components/SettingCheckItem.vue";
import SettingUserprofile from "../components/SettingUserprofile.vue";
import LeaderReviewPage from "../components/LeaderReviewPage.vue";
import AdminReviewPage from "../components/AdminReviewPage.vue";
import SalesApprovalPage from "../components/SalesApprovalPage.vue";
import FinalApprovalPage from "../components/FinalApprovalPage.vue";

// 認証導線: ルート初期表示はログイン画面。
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
  },
  {
    path: "/register",
    name: "register",
    component: RegisterPage,
  },
  {
    path: "/list",
    name: "scout-list",
    component: ScoutList,
    meta: { requiresAuth: true },
  },
  {
    path: "/create",
    name: "scout-create",
    component: ScoutPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/approval/sales",
    name: "approval-sales",
    component: SalesApprovalPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/approval/final",
    name: "approval-final",
    component: FinalApprovalPage,
    meta: { requiresAuth: true },
  },
  {
    // leader向けレビュー画面（営業承認）
    path: "/reviews/leader/:id",
    name: "leader-review",
    component: LeaderReviewPage,
    meta: { requiresAuth: true },
  },
  {
    // admin向けレビュー画面（最終承認）
    path: "/reviews/admin/:id",
    name: "admin-review",
    component: AdminReviewPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/setting",
    redirect: "/settings",
  },
  {
    path: "/settings/evaluations",
    name: "settings-evaluations",
    component: SettingCheckItem,
    meta: { requiresAuth: true },
  },
  {
    path: "/settings/profile",
    name: "settings-profile",
    component: SettingUserprofile,
    meta: { requiresAuth: true },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 認証ガード:
// - 未ログインで保護画面へ行った場合はログインへリダイレクト
// - ログイン済みでログイン/登録へ来た場合は一覧へ戻す
router.beforeEach((to) => {
  const authStore = useAuthStore();
  authStore.hydrateFromStorage();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "login",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (
    (to.name === "login" || to.name === "register") &&
    authStore.isAuthenticated
  ) {
    return { name: "scout-list" };
  }

  return true;
});
