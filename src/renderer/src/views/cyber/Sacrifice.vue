<template>
  <div class="cyber-sacrifice">
    <!-- 背景动画 -->
    <div class="cyber-bg">
      <div class="grid-lines"></div>
      <div class="neon-glow"></div>
    </div>

    <!-- 主容器 -->
    <div class="container">
      <!-- 标题 -->
      <div class="title-section">
        <h1 class="cyber-title">CYBER MEMORIAL</h1>
        <div class="title-sub">赛博祭祖系统 v1.1</div>
      </div>

      <!-- 祭台区域 -->
      <div class="altar-section">
        <div class="altar-frame">
          <div class="ancestor-display">
            <div class="ancestor-avatar">
              <el-icon :size="80"><User /></el-icon>
            </div>
            <div class="ancestor-name">
              <el-input
                v-model="ancestorName"
                placeholder="输入祖先姓名"
                class="cyber-input"
              />
            </div>
          </div>

          <!-- 贡品展示区 -->
          <div class="offerings-display">
            <div class="offering-item" v-for="(item, index) in offerings" :key="index">
              <el-icon :size="40" :color="item.color">
                <component :is="item.icon" />
              </el-icon>
              <div class="offering-count">{{ item.count }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能按钮区 -->
      <div class="action-section">
        <div class="action-grid">
          <!-- 磕头 -->
          <el-button
            type="primary"
            size="large"
            class="cyber-btn kowtow-btn"
            @click="handleKowtow"
            :loading="isKowtowing"
          >
            <el-icon class="btn-icon"><CaretBottom /></el-icon>
            磕头
            <span class="btn-count" v-if="kowtowCount > 0">{{ kowtowCount }}</span>
          </el-button>

          <!-- 上香 -->
          <el-button
            type="warning"
            size="large"
            class="cyber-btn incense-btn"
            @click="handleIncense"
          >
            <el-icon class="btn-icon"><Switch /></el-icon>
            上香
            <span class="btn-count" v-if="offerings.incense.count > 0">{{ offerings.incense.count }}</span>
          </el-button>

          <!-- 烧纸 -->
          <el-button
            type="danger"
            size="large"
            class="cyber-btn paper-btn"
            @click="handleBurnPaper"
          >
            <el-icon class="btn-icon"><Document /></el-icon>
            烧纸
            <span class="btn-count" v-if="offerings.paper.count > 0">{{ offerings.paper.count }}</span>
          </el-button>

          <!-- 贡品 -->
          <el-button
            type="success"
            size="large"
            class="cyber-btn food-btn"
            @click="handleFood"
          >
            <el-icon class="btn-icon"><Coffee /></el-icon>
            贡品
            <span class="btn-count" v-if="offerings.food.count > 0">{{ offerings.food.count }}</span>
          </el-button>

          <!-- 祈福 -->
          <el-button
            type="info"
            size="large"
            class="cyber-btn pray-btn"
            @click="handlePray"
          >
            <el-icon class="btn-icon"><ChatDotRound /></el-icon>
            祈福
          </el-button>

          <!-- 记录 -->
          <el-button
            size="large"
            class="cyber-btn record-btn"
            @click="handleShowRecord"
          >
            <el-icon class="btn-icon"><List /></el-icon>
            记录
          </el-button>
        </div>
      </div>

      <!-- 祝福语显示 -->
      <div class="blessing-section" v-if="blessingText">
        <div class="blessing-text">{{ blessingText }}</div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stat-item">
          <span class="stat-label">总磕头次数</span>
          <span class="stat-value">{{ kowtowCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总祈福次数</span>
          <span class="stat-value">{{ prayCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总祭品数</span>
          <span class="stat-value">{{ totalOfferings }}</span>
        </div>
      </div>
    </div>

    <!-- 磕头动画层 -->
    <div class="kowtow-animation" v-if="isKowtowing">
      <div class="kowtow-figure" :class="{ bowing: isKowtowing }">
        <div class="figure-head"></div>
        <div class="figure-body"></div>
        <div class="figure-legs"></div>
        <div class="figure-hands"></div>
      </div>
      <div class="kowtow-text">{{ kowtowText }}</div>
    </div>

    <!-- 记录对话框 -->
    <el-dialog
      v-model="recordDialogVisible"
      title="祭祖记录"
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

    <!-- 祈福对话框 -->
    <el-dialog
      v-model="prayDialogVisible"
      title="祈福"
      width="500px"
      class="cyber-dialog"
    >
      <el-input
        v-model="prayText"
        type="textarea"
        :rows="4"
        placeholder="写下您的祈福语..."
      />
      <template #footer>
        <el-button @click="prayDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPray">祈福</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  CaretBottom,
  Switch,
  Document,
  Coffee,
  ChatDotRound,
  List,
  Star,
} from '@element-plus/icons-vue'

// 祖先姓名
const ancestorName = ref('爷爷、奶奶')

// 磕头相关
const kowtowCount = ref(0)
const isKowtowing = ref(false)
const kowtowText = ref('')

// 祈福相关
const prayCount = ref(0)
const prayText = ref('')
const prayDialogVisible = ref(false)
const blessingText = ref('')

// 贡品统计
const offerings = ref({
  incense: { icon: Star, count: 0, color: '#e74c3c' },
  paper: { icon: Document, count: 0, color: '#f39c12' },
  food: { icon: Coffee, count: 0, color: '#27ae60' }
})

const offeringArray = computed(() => {
  return Object.values(offerings.value)
})

// 总祭品数
const totalOfferings = computed(() => {
  return offeringArray.value.reduce((sum, item) => sum + item.count, 0)
})

// 记录相关
const records = ref<Array<{ time: string, action: string, detail: string }>>([])
const recordDialogVisible = ref(false)

// 磕头功能
const handleKowtow = async () => {
  if (!ancestorName.value) {
    ElMessage.warning('请先输入祖先姓名')
    return
  }

  isKowtowing.value = true
  kowtowCount.value++

  const texts = ['一叩首', '二叩首', '三叩首', '保佑全家']
  for (let i = 0; i < texts.length; i++) {
    kowtowText.value = texts[i]
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  kowtowText.value = ''
  isKowtowing.value = false
  blessingText.value = `${ancestorName.value}保佑您！`
  setTimeout(() => {
    blessingText.value = ''
  }, 3000)

  addRecord('磕头', `第${kowtowCount.value}次磕头`)
}

// 上香功能
const handleIncense = () => {
  if (!ancestorName.value) {
    ElMessage.warning('请先输入祖先姓名')
    return
  }

  offerings.value.incense.count++
  blessingText.value = `已为${ancestorName.value}上香${offerings.value.incense.count}炷`
  setTimeout(() => {
    blessingText.value = ''
  }, 3000)

  addRecord('上香', `累计上香${offerings.value.incense.count}炷`)
}

// 烧纸功能
const handleBurnPaper = () => {
  if (!ancestorName.value) {
    ElMessage.warning('请先输入祖先姓名')
    return
  }

  offerings.value.paper.count += 10
  blessingText.value = `已为${ancestorName.value}烧纸${offerings.value.paper.count}张`
  setTimeout(() => {
    blessingText.value = ''
  }, 3000)

  addRecord('烧纸', `累计烧纸${offerings.value.paper.count}张`)
}

// 贡品功能
const handleFood = () => {
  if (!ancestorName.value) {
    ElMessage.warning('请先输入祖先姓名')
    return
  }

  offerings.value.food.count++
  blessingText.value = `已为${ancestorName.value}献上贡品`
  setTimeout(() => {
    blessingText.value = ''
  }, 3000)

  addRecord('贡品', `累计贡品${offerings.value.food.count}次`)
}

// 祈福功能
const handlePray = () => {
  if (!ancestorName.value) {
    ElMessage.warning('请先输入祖先姓名')
    return
  }
  prayDialogVisible.value = true
}

const submitPray = () => {
  if (!prayText.value.trim()) {
    ElMessage.warning('请输入祈福语')
    return
  }

  prayCount.value++
  blessingText.value = `${ancestorName.value}已收到您的祈福：${prayText.value}`
  setTimeout(() => {
    blessingText.value = ''
  }, 5000)

  addRecord('祈福', prayText.value)
  prayText.value = ''
  prayDialogVisible.value = false
  ElMessage.success('祈福成功！')
}

// 显示记录
const handleShowRecord = () => {
  recordDialogVisible.value = true
}

// 清空记录
const clearRecords = () => {
  records.value = []
  ElMessage.success('记录已清空')
}

// 添加记录
const addRecord = (action: string, detail: string) => {
  const now = new Date()
  const time = now.toLocaleString('zh-CN')
  records.value.unshift({ time, action, detail })

  // 限制记录数量
  if (records.value.length > 100) {
    records.value = records.value.slice(0, 100)
  }
}
</script>

<style scoped>
.cyber-sacrifice {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #3d5a6c 100%);
  padding: 20px;
}

/* 赛博朋克背景 */
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
    linear-gradient(rgba(150, 180, 200, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(150, 180, 200, 0.08) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

.neon-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, rgba(150, 180, 200, 0.08) 0%, transparent 70%);
}

/* 主容器 */
.container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

/* 标题区域 */
.title-section {
  text-align: center;
  margin-bottom: 40px;
}

.cyber-title {
  font-size: 48px;
  font-weight: bold;
  color: #7f8c8d;
  text-shadow: 0 0 3px rgba(127, 140, 141, 0.5);
  margin-bottom: 10px;
  letter-spacing: 4px;
}

.title-sub {
  color: #95a5a6;
  font-size: 16px;
  letter-spacing: 2px;
}

/* 祭台区域 */
.altar-section {
  margin-bottom: 40px;
}

.altar-frame {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(127, 140, 141, 0.4);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.ancestor-display {
  text-align: center;
  margin-bottom: 30px;
}

.ancestor-avatar {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.ancestor-name {
  max-width: 300px;
  margin: 0 auto;
}

.cyber-input :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(127, 140, 141, 0.4) !important;
  color: #7f8c8d !important;
  text-align: center;
  font-size: 18px;
}

.cyber-input :deep(.el-input__inner)::placeholder {
  color: rgba(127, 140, 141, 0.5);
}

/* 贡品展示 */
.offerings-display {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.offering-item {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(127, 140, 141, 0.4);
  border-radius: 10px;
}

.offering-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #7f8c8d;
  color: white;
  font-size: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* 功能按钮区 */
.action-section {
  margin-bottom: 30px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.cyber-btn {
  height: 80px;
  font-size: 18px;
  font-weight: bold;
  border: 2px solid;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cyber-btn::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transform: rotate(45deg);
  transition: all 0.5s ease;
}

.cyber-btn:hover::before {
  animation: btnShine 0.5s ease;
}

@keyframes btnShine {
  from { left: -50%; }
  to { left: 150%; }
}

.cyber-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.btn-icon {
  font-size: 24px;
  margin-right: 5px;
}

.btn-count {
  position: absolute;
  top: 5px;
  right: 10px;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #7f8c8d;
}

.kowtow-btn {
  background: linear-gradient(135deg, #7f8c8d 0%, #95a5a6 100%);
  border-color: #7f8c8d;
  color: white;
  grid-column: span 3;
}

.incense-btn {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  border-color: #e74c3c;
  color: white;
}

.paper-btn {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  border-color: #f39c12;
  color: white;
}

.food-btn {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  border-color: #27ae60;
  color: white;
}

.pray-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-color: #3498db;
  color: white;
}

.record-btn {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  border-color: #9b59b6;
  color: white;
}

/* 祝福语 */
.blessing-section {
  text-align: center;
  margin-bottom: 30px;
}

.blessing-text {
  display: inline-block;
  background: linear-gradient(135deg, rgba(127, 140, 141, 0.2), rgba(149, 165, 166, 0.2));
  border: 2px solid rgba(127, 140, 141, 0.4);
  padding: 15px 30px;
  border-radius: 10px;
  color: #7f8c8d;
  font-size: 20px;
  font-weight: bold;
  animation: blessingAppear 0.5s ease;
}

@keyframes blessingAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 统计信息 */
.stats-section {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(127, 140, 141, 0.3);
  border-radius: 10px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  color: #95a5a6;
  font-size: 14px;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  color: #7f8c8d;
  font-size: 24px;
  font-weight: bold;
}

/* 磕头动画 */
.kowtow-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.kowtow-figure {
  position: relative;
  width: 120px;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: kowtowAnim 0.6s ease-in-out;
}

.kowtow-figure.bowing {
  animation: kowtowAnim 0.6s ease-in-out 3;
}

@keyframes kowtowAnim {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(80px) rotate(20deg);
  }
}

.figure-head {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #7f8c8d, #95a5a6);
  border-radius: 50%;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  position: relative;
}

.figure-head::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 12px;
  width: 8px;
  height: 8px;
  background: #34495e;
  border-radius: 50%;
  box-shadow: 28px 0 0 #34495e;
}

.figure-head::after {
  content: '';
  position: absolute;
  top: 35px;
  left: 25px;
  width: 10px;
  height: 6px;
  background: #34495e;
  border-radius: 3px;
}

.figure-body {
  width: 80px;
  height: 70px;
  background: linear-gradient(135deg, #7f8c8d, #95a5a6);
  border-radius: 15px 15px 5px 5px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.figure-hands {
  position: absolute;
  top: 75px;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 60px;
}

.figure-hands::before,
.figure-hands::after {
  content: '';
  width: 15px;
  height: 40px;
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.figure-hands::before {
  transform: rotate(20deg);
}

.figure-hands::after {
  transform: rotate(-20deg);
}

.figure-legs {
  display: flex;
  gap: 20px;
}

.figure-legs::before,
.figure-legs::after {
  content: '';
  width: 18px;
  height: 50px;
  background: linear-gradient(135deg, #34495e, #2c3e50);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.kowtow-text {
  margin-top: 40px;
  color: #7f8c8d;
  font-size: 32px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(127, 140, 141, 0.5);
  animation: textPulse 0.6s ease-in-out infinite;
}

@keyframes textPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* 赛博对话框 */
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

.cyber-dialog :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(127, 140, 141, 0.4) !important;
  color: #7f8c8d !important;
}

.cyber-dialog :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(127, 140, 141, 0.4) !important;
  color: #7f8c8d !important;
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
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .kowtow-btn {
    grid-column: span 2;
  }

  .stats-section {
    flex-direction: column;
    gap: 20px;
  }

  .cyber-title {
    font-size: 32px;
  }
}
</style>
