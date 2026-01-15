<template>
  <div class="json-converter">
    <div class="header">
      <h1>🔍 JSON 解析器 🔍</h1>
      <p>轻松格式化、验证和转换 JSON 数据</p>
    </div>

    <div class="converter-container">
      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-header">
          <h3>📥 JSON 输入</h3>
          <div class="controls">
            <el-button type="primary" @click="formatJSON">格式化</el-button>
            <el-button @click="compressJSON">压缩</el-button>
            <el-button @click="validateJSON">验证</el-button>
            <el-button @click="copyInput">复制</el-button>
            <el-button @click="clearText('input')">清空</el-button>
          </div>
        </div>
        <el-input
          v-model="inputJSON"
          type="textarea"
          :rows="6"
          placeholder="请输入 JSON 数据..."
          class="text-input"
        />
      </div>

      <!-- 输出区域 -->
      <div class="output-section">
        <div class="input-header">
          <h3>📤 解析结果</h3>
          <div class="controls">
<!--            <el-button type="success" @click="convertToObject">转换为对象</el-button>-->
            <el-button @click="copyOutput">复制</el-button>
            <el-button @click="clearText('output')">清空</el-button>
          </div>
        </div>
        <el-input
          v-model="outputJSON"
          type="textarea"
          :rows="6"
          placeholder="解析结果将显示在这里..."
          class="text-input"
          readonly
        />
      </div>

      <!-- 转换选项 -->
      <div class="options-section">
        <h3>⚙️ 转换选项</h3>
        <div class="options-grid">
          <el-checkbox v-model="options.format" label="格式化输出" />
          <el-checkbox v-model="options.sortKeys" label="排序键名" />
          <el-checkbox v-model="options.removeEmpty" label="移除空值" />
          <div class="indent-control">
            <label>缩进:</label>
            <el-slider
              v-model="options.indentSize"
              :min="0"
              :max="8"
              :step="2"
              style="width: 200px; margin-left: 10px;"
            />
            <span>{{ options.indentSize === 0 ? '无' : `${options.indentSize}空格` }}</span>
          </div>
        </div>
      </div>

      <!-- 解析历史 -->
      <div class="history-section">
        <h3>🕒 解析历史</h3>
        <div class="history-list">
          <div
            v-for="(item, index) in history"
            :key="index"
            class="history-item"
            @click="loadHistory(item)"
          >
            <div class="history-text">{{ item.input.substring(0, 30) }}{{ item.input.length > 30 ? '...' : '' }}</div>
            <div class="history-code">{{ item.output.substring(0, 50) }}{{ item.output.length > 50 ? '...' : '' }}</div>
          </div>
          <div v-if="history.length === 0" class="no-history">暂无历史记录</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';

// 响应式数据
const inputJSON = ref('');
const outputJSON = ref('');

// 转换选项
const options = reactive({
  format: true,
  sortKeys: false,
  removeEmpty: false,
  indentSize: 2
});

interface HistoryItem {
  input: string;
  output: string;
}

// 解析历史
const history = ref<HistoryItem[]>([]);

// 格式化 JSON
const formatJSON = () => {
  if (!inputJSON.value.trim()) {
    ElMessage.warning('请输入 JSON 数据');
    return;
  }

  try {
    let parsed = JSON.parse(inputJSON.value);

    // 如果需要排序键名
    if (options.sortKeys) {
      parsed = sortObjectKeys(parsed);
    }

    // 如果需要移除空值
    if (options.removeEmpty) {
      parsed = removeEmptyValues(parsed);
    }

    // 根据缩进选项格式化
    const indent = options.indentSize > 0 ? options.indentSize : 0;
    outputJSON.value = JSON.stringify(parsed, null, indent);

    ElMessage.success('格式化成功！');

    // 添加到历史记录
    addToHistory(inputJSON.value, outputJSON.value);
  } catch (error: any) {
    ElMessage.error(`JSON 格式错误: ${error.message}`);
  }
};

