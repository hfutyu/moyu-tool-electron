<template>
  <div class="api-test-tool">
    <div class="tool-header">
      <h2>🚀 API 调试</h2>
      <p class="tool-description">快速测试您的API接口，支持多种请求方法和自定义配置</p>
    </div>

    <!-- 基本配置区域 -->
    <div class="config-card">
      <div class="config-section">
        <div class="input-group">
          <label>请求方法</label>
          <el-select v-model="method" placeholder="选择请求方法" class="method-select">
            <el-option label="GET" value="GET"></el-option>
            <el-option label="POST" value="POST"></el-option>
            <el-option label="PUT" value="PUT"></el-option>
            <el-option label="DELETE" value="DELETE"></el-option>
            <el-option label="PATCH" value="PATCH"></el-option>
          </el-select>
        </div>

        <div class="input-group">
          <label>基础URL</label>
          <el-input
            v-model="baseUrl"
            placeholder="输入基础URL"
            class="url-input"
          ></el-input>
        </div>

        <div class="input-group">
          <label>接口路径</label>
          <el-input
            v-model="path"
            placeholder="输入接口路径，例如: /api/users"
            class="path-input"
          ></el-input>
        </div>
      </div>

      <div class="action-buttons">
        <el-button @click="sendRequest" type="primary" :loading="loading" size="large">
          <span v-if="!loading">📡 发送请求</span>
          <span v-else>⏳ 发送中...</span>
        </el-button>
        <el-button @click="clearAll" size="large">🗑️ 清空</el-button>
      </div>
    </div>



    <!-- 请求头配置区域 -->
    <div class="card">
      <div class="card-header">
        <h3>🏷️ 请求头配置</h3>
        <el-button @click="addHeader" size="small" type="success" plain>
          ➕ 添加请求头
        </el-button>
      </div>
      <div class="headers-container">
        <div
          v-for="(header, index) in headers"
          :key="index"
          class="header-item"
        >
          <el-input
            v-model="header.key"
            placeholder="键，如: Content-Type"
            class="header-key"
          ></el-input>
          <el-input
            v-model="header.value"
            placeholder="值，如: application/json"
            class="header-value"
          ></el-input>
          <el-button
            @click="removeHeader(index)"
            size="small"
            type="danger"
            plain
            class="remove-btn"
          >
            🗑️ 删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 请求数据区域 -->
    <div class="card">
      <div class="card-header">
        <h3>{{ isGetRequest ? '🔍 查询参数' : '📝 请求体数据' }}</h3>
        <el-checkbox v-model="isMultilineData" class="multiline-toggle">
          多行输入
        </el-checkbox>
      </div>
      <el-input
        v-model="requestData"
        :type="isMultilineData ? 'textarea' : 'text'"
        :rows="8"
        :placeholder="isGetRequest ? '输入查询参数(JSON格式)': '输入请求数据(JSON格式)'"
        class="data-input"
      />
    </div>

    <!-- 响应结果区域 -->
    <div v-if="response" class="result-card success">
      <div class="result-header">
        <h3>✅ 响应结果</h3>
        <div class="status-badge">
          <el-tag :type="getStatusTagType(response.status)" size="large">
            状态码: {{ response.status }}
          </el-tag>
        </div>
      </div>
      <div class="response-details">
        <div class="response-meta">
          <p><strong>状态文本:</strong> {{ response.statusText }}</p>
          <p><strong>响应时间:</strong> {{ new Date().toLocaleString() }}</p>
        </div>
        <div class="response-body">
          <pre class="response-content">{{ formatResponse(response.data) }}</pre>
        </div>
      </div>
    </div>

    <!-- 错误信息区域 -->
    <div v-if="error" class="result-card error">
      <div class="result-header">
        <h3>❌ 错误信息</h3>
      </div>
      <div class="error-content">
        <pre>{{ error }}</pre>
      </div>
    </div>

    <!-- 请求历史侧边栏 -->
    <div class="card">
      <div class="history-header">
        <h3>📋 请求历史</h3>
        <el-button @click="clearHistory" size="small" type="danger" plain>清空历史</el-button>
      </div>
      <div class="history-list">
        <div
          v-for="(item, index) in requestHistory"
          :key="index"
          class="history-item"
          @click="restoreRequest(item)"
        >
          <div class="history-summary">
            <span class="method-tag" :class="getMethodClass(item.method)">{{ item.method }}</span>
            <span class="history-url">{{ item.baseUrl }}{{ item.path }}</span>
          </div>
          <div class="history-time">{{ formatDate(item.timestamp) }}</div>
        </div>
        <div v-if="requestHistory.length === 0" class="no-history">
          暂无历史记录
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { callApi } from '@renderer/api/api'

