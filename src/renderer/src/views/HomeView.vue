<template>
  <div class="home-container">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <h1 class="welcome-title">这是一个不知道干什么的APP</h1>
      <p class="welcome-subtitle">包含一些常用工具</p>
      <div class="feature-grid">
        <div class="feature-card" v-for="(feature, index) in features" :key="index">
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.desc }}</p>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-access">
      <h2 class="section-title">快速入口</h2>
      <div class="access-grid">
        <div
          class="access-item"
          v-for="(item, index) in quickAccess"
          :key="index"
          @click="goToPage(item.name)"
        >
          <div class="access-icon">{{ item.icon }}</div>
          <span class="access-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
<!--      <div class="stat-card" v-for="(stat, index) in stats" :key="index">-->
<!--        <div class="stat-value">{{ stat.value }}</div>-->
<!--        <div class="stat-label">{{ stat.label }}</div>-->
<!--      </div>-->
    </div>
  </div>
</template>

<script setup lang="ts">
// import { useRouter } from 'vue-router';

// const router = useRouter();

// 特性介绍
import router from '@renderer/router'

const features = [
  {
    icon: '✨',
    title: '工具',
    desc: '集成多种实用工具，满足日常开发需求'
  },
  {
    icon: '⚡',
    title: '设计',
    desc: '简洁的操作界面，提升工作效率'
  },
  {
    icon: '🎨',
    title: '未知',
    desc: '暂时没想好'
  }
];

// 快捷入口
const quickAccess = [
  { icon: '📝', label: 'Unicode转换', name: 'UnicodeConvert' },
  // { icon: '📊', label: '数据统计', path: '/stats' },
  // { icon: '⚙️', label: '系统设置', path: '/settings' },
  // { icon: '❓', label: '帮助中心', path: '/help' }
];

// 统计数据
// const stats = [
  // { value: '12+', label: '工具数量' },
  // { value: '24h', label: '在线服务' },
  // { value: '99.9%', label: '稳定运行' },
  // { value: '∞', label: '无限可能' }
// ];

// 跳转到指定页面
const goToPage = (name: string) => {
  router.push({ name: name })
};
</script>

<style scoped>
.home-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.welcome-banner {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
}

.welcome-title {
  font-size: 2.5rem;
  color: #2d3748;
  margin: 0 0 10px;
  font-weight: 600;
  background: linear-gradient(90deg, #4299e1, #63b3ed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-subtitle {
  font-size: 1.2rem;
  color: #718096;
  margin: 0 0 30px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid rgba(220, 220, 220, 0.3);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(66, 153, 225, 0.3);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.feature-title {
  font-size: 1.3rem;
  color: #2d3748;
  margin: 0 0 10px;
  font-weight: 500;
}

.feature-desc {
  color: #718096;
  margin: 0;
  line-height: 1.6;
}

.quick-access {
  margin-bottom: 40px;
}

.section-title {
  font-size: 1.5rem;
  color: #2d3748;
  margin: 0 0 20px;
  padding-left: 10px;
  border-left: 4px solid #4299e1;
}

.access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

.access-item {
  background: white;
  border-radius: 12px;
  padding: 25px 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(220, 220, 220, 0.3);
}

.access-item:hover {
  background: linear-gradient(135deg, #4299e1, #63b3ed);
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(66, 153, 225, 0.2);
}

.access-icon {
  font-size: 2rem;
  margin-bottom: 10px;
  display: block;
}

.access-label {
  font-size: 0.95rem;
  font-weight: 500;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(220, 220, 220, 0.3);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #4299e1;
  margin-bottom: 5px;
}

.stat-label {
  color: #718096;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .access-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .stats-section {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .stats-section {
    grid-template-columns: 1fr;
  }

  .welcome-banner {
    padding: 20px 10px;
  }
}
</style>
