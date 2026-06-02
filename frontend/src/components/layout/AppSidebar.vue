<template>
  <aside class="app-sidebar" :class="{ collapsed, 'peek-open': isPeekOpen }">
    <div class="brand-row">
      <RouterLink to="/list" class="brand-link">
        <div class="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 36 36" class="brand-logo-svg" role="img">
            <rect x="2" y="2" width="32" height="32" rx="10" fill="#14b8a6" />
            <path
              d="M13 8.8V24.2H24"
              fill="none"
              stroke="#042f2e"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M20.6 9.2L24.8 13.4"
              fill="none"
              stroke="#99f6e4"
              stroke-width="2.2"
              stroke-linecap="round"
            />
            <circle cx="24.8" cy="13.4" r="1.2" fill="#ccfbf1" />
          </svg>
        </div>
        <div v-if="showExpandedContent" class="brand-copy">
          <p class="brand-title">Scout MANAGER</p>
          <p class="brand-subtitle">Recruiting Workflow</p>
        </div>
      </RouterLink>

      <button
        type="button"
        class="collapse-toggle"
        @click="$emit('toggle-collapse')"
      >
        {{ collapsed ? "›" : "‹" }}
      </button>
    </div>

    <nav class="nav-list" aria-label="Main">
      <RouterLink
        to="/list"
        class="nav-item"
        active-class="is-active"
        :title="isCompact ? 'ダッシュボード' : ''"
        @click="handleNavSelection"
      >
        <span class="nav-icon">▦</span>
        <span v-if="showExpandedContent" class="nav-label">ダッシュボード</span>
      </RouterLink>

      <RouterLink
        to="/create"
        class="nav-item"
        active-class="is-active"
        :title="isCompact ? 'スカウト新規作成' : ''"
        @click="handleNavSelection"
      >
        <span class="nav-icon">✎</span>
        <span v-if="showExpandedContent" class="nav-label">スカウト新規作成</span>
      </RouterLink>

      <template v-if="userRole === 'leader' || userRole === 'admin'">
        <div class="nav-group">
          <button
            type="button"
            class="nav-item nav-group-toggle"
            :class="{ 'is-active': isApprovalActive || isApprovalOpen }"
            :title="isCompact ? '承認' : ''"
            @click="toggleApproval"
          >
            <span class="nav-icon">✓</span>
            <span v-if="showExpandedContent" class="nav-label">承認</span>
            <span v-if="showExpandedContent" class="caret" :class="{ open: isApprovalOpen }" aria-hidden="true"></span>
          </button>

          <Transition name="submenu">
            <div v-show="isApprovalOpen" class="sub-list">
              <RouterLink to="/approval/sales" class="sub-item" active-class="is-active-sub" @click="handleNavSelection">営業承認者承認</RouterLink>
              <RouterLink to="/approval/final" class="sub-item" active-class="is-active-sub" @click="handleNavSelection">管理者承認</RouterLink>
            </div>
          </Transition>
        </div>
      </template>

      <div class="nav-group">
        <button
          type="button"
          class="nav-item nav-group-toggle"
          :class="{ 'is-active': isSettingsActive || isSettingsOpen }"
          :title="isCompact ? '設定' : ''"
          @click="toggleSettings"
        >
          <span class="nav-icon">⚙</span>
          <span v-if="showExpandedContent" class="nav-label">設定</span>
          <span v-if="showExpandedContent" class="caret" :class="{ open: isSettingsOpen }" aria-hidden="true"></span>
        </button>

        <Transition name="submenu">
          <div v-show="isSettingsOpen" class="sub-list">
            <RouterLink to="/settings/evaluations" class="sub-item" active-class="is-active-sub" @click="handleNavSelection">評価基準・チェック項目管理</RouterLink>
            <RouterLink to="/settings/profile" class="sub-item" active-class="is-active-sub" @click="handleNavSelection">ユーザー情報編集</RouterLink>
          </div>
        </Transition>
      </div>
    </nav>

    <div class="sidebar-bottom">
      <button type="button" class="logout-button" @click="$emit('logout')" :title="isCompact ? 'ログアウト' : ''">
        <span class="nav-icon">⇥</span>
        <span v-if="showExpandedContent">ログアウト</span>
      </button>

      <button type="button" class="sidebar-user" @click="goToMyProfile" :title="isCompact ? userName : ''">
        <div class="sidebar-avatar">{{ userInitial }}</div>
        <div v-if="showExpandedContent" class="sidebar-user-meta">
          <p class="sidebar-user-name">{{ userName }}</p>
          <p class="sidebar-user-role">{{ userEmail }}</p>
          <p class="sidebar-user-role">{{ userRole }}</p>
        </div>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from "vue";
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
const isPeekOpen = computed(
  () => collapsed.value && (isApprovalOpen.value || isSettingsOpen.value),
);
const showExpandedContent = computed(() => !collapsed.value || isPeekOpen.value);
const isCompact = computed(() => collapsed.value && !isPeekOpen.value);