// 基础URL和路径
// const baseUrl = ref('https://ebike.ievcloud.com/admin-api')
const baseUrl = ref('https://127.0.0.1:6666')
// const path = ref('/ep/overview/day/getBatteryMileageStats?groupType=1')
const path = ref('/ep/overview/day/getBatteryMileageStats?groupType=1')

// 请求方法
const method = ref('GET')

// 请求头
const headers = ref([
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Authorization', value: 'Bearer 299d8d6ed59c42a3a2ebd0bd283b9722' },
])

// 请求数据
const requestData = ref('')
const isMultilineData = ref(true)

// 响应和错误
const response = ref<any>(null)
const error = ref<string | null>(null)
const loading = ref(false)

// 请求历史
const requestHistory = ref<any[]>([])

// 计算属性判断是否是GET请求
const isGetRequest = computed(() => {
  return ['GET', 'DELETE'].includes(method.value.toUpperCase())
})

// 添加请求头
const addHeader = () => {
  headers.value.push({ key: '', value: '' })
}

// 删除请求头
const removeHeader = (index: number) => {
  headers.value.splice(index, 1)
}

// 发送请求
const sendRequest = async () => {
  loading.value = true
  response.value = null
  error.value = null

  try {
    // 解析请求数据
    let parsedData: any = null
    if (requestData.value.trim()) {
      try {
        parsedData = JSON.parse(requestData.value)
      } catch (e) {
        // 如果不是JSON格式，则作为字符串发送
        parsedData = requestData.value
      }
    }

    // 构建完整URL
    const fullUrl = path.value.startsWith('/') ? `${baseUrl.value}${path.value}` : `${baseUrl.value}/${path.value}`

    // 构建请求头对象
    const headersObj: Record<string, string> = {}
    headers.value.forEach(header => {
      if (header.key && header.value) {
        headersObj[header.key] = header.value
      }
    })

    // 发送请求
    let result
    if (isGetRequest.value) {
      // GET请求使用params
      result = await callApi(method.value, fullUrl, undefined, headersObj, parsedData)
    } else {
      // POST/PUT/PATCH请求使用data
      result = await callApi(method.value, fullUrl, parsedData, headersObj)
    }

    // 保存到历史记录
    saveToHistory()

    response.value = {
      status: result.status || 200,
      statusText: result.statusText || 'OK',
      data: result.data || result
    }
  } catch (err: any) {
    console.error('API请求失败:', err)
    error.value = err.message || JSON.stringify(err)
  } finally {
    loading.value = false
  }
}

// 保存到历史记录
const saveToHistory = () => {
  const historyItem = {
    method: method.value,
    baseUrl: baseUrl.value,
    path: path.value,
    headers: [...headers.value],
    requestData: requestData.value,
    timestamp: new Date().toISOString()
  }

  // 添加到历史记录开头
  requestHistory.value.unshift(historyItem)

  // 限制历史记录数量为20条
  if (requestHistory.value.length > 20) {
    requestHistory.value.pop()
  }

  // 保存到本地存储
  localStorage.setItem('apiTestHistory', JSON.stringify(requestHistory.value))
}

