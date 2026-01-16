<template>
  <div class="time-converter">
    <div class="header">
      <h1>⏰ 时间转换器 ⏰</h1>
      <p>轻松转换时间格式、计算时间差、转换时间单位</p>
    </div>

    <div class="converter-container">
      <!-- 时间转换区域 -->
      <div class="input-section">
        <div class="input-header">
          <h3>📅 时间格式转换</h3>
          <div class="controls">
            <el-button type="primary" @click="convertTimeFormat">转换</el-button>
            <el-button @click="syncTime">同步当前时间</el-button>
          </div>
        </div>
        <div class="time-inputs">
          <el-input
            v-model="timestamp"
            placeholder="请输入 Unix 时间戳 (毫秒)"
            class="time-input"
          />
          <el-input
            v-model="isoDate"
            placeholder="请输入 ISO 日期格式"
            class="time-input"
          />
          <el-input
            v-model="formattedDate"
            placeholder="请输入自定义日期格式 (YYYY-MM-DD HH:mm:ss)"
            class="time-input"
          />
        </div>
      </div>

      <!-- 时间差计算区域 -->
      <div class="output-section">
        <div class="input-header">
          <h3>⏱️ 时间差计算</h3>
        </div>
        <div class="time-diff-inputs">
          <el-input
            v-model="startTime"
            placeholder="开始时间 (YYYY-MM-DD HH:mm:ss)"
            class="time-input"
          />
          <el-input
            v-model="endTime"
            placeholder="结束时间 (YYYY-MM-DD HH:mm:ss)"
            class="time-input"
          />
          <el-button type="success" @click="calculateTimeDiff">计算时间差</el-button>
          <div class="time-diff-result" v-if="timeDiffResult">
            <p>时间差: {{ timeDiffResult }}</p>
            <p>总秒数: {{ totalSeconds }} 秒</p>
          </div>
        </div>
      </div>

      <!-- 时间单位转换区域 -->
      <div class="unit-conversion-section">
        <h3>🔄 时间单位转换</h3>
        <div class="conversion-grid">
          <div class="conversion-row">
            <label>天</label>
            <el-input-number v-model="days" :min="0" @change="convertDays" />
          </div>
          <div class="conversion-row">
            <label>小时</label>
            <el-input-number v-model="hours" :min="0" @change="convertHours" />
          </div>
          <div class="conversion-row">
            <label>分钟</label>
            <el-input-number v-model="minutes" :min="0" @change="convertMinutes" />
          </div>
          <div class="conversion-row">
            <label>秒</label>
            <el-input-number v-model="seconds" :min="0" @change="convertSeconds" />
          </div>
          <div class="conversion-row">
            <label>毫秒</label>
            <el-input-number v-model="milliseconds" :min="0" @change="convertMilliseconds" />
          </div>
        </div>
      </div>

      <!-- 转换历史 -->
      <div class="history-section">
        <h3>🕒 转换历史
          <el-button style="float: right;" @click="clearHistory" size="small" type="danger" plain>清空历史</el-button>
        </h3>
        <div class="history-list">
          <div
            v-for="(item, index) in history"
            :key="index"
            class="history-item"
            @click="loadHistory(item)"
          >
            <div class="history-text">{{ item.type }}: {{ item.input }}</div>
            <div class="history-code">{{ item.result }}</div>
          </div>
          <div v-if="history.length === 0" class="no-history">暂无历史记录</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

// 时间格式转换相关
const timestamp = ref('');
const isoDate = ref('');
const formattedDate = ref('');

// 时间差计算相关
const startTime = ref('');
const endTime = ref('');
const timeDiffResult = ref('');
const totalSeconds = ref(0);

// 时间单位转换相关
const days = ref(0);
const hours = ref(0);
const minutes = ref(0);
const seconds = ref(0);
const milliseconds = ref(0);

// 转换历史
interface HistoryItem {
  type: string;
  input: string;
  result: string;
  timestamp: number;
}
const history = ref<HistoryItem[]>([]);

// 防抖定时器
// eslint-disable-next-line no-undef
let debounceTimer: NodeJS.Timeout | null = null;

// 时间格式转换
const convertTimeFormat = () => {
  // 清除之前的防抖定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 防抖处理
  debounceTimer = setTimeout(() => {
    // 检查哪个字段有输入值
    if (timestamp.value) {
      // 从时间戳转换
      try {
        const numTimestamp = parseInt(timestamp.value);
        if (isNaN(numTimestamp)) {
          throw new Error('无效的时间戳');
        }

        const date = new Date(numTimestamp);
        isoDate.value = date.toISOString();
        formattedDate.value = formatDateTime(date);

        addToHistory('时间戳转日期', timestamp.value, `${isoDate.value} / ${formattedDate.value}`);
        ElMessage.success('时间戳转换成功！');
      } catch (error) {
        ElMessage.error('时间戳格式错误');
      }
    } else if (isoDate.value) {
      // 从ISO日期转换
      try {
        const date = new Date(isoDate.value);
        if (isNaN(date.getTime())) {
          throw new Error('无效的日期');
        }

        timestamp.value = date.getTime().toString();
        formattedDate.value = formatDateTime(date);

        addToHistory('ISO日期转时间戳', isoDate.value, `${timestamp.value} / ${formattedDate.value}`);
        ElMessage.success('ISO日期转换成功！');
      } catch (error) {
        ElMessage.error('ISO日期格式错误');
      }
    } else if (formattedDate.value) {
      // 从格式化日期转换
      try {
        const date = new Date(formattedDate.value);
        if (isNaN(date.getTime())) {
          throw new Error('无效的日期');
        }

        timestamp.value = date.getTime().toString();
        isoDate.value = date.toISOString();

        addToHistory('格式化日期转时间戳', formattedDate.value, `${timestamp.value} / ${isoDate.value}`);
        ElMessage.success('格式化日期转换成功！');
      } catch (error) {
        ElMessage.error('日期格式错误');
      }
    } else {
      ElMessage.warning('请至少输入一个时间格式');
    }
  }, 300);
};

