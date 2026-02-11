<template>
  <div class="cyber-pet">
    <!-- 背景动画 -->
    <div class="cyber-bg">
      <div class="grid-lines"></div>
      <div class="particle-bg"></div>
    </div>

    <!-- 主容器 -->
    <div class="container">
      <!-- 标题 -->
      <div class="title-section">
        <h1 class="cyber-title">CYBER PET</h1>
        <div class="title-sub">赛博宠物小猫咪</div>
      </div>

      <!-- 宠物显示区 -->
      <div class="pet-section">
        <div class="pet-container">
          <div class="pet-avatar" :class="{ sleeping: isSleeping, eating: isEating, playing: isPlaying }">
            <!-- 猫咪身体 -->
            <div class="cat-body">
              <!-- 猫头 -->
              <div class="cat-head">
                <!-- 耳朵 -->
                <div class="cat-ear left"></div>
                <div class="cat-ear right"></div>
                <!-- 脸 -->
                <div class="cat-face">
                  <!-- 眼睛 -->
                  <div class="cat-eyes">
                    <div class="eye left" :class="{ closed: isSleeping }">
                      <div class="pupil"></div>
                    </div>
                    <div class="eye right" :class="{ closed: isSleeping }">
                      <div class="pupil"></div>
                    </div>
                  </div>
                  <!-- 鼻子和嘴巴 -->
                  <div class="cat-nose"></div>
                  <div class="cat-mouth"></div>
                  <!-- 胡须 -->
                  <div class="whiskers">
                    <div class="whisker left-1"></div>
                    <div class="whisker left-2"></div>
                    <div class="whisker right-1"></div>
                    <div class="whisker right-2"></div>
                  </div>
                </div>
              </div>
              <!-- 身体 -->
              <div class="cat-torso"></div>
              <!-- 尾巴 -->
              <div class="cat-tail" :class="{ wagging: isPlaying }"></div>
            </div>
          </div>

          <!-- 宠物名字输入 -->
          <div class="pet-name-input">
            <el-input
              v-model="petName"
              placeholder="给小猫咪起个名字"
              class="cyber-input"
            />
          </div>
        </div>
      </div>

      <!-- 状态显示区 -->
      <div class="status-section">
        <div class="status-grid">
          <div class="status-item">
            <el-icon class="status-icon"><Coffee /></el-icon>
            <span class="status-label">饱食度</span>
            <el-progress
              :percentage="hunger"
              :color="getBarColor(hunger)"
              :stroke-width="12"
              class="status-bar"
            />
          </div>
          <div class="status-item">
            <el-icon class="status-icon"><Star /></el-icon>
            <span class="status-label">心情</span>
            <el-progress
              :percentage="mood"
              :color="getBarColor(mood)"
              :stroke-width="12"
              class="status-bar"
            />
          </div>
          <div class="status-item">
            <el-icon class="status-icon"><Lollipop /></el-icon>
            <span class="status-label">健康度</span>
            <el-progress
              :percentage="health"
              :color="getBarColor(health)"
              :stroke-width="12"
              class="status-bar"
            />
          </div>
          <div class="status-item">
            <el-icon class="status-icon"><Moon /></el-icon>
            <span class="status-label">能量</span>
            <el-progress
              :percentage="energy"
              :color="getBarColor(energy)"
              :stroke-width="12"
              class="status-bar"
            />
          </div>
        </div>
      </div>

      <!-- 互动按钮区 -->
      <div class="action-section">
        <div class="action-grid">
          <el-button
            type="warning"
            size="large"
            class="cyber-btn"
            @click="handleFeed"
            :disabled="isSleeping || isEating"
          >
            <el-icon class="btn-icon"><Coffee /></el-icon>
            喂食
          </el-button>

          <el-button
            type="primary"
            size="large"
            class="cyber-btn"
            @click="handlePlay"
            :disabled="isSleeping || energy < 20"
          >
            <el-icon class="btn-icon"><Star /></el-icon>
            玩耍
          </el-button>

          <el-button
            type="info"
            size="large"
            class="cyber-btn"
            @click="handleSleep"
            :disabled="energy > 80 || isPlaying"
          >
            <el-icon class="btn-icon"><Moon /></el-icon>
            睡觉
          </el-button>

          <el-button
            type="success"
            size="large"
            class="cyber-btn"
            @click="handleClean"
            :disabled="isSleeping || isPlaying"
          >
            <el-icon class="btn-icon"><Document /></el-icon>
            洗澡
          </el-button>

          <el-button
            type="danger"
            size="large"
            class="cyber-btn"
            @click="handlePet"
            :disabled="isSleeping"
          >
            <el-icon class="btn-icon"><Lollipop /></el-icon>
            抚摸
          </el-button>

          <el-button
            size="large"
            class="cyber-btn"
            @click="handleRecord"
          >
            <el-icon class="btn-icon"><List /></el-icon>
            记录
          </el-button>
        </div>
      </div>

      <!-- 状态提示 -->
      <div class="message-section" v-if="message">
        <div class="message-text">{{ message }}</div>
      </div>
    </div>

    <!-- 记录对话框 -->
    <el-dialog
      v-model="recordDialogVisible"
      title="宠物记录"
      width="600px"
      class="cyber-dialog"
    >
      <el-table :data="records" class="cyber-table">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="detail" label="详情" />
      </el-table>
      <template #footer>
        <el-button @click="recordDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="clearRecords">清空记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Coffee,
  Star,
  Moon,
  Document,
  Lollipop,
  List
} from '@element-plus/icons-vue'

