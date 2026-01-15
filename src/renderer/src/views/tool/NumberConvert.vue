<template>
  <div class="number-converter">
    <div class="header">
      <h1>🧮 进制转换器 🧮</h1>
      <p>轻松转换不同进制之间的数值</p>
    </div>

    <div class="converter-container">
      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-header">
          <h3>🔢 数值输入</h3>
        </div>
        <el-input
          v-model="inputValue"
          type="text"
          placeholder="请输入数字或十六进制数..."
          class="text-input"
          @input="convertAll"
        />
      </div>

      <!-- 进制选择 -->
      <div class="options-section">
        <h3>⚙️ 进制选项</h3>
        <div class="options-grid">
          <div class="option-row">
            <label>输入进制:</label>
            <el-select v-model="inputBase" placeholder="请选择" @change="convertAll" style="width: 120px;">
              <el-option label="二进制" value="2" />
              <el-option label="八进制" value="8" />
              <el-option label="十进制" value="10" />
              <el-option label="十六进制" value="16" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 转换结果 -->
      <div class="results-section">
        <h3>📊 转换结果</h3>
        <div class="result-grid">
          <div class="result-item">
            <h4>二进制 (Binary)</h4>
            <div class="result-value">{{ binaryResult }}</div>
            <div class="copy-btn">
              <el-button size="small" @click="copyToClipboard(binaryResult)">复制</el-button>
            </div>
          </div>
          <div class="result-item">
            <h4>八进制 (Octal)</h4>
            <div class="result-value">{{ octalResult }}</div>
            <div class="copy-btn">
              <el-button size="small" @click="copyToClipboard(octalResult)">复制</el-button>
            </div>
          </div>
          <div class="result-item">
            <h4>十进制 (Decimal)</h4>
            <div class="result-value">{{ decimalResult }}</div>
            <div class="copy-btn">
              <el-button size="small" @click="copyToClipboard(decimalResult)">复制</el-button>
            </div>
          </div>
          <div class="result-item">
            <h4>十六进制 (Hexadecimal)</h4>
            <div class="result-value">{{ hexResult }}</div>
            <div class="copy-btn">
              <el-button size="small" @click="copyToClipboard(hexResult)">复制</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- ASCII 查看器 -->
      <div class="ascii-section">
        <h3>🔤 ASCII 对照</h3>
        <div class="ascii-grid">
          <div class="ascii-item" v-for="ascii in asciiValues" :key="ascii.decimal">
            <div class="ascii-info">
              <span class="ascii-char">{{ ascii.char }}</span>
              <span class="ascii-desc">({{ ascii.desc }})</span>
            </div>
            <div class="ascii-values">
              <span class="ascii-decimal">Dec: {{ ascii.decimal }}</span>
              <span class="ascii-hex">Hex: {{ ascii.hex }}</span>
              <span class="ascii-binary">Bin: {{ ascii.binary }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 常用进制对照表 -->
      <div class="reference-section">
        <h3>📋 常用数值对照表</h3>
        <div class="reference-grid">
          <div class="ref-item" v-for="item in referenceTable" :key="item.decimal">
            <div class="ref-decimal">Dec: {{ item.decimal }}</div>
            <div class="ref-binary">Bin: {{ item.binary }}</div>
            <div class="ref-octal">Oct: {{ item.octal }}</div>
            <div class="ref-hex">Hex: {{ item.hex }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';

// 响应式数据
const inputValue = ref('255');
const inputBase = ref('10'); // 默认十进制

// 转换结果
const decimalResult = ref('255');
const binaryResult = ref('11111111');
const octalResult = ref('377');
const hexResult = ref('FF');

// ASCII 对照值
const asciiValues = computed(() => {
  const result: { decimal: number; char: string; desc: string; hex: string; binary: string }[] = [];  const dec = parseInt(decimalResult.value);

  // 计算当前数值对应的 ASCII 字符
  if (!isNaN(dec) && dec >= 0 && dec <= 127) {
    const char = String.fromCharCode(dec);
    let desc = '';

    if (dec >= 32 && dec <= 126) {
      desc = char;
    } else {
      switch(dec) {
        case 0: desc = 'NUL'; break;
        case 7: desc = 'BEL'; break;
        case 8: desc = 'BS'; break;
        case 9: desc = 'TAB'; break;
        case 10: desc = 'LF'; break;
        case 13: desc = 'CR'; break;
        default: desc = `控制字符${dec}`;
      }
    }

    result.push({
      decimal: dec,
      char,
      desc,
      hex: dec.toString(16).toUpperCase(),
      binary: dec.toString(2)
    });
  }

  // 添加附近的几个 ASCII 字符以便查看
  for (let i = Math.max(32, dec - 3); i <= Math.min(126, dec + 3); i++) {
    if (i === dec) continue; // 跳过已经添加的

    const char = String.fromCharCode(i);
    let desc = '';

    if (i >= 32 && i <= 126) {
      desc = char;
    } else {
      switch(i) {
        case 0: desc = 'NUL'; break;
        case 7: desc = 'BEL'; break;
        case 8: desc = 'BS'; break;
        case 9: desc = 'TAB'; break;
        case 10: desc = 'LF'; break;
        case 13: desc = 'CR'; break;
        default: desc = `控制字符${i}`;
      }
    }

    result.push({
      decimal: i,
      char,
      desc,
      hex: i.toString(16).toUpperCase(),
      binary: i.toString(2)
    });
  }

  return result;
});

// 常用数值对照表
const referenceTable = computed(() => {
  const table: { decimal: number; binary: string; octal: string; hex: string }[] = [];
  const dec = parseInt(decimalResult.value);

  // 添加输入数值及前后几个数值作为对照
  const start = Math.max(0, dec - 2);
  const end = Math.min(255, dec + 2);

  for (let i = start; i <= end; i++) {
    table.push({
      decimal: i,
      binary: i.toString(2),
      octal: i.toString(8),
      hex: i.toString(16).toUpperCase()
    });
  }

  return table;
});

// 将输入值转换为十进制
const convertToDecimal = (value: string, base: number): number => {
  try {
    // 特殊处理十六进制，去除可能的前缀
    if (base === 16) {
      value = value.replace(/^0x/i, '');
    }

    // 特殊处理二进制，去除可能的前缀
    if (base === 2) {
      value = value.replace(/^0b/i, '');
    }

    // 特殊处理八进制，去除可能的前缀
    if (base === 8) {
      value = value.replace(/^0o/i, '');
    }

    return parseInt(value, base);
  } catch (e) {
    throw new Error(`无效的${getBaseName(base)}数值`);
  }
};

// 获取进制名称
const getBaseName = (base: number): string => {
  switch(base) {
    case 2: return '二进制';
    case 8: return '八进制';
    case 10: return '十进制';
    case 16: return '十六进制';
    default: return `${base}进制`;
  }
};

// 执行所有转换
const convertAll = () => {
  try {
    if (!inputValue.value.trim()) {
      // 如果输入为空，重置所有值
      decimalResult.value = '';
      binaryResult.value = '';
      octalResult.value = '';
      hexResult.value = '';
      return;
    }

    // 先将输入值转换为十进制
    const decimal = convertToDecimal(inputValue.value, parseInt(inputBase.value));

    // 更新所有进制结果
    decimalResult.value = decimal.toString();
    binaryResult.value = decimal.toString(2);
    octalResult.value = decimal.toString(8);
    hexResult.value = decimal.toString(16).toUpperCase();

  } catch (error: any) {
    ElMessage.error(error.message);
  }
};

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  if (!text) {
    ElMessage.warning('没有可复制的内容');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    ElNotification({
      title: '复制成功',
      message: `已复制: ${text}`,
      type: 'success'
    });
  } catch (err) {
    console.error('复制失败:', err);
    ElMessage.error('复制失败');
  }
};

// 初始化转换
convertAll();
</script>

<style scoped>
.number-converter {
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

.input-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.input-section:hover {
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
  display: flex;
  gap: 15px;
  align-items: center;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.results-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.results-section h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.result-item {
  background: #f8f9ff;
  border-radius: 10px;
  padding: 15px;
  border: 1px solid #e0e6ed;
}

.result-item h4 {
  margin: 0 0 10px 0;
  color: #4a6cf7;
  font-size: 1.1rem;
}

.result-value {
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
  word-break: break-all;
  padding: 10px;
  background: #fff;
  border-radius: 5px;
  border: 1px dashed #ddd;
  margin-bottom: 10px;
}

.copy-btn {
  text-align: right;
}

.ascii-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.ascii-section h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.ascii-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.ascii-item {
  background: #f8f9ff;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e0e6ed;
}

.ascii-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ascii-char {
  font-size: 1.5rem;
  font-weight: bold;
  display: inline-block;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  background: #4a6cf7;
  color: white;
  border-radius: 4px;
}

.ascii-desc {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.ascii-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: #7f8c8d;
}

.reference-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.reference-section h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.ref-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: #f8f9ff;
  border-radius: 8px;
  font-size: 0.9rem;
  border: 1px solid #e0e6ed;
}

.ref-decimal, .ref-binary, .ref-octal, .ref-hex {
  font-family: 'Courier New', monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .options-grid {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }

  .ascii-grid {
    grid-template-columns: 1fr;
  }

  .reference-grid {
    grid-template-columns: 1fr;
  }

  .header h1 {
    font-size: 2rem;
  }
}
</style>