// 同步当前时间
const syncTime = () => {
  const now = new Date();
  timestamp.value = now.getTime().toString();
  isoDate.value = now.toISOString();
  formattedDate.value = formatDateTime(now);

  ElMessage.success('已同步当前时间');
};

// 计算时间差
const calculateTimeDiff = () => {
  if (!startTime.value || !endTime.value) {
    ElMessage.warning('请输入开始和结束时间');
    return;
  }

  try {
    const startDate = new Date(startTime.value);
    const endDate = new Date(endTime.value);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      ElMessage.error('日期格式错误');
      return;
    }

    const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
    totalSeconds.value = Math.floor(diffMs / 1000);

    // 计算天、小时、分钟、秒
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    timeDiffResult.value = `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`;

    addToHistory('时间差计算', `${startTime.value} 至 ${endTime.value}`, timeDiffResult.value);
    ElMessage.success('计算完成！');
  } catch (error) {
    ElMessage.error('计算失败');
  }
};

// 格式化日期时间
const formatDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 时间单位转换函数
const convertDays = () => {
  const totalMs = days.value * 24 * 60 * 60 * 1000;
  updateAllUnits(totalMs);
};

const convertHours = () => {
  const totalMs = hours.value * 60 * 60 * 1000;
  updateAllUnits(totalMs);
};

const convertMinutes = () => {
  const totalMs = minutes.value * 60 * 1000;
  updateAllUnits(totalMs);
};

const convertSeconds = () => {
  const totalMs = seconds.value * 1000;
  updateAllUnits(totalMs);
};

const convertMilliseconds = () => {
  updateAllUnits(milliseconds.value);
};

// 更新所有单位值
const updateAllUnits = (totalMs: number) => {
  milliseconds.value = totalMs;
  seconds.value = Math.floor(totalMs / 1000);
  minutes.value = Math.floor(totalMs / (1000 * 60));
  hours.value = Math.floor(totalMs / (1000 * 60 * 60));
  days.value = Math.floor(totalMs / (1000 * 60 * 60 * 24));
};

// 添加到历史记录
const addToHistory = (type: string, input: string, result: string) => {
  // 添加新记录到最前面
  history.value.unshift({
    type,
    input,
    result,
    timestamp: Date.now()
  });

  // 只保留最近的10条记录
  if (history.value.length > 10) {
    history.value.pop();
  }
  // 保存到本地存储
  localStorage.setItem('timeHistory', JSON.stringify(history.value))
};
const clearHistory = () => {
  history.value = [];
  localStorage.removeItem('timeHistory');
}

if (localStorage.getItem('timeHistory')) {
  try {
    history.value = JSON.parse(localStorage.getItem('timeHistory') || '[]')
  } catch (e) {
    console.error('加载历史记录失败:', e)
  }
}
// 加载历史记录
const loadHistory = (item: HistoryItem) => {
  // 根据历史记录类型加载到相应字段
  if (item.type.includes('转')) {
    // 解析结果字符串，它应该是 "值1 / 值2" 的格式
    const parts = item.result.split(' / ');
    if (parts.length >= 2) {
      // 根据输入类型设置对应的字段
      if (item.type.includes('时间戳转日期')) {
        // 输入是时间戳，输出是 ISO 和格式化日期
        timestamp.value = item.input;
        isoDate.value = parts[0];  // 第一个是 ISO 日期
        formattedDate.value = parts[1];  // 第二个是格式化日期
      } else if (item.type.includes('ISO日期转时间戳')) {
        // 输入是 ISO 日期，输出是时间戳和格式化日期
        isoDate.value = item.input;
        timestamp.value = parts[0];  // 第一个是时间戳
        formattedDate.value = parts[1];  // 第二个是格式化日期
      } else if (item.type.includes('格式化日期转时间戳')) {
        // 输入是格式化日期，输出是时间戳和 ISO 日期
        formattedDate.value = item.input;
        timestamp.value = parts[0];  // 第一个是时间戳
        isoDate.value = parts[1];  // 第二个是 ISO 日期
      }
    }
  } else if (item.type === '时间差计算') {
    const times = item.input.split(' 至 ');
    if (times.length === 2) {
      startTime.value = times[0];
      endTime.value = times[1];
    }
  }
};

</script>

<style scoped>
.time-converter {
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

.time-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.time-input {
  margin-bottom: 10px;
}

.time-diff-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.time-diff-result {
  margin-top: 15px;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.unit-conversion-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.unit-conversion-section h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.conversion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.conversion-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.conversion-row label {
  font-weight: bold;
  color: #555;
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

  .time-inputs, .time-diff-inputs {
    flex-direction: column;
  }

  .conversion-grid {
    grid-template-columns: 1fr;
  }
}
</style>
