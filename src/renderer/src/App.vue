<template>
  <el-container direction="vertical" class="app-container">
    <TitleBar/>
    <Layout/>
  </el-container>
</template>

<script setup lang="ts">
import Layout from './components/Layout.vue'
import TitleBar from '@renderer/components/TitleBar.vue'
</script>
<style>
body {
  margin: 0;
}

.app-container {
  height: 100vh;
  overflow: hidden;
  border-radius: 30px;
}
</style>
