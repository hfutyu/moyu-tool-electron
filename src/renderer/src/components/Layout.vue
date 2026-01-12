<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <el-menu
        :default-active="$route.name as string"
        class="el-menu-vertical-demo"
        :unique-opened="true"
        @select="handleMenuSelect"
      >
        <menu-item
          v-for="item in menuItems"
          :key="item.index"
          :item="item"
        />
      </el-menu>
    </el-aside>

    <el-container>
      <el-header>
        <h2>{{title}}</h2>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {computed, defineAsyncComponent} from "vue";

interface MenuItem {
  index: string
  title: string
  icon?: any
  children?: MenuItem[]
}

// 递归组件用于渲染菜单
const MenuItem = defineAsyncComponent(() => import('./MenuItem.vue'))

const router = useRouter()
// 从路由配置动态生成菜单项（支持多级）
const menuItems = computed<MenuItem[]>(() => {
  return router.options.routes
    .filter(route => route.meta && route.meta.showInMenu === true)
    .map(route => convertRouteToMenuItem(route))
})

// 递归转换路由为菜单项
const convertRouteToMenuItem = (route: any): MenuItem => {
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
  console.log(menuItems);
  console.log(index);
  router.push({ name: index })
}
</script>
<style>
.layout-container {
  height: 95vh
}
</style>