watchEffect(() => {
  if (collapsed.value) return;
  if (isApprovalActive.value) isApprovalOpen.value = true;
  if (isSettingsActive.value) isSettingsOpen.value = true;
});

watch(
  collapsed,
  (isNowCollapsed) => {
    if (!isNowCollapsed) return;
    isApprovalOpen.value = false;
    isSettingsOpen.value = false;
  },
  { immediate: true },
);

function toggleApproval() {
  isApprovalOpen.value = !isApprovalOpen.value;
  if (isApprovalOpen.value) {
    isSettingsOpen.value = false;
  }
}

function toggleSettings() {
  isSettingsOpen.value = !isSettingsOpen.value;
  if (isSettingsOpen.value) {
    isApprovalOpen.value = false;
  }
}

function handleNavSelection() {
  if (!collapsed.value) return;
  isApprovalOpen.value = false;
  isSettingsOpen.value = false;
}

function goToMyProfile() {
  router.push("/profile");
}

// userRoleをpropsから参照できるように
const userRole = computed(() => props.userRole);
</script>

<style scoped>
.app-sidebar {
  --ui-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --ui-fast: 0.22s;
  --ui-base: 0.32s;
  width: 276px;
  min-width: 276px;
  height: auto;
  padding: 14px 14px 12px !important;
  border-right: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(170deg, #0f3d2e 0%, #0e2f25 52%, #0b231c 100%) !important;
  transition: width var(--ui-base) var(--ui-ease), min-width var(--ui-base) var(--ui-ease), border-color var(--ui-base) var(--ui-ease), background var(--ui-base) var(--ui-ease);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.app-sidebar.collapsed {
  width: 84px;
  min-width: 84px;
}

.app-sidebar.collapsed.peek-open {
  width: 276px;
  min-width: 276px;
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.app-sidebar.collapsed .brand-row {
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  margin-bottom: 18px;
}

.app-sidebar.collapsed.peek-open .brand-row {
  flex-direction: row;
  justify-content: space-between;
  gap: 0;
  margin-bottom: 24px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  transition: opacity var(--ui-fast) var(--ui-ease);
}

.app-sidebar.collapsed .brand-link {
  justify-content: center;
  gap: 0;
}

.app-sidebar.collapsed.peek-open .brand-link {
  justify-content: flex-start;
  gap: 10px;
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
  transition: transform var(--ui-base) var(--ui-ease), background-color var(--ui-base) var(--ui-ease), border-color var(--ui-base) var(--ui-ease), box-shadow var(--ui-base) var(--ui-ease);
}

.brand-link:hover .brand-logo {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(153, 246, 228, 0.35);
  box-shadow: 0 8px 16px rgba(3, 29, 24, 0.24);
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
  transition: background-color var(--ui-fast) var(--ui-ease), border-color var(--ui-fast) var(--ui-ease), transform var(--ui-fast) var(--ui-ease), color var(--ui-fast) var(--ui-ease);
}

.collapse-toggle:hover {
  background: rgba(255, 255, 255, 0.13);
  border-color: rgba(94, 234, 212, 0.42);
  transform: translateY(-1px);
}

.app-sidebar.collapsed .collapse-toggle {
  margin-top: 2px;
}

.app-sidebar.collapsed.peek-open .collapse-toggle {
  margin-top: 0;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 12px;
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
  transition: background-color var(--ui-fast) var(--ui-ease), color var(--ui-fast) var(--ui-ease), transform var(--ui-fast) var(--ui-ease), box-shadow var(--ui-fast) var(--ui-ease);
}

.app-sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px 6px !important;
}

.app-sidebar.collapsed.peek-open .nav-item {
  justify-content: flex-start;
  padding: 10px 12px !important;
}

.nav-item:hover {
  background: rgba(45, 212, 191, 0.13) !important;
  transform: translateX(2px);
}

.nav-item.is-active {
  background: linear-gradient(
    90deg,
    rgba(20, 184, 166, 0.35),
    rgba(13, 148, 136, 0.2)
  );
  color: #ffffff !important;
}

.nav-icon {
  width: 16px;
  text-align: center;
  color: #a7f3d0;
  font-size: 13px;
  transition: color var(--ui-fast) var(--ui-ease), transform var(--ui-fast) var(--ui-ease);
}

.nav-item:hover .nav-icon,
.nav-item.is-active .nav-icon {
  color: #d1fae5;
  transform: scale(1.04);
}

.nav-label {
  white-space: nowrap;
}

.caret {
  margin-left: auto;
  width: 8px;
  height: 8px;
  border-right: 1.8px solid currentColor;
  border-bottom: 1.8px solid currentColor;
  transform: rotate(45deg);
  transform-origin: 56% 56%;
  opacity: 0.9;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.caret.open {
  transform: rotate(225deg);
  opacity: 1;
}

.sub-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 8px 0 10px;
  padding-left: 30px;
}

.submenu-enter-active,
.submenu-leave-active {
  transition: max-height var(--ui-base) var(--ui-ease), opacity var(--ui-fast) var(--ui-ease), transform var(--ui-fast) var(--ui-ease), margin var(--ui-fast) var(--ui-ease);
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-4px);
  margin-top: 0;
  margin-bottom: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  max-height: 180px;
  opacity: 1;
  transform: translateY(0);
}

.sub-item {
  border-radius: 8px;
  color: #d1fae5;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  padding: 7px 10px;
  transition: background-color var(--ui-fast) var(--ui-ease), color var(--ui-fast) var(--ui-ease), transform var(--ui-fast) var(--ui-ease);
}

.sub-item:hover {
  background: rgba(45, 212, 191, 0.1);
  transform: translateX(2px);
}

.sub-item.is-active-sub {
  background: rgba(20, 184, 166, 0.3);
  color: #ffffff;
}

.sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  padding-top: 12px;
  flex: 0 0 auto;
  transition: border-color var(--ui-base) var(--ui-ease);
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
  transition: background-color var(--ui-fast) var(--ui-ease), color var(--ui-fast) var(--ui-ease), transform var(--ui-fast) var(--ui-ease);
}