// 压缩 JSON
const compressJSON = () => {
  if (!inputJSON.value.trim()) {
    ElMessage.warning('请输入 JSON 数据');
    return;
  }

  try {
    const parsed = JSON.parse(inputJSON.value);
    outputJSON.value = JSON.stringify(parsed);
    ElMessage.success('压缩完成！');

    // 添加到历史记录
    addToHistory(inputJSON.value, outputJSON.value);
  } catch (error: any) {
    ElMessage.error(`JSON 格式错误: ${error.message}`);
  }
};

// 验证 JSON
const validateJSON = () => {
  if (!inputJSON.value.trim()) {
    ElMessage.warning('请输入 JSON 数据');
    return;
  }

  try {
    JSON.parse(inputJSON.value);
    ElMessage.success('JSON 格式正确！');
  } catch (error: any) {
    ElMessage.error(`JSON 格式错误: ${error.message}`);
  }
};

// 转换为对象（格式化输出）
// const convertToObject = () => {
//   formatJSON(); // 复用格式化功能
// };

// 排序对象键名
const sortObjectKeys = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const sortedObj: any = {};
  Object.keys(obj).sort().forEach(key => {
    sortedObj[key] = sortObjectKeys(obj[key]);
  });
  return sortedObj;
};

// 移除空值
const removeEmptyValues = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeEmptyValues).filter(val => val !== null && val !== undefined);
  }

  const cleaned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = removeEmptyValues(obj[key]);
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};

// 添加到历史记录
const addToHistory = (input: string, output: string) => {
  // 检查是否已存在相同的记录
  const existingIndex = history.value.findIndex(
    item => item.input === input && item.output === output
  );

  if (existingIndex !== -1) {
    // 如果存在，移到最前面
    history.value.splice(existingIndex, 1);
  }

  // 添加新记录到最前面
  history.value.unshift({ input, output });

  // 只保留最近的10条记录
  if (history.value.length > 10) {
    history.value.pop();
  }
};

// 加载历史记录
const loadHistory = (item: { input: string; output: string }) => {
  inputJSON.value = item.input;
  outputJSON.value = item.output;
};

// 清空文本
const clearText = (type: 'input' | 'output') => {
  if (type === 'input') {
    inputJSON.value = '';
  } else {
    outputJSON.value = '';
  }
};

// 复制输入到剪贴板
const copyInput = async () => {
  if (!inputJSON.value) {
    ElMessage.warning('没有可复制的内容');
    return;
  }

  try {
    await navigator.clipboard.writeText(inputJSON.value);
    ElMessage.success('已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
    ElMessage.error('复制失败');
  }
};

// 复制输出到剪贴板
const copyOutput = async () => {
  if (!outputJSON.value) {
    ElMessage.warning('没有可复制的内容');
    return;
  }

  try {
    await navigator.clipboard.writeText(outputJSON.value);
    ElMessage.success('已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
    ElMessage.error('复制失败');
  }
};
</script>

<style scoped>
.json-converter {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  padding: 30px;
  border-radius: 15px;
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.header p {
  margin: 10px 0 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.converter-container {
  display: grid;
  gap: 25px;
}

.input-section, .output-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.input-section:hover, .output-section:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.12);
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.input-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.text-input {
  width: 100%;
}

.options-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.options-section h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.options-grid {
  display: grid;
  gap: 15px;
}

.indent-control {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.history-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.history-section h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
}

.history-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  background-color: #f8f9ff;
  border-color: #a777e3;
  transform: translateX(5px);
}

.history-text {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.history-code {
  color: #7f8c8d;
  font-family: monospace;
  font-size: 0.9em;
}

.no-history {
  text-align: center;
  color: #95a5a6;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .input-header {
    flex-direction: column;
    align-items: stretch;
  }

  .controls {
    margin-top: 15px;
  }

  .header h1 {
    font-size: 2rem;
  }

  .controls {
    flex-direction: column;
  }

  .indent-control {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
