import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { HomeFilled, Menu, User, Document } from '@element-plus/icons-vue'
import { nextTick } from 'vue' // 如果使用Element Plus图标
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
    path: '/api',
    name: 'API',
    component: () => import('../views/ApiFox.vue'),
    meta: {
      title: 'API测试工具',
      showInMenu: true,
      icon: Document,
    }
  },
  {
    path: '/file',
    name: 'File',
    component: () => import('../views/ApiFox.vue'),
    meta: {
      title: '本地文件',
      showInMenu: true,
      icon: Document,
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
        component: () => import('../views/tool/UnicodeConvert.vue'),
        meta: {
          title: 'Unicode转换器',
          showInMenu: true
        }
      },
      {
        path: 'json',
        name: 'JsonConvert',
        component: () => import('../views/tool/JSONConvert.vue'),
        meta: {
          title: 'JSON解析',
          showInMenu: true
        }
      },
      {
        path: 'time',
        name: 'TimeConvert',
        component: () => import('../views/tool/TimeConvert.vue'),
        meta: {
          title: '时间戳工具',
          showInMenu: true
        }
      }
    ]
  },
  {
    path: '/self',
    name: 'self',
    component: () => import('../views/SelfCenter.vue'),
    meta: {
      title: '个人中心',
      showInMenu: true,
      icon: User,
    }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
router.afterEach(() => {
  nextTick(() => {
    const mainElement = document.querySelector('.soft-main')
    if (mainElement) {
      mainElement.scrollTop = 0
    }
  })
})

export default router
