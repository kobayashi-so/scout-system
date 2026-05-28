import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router'

import ScoutPage from '../components/ScoutPage.vue'
import ScoutList from '../components/ScoutList.vue'
import SettingCheckItem from '../components/SettingCheckItem.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/list',
  },
  {
    path: '/list',
    name: 'scout-list',
    component: ScoutList,
  },
  {
    path: '/create',
    name: 'scout-create',
    component: ScoutPage,
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