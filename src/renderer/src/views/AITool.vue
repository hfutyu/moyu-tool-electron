<template>
  <div class="chat-container">
    <!-- 对话头部 -->
    <div class="chat-header">
      <h2>AI 对话助手</h2>
      <div class="api-config" v-if="showConfig">
        <el-form :model="configForm" label-width="100px" size="small">
          <el-form-item label="API地址:">
            <el-input v-model="configForm.baseUrl" placeholder="请输入API地址"></el-input>
          </el-form-item>
          <el-form-item label="API密钥:">
            <el-input
              v-model="configForm.apiKey"
              type="password"
              placeholder="请输入API密钥"
              show-password
            ></el-input>
          </el-form-item>
          <el-form-item label="模型名称:">
            <el-input v-model="configForm.model" placeholder="请输入模型名称"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <el-button
        type="primary"
        size="small"
        @click="toggleConfig"
        class="config-btn"
      >
        {{ showConfig ? '隐藏配置' : '显示配置' }}
      </el-button>
    </div>

    <!-- 消息显示区域 -->
    <div class="chat-messages" ref="messagesContainerRef">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.role]"
      >
        <div class="message-avatar">
          <i v-if="message.role === 'user'" class="el-icon-user"></i>
          <i v-else class="el-icon-chat-line-round"></i>
        </div>
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-message message assistant">
        <div class="message-avatar">
          <i class="el-icon-chat-line-round"></i>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-area">
      <el-input
        v-model="inputMessage"
        :rows="3"
        type="textarea"
        placeholder="请输入您的问题..."
        maxlength="1000"
        show-word-limit
        @keyup.enter="sendIfNotShift($event)"
        :disabled="isLoading"
      />
      <div class="input-controls">
        <el-button
          type="primary"
          @click="sendMessage"
          :loading="isLoading"
          :disabled="!inputMessage.trim() || isLoading"
        >
          发送
        </el-button>
        <el-button @click="clearChat">清空对话</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { callApi } from '@renderer/api/api'

// 配置相关
const showConfig = ref(false)
const configForm = reactive({
  baseUrl: ref('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'),
  apiKey: ref('sk-477ce61396ae463bb57fbc0858ee1f51'),
  model: ref('qwen-plus')
})

// 消息相关
const messages = ref([
  {
    role: 'assistant',
    content: '您好！我是AI助手，有什么可以帮助您的吗？',
    timestamp: new Date()
  }
])
const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainerRef = ref<HTMLElement | null>(null)

// 切换配置面板显示
const toggleConfig = () => {
  showConfig.value = !showConfig.value
}

// 发送消息
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message) return

  // 添加用户消息到对话
  messages.value.push({
    role: 'user',
    content: message,
    timestamp: new Date()
  })

  // 清空输入框
  inputMessage.value = ''

  // 显示加载状态
  isLoading.value = true

  try {
    // 准备API请求数据
    const requestData = {
      model: configForm.model,
      messages: messages.value.filter(msg => msg.role !== 'assistant' || msg.content !== '您好！我是AI助手，有什么可以帮助您的吗？').map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }

    // 调用API获取响应
    const response = await callApi(
      'POST',
      configForm.baseUrl,
      requestData,
      { 'Authorization': `Bearer ${configForm.apiKey}` },
      undefined
    ) as any

    // 解析并添加AI响应
    if (response.choices && response.choices.length > 0) {
      const aiResponse = response.choices[0].message.content

      messages.value.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      })
    }
  } catch (error) {
    console.error('API调用失败:', error)
    messages.value.push({
      role: 'assistant',
      content: '抱歉，我在处理您的请求时遇到了问题。请稍后再试。',
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
    // 自动滚动到底部
    scrollToBottom()
  }
}

// 处理回车键发送
const sendIfNotShift = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 清空聊天记录
const clearChat = () => {
  messages.value = [
    {
      role: 'assistant',
      content: '您好！我是AI助手，有什么可以帮助您的吗？',
      timestamp: new Date()
    }
  ]
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
  }
}

// 组件挂载后自动滚动到底部
onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f7fa;
}

.chat-header {
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-header h2 {
  margin: 0;
  color: #333;
}

.config-btn {
  margin-left: auto;
}

.api-config {
  flex-grow: 1;
  margin-right: 20px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.message {
  display: flex;
  margin-bottom: 15px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  align-self: flex-end;
}

.message.user .message-content {
  background-color: #409eff;
  color: white;
  border-radius: 18px 4px 18px 18px;
}

.message.assistant .message-content {
  background-color: #f0f2f5;
  border-radius: 4px 18px 18px 18px;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e6f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
}

.message.user .message-avatar {
  order: 2;
  margin-right: 0;
  margin-left: 10px;
  background-color: #ecf5ff;
}

.message-content {
  max-width: 70%;
  padding: 10px 15px;
  position: relative;
}

.message.user .message-content {
  order: 1;
}

.message-text {
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-top: 5px;
}

.loading-message {
  align-items: center;
}

.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #999;
  border-radius: 50%;
  margin: 0 2px;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.6; }
  40% { transform: scale(1.2); opacity: 1; }
}

.chat-input-area {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.input-controls {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.el-textarea {
  :deep(.el-textarea__inner) {
    border-radius: 8px;
  }
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
