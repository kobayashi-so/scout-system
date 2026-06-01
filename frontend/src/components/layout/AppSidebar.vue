<template>
  <aside class="app-sidebar" :class="{ collapsed }">
    <div class="brand-row">
      <RouterLink to="/list" class="brand-link">
        <div class="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 36 36" class="brand-logo-svg" role="img">
            <rect x="2" y="2" width="32" height="32" rx="10" fill="#14b8a6" />
            <path d="M13 8.8V24.2H24" fill="none" stroke="#042f2e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M20.6 9.2L24.8 13.4" fill="none" stroke="#99f6e4" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="24.8" cy="13.4" r="1.2" fill="#ccfbf1" />
          </svg>
        </div>
        <div v-if="!collapsed" class="brand-copy">
          <p class="brand-title">Scout MANAGER</p>
          <p class="brand-subtitle">Recruiting Workflow</p>
        </div>
      </RouterLink>

      <button type="button" class="collapse-toggle" @click="$emit('toggle-collapse')">
        {{ collapsed ? '›' : '‹' }}
      </button>
    </div>

    <nav class="nav-list" aria-label="Main">
      <RouterLink to="/list" class="nav-item" active-class="is-active" :title="collapsed ? 'ダッシュボード' : ''">
        <span class="nav-icon">▦</span>
        <span v-if="!collapsed" class="nav-label">ダッシュボード</span>
      </RouterLink>

      <RouterLink to="/create" class="nav-item" active-class="is-active" :title="collapsed ? 'スカウト新規作成' : ''">
        <span class="nav-icon">✎</span>
        <span v-if="!collapsed" class="nav-label">スカウト新規作成</span>
      </RouterLink>

      <template v-if="userRole === 'leader' || userRole === 'admin'">
        <div class="nav-group">
          <button
            type="button"
            class="nav-item nav-group-toggle"
            :class="{ 'is-active': isApprovalActive || isApprovalOpen }"
            :title="collapsed ? '承認' : ''"
            @click="isApprovalOpen = !isApprovalOpen"
          >
            <span class="nav-icon">✓</span>
            <span v-if="!collapsed" class="nav-label">承認</span>
            <span v-if="!collapsed" class="caret" :class="{ open: isApprovalOpen }">⌄</span>
          </button>

          <div v-show="isApprovalOpen && !collapsed" class="sub-list">
            <RouterLink to="/approval/sales" class="sub-item" active-class="is-active-sub">営業承認</RouterLink>
            <RouterLink to="/approval/final" class="sub-item" active-class="is-active-sub">管理者承認</RouterLink>
          </div>
        </div>
      </template>

      <div class="nav-group">
        <button
          type="button"
          class="nav-item nav-group-toggle"
          :class="{ 'is-active': isSettingsActive || isSettingsOpen }"
          :title="collapsed ? '設定' : ''"
          @click="isSettingsOpen = !isSettingsOpen"
        >
          <span class="nav-icon">⚙</span>
          <span v-if="!collapsed" class="nav-label">設定</span>
          <span v-if="!collapsed" class="caret" :class="{ open: isSettingsOpen }">⌄</span>
        </button>

        <div v-show="isSettingsOpen && !collapsed" class="sub-list">
          <RouterLink to="/settings/evaluations" class="sub-item" active-class="is-active-sub">評価基準・チェック項目管理</RouterLink>
          <RouterLink to="/settings/profile" class="sub-item" active-class="is-active-sub">ユーザー情報編集</RouterLink>
        </div>
      </div>
    </nav>

    <div class="sidebar-bottom">
      <button type="button" class="logout-button" @click="$emit('logout')" :title="collapsed ? 'ログアウト' : ''">
        <span class="nav-icon">⇥</span>
        <span v-if="!collapsed">ログアウト</span>
      </button>

      <button type="button" class="sidebar-user" @click="goToMyProfile" :title="collapsed ? userName : ''">
        <div class="sidebar-avatar">{{ userInitial }}</div>
        <div v-if="!collapsed" class="sidebar-user-meta">
          <p class="sidebar-user-name">{{ userName }}</p>
          <p class="sidebar-user-role">{{ userEmail }}</p>
          <p class="sidebar-user-role">{{ userRole }}</p>
        </div>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps<{
  userName: string;
  userEmail: string;
  userRole: string;
  collapsed?: boolean;
}>();

