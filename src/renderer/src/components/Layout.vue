<template>
  <el-container class="layout-container">
    <el-aside width="220px">
      <el-menu
        :default-active="$route.name as string"
        class="el-menu-vertical-demo soft-clear-menu"
        :unique-opened="true"
        @select="handleMenuSelect"
        :collapse="isCollapse"
      >
        <menu-item
          v-for="item in menuItems"
          :key="item.index"
          :item="item"
        />
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="soft-header">
        <div class="header-content">
          <h2 class="soft-title">{{ title }}</h2>
          <el-button
            @click="router.back()"
            class="soft-back-button"
            :icon="ArrowLeft"
            size="default"
          >
            返回
          </el-button>
        </div>
      </el-header>
      <el-main class="soft-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, defineAsyncComponent, ref } from "vue";
import { ArrowLeft } from '@element-plus/icons-vue';

interface MenuItemData {
  index: string
  title: string
  icon?: any
  children?: MenuItemData[]
}

// 递归组件用于渲染菜单
const MenuItem = defineAsyncComponent(() => import('./MenuItem.vue'))

const router = useRouter()
const isCollapse = ref(false) //左侧菜单展开

// 从路由配置动态生成菜单项（支持多级）
const menuItems = computed<MenuItemData[]>(() => {
  return router.options.routes
    .filter(route => route.meta && route.meta.showInMenu !== false)
    .map(route => convertRouteToMenuItem(route))
})

// 递归转换路由为菜单项
const convertRouteToMenuItem = (route: any): MenuItemData => {
  return {
    index: route.name as string,
    title: route.meta?.title as string || route.name as string,
    icon: route.meta?.icon,
    children: route.children?.length
      ? route.children
        .filter((child: any) => child.meta && child.meta.showInMenu !== false)
        .map((child: any) => convertRouteToMenuItem(child))
      : undefined
  }
}

// 标题响应当前路由
const title = computed(() => {
  const currentRoute = router.currentRoute.value
  return currentRoute.meta?.title as string || currentRoute.name as string || '首页'
})

// 处理菜单选择事件
const handleMenuSelect = (index: string) => {
  router.push({ name: index })
}
</script>

<style scoped>

/* 柔和返回按钮样式 */
.soft-back-button {
  background: linear-gradient(135deg, #a3bded, #6391cc);
  border: none;
  color: white;
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 500;
  box-shadow: 0 4px 6px rgba(99, 145, 204, 0.2);
  transition: all 0.3s ease;
  height: auto;
  display: flex;
  align-items: center;
}

.soft-back-button:hover {
  color: white;
  background: linear-gradient(135deg, #93acec, #527dbf);
  box-shadow: 0 6px 8px rgba(99, 145, 204, 0.3);
  transform: translateY(-2px);
}

.soft-back-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(99, 145, 204, 0.2);
}

.soft-back-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 145, 204, 0.3);
}

/* 隐藏默认图标间距调整 */
.soft-back-button .el-icon {
  margin-right: 6px;
}
.soft-main {
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
}

.layout-container {
  overflow: hidden;
  background: linear-gradient(135deg, #e6fffa, #f0fff4);
}
.soft-clear-menu {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(220, 220, 220, 0.5);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
  height: 100%;
  overflow: hidden;
}

.soft-clear-menu .el-menu-item,
.soft-clear-menu .el-sub-menu__title {
  background: transparent;
  color: #4a5568;
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.soft-clear-menu .el-menu-item:hover,
.soft-clear-menu .el-sub-menu__title:hover {
  background: rgba(74, 134, 232, 0.1);
  color: #2d3748;
  border: 1px solid rgba(74, 134, 232, 0.2);
}

.soft-clear-menu .el-menu-item.is-active,
.soft-clear-menu .el-sub-menu.is-active > .el-sub-menu__title {
  background: linear-gradient(to right, #4299e1, #63b3ed);
  color: white;
  border: 1px solid rgba(66, 153, 225, 0.3);
  box-shadow: 0 4px 6px rgba(66, 153, 225, 0.15);
}

.soft-header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(220, 220, 220, 0.5);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.soft-title {
  margin: 0;
  color: #2d3748;
  font-size: 1.4rem;
  font-weight: 500;
}

/* 圆润设计 */
.soft-clear-menu .el-menu-item,
.soft-clear-menu .el-sub-menu__title {
  border-radius: 10px;
}

/* 柔和阴影 */
.soft-clear-menu {
  box-shadow:
    0 1px 3px rgba(0,0,0,0.05),
    0 4px 6px rgba(0,0,0,0.05);
}

/* 柔和滚动条 */
.soft-clear-menu::-webkit-scrollbar {
  width: 6px;
}

.soft-clear-menu::-webkit-scrollbar-track {
  background: rgba(240, 240, 240, 0.5);
}

.soft-clear-menu::-webkit-scrollbar-thumb {
  background: rgba(200, 200, 200, 0.5);
  border-radius: 3px;
}

/* 柔和过渡动画 */
.soft-clear-menu .el-menu-item,
.soft-clear-menu .el-sub-menu__title {
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    transform 0.2s ease;
}

.soft-clear-menu .el-menu-item:hover,
.soft-clear-menu .el-sub-menu__title:hover {
  transform: translateX(4px);
}
</style>
