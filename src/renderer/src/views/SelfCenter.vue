<template>
  <div class="self-center">
    <div class="header">
      <h1>👤 个人中心</h1>
      <p>管理您的账户信息和设置</p>
    </div>

    <div class="profile-container">
      <!-- 用户信息卡片 -->
      <div class="info-card">
        <div class="avatar-section">
          <div class="avatar">
            <span class="initials">M</span>
          </div>
          <div class="user-info">
            <h2>{{userInfo.name}}</h2>
            <p class="email">{{userInfo.email}}</p>
          </div>
        </div>
        <div class="edit-profile">
          <el-button type="primary" size="default">编辑资料</el-button>
        </div>
      </div>

      <!-- 功能卡片区域 -->
      <div class="features-grid">
        <!-- 个人资料 -->
        <div class="feature-card">
          <div class="card-icon">
            <i class="el-icon-user"></i>
          </div>
          <h3>个人资料</h3>
          <p>管理您的个人信息</p>
          <el-button type="text" class="action-btn">查看</el-button>
        </div>

        <!-- 安全设置 -->
        <div class="feature-card">
          <div class="card-icon">
            <i class="el-icon-lock"></i>
          </div>
          <h3>安全设置</h3>
          <p>密码、隐私等安全选项</p>
          <el-button type="text" class="action-btn">设置</el-button>
        </div>

        <!-- 通知设置 -->
        <div class="feature-card">
          <div class="card-icon">
            <i class="el-icon-bell"></i>
          </div>
          <h3>通知设置</h3>
          <p>管理通知偏好</p>
          <el-button type="text" class="action-btn">配置</el-button>
        </div>

        <!-- 历史记录 -->
        <div class="feature-card">
          <div class="card-icon">
            <i class="el-icon-document"></i>
          </div>
          <h3>操作历史</h3>
          <p>查看您的操作记录</p>
          <el-button type="text" class="action-btn">查看</el-button>
        </div>

        <!-- 主题设置 -->
        <div class="feature-card">
          <div class="card-icon">
            <i class="el-icon-moon"></i>
          </div>
          <h3>主题设置</h3>
          <p>个性化界面主题</p>
          <el-button type="text" class="action-btn">设置</el-button>
        </div>

        <!-- 帮助中心 -->
        <div class="feature-card">
          <div class="card-icon">
            <i class="el-icon-question-filled"></i>
          </div>
          <h3>帮助中心</h3>
          <p>常见问题解答</p>
          <el-button type="text" class="action-btn">查看</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 模拟用户信息
interface UserInfo {
  name: string
  email: string
  avatar: string
}

const userInfo = ref<UserInfo>({
  name: '用户名',
  email: 'user@example.com',
  avatar: ''
})

onMounted(() => {

})
</script>

<style scoped>
.self-center {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
  color: #2c3e50;
}

.header p {
  margin: 10px 0 0;
  font-size: 1.2rem;
  color: #7f8c8d;
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.initials {
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.user-info h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.email {
  margin: 5px 0 0;
  color: #7f8c8d;
  font-size: 1rem;
}

.edit-profile {
  display: flex;
  align-items: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.12);
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.card-icon i {
  font-size: 24px;
  color: white;
}

.feature-card h3 {
  margin: 0 0 10px;
  font-size: 1.3rem;
  color: #2c3e50;
}

.feature-card p {
  margin: 0 0 15px;
  color: #7f8c8d;
  flex-grow: 1;
}

.action-btn {
  align-self: flex-start;
  color: #409eff;
  padding: 0;
  font-weight: 500;
}

.action-btn:hover {
  color: #66b1ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-card {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .avatar-section {
    justify-content: center;
  }

  .edit-profile {
    width: 100%;
    justify-content: center;
  }

  .header h1 {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