defineEmits<{
  (e: "logout"): void;
  (e: "toggle-collapse"): void;
}>();

const route = useRoute();
const router = useRouter();
const isApprovalOpen = ref(false);
const isSettingsOpen = ref(false);

const isApprovalActive = computed(() => route.path.startsWith("/approval"));
const isSettingsActive = computed(() => route.path.startsWith("/settings"));

const userInitial = computed(() => {
  const first = props.userEmail.trim().charAt(0);
  return first || "?";
});

const collapsed = computed(() => Boolean(props.collapsed));

watchEffect(() => {
  if (isApprovalActive.value) isApprovalOpen.value = true;
  if (isSettingsActive.value) isSettingsOpen.value = true;
});

function goToMyProfile() {
  router.push("/profile");
}

// userRoleをpropsから参照できるように
const userRole = computed(() => props.userRole);
</script>

<style scoped>
.app-sidebar {
  width: 276px;
  min-width: 276px;
  padding: 14px 14px 12px !important;
  border-right: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(170deg, #0f3d2e 0%, #0e2f25 52%, #0b231c 100%) !important;
  transition: width 0.22s ease, min-width 0.22s ease;
}

.app-sidebar.collapsed {
  width: 84px;
  min-width: 84px;
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo-svg {
  width: 28px;
  height: 28px;
}

.brand-copy {
  min-width: 0;
}

.brand-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: #f0fdfa;
}

.brand-subtitle {
  margin: 0;
  color: #9bd6cc;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.collapse-toggle {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.06);
  color: #d1fae5;
  font-size: 16px;
  cursor: pointer;
}

.collapse-toggle:hover {
  background: rgba(255, 255, 255, 0.13);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 10px;
  padding: 10px 12px !important;
  text-decoration: none;
  color: #def7ec !important;
  font-size: 13px;
  font-weight: 700;
  background: transparent;
  cursor: pointer;
}

.app-sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px 6px !important;
}

.nav-item:hover {
  background: rgba(45, 212, 191, 0.13) !important;
}

.nav-item.is-active {
  background: linear-gradient(90deg, rgba(20, 184, 166, 0.35), rgba(13, 148, 136, 0.2));
  color: #ffffff !important;
}

.nav-icon {
  width: 16px;
  text-align: center;
  color: #a7f3d0;
  font-size: 13px;
}

.nav-label {
  white-space: nowrap;
}

.caret {
  margin-left: auto;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.caret.open {
  transform: rotate(180deg);
}

.sub-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 4px 0 2px;
  padding-left: 30px;
}

.sub-item {
  border-radius: 8px;
  color: #d1fae5;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  padding: 7px 10px;
}

.sub-item:hover {
  background: rgba(45, 212, 191, 0.1);
}

.sub-item.is-active-sub {
  background: rgba(20, 184, 166, 0.3);
  color: #ffffff;
}

.sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  padding-top: 12px;
}

.logout-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  border: 0;
  background: transparent;
  color: #d1fae5;
  padding: 10px 12px !important;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.logout-button:hover {
  background: rgba(244, 63, 94, 0.15) !important;
  color: #ffe4e6;
}

.app-sidebar.collapsed .logout-button {
  justify-content: center;
  padding: 10px 6px !important;
}

.sidebar-user {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(255, 255, 255, 0.04);
  padding: 10px;
  cursor: pointer;
}

.sidebar-user:hover {
  background: rgba(45, 212, 191, 0.1);
}

.app-sidebar.collapsed .sidebar-user {
  justify-content: center;
  padding: 10px 6px;
}

.sidebar-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.24);
  border: 1px solid rgba(94, 234, 212, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0fdfa;
  font-size: 13px;
  font-weight: 700;
}

.sidebar-user-name,
.sidebar-user-role {
  margin: 0;
}

.sidebar-user-meta {
  text-align: left;
}

.sidebar-user-name {
  color: #ecfeff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.sidebar-user-role {
  color: #9bd6cc;
  font-size: 11px;
  line-height: 1.35;
}

/* main.css の汎用疑似アイコンを打ち消し */
.app-sidebar nav :deep(a)::before,
.app-sidebar nav :deep(button)::before,
.app-sidebar :deep(.sidebar-bottom button)::before {
  display: none !important;
  content: none !important;
}
</style>