// 宠物名字
const petName = ref('')

// 宠物状态
const hunger = ref(80)
const mood = ref(80)
const health = ref(100)
const energy = ref(100)

// 宠物状态标志
const isSleeping = ref(false)
const isEating = ref(false)
const isPlaying = ref(false)

// 消息提示
const message = ref('')

// 记录
const records = ref<Array<{ time: string, action: string, detail: string }>>([])
const recordDialogVisible = ref(false)

// 定时器
let statusInterval: number | null = null

// 获取进度条颜色
const getBarColor = (value: number) => {
  if (value >= 80) return '#27ae60'
  if (value >= 50) return '#f39c12'
  return '#e74c3c'
}

// 显示消息
const showMessage = (msg: string) => {
  message.value = msg
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// 添加记录
const addRecord = (action: string, detail: string) => {
  const now = new Date()
  const time = now.toLocaleString('zh-CN')
  records.value.unshift({ time, action, detail })
  if (records.value.length > 100) {
    records.value = records.value.slice(0, 100)
  }
}

// 喂食
const handleFeed = async () => {
  if (!petName.value) {
    ElMessage.warning('先给小猫咪起个名字吧')
    return
  }

  isEating.value = true
  hunger.value = Math.min(100, hunger.value + 20)
  mood.value = Math.min(100, mood.value + 5)
  showMessage(`${petName.value}正在享受美食...`)

  setTimeout(() => {
    isEating.value = false
    showMessage(`${petName.value}吃饱了！`)
    addRecord('喂食', '饱食度+20')
  }, 2000)
}

// 玩耍
const handlePlay = async () => {
  if (!petName.value) {
    ElMessage.warning('先给小猫咪起个名字吧')
    return
  }

  isPlaying.value = true
  mood.value = Math.min(100, mood.value + 25)
  energy.value = Math.max(0, energy.value - 15)
  hunger.value = Math.max(0, hunger.value - 10)
  showMessage(`${petName.value}开心地玩耍中...`)

  setTimeout(() => {
    isPlaying.value = false
    showMessage(`${petName.value}玩累了！`)
    addRecord('玩耍', '心情+25，能量-15')
  }, 3000)
}

// 睡觉
const handleSleep = async () => {
  if (!petName.value) {
    ElMessage.warning('先给小猫咪起个名字吧')
    return
  }

  isSleeping.value = true
  showMessage(`${petName.value}睡着了...`)

  // 睡眠恢复能量
  const sleepInterval = setInterval(() => {
    if (!isSleeping.value) {
      clearInterval(sleepInterval)
      return
    }
    energy.value = Math.min(100, energy.value + 5)
    health.value = Math.min(100, health.value + 2)
  }, 1000)

  // 10秒后醒来
  setTimeout(() => {
    isSleeping.value = false
    clearInterval(sleepInterval)
    showMessage(`${petName.value}睡醒了！精神焕发！`)
    addRecord('睡觉', '能量恢复')
  }, 10000)
}

// 洗澡
const handleClean = async () => {
  if (!petName.value) {
    ElMessage.warning('先给小猫咪起个名字吧')
    return
  }

  showMessage(`${petName.value}正在洗澡...`)

  setTimeout(() => {
    health.value = Math.min(100, health.value + 10)
    mood.value = Math.min(100, mood.value + 5)
    showMessage(`${petName.value}变得干干净净！`)
    addRecord('洗澡', '健康度+10，心情+5')
  }, 2000)
}

// 抚摸
const handlePet = () => {
  if (!petName.value) {
    ElMessage.warning('先给小猫咪起个名字吧')
    return
  }

  mood.value = Math.min(100, mood.value + 10)
  health.value = Math.min(100, health.value + 3)
  showMessage(`${petName.value}很享受你的抚摸！喵~`)
  addRecord('抚摸', '心情+10，健康度+3')
}

// 查看记录
const handleRecord = () => {
  recordDialogVisible.value = true
}

// 清空记录
const clearRecords = () => {
  records.value = []
  ElMessage.success('记录已清空')
}

// 状态自然衰减
const startStatusDecay = () => {
  statusInterval = window.setInterval(() => {
    if (!isSleeping.value) {
      hunger.value = Math.max(0, hunger.value - 1)
      energy.value = Math.max(0, energy.value - 0.5)
    }
    mood.value = Math.max(0, mood.value - 0.5)
  }, 5000)
}

// 状态警告检查
const checkStatusWarning = () => {
  if (!isSleeping.value) {
    if (hunger.value < 20) {
      showMessage(`${petName.value || '小猫咪'}肚子饿了！`)
    }
    if (energy.value < 20) {
      showMessage(`${petName.value || '小猫咪'}累了，需要休息！`)
    }
  }
  if (health.value < 30) {
    showMessage(`${petName.value || '小猫咪'}需要照顾！`)
  }
}

// 组件挂载
onMounted(() => {
  startStatusDecay()
  window.setInterval(checkStatusWarning, 15000)
})

// 组件卸载
onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style scoped>
.cyber-pet {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #3d5a6c 100%);
  padding: 20px;
}

/* 背景动画 */
.cyber-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.grid-lines {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(150, 180, 200, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(150, 180, 200, 0.05) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridMove 30s linear infinite;
}

@keyframes gridMove {
  0% { transform: perspective(500px) rotateX(50deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(50deg) translateY(60px); }
}

.particle-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, rgba(150, 180, 200, 0.05) 0%, transparent 60%);
}

/* 主容器 */
.container {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
}

/* 标题区域 */
.title-section {
  text-align: center;
  margin-bottom: 30px;
}

.cyber-title {
  font-size: 42px;
  font-weight: bold;
  color: #7f8c8d;
  margin-bottom: 10px;
  letter-spacing: 3px;
}

.title-sub {
  color: #95a5a6;
  font-size: 15px;
  letter-spacing: 2px;
}

/* 宠物显示区 */
.pet-section {
  margin-bottom: 30px;
}

.pet-container {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(127, 140, 141, 0.4);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.pet-avatar {
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
  position: relative;
  animation: catBreathe 3s ease-in-out infinite;
}

@keyframes catBreathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.pet-avatar.sleeping {
  animation: catSleep 2s ease-in-out infinite;
}

@keyframes catSleep {
  0%, 100% { transform: scale(1) rotate(-1deg); }
  50% { transform: scale(1.01) rotate(1deg); }
}

.pet-avatar.playing {
  animation: catPlay 0.3s ease-in-out infinite;
}

@keyframes catPlay {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 猫咪样式 */
.cat-body {
  position: relative;
  width: 100%;
  height: 100%;
}

.cat-head {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 90px;
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  border-radius: 50% 50% 45% 45%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.cat-ear {
  position: absolute;
  top: -15px;
  width: 0;
  height: 0;
  border-left: 18px solid transparent;
  border-right: 18px solid transparent;
  border-bottom: 30px solid #7f8c8d;
}

.cat-ear.left {
  left: 8px;
  transform: rotate(-15deg);
}

.cat-ear.right {
  right: 8px;
  transform: rotate(15deg);
}

.cat-face {
  position: relative;
  width: 100%;
  height: 100%;
}

.cat-eyes {
  position: absolute;
  top: 35px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 25px;
}

.eye {
  width: 16px;
  height: 20px;
  background: #34495e;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
}

.eye.closed {
  height: 4px;
  border-radius: 2px;
  background: #34495e;
}

.pupil {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 12px;
  background: #2c3e50;
  border-radius: 50%;
}

.cat-nose {
  position: absolute;
  top: 58px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 8px;
  background: #e74c3c;
  border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
}

.cat-mouth {
  position: absolute;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 8px;
  border: 2px solid #34495e;
  border-top: none;
  border-radius: 0 0 50% 50%;
}

.whiskers {
  position: absolute;
  top: 55px;
  width: 100%;
}

.whisker {
  position: absolute;
  width: 35px;
  height: 2px;
  background: rgba(52, 73, 94, 0.6);
  border-radius: 1px;
}

.whisker.left-1 {
  left: 5px;
  transform: rotate(-10deg);
}

.whisker.left-2 {
  left: 3px;
  top: 8px;
  transform: rotate(-20deg);
}

.whisker.right-1 {
  right: 5px;
  transform: rotate(10deg);
}

.whisker.right-2 {
  right: 3px;
  top: 8px;
  transform: rotate(20deg);
}

.cat-torso {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 50px;
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  border-radius: 40% 40% 50% 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.cat-tail {
  position: absolute;
  bottom: 30px;
  right: 10px;
  width: 8px;
  height: 60px;
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  border-radius: 4px;
  transform-origin: bottom center;
  transform: rotate(30deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.cat-tail.wagging {
  animation: tailWag 0.5s ease-in-out infinite;
}

@keyframes tailWag {
  0%, 100% { transform: rotate(30deg); }
  50% { transform: rotate(-10deg); }
}

/* 宠物名字输入 */
.pet-name-input {
  max-width: 300px;
  margin: 0 auto;
}

.cyber-input :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(127, 140, 141, 0.4) !important;
  color: #7f8c8d !important;
  text-align: center;
  font-size: 16px;
}

.cyber-input :deep(.el-input__inner)::placeholder {
  color: rgba(127, 140, 141, 0.5);
}

/* 状态显示区 */
.status-section {
  margin-bottom: 30px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.status-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(127, 140, 141, 0.3);
  border-radius: 12px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.status-icon {
  font-size: 24px;
  color: #7f8c8d;
}

.status-label {
  font-size: 14px;
  color: #95a5a6;
}

.status-bar {
  width: 100%;
}

.status-bar :deep(.el-progress-bar__outer) {
  background: rgba(255, 255, 255, 0.1);
}

/* 互动按钮区 */
.action-section {
  margin-bottom: 30px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.cyber-btn {
  height: 70px;
  font-size: 16px;
  font-weight: bold;
  border: 2px solid;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cyber-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.cyber-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 20px;
  margin-right: 5px;
}

/* 消息提示 */
.message-section {
  text-align: center;
  margin-bottom: 20px;
}

.message-text {
  display: inline-block;
  background: linear-gradient(135deg, rgba(127, 140, 141, 0.2), rgba(149, 165, 166, 0.2));
  border: 2px solid rgba(127, 140, 141, 0.4);
  padding: 12px 25px;
  border-radius: 10px;
  color: #7f8c8d;
  font-size: 18px;
  font-weight: bold;
  animation: messageAppear 0.3s ease;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 对话框 */
.cyber-dialog :deep(.el-dialog) {
  background: rgba(44, 62, 80, 0.95) !important;
  border: 2px solid rgba(127, 140, 141, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.cyber-dialog :deep(.el-dialog__title) {
  color: #7f8c8d !important;
}

.cyber-dialog :deep(.el-dialog__body) {
  color: #ecf0f1;
}

.cyber-dialog :deep(.el-table) {
  background: transparent !important;
}

.cyber-dialog :deep(.el-table tr) {
  background: transparent !important;
}

.cyber-dialog :deep(.el-table td, .el-table th) {
  border-color: rgba(127, 140, 141, 0.3) !important;
  color: #ecf0f1 !important;
}

.cyber-dialog :deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background: rgba(127, 140, 141, 0.1) !important;
}

/* 响应式 */
@media (max-width: 768px) {
  .status-grid {
    grid-template-columns: 1fr;
  }

  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .cyber-title {
    font-size: 32px;
  }
}
</style>
