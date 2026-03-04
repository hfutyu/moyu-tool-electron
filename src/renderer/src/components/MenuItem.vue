<template>
  <el-menu-item v-if="!item.children || item.children.length === 0" :index="item.index">
    <el-icon v-if="item.icon" class="menu-icon">
      <component :is="item.icon" />
    </el-icon>
    <span>{{ item.title }}</span>
  </el-menu-item>
  <el-sub-menu v-else :index="item.index">
    <template #title>
      <el-icon v-if="item.icon" class="menu-icon">
        <component :is="item.icon" />
      </el-icon>
      <span>{{ item.title }}</span>
    </template>
    <menu-item
      v-for="child in item.children"
      :key="child.index"
      :item="child"
    />
  </el-sub-menu>
</template>

<script setup lang="ts">
import { ElSubMenu, ElMenuItem, ElIcon } from 'element-plus'

interface MenuItem {
  index: string
  title: string
  icon?: any
  children?: MenuItem[]
}

defineProps<{
  item: MenuItem
}>()
</script>

<style scoped>
.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  margin-right: 8px;
  flex-shrink: 0;
}
</style>