// 恢复请求配置
const restoreRequest = (item: any) => {
  method.value = item.method
  baseUrl.value = item.baseUrl
  path.value = item.path
  headers.value = [...item.headers]
  requestData.value = item.requestData
  isMultilineData.value = true

}

// 清空历史记录
const clearHistory = () => {
  requestHistory.value = []
  localStorage.removeItem('apiTestHistory')
}

// 格式化响应数据
const formatResponse = (data: any) => {
  if (typeof data === 'object') {
    return JSON.stringify(data, null, 2)
  }
  return data
}

// 获取状态标签类型
const getStatusTagType = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}

// 清空所有内容
const clearAll = () => {
  path.value = '/ep/overview/day/getBatteryMileageStats?groupType=1'
  requestData.value = ''
  response.value = null
  error.value = null
  headers.value = [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Authorization', value: 'Bearer 299d8d6ed59c42a3a2ebd0bd283b9722' },
  ]
}

// 获取方法标签类
const getMethodClass = (method: string) => {
  return `method-${method.toLowerCase()}`
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 组件挂载时加载历史记录
if (localStorage.getItem('apiTestHistory')) {
  try {
    requestHistory.value = JSON.parse(localStorage.getItem('apiTestHistory') || '[]')
  } catch (e) {
    console.error('加载历史记录失败:', e)
  }
}
</script>

<style scoped>
.api-test-tool {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
}

.tool-header {
  text-align: center;
  margin-bottom: 32px;
  grid-column: 1 / -1;
}

.tool-header h2 {
  color: #1f2d3d;
  font-size: 28px;
  margin-bottom: 8px;
  font-weight: 600;
}

.tool-description {
  color: #606266;
  font-size: 16px;
}

.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  grid-column: 1 / -1;
}

.config-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.method-select {
  width: 100%;
}

.url-input, .path-input {
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.headers-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-item {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 12px;
  align-items: center;
}

.header-key, .header-value {
  margin: 0 !important;
}

.remove-btn {
  height: 40px;
  margin: 0 !important;
}

.multiline-toggle {
  margin: 0;
}

.data-input {
  width: 100%;
}

.result-card {
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  animation: slideIn 0.3s ease-out;
  grid-column: 1 / -1;
}

.result-card.success {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 1px solid #b3d8ff;
}

.result-card.error {
  background: linear-gradient(135deg, #fef0f0 0%, #fdf6ec 100%);
  border: 1px solid #fcd3cf;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.status-badge {
  display: flex;
  align-items: center;
}

.response-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.response-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.response-meta p {
  margin: 0;
  color: #606266;
}

.response-body {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.response-content {
  margin: 0;
  padding: 16px;
  background: #2d2d2d;
  color: #f8f8f2;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-content {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.history-sidebar {
  position: sticky;
  top: 24px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: fit-content;
  width: 350px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.history-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.history-list {
  max-height: 500px;
  overflow-y: auto;
}

.history-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.history-item:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.history-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.method-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.method-get {
  background-color: #67c23a;
}

.method-post {
  background-color: #409eff;
}

.method-put {
  background-color: #e6a23c;
}

.method-delete {
  background-color: #f56c6c;
}

.method-patch {
  background-color: #909399;
}

.history-url {
  font-size: 13px;
  color: #606266;
  word-break: break-all;
}

.history-time {
  font-size: 12px;
  color: #909399;
}

.no-history {
  text-align: center;
  color: #909399;
  padding: 20px;
  font-style: italic;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .api-test-tool {
    grid-template-columns: 1fr;
  }

  .history-sidebar {
    width: 100%;
    order: -1;
  }
}

@media (max-width: 768px) {
  .api-test-tool {
    padding: 16px;
  }

  .config-section {
    grid-template-columns: 1fr;
  }

  .header-item {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }

  .remove-btn {
    grid-column: span 2;
    justify-self: end;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .status-badge {
    align-self: flex-start;
  }

  .history-sidebar {
    width: 100%;
  }
}
</style>
