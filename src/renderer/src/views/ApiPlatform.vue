<template>
  <div class="api-platform-container">
    <header class="platform-header">
      <h1>对外API开放平台</h1>
      <p>管理您的API密钥，控制访问权限和配额</p>
    </header>

    <!-- 操作区域 -->
    <section class="action-section">
      <button
        class="btn-primary"
        @click="startCreateApiKey"
      >
        创建新的API密钥
      </button>
    </section>

    <!-- API密钥列表 -->
    <section class="keys-list">
      <h2>API密钥列表</h2>
      <div
        v-for="key in apiKeys"
        :key="key.id"
        class="key-card"
      >
        <div class="key-info">
          <div class="key-name">{{ key.name }}</div>
          <div class="key-details">
            <div class="detail-item">
              <label>API Key:</label>
              <span>{{ key.key.substring(0, 8) }}...{{ key.key.slice(-4) }}</span>
              <button
                class="copy-btn"
                @click="copyToClipboard(key.key)"
                title="复制API Key"
              >
                复制
              </button>
            </div>
            <div class="detail-item">
              <label>Secret:</label>
              <span>••••••••••••••••••••••••••••••••</span>
              <button
                class="copy-btn"
                @click="copyToClipboard(key.secret)"
                title="复制Secret"
              >
                复制
              </button>
            </div>
            <div class="detail-item">
              <label>电池组:</label>
              <span>{{ key.batteryGroup.join(', ') }}</span>
            </div>
            <div class="detail-item">
              <label>开放接口:</label>
              <span>{{ key.interfaces.join(', ') }}</span>
            </div>
            <div class="detail-item">
              <label>创建时间:</label>
              <span>{{ new Date(key.createdAt).toLocaleString() }}</span>
            </div>
            <div class="detail-item">
              <label>过期时间:</label>
              <span v-if="key.expireTime">
                {{ new Date(key.expireTime).toLocaleDateString() }}
                <span
                  v-if="isExpired(key.expireTime)"
                  class="status expired"
                >
                  已过期
                </span>
              </span>
              <span v-else>无限制</span>
            </div>
            <div class="detail-item">
              <label>日配额:</label>
              <span>{{ key.dailyQuota }}</span>
            </div>
            <div class="detail-item">
              <label>月配额:</label>
              <span>{{ key.monthlyQuota }}</span>
            </div>
            <div class="detail-item">
              <label>说明:</label>
              <span>{{ key.description || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="key-actions">
          <button
            class="btn-danger"
            @click="deleteKey(key.id)"
          >
            删除
          </button>
        </div>
      </div>

      <div v-if="apiKeys.length === 0" class="empty-state">
        暂无API密钥，请点击上方按钮创建
      </div>
    </section>

    <!-- 分步骤创建API密钥模态框 -->
    <div v-if="showGenerateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content wizard-modal">
        <div class="wizard-header">
          <h3>创建API密钥向导</h3>
          <div class="step-indicator">
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="step"
              :class="{ active: currentStep === index, completed: currentStep > index }"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-label">{{ step.title }}</div>
            </div>
          </div>
        </div>

        <!-- 步骤1: 基本信息 -->
        <div v-show="currentStep === 0" class="wizard-step">
          <h4>基本信息</h4>
          <div class="form-group">
            <label for="name">密钥名称 *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="为API密钥设置一个名称"
              :class="{ 'error': validationErrors.name }"
            />
            <div v-if="validationErrors.name" class="error-message">
              {{ validationErrors.name }}
            </div>
          </div>

          <div class="form-group">
            <label for="description">说明</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              placeholder="请输入密钥用途说明"
            ></textarea>
          </div>
        </div>

        <!-- 步骤2: 权限设置 -->
        <div v-show="currentStep === 1" class="wizard-step">
          <h4>权限设置</h4>
          <div class="form-group">
            <label>选择电池组 *</label>
            <div class="checkbox-group">
              <label
                v-for="group in batteryGroups"
                :key="group"
                class="checkbox-item"
              >
                <input
                  v-model="form.batteryGroups"
                  type="checkbox"
                  :value="group"
                />
                {{ group }}
              </label>
            </div>
            <div v-if="validationErrors.batteryGroups" class="error-message">
              {{ validationErrors.batteryGroups }}
            </div>
          </div>

          <div class="form-group">
            <label>选择开放接口 *</label>
            <div class="checkbox-group">
              <label
                v-for="iface in availableInterfaces"
                :key="iface"
                class="checkbox-item"
              >
                <input
                  v-model="form.interfaces"
                  type="checkbox"
                  :value="iface"
                />
                {{ iface }}
              </label>
            </div>
            <div v-if="validationErrors.interfaces" class="error-message">
              {{ validationErrors.interfaces }}
            </div>
          </div>
        </div>

        <!-- 步骤3: 配额与期限 -->
        <div v-show="currentStep === 2" class="wizard-step">
          <h4>配额与期限</h4>
          <div class="form-row">
            <div class="form-group">
              <label for="dailyQuota">日配额 *</label>
              <input
                id="dailyQuota"
                v-model.number="form.dailyQuota"
                type="number"
                min="0"
                :class="{ 'error': validationErrors.dailyQuota }"
              />
              <div v-if="validationErrors.dailyQuota" class="error-message">
                {{ validationErrors.dailyQuota }}
              </div>
            </div>

            <div class="form-group">
              <label for="monthlyQuota">月配额 *</label>
              <input
                id="monthlyQuota"
                v-model.number="form.monthlyQuota"
                type="number"
                min="0"
                :class="{ 'error': validationErrors.monthlyQuota }"
              />
              <div v-if="validationErrors.monthlyQuota" class="error-message">
                {{ validationErrors.monthlyQuota }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="expireTime">过期时间</label>
            <input
              id="expireTime"
              v-model="form.expireTime"
              type="date"
            />
          </div>
        </div>

        <!-- 步骤4: 确认信息 -->
        <div v-show="currentStep === 3" class="wizard-step confirmation-step">
          <h4>确认信息</h4>
          <div class="confirmation-summary">
            <div class="summary-item">
              <strong>密钥名称:</strong>
              <span>{{ form.name || '未命名密钥' }}</span>
            </div>
            <div class="summary-item">
              <strong>说明:</strong>
              <span>{{ form.description || '无' }}</span>
            </div>
            <div class="summary-item">
              <strong>电池组:</strong>
              <span>{{ form.batteryGroups.length ? form.batteryGroups.join(', ') : '未选择' }}</span>
            </div>
            <div class="summary-item">
              <strong>开放接口:</strong>
              <span>{{ form.interfaces.length ? form.interfaces.join(', ') : '未选择' }}</span>
            </div>
            <div class="summary-item">
              <strong>日配额:</strong>
              <span>{{ form.dailyQuota }}</span>
            </div>
            <div class="summary-item">
              <strong>月配额:</strong>
              <span>{{ form.monthlyQuota }}</span>
            </div>
            <div class="summary-item">
              <strong>过期时间:</strong>
              <span>{{ form.expireTime ? new Date(form.expireTime).toLocaleDateString() : '无限制' }}</span>
            </div>
          </div>
          <div class="warning-message">
            <p><strong>注意：</strong>创建后请妥善保管API密钥和密钥，丢失后无法找回。</p>
          </div>
        </div>

        <!-- 步骤5: 完成 -->
        <div v-show="currentStep === 4" class="wizard-step completion-step">
          <div class="completion-icon">✓</div>
          <h4>API密钥创建成功！</h4>
          <div class="result-info">
            <p><strong>API Key:</strong></p>
            <div class="key-display">
              <span class="key-value">{{ generatedKey.key }}</span>
              <button class="copy-btn" @click="copyToClipboard(generatedKey.key)">复制</button>
            </div>
            <p><strong>Secret:</strong></p>
            <div class="key-display">
              <span class="key-value">{{ generatedKey.secret }}</span>
              <button class="copy-btn" @click="copyToClipboard(generatedKey.secret)">复制</button>
            </div>
          </div>
          <p class="result-note">请立即保存这些信息，刷新页面后将无法查看Secret</p>
        </div>

        <!-- 导航按钮 -->
        <div class="wizard-navigation">
          <button
            v-if="currentStep > 0 && currentStep < 4"
            type="button"
            class="btn-secondary"
            @click="prevStep"
          >
            上一步
          </button>
          <button
            v-if="currentStep < 3"
            type="button"
            class="btn-primary"
            @click="nextStep"
          >
            下一步
          </button>
          <button
            v-if="currentStep === 3"
            type="button"
            class="btn-primary"
            @click="createFinalApiKey"
          >
            创建API密钥
          </button>
          <button
            v-if="currentStep === 4"
            type="button"
            class="btn-primary"
            @click="closeModal"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface ApiKey {
  id: string
  name: string
  key: string
  secret: string
  batteryGroup: string[]
  interfaces: string[]
  expireTime: Date | null
  totalRequests: number
  dailyQuota: number
  monthlyQuota: number
  description: string
  createdAt: Date
  status: 'active' | 'expired' | 'disabled'
}

const form = reactive({
  name: '',
  batteryGroups: [] as string[],
  interfaces: [] as string[],
  expireTime: null as Date | null,
  dailyQuota: 1000,
  monthlyQuota: 50000,
  description: ''
})

const apiKeys = ref<ApiKey[]>([])
const showGenerateModal = ref(false)
const currentStep = ref(0)
const generatedKey = ref({ key: '', secret: '' })

// 模拟电池组选项
const batteryGroups = [
  '电池组A',
  '电池组B',
  '电池组C',
  '电池组D'
]

// 模拟接口选项
const availableInterfaces = [
  '获取电池状态',
  '获取电池数据',
  '控制充电',
  '控制放电',
  '获取历史数据',
  '设备管理',
  '告警信息'
]

// 步骤配置
const steps = [
  { title: '基本信息' },
  { title: '权限设置' },
  { title: '配额期限' },
  { title: '确认信息' },
  { title: '完成' }
]

// 验证错误
const validationErrors = reactive({
  name: '',
  batteryGroups: '',
  interfaces: '',
  dailyQuota: '',
  monthlyQuota: ''
})

// 开始创建API密钥
const startCreateApiKey = () => {
  resetForm()
  currentStep.value = 0
  showGenerateModal.value = true
}

// 关闭模态框
const closeModal = () => {
  showGenerateModal.value = false
  resetForm()
}

// 下一步
const nextStep = () => {
  if (validateCurrentStep()) {
    currentStep.value++
  }
}

// 上一步
const prevStep = () => {
  currentStep.value--
}

// 验证当前步骤
const validateCurrentStep = (): boolean => {
  // 清除之前的错误
  Object.keys(validationErrors).forEach(key => {
    validationErrors[key as keyof typeof validationErrors] = ''
  })

  switch (currentStep.value) {
    case 0: // 基本信息步骤
      if (!form.name.trim()) {
        validationErrors.name = '请输入密钥名称'
        return false
      }
      break
    case 1: // 权限设置步骤
      if (form.batteryGroups.length === 0) {
        validationErrors.batteryGroups = '请选择至少一个电池组'
        return false
      }
      if (form.interfaces.length === 0) {
        validationErrors.interfaces = '请选择至少一个开放接口'
        return false
      }
      break
    case 2: // 配额与期限步骤
      if (form.dailyQuota <= 0) {
        validationErrors.dailyQuota = '日配额必须大于0'
        return false
      }
      if (form.monthlyQuota <= 0) {
        validationErrors.monthlyQuota = '月配额必须大于0'
        return false
      }
      if (form.dailyQuota > form.monthlyQuota) {
        validationErrors.dailyQuota = '日配额不能大于月配额'
        return false
      }
      break
  }

  return true
}

// 创建最终API密钥
const createFinalApiKey = () => {
  const key = 'key_' + Math.random().toString(36).substr(2, 16)
  const secret = 'secret_' + Math.random().toString(36).substr(2, 32)

  const newKey: ApiKey = {
    id: Date.now().toString(),
    name: form.name || '未命名密钥',
    key,
    secret,
    batteryGroup: form.batteryGroups,
    interfaces: form.interfaces,
    expireTime: form.expireTime,
    totalRequests: 0,
    dailyQuota: form.dailyQuota,
    monthlyQuota: form.monthlyQuota,
    description: form.description,
    createdAt: new Date(),
    status: 'active'
  }

  apiKeys.value.push(newKey)
  generatedKey.value = { key, secret }
  currentStep.value = 4 // 跳转到完成步骤
}

// 重置表单
const resetForm = () => {
  form.name = ''
  form.batteryGroups = []
  form.interfaces = []
  form.expireTime = null
  form.dailyQuota = 1000
  form.monthlyQuota = 50000
  form.description = ''
  currentStep.value = 0

  // 清除验证错误
  Object.keys(validationErrors).forEach(key => {
    validationErrors[key as keyof typeof validationErrors] = ''
  })
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      alert('已复制到剪贴板')
    })
    .catch(err => {
      console.error('复制失败:', err)
    })
}

// 删除API密钥
const deleteKey = (id: string) => {
  if (confirm('确定要删除这个API密钥吗？')) {
    apiKeys.value = apiKeys.value.filter(key => key.id !== id)
  }
}

// 检查密钥是否过期
const isExpired = (expireTime: Date | null) => {
  if (!expireTime) return false
  return new Date() > new Date(expireTime)
}
</script>

<style scoped>
.api-platform-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.platform-header {
  text-align: center;
  margin-bottom: 30px;
}

.platform-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.action-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.keys-list h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.key-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background-color: #fafafa;
}

