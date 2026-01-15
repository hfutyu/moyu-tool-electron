<template>
  <div>
    <el-input v-model="username" placeholder="请输入用户名"></el-input>
    <el-button @click="testApi">测试</el-button>
  </div>
</template>
<script lang="ts" setup>
import { test, test1 } from '@renderer/api/api'
import { ref } from 'vue'
const username = ref(1)
const testApi = () => {
  console.log(username.value)
  // test()
  test1({groupType: username.value})
}
</script>
