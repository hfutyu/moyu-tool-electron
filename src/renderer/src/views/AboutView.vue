<template>
  <div class="about-container">
    <el-card class="about-card">
      <template #header>
        <div class="card-header">
          <h1>关于此应用</h1>
        </div>
      </template>

      <div class="app-info">
        <div class="logo-section">
          <el-avatar :size="100" shape="square" class="app-logo">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIxIiB5PSIxIiB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHJ4PSI1IiByeT0iNSI+PC9yZWN0PjxwYXRoIGQ9Ik0xNiAxNUwyMCAxMSAxNiA3Ij48L3BhdGg+PHBhdGggZD0iTTEyIDE1TDggMTFMMTIgNyI+PC9wYXRoPjwvc3ZnPg==" alt="App Logo">
          </el-avatar>
          <h2>{{ appInfo.name }}</h2>
        </div>

        <div class="info-section">
          <h3>应用信息</h3>
          <ul class="info-list">
            <li><strong>版本:</strong> <span>{{ appInfo.version }}</span></li>
            <li><strong>构建日期:</strong> <span>{{ appInfo.buildDate }}</span></li>
            <li><strong>作者:</strong> <span>{{ appInfo.author }}</span></li>
            <li><strong>框架:</strong> <span>{{ appInfo.framework }}</span></li>
          </ul>
        </div>

        <div class="description-section">
          <h3>应用简介</h3>
          <p>{{ appInfo.description }}</p>
        </div>

        <div class="tech-stack">
          <h3>技术栈</h3>
          <div class="tech-tags">
            <el-tag v-for="tech in appInfo.techStack" :key="tech" type="info" size="large" class="tech-tag">
              {{ tech }}
            </el-tag>
          </div>
        </div>

        <div class="links-section">
          <h3>相关链接</h3>
          <div class="links">
            <el-link :href="link.url" target="_blank" v-for="link in appInfo.links" :key="link.name" class="link-item">
              <i :class="link.icon"></i> {{ link.name }}
            </el-link>
          </div>
        </div>

        <div class="license-section">
          <h3>许可证</h3>
          <p>{{ appInfo.license }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

// 应用信息数据
const appInfo = reactive({
  name: 'Electron-Vue 应用模板',
  version: '1.0.0',
  buildDate: new Date().toLocaleDateString('zh-CN'),
  author: 'Your Name',
  framework: 'Vue 3 + TypeScript + Electron + Element Plus',
  description: '这是一个基于 Electron 和 Vue 3 的桌面应用程序模板。它集成了现代前端开发工具链，提供了开箱即用的开发体验。模板包含了基本的路由、状态管理和 UI 组件，适合快速开发跨平台桌面应用。',
  techStack: [
    'Vue 3',
    'TypeScript',
    'Electron',
    'Element Plus',
    'Vite',
    'Pinia'
  ],
  license: 'MIT License',
  links: [
    {
      name: 'GitHub 仓库',
      url: 'https://github.com/your-username/your-repo-name',
      icon: 'el-icon el-icon-link'
    },
    {
      name: '文档',
      url: 'https://your-docs-url.com',
      icon: 'el-icon el-icon-document'
    },
    {
      name: '反馈问题',
      url: 'https://github.com/your-username/your-repo-name/issues',
      icon: 'el-icon el-icon-warning'
    }
  ]
})
</script>

<style scoped>
.about-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.about-card {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-header h1 {
  margin: 0;
  color: #409EFF;
}

.app-info {
  padding: 20px 0;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-section h2 {
  margin-top: 15px;
  color: #303133;
}

.info-section,
.description-section,
.tech-stack,
.links-section,
.license-section {
  margin-bottom: 25px;
}

.info-section h3,
.description-section h3,
.tech-stack h3,
.links-section h3,
.license-section h3 {
  color: #303133;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 8px;
  margin-bottom: 15px;
}

.info-list {
  list-style: none;
  padding: 0;
}

.info-list li {
  padding: 8px 0;
  border-bottom: 1px dashed #EBEEF5;
  display: flex;
  justify-content: space-between;
}

.info-list li:last-child {
  border-bottom: none;
}

.info-list strong {
  width: 100px;
  display: inline-block;
  color: #606266;
}

.description-section p {
  line-height: 1.8;
  color: #606266;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tech-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-item {
  padding: 8px 12px;
  border-radius: 4px;
  text-decoration: none;
  color: #606266;
  transition: all 0.3s;
  border: 1px solid #DCDFE6;
}

.link-item:hover {
  background-color: #ECF5FF;
  border-color: #B3D8FF;
  color: #409EFF;
}

.license-section p {
  background-color: #F4F4F5;
  padding: 15px;
  border-radius: 4px;
  color: #909399;
  font-family: monospace;
}
</style>
