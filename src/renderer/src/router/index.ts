import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { HomeFilled, Menu } from '@element-plus/icons-vue' // 如果使用Element Plus图标
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
      showInMenu: true,
      icon: HomeFilled,
    }
  },
  {
    path: '/tool',
    name: 'Tool',
    meta: {
      title: '工具',
      showInMenu: true,
      icon: Menu
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
      },
      {
        path: 'json',
        name: 'JsonConvert',
        component: () => import('../views/JSONConvert.vue'),
        meta: {
          title: 'JSON解析',
          showInMenu: true
        }
      },
      {
        path: 'time',
        name: 'TimeConvert',
        component: () => import('../views/TimeConvert.vue'),
        meta: {
          title: '时间戳工具',
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
