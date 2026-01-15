<template>
  <div class="unicode-converter">
    <div class="header">
      <h1>✨ Unicode 转换器 ✨</h1>
      <p>轻松转换文本与 Unicode 编码</p>
    </div>

    <div class="converter-container">
      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-header">
          <h3>📝 原始文本</h3>
          <div class="controls">
            <el-button type="primary" @click="convertToUnicode">转换为 Unicode</el-button>
            <el-button @click="copyOriginal">复制</el-button>
            <el-button @click="clearText('text')">清空</el-button>
          </div>
        </div>
        <el-input
          v-model="originalText"
          type="textarea"
          :rows="4"
          placeholder="请输入要转换的文本..."
          class="text-input"
        />
      </div>

      <!-- 输出区域 -->
      <div class="output-section">
        <div class="input-header">
          <h3>🔐 Unicode 编码</h3>
          <div class="controls">
            <el-button type="success" @click="convertFromUnicode">解析为文本</el-button>
            <el-button @click="copyUnicode">复制</el-button>
            <el-button @click="clearText('unicode')">清空</el-button>
          </div>
        </div>
        <el-input
          v-model="unicodeText"
          type="textarea"
          :rows="4"
          placeholder="转换后的 Unicode 编码会显示在这里..."
          class="text-input"
        />
      </div>

      <!-- 编码选项 -->
      <div class="options-section">
        <h3>⚙️ 转换选项</h3>
        <div class="options-grid">
          <el-checkbox v-model="options.includeSpaces" label="保留空格" />
          <el-checkbox v-model="options.upperCase" label="大写编码" />
          <el-radio-group v-model="options.encodingType" style="margin-top: 10px;">
            <el-radio label="javascript">JavaScript (\uXXXX)</el-radio>
            <el-radio label="html">HTML (&#XXXX;)</el-radio>
            <el-radio label="hex">十六进制 (U+XXXX)</el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 转换历史 -->
      <div class="history-section">
        <h3>🕒 转换历史</h3>
        <div class="history-list">
          <div
            v-for="(item, index) in history"
            :key="index"
            class="history-item"
            @click="loadHistory(item)"
          >
            <div class="history-text">{{ item.original.substring(0, 30) }}{{ item.original.length > 30 ? '...' : '' }}</div>
            <div class="history-code">{{ item.result.substring(0, 50) }}{{ item.result.length > 50 ? '...' : '' }}</div>
          </div>
          <div v-if="history.length === 0" class="no-history">暂无历史记录</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';

// 响应式数据
const originalText = ref('');
const unicodeText = ref('');

// 转换选项
const options = reactive({
  includeSpaces: true,
  upperCase: true,
  encodingType: 'javascript' // javascript, html, hex
});
interface HistoryItem {
  original: string;
  result: string;
}
// 转换历史
const history = ref<HistoryItem[]>([]);

// 文本转 Unicode
const convertToUnicode = () => {
  if (!originalText.value.trim()) {
    ElMessage.warning('请输入要转换的文本');
    return;
  }

  let result = '';

  for (let i = 0; i < originalText.value.length; i++) {
    const char = originalText.value[i];

    // 保留空格的处理
    if (char === ' ' && !options.includeSpaces) {
      result += ' ';
      continue;
    }

    // 获取字符的 Unicode 码点
    const codePoint = char.codePointAt(0)!;
    let encodedChar = '';

    switch(options.encodingType) {
      case 'javascript':
        encodedChar = `\\u${codePoint.toString(16).padStart(4, '0')}`;
        break;
      case 'html':
        encodedChar = `&#${codePoint};`;
        break;
      case 'hex':
        encodedChar = `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
        break;
      default:
        encodedChar = `\\u${codePoint.toString(16).padStart(4, '0')}`;
    }

    // 如果是大写选项，转换编码部分
    if (options.upperCase) {
      if (options.encodingType === 'html') {
        // HTML 不需要大写转换
      } else {
        encodedChar = encodedChar.toUpperCase();
      }
    }

    result += encodedChar;
  }

  unicodeText.value = result;

  // 添加到历史记录
  addToHistory(originalText.value, result);
};

// Unicode 解析为文本
const convertFromUnicode = () => {
  if (!unicodeText.value.trim()) {
    ElMessage.warning('请输入要解析的 Unicode 编码');
    return;
  }

  let result = unicodeText.value;

  // 根据不同的编码格式解析
  switch(options.encodingType) {
    case 'javascript':
      result = result.toLowerCase();
      result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => {
        return String.fromCodePoint(parseInt(hex, 16));
      });
      break;
    case 'html':
      result = result.replace(/&#(\d+);/g, (_match, dec) => {
        return String.fromCodePoint(parseInt(dec, 10));
      });
      break;
    case 'hex':
      result = result.replace(/U\+([0-9a-fA-F]{4})/g, (_match, hex) => {
        return String.fromCodePoint(parseInt(hex, 16));
      });
      break;
  }

  originalText.value = result;

  // 添加到历史记录
  addToHistory(unicodeText.value, result);
};

// 添加到历史记录
const addToHistory = (original: string, result: string) => {
  // 检查是否已存在相同的记录
  const existingIndex = history.value.findIndex(
    item => item.original === original && item.result === result
  );

  if (existingIndex !== -1) {
    // 如果存在，移到最前面
    history.value.splice(existingIndex, 1);
  }

  // 添加新记录到最前面
  history.value.unshift({ original, result });

  // 只保留最近的10条记录
  if (history.value.length > 10) {
    history.value.pop();
  }
};

// 加载历史记录
const loadHistory = (item: { original: string; result: string }) => {
  originalText.value = item.original;
  unicodeText.value = item.result;
};

// 清空文本
const clearText = (type: 'text' | 'unicode') => {
  if (type === 'text') {
    originalText.value = '';
  } else {
    unicodeText.value = '';
  }
};
// 复制 Orign 到剪贴板
const copyOriginal = async () => {
  if (!originalText.value) {
    ElMessage.warning('没有可复制的内容');
    return;
  }

  try {
    await navigator.clipboard.writeText(originalText.value);
    ElMessage.success('已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
    ElMessage.error('复制失败');
  }
};
// 复制 Unicode 到剪贴板
const copyUnicode = async () => {
  if (!unicodeText.value) {
    ElMessage.warning('没有可复制的内容');
    return;
  }

  try {
    await navigator.clipboard.writeText(unicodeText.value);
    ElMessage.success('已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
    ElMessage.error('复制失败');
  }
};

// 实时双向转换（可选功能）
watch([originalText, () => options.encodingType], () => {
  if (originalText.value && originalText.value !== unicodeText.value) {
    // 这里可以添加实时转换逻辑，但为了性能考虑，我们只在点击按钮时转换
  }
});
</script>

<style scoped>
.unicode-converter {
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
  gap: 10px;
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
}
</style>
