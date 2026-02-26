<template>
  <div class="memo-container">
    <div class="memo-header">
      <h2>📝 备忘录</h2>
      <el-button type="primary" @click="addMemo">添加备忘录</el-button>
    </div>

    <div class="memo-list">
      <el-card
        v-for="(item, index) in memos"
        :key="item.id"
        class="memo-card"
        :body-style="{ padding: '15px' }"
      >
        <div class="memo-content">
          <div class="memo-time">{{ item.time }}</div>
          <el-input
            v-if="item.editing"
            v-model="item.content"
            type="textarea"
            :rows="3"
            placeholder="输入备忘录内容..."
          />
          <div v-else class="memo-text">{{ item.content }}</div>
        </div>
        <div class="memo-actions">
          <el-button
            v-if="!item.editing"
            size="small"
            @click="editMemo(index)"
          >
            编辑
          </el-button>
          <el-button
            v-if="item.editing"
            size="small"
            type="success"
            @click="saveMemo(index)"
          >
            保存
          </el-button>
          <el-button
            v-if="item.editing"
            size="small"
            @click="cancelEdit(index)"
          >
            取消
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="deleteMemo(index)"
          >
            删除
          </el-button>
        </div>
      </el-card>

      <el-empty v-if="memos.length === 0" description="暂无备忘录，点击上方按钮添加" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

interface Memo {
  id: number
  content: string
  time: string
  editing?: boolean
}

const STORAGE_KEY = 'catfish-memos'

const memos = ref<Memo[]>([])

// 加载备忘录
const loadMemos = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      memos.value = JSON.parse(saved)
    } catch {
      memos.value = []
    }
  }
}

// 保存备忘录
const saveMemos = () => {
  const toSave = memos.value.map(({ editing, ...rest }) => rest)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
}

// 添加备忘录
const addMemo = () => {
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  memos.value.unshift({
    id: Date.now(),
    content: '',
    time: timeStr,
    editing: true
  })
}

// 编辑备忘录
const editMemo = (index: number) => {
  memos.value[index].editing = true
}

// 保存备忘录
const saveMemo = (index: number) => {
  if (!memos.value[index].content.trim()) {
    ElMessage.warning('备忘录内容不能为空')
    return
  }
  memos.value[index].editing = false
  saveMemos()
  ElMessage.success('保存成功')
}

// 取消编辑
const cancelEdit = (index: number) => {
  if (!memos.value[index].content.trim()) {
    memos.value.splice(index, 1)
  } else {
    memos.value[index].editing = false
  }
}

// 删除备忘录
const deleteMemo = (index: number) => {
  memos.value.splice(index, 1)
  saveMemos()
  ElMessage.success('删除成功')
}

// 页面加载时读取数据
onMounted(() => {
  loadMemos()
})
</script>

<style scoped>
.memo-container {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
}

.memo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.memo-header h2 {
  margin: 0;
  color: #1a202c;
  font-size: 1.6rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.memo-header h2::before {
  font-size: 1.4rem;
}

.memo-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memo-card {
  border-radius: 16px !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: white !important;
}

.memo-card:hover {
  box-shadow: 0 8px 24px rgba(66, 153, 225, 0.15) !important;
  transform: translateY(-2px);
}

.memo-card:hover .memo-time {
  color: #4299e1;
}

.memo-content {
  margin-bottom: 16px;
}

.memo-time {
  font-size: 0.8rem;
  color: #a0aec0;
  margin-bottom: 12px;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: color 0.3s ease;
}

.memo-text {
  color: #2d3748;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 1rem;
}

.memo-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #edf2f7;
}

.memo-actions .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.memo-actions .el-button:hover {
  transform: translateY(-1px);
}

/* 编辑状态样式 */
.memo-card.is-editing {
  border: 2px solid #4299e1 !important;
  box-shadow: 0 4px 16px rgba(66, 153, 225, 0.2) !important;
}

:deep(.el-textarea__inner) {
  border-radius: 12px;
  border-color: #e2e8f0;
  font-size: 1rem;
  line-height: 1.7;
}

:deep(.el-textarea__inner:focus) {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
}

/* 空状态优化 */
:deep(.el-empty) {
  padding: 60px 20px;
}

:deep(.el-empty__description) {
  color: #a0aec0;
  font-size: 1rem;
}

/* 添加按钮优化 */
.memo-header .el-button--primary {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.memo-header .el-button--primary:hover {
  background: linear-gradient(135deg, #3182ce, #2b6cb0);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
}

/* 响应式 */
@media (max-width: 768px) {
  .memo-container {
    padding: 16px;
  }

  .memo-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .memo-header h2 {
    font-size: 1.3rem;
  }

  .memo-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