.logout-button:hover {
  background: rgba(244, 63, 94, 0.15) !important;
  color: #ffe4e6;
  transform: translateX(2px);
}

.app-sidebar.collapsed .logout-button {
  justify-content: center;
  padding: 10px 6px !important;
}

.app-sidebar.collapsed.peek-open .logout-button {
  justify-content: flex-start;
  padding: 10px 12px !important;
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
  transition: background-color var(--ui-base) var(--ui-ease), border-color var(--ui-base) var(--ui-ease), transform var(--ui-fast) var(--ui-ease), box-shadow var(--ui-base) var(--ui-ease);
}

.sidebar-user:hover {
  background: rgba(45, 212, 191, 0.1);
  border-color: rgba(94, 234, 212, 0.38);
  box-shadow: 0 10px 18px rgba(3, 29, 24, 0.2);
  transform: translateY(-1px);
}

.app-sidebar.collapsed .sidebar-user {
  justify-content: center;
  padding: 10px 6px;
}

.app-sidebar.collapsed.peek-open .sidebar-user {
  justify-content: flex-start;
  padding: 10px;
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
  transition: transform var(--ui-fast) var(--ui-ease), background-color var(--ui-base) var(--ui-ease), border-color var(--ui-base) var(--ui-ease);
}

.sidebar-user:hover .sidebar-avatar {
  transform: scale(1.04);
  background: rgba(20, 184, 166, 0.34);
  border-color: rgba(153, 246, 228, 0.74);
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

@media (prefers-reduced-motion: reduce) {
  .app-sidebar,
  .brand-link,
  .brand-logo,
  .collapse-toggle,
  .nav-item,
  .nav-icon,
  .caret,
  .sub-item,
  .submenu-enter-active,
  .submenu-leave-active,
  .sidebar-bottom,
  .logout-button,
  .sidebar-user,
  .sidebar-avatar {
    transition: none !important;
  }
}

/* main.css の汎用疑似アイコンを打ち消し */
.app-sidebar nav :deep(a)::before,
.app-sidebar nav :deep(button)::before,
.app-sidebar :deep(.sidebar-bottom button)::before {
  display: none !important;
  content: none !important;
}
</style>
