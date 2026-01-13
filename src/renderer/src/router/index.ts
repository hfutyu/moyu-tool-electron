import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
    meta: {
      title: '首页',
      showInMenu: true
    }
  },
  {
    path: '/tool',
    name: 'Tool',
    meta: {
      title: '工具',
      showInMenu: true
    },
    children: [
      {
        path: 'unicode',
        name: 'UnicodeConvert',
        component: () => import('../views/UnicodeConvert.vue'),
        meta: {
          title: 'Unicode转换器',
          showInMenu: true
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
