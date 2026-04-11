<template>
  <div class="dashboard-container">
    <div class="welcome-banner premium-card">
      <div class="banner-left">
        <div class="avatar-box">
          <el-avatar :size="64" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
        </div>
        <div class="welcome-text">
          <h1 class="greeting">{{ timeGreeting }}，{{ userName }}！</h1>
          <p class="date-subtitle">
            今天是 {{ currentDate }}，系统各项服务运行平稳，祝您工作顺心。
          </p>
        </div>
      </div>
      <div class="banner-right">
        <div class="weather-widget">
          <el-icon class="weather-icon"><Sunny /></el-icon>
          <div class="weather-info">
            <span class="temp">24°C</span>
            <span class="desc">晴朗 · 适宜办公</span>
          </div>
        </div>
      </div>
      <div class="banner-decor decor-1"></div>
      <div class="banner-decor decor-2"></div>
    </div>

    <div class="section-title">数据概览</div>
    <div class="stats-grid">
      <div class="stat-card premium-card">
        <div class="stat-header">
          <span class="stat-title">题库总规模</span>
          <div class="icon-wrapper bg-blue"><el-icon><Document /></el-icon></div>
        </div>
        <div class="stat-body">
          <span class="stat-num">1,280</span>
          <span class="stat-unit">道</span>
        </div>
        <div class="stat-footer">
          <span class="trend up"><el-icon><Top /></el-icon> 12%</span>
          <span class="trend-text">较上周新增</span>
        </div>
      </div>

      <div class="stat-card premium-card">
        <div class="stat-header">
          <span class="stat-title">成卷总数</span>
          <div class="icon-wrapper bg-green"><el-icon><Files /></el-icon></div>
        </div>
        <div class="stat-body">
          <span class="stat-num">74</span>
          <span class="stat-unit">份</span>
        </div>
        <div class="stat-footer">
          <span class="trend up"><el-icon><Top /></el-icon> 5%</span>
          <span class="trend-text">较上周新增</span>
        </div>
      </div>

      <div class="stat-card premium-card">
        <div class="stat-header">
          <span class="stat-title">平台用户总数</span>
          <div class="icon-wrapper bg-orange"><el-icon><User /></el-icon></div>
        </div>
        <div class="stat-body">
          <span class="stat-num">5,621</span>
          <span class="stat-unit">人</span>
        </div>
        <div class="stat-footer">
          <span class="trend up"><el-icon><Top /></el-icon> 28%</span>
          <span class="trend-text">较上月增长</span>
        </div>
      </div>

      <div class="stat-card premium-card">
        <div class="stat-header">
          <span class="stat-title">待办审批</span>
          <div class="icon-wrapper bg-red"><el-icon><Bell /></el-icon></div>
        </div>
        <div class="stat-body">
          <span class="stat-num text-danger">3</span>
          <span class="stat-unit">项</span>
        </div>
        <div class="stat-footer">
          <span class="trend-text">需尽快处理</span>
        </div>
      </div>
    </div>

    <div class="section-title">快捷入口</div>
    <div class="quick-actions-grid">
      <div 
        class="action-card premium-card" 
        v-for="action in quickActions" 
        :key="action.title"
        @click="router.push(action.path)"
      >
        <div class="action-icon-box" :style="{ background: action.bgColor, color: action.color }">
          <el-icon><component :is="action.icon" /></el-icon>
        </div>
        <div class="action-info">
          <h3>{{ action.title }}</h3>
          <p>{{ action.desc }}</p>
        </div>
        <el-icon class="action-arrow"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Document, Files, User, Bell, 
  Promotion, Folder, Sunny, Top, ArrowRight,
  Monitor
} from '@element-plus/icons-vue'

const router = useRouter()
const currentDate = ref('')
const timeGreeting = ref('您好')
const userName = ref('管理员')

const quickActions = ref([
  { 
    title: '题库维护', 
    desc: '录入、编辑与管理考试题目',
    icon: Document, 
    path: '/admin/question-manage', 
    color: '#1677ff',
    bgColor: '#e8f3ff'
  },
  { 
    title: '试卷组建', 
    desc: '自定义组卷或智能一键生成',
    icon: Files, 
    path: '/admin/paper-manage', 
    color: '#00b42a',
    bgColor: '#e8ffea'
  },
  { 
    title: '系统公告', 
    desc: '向全平台师生发布通知广播',
    icon: Promotion, 
    path: '/admin/notice-manage', 
    color: '#ff7d00',
    bgColor: '#fff3e8'
  },
  { 
    title: '分类管理', 
    desc: '配置题目及试卷的层级分类',
    icon: Folder, 
    path: '/admin/category-manage', 
    color: '#722ed1',
    bgColor: '#f2e8ff'
  },
])

const initGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) timeGreeting.value = '凌晨好'
  else if (hour < 9) timeGreeting.value = '早上好'
  else if (hour < 12) timeGreeting.value = '上午好'
  else if (hour < 14) timeGreeting.value = '中午好'
  else if (hour < 18) timeGreeting.value = '下午好'
  else timeGreeting.value = '晚上好'
}

onMounted(() => {
  const today = new Date()
  currentDate.value = today.toLocaleDateString('zh-CN', { 
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
  })
  
  initGreeting()

  // 动态读取当前登录用户的身份
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    const userInfo = JSON.parse(userInfoStr)
    const roleName = String(userInfo.role) === '1' ? '老师' : '管理员'
    userName.value = userInfo.realName || userInfo.username || roleName
  }
})
</script>

<style scoped>
/* 全局页面底色与排版 */
.dashboard-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 高级卡片基础样式：去边框，加弥散阴影 */
.premium-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(29, 35, 41, 0.03);
  border: 1px solid #f0f2f5;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 32px 0 16px 4px;
}

/* --- 欢迎横幅 --- */
.welcome-banner {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 40px;
  overflow: hidden;
  background: linear-gradient(105deg, #ffffff 0%, #f7f9fd 100%);
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 24px;
  z-index: 2;
}

.avatar-box {
  padding: 4px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.greeting {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 10px 0;
  letter-spacing: 0.5px;
}

.date-subtitle {
  font-size: 14px;
  color: #86909c;
  margin: 0;
}

.banner-right {
  z-index: 2;
}

.weather-widget {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.weather-icon {
  font-size: 28px;
  color: #faad14;
}

.weather-info {
  display: flex;
  flex-direction: column;
}

.weather-info .temp {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.weather-info .desc {
  font-size: 12px;
  color: #86909c;
}

/* 装饰光晕 */
.banner-decor {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  z-index: 1;
}
.decor-1 {
  width: 300px;
  height: 300px;
  background: rgba(22, 119, 255, 0.05);
  top: -100px;
  right: 10%;
}
.decor-2 {
  width: 200px;
  height: 200px;
  background: rgba(114, 46, 209, 0.03);
  bottom: -50px;
  right: -20px;
}

/* --- 数据概览卡片 --- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.stat-card {
  padding: 24px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(29, 35, 41, 0.06);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.stat-title {
  font-size: 14px;
  color: #86909c;
  font-weight: 500;
}

/* 高级图标容器：去掉了厚重的全色背景，改为浅色底+主题色图标 */
.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.bg-blue { background: #e8f3ff; color: #1677ff; }
.bg-green { background: #e8ffea; color: #00b42a; }
.bg-orange { background: #fff3e8; color: #ff7d00; }
.bg-red { background: #ffece8; color: #f53f3f; }

.stat-body {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 16px;
}

.stat-num {
  font-size: 32px;
  font-weight: 700;
  color: #1d2129;
  font-family: din-condensed, impact, sans-serif;
}
.text-danger { color: #f53f3f; }

.stat-unit {
  font-size: 13px;
  color: #86909c;
}

.stat-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding-top: 16px;
  border-top: 1px dashed #f0f2f5;
}

.trend.up { color: #00b42a; font-weight: 500; display: flex; align-items: center; }
.trend-text { color: #86909c; }

/* --- 快捷操作矩阵 --- */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.action-card {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  position: relative;
}

.action-card:hover {
  transform: translateY(-4px);
  border-color: #d9e1eb;
  box-shadow: 0 10px 24px rgba(29, 35, 41, 0.06);
}

.action-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  transition: transform 0.3s;
}

.action-card:hover .action-icon-box {
  transform: scale(1.05);
}

.action-info h3 {
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #1d2129;
  font-weight: 600;
}

.action-info p {
  margin: 0;
  font-size: 13px;
  color: #86909c;
  line-height: 1.4;
}

.action-arrow {
  position: absolute;
  right: 24px;
  font-size: 16px;
  color: #c9cdd4;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s;
}

.action-card:hover .action-arrow {
  opacity: 1;
  transform: translateX(0);
  color: #1677ff;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .stats-grid, .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .welcome-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  .banner-right {
    align-self: flex-end;
  }
  .stats-grid, .quick-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>