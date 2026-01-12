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
  },
  {
    path: '/about',
    name: 'About',
    // component: AboutView,
    meta: {
      title: '关于',
      showInMenu: false
    },
    children: [
      {
        path: 'child',
        name: 'AboutChild',
        // component: () => import('../views/AboutChildView.vue'),
        meta: {
          title: '关于子页面',
          showInMenu: true
        },
        children: [
          {
            path: 'childc',
            name: 'AboutChildChildc',
            component: () => import('../views/AboutChildChildView.vue'),
            meta: {
              title: '关于子页面子页面',
              showInMenu: true
            }
          }
        ]
      },
      {
        path: 'child2',
        name: 'AboutChild2',
        component: () => import('../views/AboutChild2View.vue'),
        meta: {
          title: '关于子页面2',
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
