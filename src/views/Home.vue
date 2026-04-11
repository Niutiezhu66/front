<template>
  <div class="home-wrapper">
    <header class="navbar">
      <div class="nav-container">
        <div class="logo">
          <img src="../assets/logo.svg" alt="logo" class="logo-img" />
          <span class="brand-title">中小学生的在线测试系统</span>
        </div>
        
        <div class="nav-menu">
          <el-button link class="nav-item" @click="goToExam">智能考试</el-button>
          <el-button link class="nav-item" @click="goToPractice">题库练习</el-button>
          <el-button link class="nav-item" @click="goToRanking">排行榜</el-button>
        </div>

        <div class="nav-actions">
          <template v-if="!isLoggedIn">
            <el-button class="login-btn" text @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" class="register-btn" @click="$router.push('/register')">免费注册</el-button>
          </template>

          <template v-else>
            <el-button 
              v-if="userRole === 0 || userRole === 1" 
              class="admin-entry-btn"
              type="primary" 
              plain 
              round
              @click="$router.push('/admin')"
            >
              <el-icon><Monitor /></el-icon> 进入控制台
            </el-button>
            
            <el-dropdown @command="handleCommand" trigger="click" class="user-dropdown">
              <span class="avatar-wrapper">
                <el-avatar :size="36" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" class="user-avatar" />
                <span class="username">{{ userInfo.nickname || userInfo.username }}</span>
                <el-icon class="arrow-icon"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu class="custom-dropdown">
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided class="text-danger">
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </div>
    </header>

    <main class="main-content">
      
      <section class="hero-section">
        <div class="carousel-container premium-card">
          <el-carousel 
            v-model="activeBannerIndex"
            :interval="6000" 
            height="340px"
            arrow="hover"
            class="custom-carousel"
          >
            <el-carousel-item v-for="(banner, index) in bannerList" :key="index">
              <div class="banner-item" @click="handleBannerClick(banner)">
                <img :src="banner.imageUrl" class="banner-img" />
                <div class="banner-mask">
                  <div class="banner-text">
                    <h2 class="title">{{ banner.title }}</h2>
                    <p class="desc">{{ banner.description }}</p>
                  </div>
                </div>
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>

        <div class="notice-panel premium-card">
          <div class="panel-header">
            <h3><el-icon><Bell /></el-icon> 系统公告</h3>
            <el-button link class="more-btn">更多</el-button>
          </div>
          <div class="notice-list">
            <div class="notice-item" v-for="(notice, index) in noticeList.slice(0,4)" :key="index" @click="handleNoticeClick(notice)">
              <div class="notice-indicator" :class="notice.type.toLowerCase()"></div>
              <div class="notice-content-wrapper">
                <h4 class="notice-title">{{ notice.title }}</h4>
                <span class="notice-date">{{ formatTime(notice.createTime).split(' ')[0] }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="stats-section premium-card">
        <div class="stat-item">
          <div class="stat-value">{{ stats.questionCount || 0 }}</div>
          <div class="stat-label">海量精选题库</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.userCount || 0 }}</div>
          <div class="stat-label">入驻师生总数</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.examCount || 0 }}</div>
          <div class="stat-label">累计考试场次</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value text-primary">{{ stats.todayExamCount || 0 }}</div>
          <div class="stat-label">今日活跃评估</div>
        </div>
      </section>

      <section class="features-section">
        <h2 class="section-heading">探索核心能力</h2>
        <div class="feature-grid">
          <div class="feature-card" @click="goToExam">
            <div class="icon-wrapper bg-blue"><el-icon><Document /></el-icon></div>
            <h3>智能组卷考试</h3>
            <p>基于先进算法实现知识点全覆盖，支持自动防作弊与极速智能批改体验。</p>
          </div>
          
          <div class="feature-card" @click="goToPractice">
            <div class="icon-wrapper bg-green"><el-icon><Edit /></el-icon></div>
            <h3>个性化刷题</h3>
            <p>AI动态跟踪薄弱环节，为您量身定制每日练习计划，告别无效题海战术。</p>
          </div>
          
          <div class="feature-card" @click="goToRanking">
            <div class="icon-wrapper bg-orange"><el-icon><Trophy /></el-icon></div>
            <h3>全维能力排行</h3>
            <p>多维度的学习数据天梯榜单，与全站学霸同台竞技，激发内在学习潜能。</p>
          </div>
          
          <div class="feature-card" @click="goToAnalysis">
            <div class="icon-wrapper bg-purple"><el-icon><DataAnalysis /></el-icon></div>
            <h3>AI 学情诊断</h3>
            <p>生成专属学习雷达图与诊断报告，精准定位知识盲区，提供下一步提升建议。</p>
          </div>
        </div>
      </section>

      <section class="popular-section">
        <div class="section-header">
          <h2 class="section-heading" style="margin:0;">本周热门演练</h2>
          <el-button link type="primary" @click="goToPractice">进入题库探索 <el-icon><Right /></el-icon></el-button>
        </div>
        <div class="popular-grid">
          <div class="question-card premium-card" v-for="question in popularQuestions" :key="question.id">
            <div class="q-header">
              <el-tag :type="getQuestionTypeTag(question.type)" size="small" effect="light" class="q-type">
                {{ getQuestionTypeText(question.type) }}
              </el-tag>
              <span class="q-diff" :class="question.difficulty.toLowerCase()">{{ getDifficultyText(question.difficulty) }}</span>
            </div>
            <h4 class="q-title">{{ question.title }}</h4>
            <div class="q-footer">
              <span class="q-category"><el-icon><Folder /></el-icon> {{ question.categoryName || '通用分类' }}</span>
              <div class="q-metrics">
                <span><el-icon><View /></el-icon> {{ question.viewCount || 0 }}</span>
                <span><el-icon><Select /></el-icon> {{ question.correctRate || 0 }}% 胜率</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>

    <el-dialog v-model="noticeDetailVisible" :title="selectedNotice?.title" width="600px" class="premium-dialog">
      <div class="notice-detail" v-if="selectedNotice">
        <div class="detail-meta">
          <el-tag size="small" :type="getNoticeTypeTag(selectedNotice.type)" effect="light">
            {{ getNoticeTypeText(selectedNotice.type) }}
          </el-tag>
          <span class="time">{{ formatTime(selectedNotice.createTime) }}</span>
        </div>
        <div class="detail-content" v-html="selectedNotice.content"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Document, Edit, Trophy, Bell, DataAnalysis, View, Select,
  User, Monitor, SwitchButton, ArrowDown, Right, Folder
} from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()

