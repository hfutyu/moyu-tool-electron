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
      title: 'API调试',
      showInMenu: true,
      icon: Document,
    }
  },
  {
    path: '/apiPlatform',
    name: 'apiPlatform',
    component: () => import('../views/ApiPlatform.vue'),
    meta: {
      title: '接口开放平台',
      showInMenu: true,
      icon: Document,
    }
  },
  {
    path: '/ai',
    name: 'ai',
    component: () => import('../views/AITool.vue'),
    meta: {
      title: '大模型对话',
      showInMenu: true,
      icon: HomeFilled,
    }
  },
  {
    path: '/tool',
    name: 'Tool',
    meta: {
      title: '常用工具',
      showInMenu: true,
      icon: Menu
    },
    children: [
      {
        path: 'pic',
        name: 'PicConvert',
        component: () => import('../views/tool/PicConvert.vue'),
        meta: {
          title: '图片转换器',
          showInMenu: true
        }
      },
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
        component: () => import('../views/tool/JsonConvert.vue'),
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
      },
      {
        path: '/number',
        name: 'NumberConvert',
        component: () => import('../views/tool/NumberConvert.vue'),
        meta: {
          title: '进制转换',
          showInMenu: true,
         }
      },
    ]
  },
  {
    path: '/game',
    name: 'Game',
    meta: {
      title: '休闲娱乐',
      showInMenu: true,
      icon: Menu
    },
    children: [
      {
        path: '2048',
        name: '2048',
        component: () => import('../views/game/2048.vue'),
        meta: {
          title: '2048',
          showInMenu: true
        }
      },
      {
        path: 'plane',
        name: 'PaperPlane',
        component: () => import('../views/game/PaperPlane.vue'),
        meta: {
          title: '纸飞机',
          showInMenu: true
        }
      },
      {
        path: 'Gomoku',
        name: 'Gomoku',
        component: () => import('../views/game/Gomoku.vue'),
        meta: {
          title: '五子棋',
          showInMenu: true
        }
      },
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
