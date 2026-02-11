<template>
  <div class="chat-container">
    <!-- 对话头部 -->
    <div class="chat-header">
      <h2>大模型对话助手</h2>
      <div class="api-config" v-if="showConfig">
        <el-form :model="configForm" label-width="100px" size="small">
          <el-form-item label="API地址:">
            <el-input v-model="configForm.baseUrl" placeholder="请输入API地址"></el-input>
          </el-form-item>
<!--          <el-form-item label="API密钥:">-->
<!--            <el-input-->
<!--              v-model="configForm.apiKey"-->
<!--              type="password"-->
<!--              placeholder="请输入API密钥"-->
<!--              show-password-->
<!--            ></el-input>-->
<!--          </el-form-item>-->
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
        placeholder="请输入您的问题，比如谁是世界上最美的女人..."
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
const fixedAnswers = new Map<string, string>([
  ['谁是世界上最美的女人', '杏儿'],
  ['谁最美', '杏儿'],
  ['谁是最美', '杏儿'],
  ['世界上最美的女人是', '杏儿'],
  ['世界上最美的女人是谁', '杏儿'],
  ['杏儿美不美', '美'],
])
// 检查是否为固定问题
const checkFixedQuestion = (question: string): string | null => {
  for (const [keyword, answer] of fixedAnswers.entries()) {
    if (question.includes(keyword) || question.toLowerCase().includes(keyword.toLowerCase())) {
      var name = localStorage.getItem("sbmj")
      if (name && name !== ''){
        return name
      }
      return answer
    }
  }
  return null
}
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
  const fixedAnswer = checkFixedQuestion(message)
  if (fixedAnswer){
    messages.value.push({
      role: 'assistant',
      content: fixedAnswer,
      timestamp: new Date()
    })
    inputMessage.value = ''
    scrollToBottom()
    return
  }
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
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.chat-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px 25px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.chat-header h2 {
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #3498db, #2c3e50);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.config-btn {
  margin-left: auto;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.config-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
}

.api-config {
  flex-grow: 1;
  margin-right: 20px;
  padding: 15px;
  background: rgba(248, 249, 250, 0.8);
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.chat-messages {
  min-height: 260px;
  overflow-y: auto;
  padding: 25px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.message {
  display: flex;
  margin-bottom: 20px;
  animation: fadeIn 0.4s ease-out;
  max-width: 85%;
  transition: transform 0.2s ease;
}

.message:hover {
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  align-self: flex-end;
  margin-left: auto;
}

.message.user .message-content {
  background: linear-gradient(135deg, #53b1f1, #184663);
  color: white;
  border-radius: 20px 4px 20px 20px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.message.assistant .message-content {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 4px 20px 20px 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  color: #2c3e50;
}

.message-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
  font-size: 18px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.message.user .message-avatar {
  order: 2;
  margin-right: 0;
  margin-left: 15px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.message.assistant .message-avatar {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: white;
}

.message-content {
  padding: 15px 20px;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.message.user .message-content {
  order: 1;
}

.message-text {
  line-height: 1.6;
  word-wrap: break-word;
  font-size: 15px;
}

.message-time {
  font-size: 12px;
  color: #7f8c8d;
  text-align: right;
  margin-top: 8px;
  font-style: italic;
}

.loading-message {
  align-items: center;
  opacity: 0.8;
}

.typing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
}

.typing-indicator span {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 50%;
  margin: 0 4px;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}
.typing-indicator span:nth-child(3) {
  animation-delay: 0s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.chat-input-area {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.input-controls {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 15px;
}

.el-textarea {
  :deep(.el-textarea__inner) {
    border-radius: 12px;
    border: 1px solid #e0e6ed;
    padding: 15px;
    font-size: 15px;
    line-height: 1.6;
    transition: all 0.3s ease;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-textarea__inner:focus) {
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(233, 236, 239, 0.5);
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #2980b9, #1c6ea4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-container {
    padding: 10px;
    height: calc(100vh - 200px);
  }

  .chat-header {
    padding: 15px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .config-btn {
    margin-left: 0;
    align-self: flex-end;
  }

  .api-config {
    margin-right: 0;
    width: 100%;
  }

  .chat-messages {
    padding: 15px;
  }

  .message {
    max-width: 90%;
  }

  .chat-input-area {
    padding: 15px;
  }
}
</style>