.key-info {
  flex: 1;
}

.key-name {
  font-weight: bold;
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 10px;
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.detail-item label {
  font-weight: bold;
  width: 100px;
  color: #555;
}

.detail-item span {
  flex: 1;
  color: #333;
}

.copy-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 10px;
}

.copy-btn:hover {
  background-color: #2980b9;
}

.status.expired {
  color: #e74c3c;
  font-weight: bold;
  margin-left: 10px;
}

.key-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
  margin-bottom: 8px;
}

.checkbox-item input[type="checkbox"] {
  margin-right: 5px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-style: italic;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.wizard-modal {
  background: white;
  border-radius: 8px;
  padding: 25px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.wizard-header {
  margin-bottom: 20px;
}

.wizard-header h3 {
  margin-top: 0;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.step-indicator {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  position: relative;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 20px;
  left: 50%;
  right: -50%;
  height: 2px;
  background-color: #ddd;
  z-index: 1;
}

.step.completed:not(:last-child)::after {
  background-color: #3498db;
}

.step:last-child::after {
  display: none;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #ecf0f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #7f8c8d;
  z-index: 2;
  border: 2px solid #ecf0f1;
}

.step.completed .step-number {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.step.active .step-number {
  background-color: #2ecc71;
  color: white;
  border-color: #2ecc71;
  transform: scale(1.1);
  transition: transform 0.2s;
}

.step-label {
  margin-top: 8px;
  font-size: 12px;
  color: #7f8c8d;
  text-align: center;
  max-width: 80px;
}

.step.completed .step-label,
.step.active .step-label {
  color: #2c3e50;
  font-weight: bold;
}

.wizard-step {
  flex: 1;
  padding: 10px 0;
}

.wizard-step h4 {
  margin-top: 0;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.confirmation-summary {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #ddd;
}

.summary-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.summary-item strong {
  width: 120px;
  flex-shrink: 0;
  color: #2c3e50;
}

.warning-message {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 12px;
  margin-top: 15px;
}

.completion-step {
  text-align: center;
}

.completion-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #2ecc71;
  color: white;
  font-size: 30px;
  line-height: 60px;
  margin: 0 auto 20px;
}

.result-info {
  text-align: left;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
}

.key-display {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.key-value {
  flex: 1;
  padding: 8px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  word-break: break-all;
  font-family: monospace;
}

.result-note {
  font-style: italic;
  color: #e74c3c;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #2c3e50;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-group input.error,
.form-group textarea.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

.wizard-navigation {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

@media (max-width: 768px) {
  .key-card {
    flex-direction: column;
  }

  .key-actions {
    margin-top: 15px;
    align-items: flex-start;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .checkbox-group {
    flex-direction: column;
  }

  .step-indicator {
    flex-direction: column;
  }

  .step {
    flex-direction: row;
    margin-bottom: 15px;
    align-items: flex-start;
  }

  .step:not(:last-child)::after {
    top: 20px;
    left: 20px;
    right: auto;
    width: 2px;
    height: calc(100% - 40px);
  }

  .step-label {
    margin-top: 0;
    margin-left: 10px;
    text-align: left;
    max-width: calc(100% - 60px);
  }

  .wizard-modal {
    max-width: 95%;
    padding: 15px;
  }

  .wizard-navigation {
    flex-direction: column-reverse;
  }

  .wizard-navigation button {
    width: 100%;
  }
}
</style>