const isLoggedIn = ref(false)
const userInfo = ref({})
const userRole = ref(2) 

onMounted(() => {
  const userStr = localStorage.getItem('userInfo')
  if (userStr) {
    try {
      userInfo.value = JSON.parse(userStr)
      isLoggedIn.value = true
      userRole.value = Number(userInfo.value.role)
    } catch (e) {}
  }
})

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('userInfo')
    isLoggedIn.value = false
    ElMessage.success('已安全退出')
    window.location.href = '/' 
  } else if (command === 'profile') {
    router.push('/profile') 
  }
}

const bannerList = ref([])
const noticeList = ref([])
const popularQuestions = ref([])
const stats = ref({ questionCount: 0, userCount: 0, examCount: 0, todayExamCount: 0 })

const noticeDetailVisible = ref(false)
const selectedNotice = ref(null)
const activeBannerIndex = ref(0)

const getBannerList = async () => {
  try {
    const res = await request.get('/api/banners/active')
    bannerList.value = res.data || []
  } catch (error) {
    // Fallback data
    bannerList.value = [
      { id: 1, title: '下一代智能评估引擎', description: '结合深度学习算法，为您提供精准的能力诊断与个性化提升方案。', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop', linkUrl: '/practice' },
      { id: 2, title: '全学段海量题库', description: '紧贴最新教学大纲，支持多维度组卷与一键智能批改。', imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop', linkUrl: '/exam/list' }
    ]
  }
}

const getNoticeList = async () => {
  try {
    const res = await request.get('/api/notices/latest', { params: { limit: 5 } })
    noticeList.value = res.data || []
  } catch (error) {
    // Fallback data
    noticeList.value = [
      { id: 1, title: '平台V2.0核心引擎升级完成通知', content: '系统已完成底层架构升级，并发处理能力提升300%。', type: 'SYSTEM', createTime: '2024-06-24 10:00:00' },
      { id: 2, title: '全新AI组卷模块开启公测', content: '一键生成高阶试卷，欢迎各位教师体验。', type: 'FEATURE', createTime: '2024-06-23 15:30:00' },
      { id: 3, title: '关于规范在线考试纪律的联合声明', content: '请自觉遵守平台规范。', type: 'NOTICE', createTime: '2024-06-22 09:00:00' }
    ]
  }
}

const getPopularQuestions = async () => {
  try {
    const res = await request.get('/api/questions/popular', { params: { size: 6 } })
    popularQuestions.value = res.data || []
  } catch (error) {
    // Dummy Data to show layout
    popularQuestions.value = [
      { id: 1, type: 'CHOICE', difficulty: 'HARD', title: '微积分基础：求解特定函数的极限值与导数应用', categoryName: '高等数学', viewCount: 1205, correctRate: 34 },
      { id: 2, type: 'JUDGE', difficulty: 'EASY', title: '计算机网络中TCP与UDP协议的核心区别判断', categoryName: '计算机基础', viewCount: 856, correctRate: 88 },
      { id: 3, type: 'TEXT', difficulty: 'MEDIUM', title: '简述Spring Boot框架中自动装配的实现原理', categoryName: 'Java开发', viewCount: 642, correctRate: 65 }
    ]
  }
}

const getStats = async () => {
  try {
    const res = await request.get('/api/stats/overview')
    if (res.code === 200) {
      stats.value = res.data || stats.value
    } else {
      stats.value = { questionCount: 12580, userCount: 3420, examCount: 890, todayExamCount: 45 }
    }
  } catch (error) {
    stats.value = { questionCount: 12580, userCount: 3420, examCount: 890, todayExamCount: 45 }
  }
}

const handleBannerClick = (banner) => {
  if (banner.linkUrl) {
    banner.linkUrl.startsWith('http') ? window.open(banner.linkUrl, '_blank') : router.push(banner.linkUrl)
  }
}

const handleNoticeClick = (notice) => {
  selectedNotice.value = notice
  noticeDetailVisible.value = true
}

const formatTime = (dateStr) => new Date(dateStr).toLocaleString('zh-CN')

const getNoticeTypeTag = (type) => ({ 'SYSTEM': 'danger', 'FEATURE': 'primary', 'NOTICE': 'warning' }[type] || 'info')
const getNoticeTypeText = (type) => ({ 'SYSTEM': '系统', 'FEATURE': '更新', 'NOTICE': '通知' }[type] || '公告')

const getQuestionTypeTag = (type) => ({ 'CHOICE': 'primary', 'JUDGE': 'success', 'TEXT': 'warning' }[type] || 'info')
const getQuestionTypeText = (type) => ({ 'CHOICE': '单选题', 'JUDGE': '判断题', 'TEXT': '简答题' }[type] || type)

const getDifficultyText = (diff) => ({ 'EASY': '初级', 'MEDIUM': '进阶', 'HARD': '困难' }[diff] || diff)

const goToExam = () => router.push('/exam/list')
const goToPractice = () => router.push('/practice')
const goToRanking = () => router.push('/exam-ranking')
const goToAnalysis = () => router.push('/analysis')

onMounted(() => {
  getBannerList()
  getNoticeList()
  getPopularQuestions()
  getStats()
})
</script>

<style scoped>
/* 全局设定 */
.home-wrapper {
  min-height: 100vh;
  background-color: #f5f7fa; /* 纯净灰白底色，现代SaaS标配 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #1d2129;
}

/* 公共高级卡片样式 */
.premium-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(29, 35, 41, 0.03); /* 极度柔和的弥散阴影 */
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

/* --- 导航栏 (毛玻璃悬浮) --- */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-img { height: 32px; }
.brand-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  letter-spacing: 0.5px;
}
.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 32px;
}
.nav-item {
  font-size: 15px;
  color: #4e5969;
  font-weight: 500;
}
.nav-item:hover { color: #1677ff; background: transparent; }
.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.login-btn { color: #4e5969; font-weight: 500; }
.register-btn { border-radius: 6px; font-weight: 500; }
.admin-entry-btn { padding: 8px 16px; }

/* 用户下拉 */
.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background 0.2s;
}
.avatar-wrapper:hover { background: #f2f3f5; }
.username { font-size: 14px; font-weight: 500; color: #1d2129; }
.arrow-icon { color: #86909c; font-size: 12px; }

/* --- 主体容器 --- */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

/* --- 首屏 Hero 区 (分栏设计) --- */
.hero-section {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 24px;
  margin-bottom: 32px;
}
.carousel-container {
  overflow: hidden;
  height: 340px;
}
.banner-item {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.banner-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%);
  display: flex;
  align-items: flex-end;
  padding: 40px;
}
.banner-text .title {
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}
.banner-text .desc {
  color: rgba(255,255,255,0.85);
  font-size: 15px;
  margin: 0;
}

/* 公告面板 */
.notice-panel {
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1d2129;
  display: flex;
  align-items: center;
  gap: 8px;
}
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
  margin: -8px; /* 扩展点击区域 */
}
.notice-item:hover { background: #f7f8fa; }
.notice-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 8px;
}
.notice-indicator.system { background-color: #f53f3f; }
.notice-indicator.feature { background-color: #1677ff; }
.notice-indicator.notice { background-color: #ff7d00; }

.notice-content-wrapper { flex: 1; overflow: hidden; }
.notice-title {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notice-date { font-size: 12px; color: #86909c; }

/* --- 统计条 (极简) --- */
.stats-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 60px;
  margin-bottom: 48px;
}
.stat-item { text-align: center; }
.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1d2129;
  font-family: din-condensed, impact, sans-serif;
  margin-bottom: 4px;
}
.stat-value.text-primary { color: #1677ff; }
.stat-label { font-size: 14px; color: #86909c; }
.stat-divider { width: 1px; height: 40px; background: #e5e6eb; }

/* --- 核心能力矩阵 --- */
.features-section { margin-bottom: 60px; }
.section-heading {
  font-size: 22px;
  color: #1d2129;
  font-weight: 600;
  margin-bottom: 24px;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.feature-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.feature-card:hover {
  transform: translateY(-4px);
  border-color: #e5e6eb;
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
}
.icon-wrapper {
  width: 56px;
  height: 56px;
  margin: 0 auto 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.bg-blue { background: #e8f3ff; color: #1677ff; }
.bg-green { background: #e8ffea; color: #00b42a; }
.bg-orange { background: #fff3e8; color: #ff7d00; }
.bg-purple { background: #f2e8ff; color: #722ed1; }

.feature-card h3 { font-size: 18px; color: #1d2129; margin: 0 0 12px 0; }
.feature-card p { font-size: 13px; color: #86909c; line-height: 1.6; margin: 0; }

/* --- 热门题目区 --- */
.popular-section { margin-bottom: 40px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;}
.popular-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.question-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.question-card:hover { border-color: #d9e1eb; transform: translateY(-2px); }
.q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.q-diff { font-size: 12px; font-weight: 500; }
.q-diff.easy { color: #00b42a; }
.q-diff.medium { color: #ff7d00; }
.q-diff.hard { color: #f53f3f; }
.q-title {
  font-size: 15px;
  color: #333;
  margin: 0 0 16px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.q-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #86909c;
}
.q-category { display: flex; align-items: center; gap: 4px; }
.q-metrics { display: flex; gap: 12px; }

/* --- 对话框深度美化 --- */
:deep(.premium-dialog .el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  margin-right: 0;
  padding: 20px 24px;
}
:deep(.premium-dialog .el-dialog__title) { font-weight: 600; font-size: 16px; }
.detail-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #e5e6eb;
}
.detail-meta .time { color: #86909c; font-size: 13px; }
.detail-content { font-size: 14px; line-height: 1.8; color: #4e5969; }

/* 响应式调整 */
@media (max-width: 992px) {
  .hero-section { grid-template-columns: 1fr; }
  .feature-grid { grid-template-columns: repeat(2, 1fr); }
  .popular-grid { grid-template-columns: repeat(2, 1fr); }
  .stats-section { flex-wrap: wrap; gap: 20px; padding: 24px; }
  .stat-divider { display: none; }
  .stat-item { width: 45%; }
  .nav-menu { display: none; }
}
@media (max-width: 576px) {
  .feature-grid, .popular-grid { grid-template-columns: 1fr; }
  .stat-item { width: 100%; }
}
</style>