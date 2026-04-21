<template>
  <div class="home-wrapper">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <header class="navbar glass-effect">
      <div class="nav-container">
        <div class="logo">
          <img src="../assets/logo.svg" alt="logo" class="logo-img" />
          <span class="brand-title">中小学生在线测试系统</span>
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
              round
              @click="$router.push('/admin')"
            >
              <el-icon><Monitor /></el-icon> 进入控制台
            </el-button>
            
            <el-dropdown @command="handleCommand" trigger="click" class="user-dropdown">
              <span class="avatar-wrapper glass-effect-light">
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
      
      <section class="hero-section animate-fade-up" style="animation-delay: 0.1s;">
        <div class="carousel-container premium-card">
          <el-carousel 
            v-model="activeBannerIndex"
            :interval="6000" 
            height="360px"
            arrow="hover"
            class="custom-carousel"
          >
            <el-carousel-item v-for="(banner, index) in bannerList" :key="index">
              <div class="banner-item" @click="handleBannerClick(banner)">
                <img :src="normalizeImageUrl(banner.imageUrl)" class="banner-img" />
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
            <div class="notice-item glass-effect-light" v-for="(notice, index) in noticeList.slice(0,4)" :key="index" @click="handleNoticeClick(notice)">
              <div class="notice-indicator" :class="notice.type.toLowerCase()"></div>
              <div class="notice-content-wrapper">
                <h4 class="notice-title">{{ notice.title }}</h4>
                <span class="notice-date">{{ formatTime(notice.createTime).split(' ')[0] }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="stats-section premium-card animate-fade-up" style="animation-delay: 0.2s;">
        <div class="stat-item">
          <div class="stat-value text-gradient-blue">{{ stats.questionCount || 0 }}</div>
          <div class="stat-label">海量精选题库</div>
        </div>
        <div class="stat-item">
          <div class="stat-value text-gradient-purple">{{ stats.userCount || 0 }}</div>
          <div class="stat-label">入驻师生总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value text-gradient-orange">{{ stats.examCount || 0 }}</div>
          <div class="stat-label">累计考试场次</div>
        </div>
        <div class="stat-item">
          <div class="stat-value text-gradient-green">{{ stats.todayExamCount || 0 }}</div>
          <div class="stat-label">今日活跃评估</div>
        </div>
      </section>

      <section class="features-section animate-fade-up" style="animation-delay: 0.3s;">
        <h2 class="section-heading">探索核心能力</h2>
        <div class="feature-grid">
          <div class="feature-card premium-card glass-effect" @click="goToExam">
            <div class="icon-wrapper bg-blur-blue"><el-icon><Document /></el-icon></div>
            <h3>智能组卷考试</h3>
            <p>基于先进算法实现知识点全覆盖，支持自动防作弊与极速智能批改体验。</p>
          </div>
          
          <div class="feature-card premium-card glass-effect" @click="goToPractice">
            <div class="icon-wrapper bg-blur-green"><el-icon><Edit /></el-icon></div>
            <h3>个性化刷题</h3>
            <p>动态跟踪薄弱环节，为您量身定制每日练习计划，告别无效题海战术。</p>
          </div>
          
          <div class="feature-card premium-card glass-effect" @click="goToRanking">
            <div class="icon-wrapper bg-blur-orange"><el-icon><Trophy /></el-icon></div>
            <h3>全维能力排行</h3>
            <p>多维度的学习数据天梯榜单，与全站学霸同台竞技，激发内在学习潜能。</p>
          </div>
          
          <div class="feature-card premium-card glass-effect" @click="goToAnalysis">
            <div class="icon-wrapper bg-blur-purple"><el-icon><DataAnalysis /></el-icon></div>
            <h3>深度学情诊断</h3>
            <p>生成专属学习雷达图与诊断报告，精准定位知识盲区，提供下一步提升建议。</p>
          </div>
        </div>
      </section>

      <section class="popular-section animate-fade-up" style="animation-delay: 0.4s;">
        <div class="section-header">
          <h2 class="section-heading" style="margin:0;">本周热门演练</h2>
          <el-button link class="btn-hover-glow" @click="goToPractice">进入题库探索 <el-icon><Right /></el-icon></el-button>
        </div>
        <div class="popular-grid">
          <div class="question-card premium-card" v-for="question in popularQuestions" :key="question.id" @click="goToPopularQuestion(question)">
            <div class="q-header">
              <el-tag :type="getQuestionTypeTag(question.type)" size="small" effect="dark" class="q-type custom-tag">
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

    <el-dialog v-model="noticeDetailVisible" :title="selectedNotice?.title" width="600px" class="premium-dialog glass-dialog">
      <div class="notice-detail" v-if="selectedNotice">
        <div class="detail-meta">
          <el-tag size="small" :type="getNoticeTypeTag(selectedNotice.type)" effect="dark" class="custom-tag">
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

const normalizeImageUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\/(localhost|127\.0\.0\.1):9000\//i.test(url)) {
    const minioPrefix = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1):9000\//i, '')
    return `/api/files/minio/${encodeURI(minioPrefix)}`
  }
  if (/^https?:\/\//i.test(url)) {
    return encodeURI(url)
  }
  return url
}

const getBannerList = async () => {
  try {
    const res = await request.get('/api/banners/active')
    bannerList.value = res.data || []
  } catch (error) {
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
    noticeList.value = [
      { id: 1, title: '平台V2.0核心引擎升级完成通知', content: '系统已完成底层架构升级，并发处理能力提升300%。', type: 'SYSTEM', createTime: '2024-06-24 10:00:00' },
      { id: 2, title: '智能组卷模块开启公测', content: '一键生成高阶试卷，欢迎各位教师体验。', type: 'FEATURE', createTime: '2024-06-23 15:30:00' },
      { id: 3, title: '关于规范在线考试纪律的联合声明', content: '请自觉遵守平台规范。', type: 'NOTICE', createTime: '2024-06-22 09:00:00' }
    ]
  }
}

const getPopularQuestions = async () => {
  try {
    const res = await request.get('/api/questions/popular', { params: { size: 6 } })
    popularQuestions.value = res.data || []
  } catch (error) {
    popularQuestions.value = []
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
const goToPopularQuestion = async (question) => {
  try {
    await request.post(`/api/questions/${question.id}/view`)
  } catch (error) {}
  router.push({
    path: '/practice',
    query: {
      questionId: question.id,
      categoryId: question.categoryId,
      fromHomeHot: '1'
    }
  })
}
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
/* 全局设定与高级背景 */
.home-wrapper {
  position: relative;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #0f172a;
  overflow-x: hidden;
}

/* 绝美环境光背景 (Ambient Orbs) */
.ambient-background {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s infinite alternate ease-in-out;
}
.blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%); }
.blob-2 { bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%); animation-delay: -5s; }
.blob-3 { top: 40%; left: 60%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(16, 185, 129, 0.1), transparent 70%); animation-delay: -10s; }

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(5%, 10%) scale(1.1); }
}

/* 进场动画 */
.animate-fade-up {
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 核心毛玻璃卡片 */
.glass-effect {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
}
.glass-effect-light {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.premium-card {
  border-radius: 24px;
  box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.06), 0 4px 12px -4px rgba(15, 23, 42, 0.04);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.premium-card:hover {
  box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.1);
}

/* --- 导航栏 (高级悬浮) --- */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}
.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.logo { display: flex; align-items: center; gap: 14px; }
.logo-img { height: 36px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
.brand-title { font-size: 19px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px; }

.nav-menu { flex: 1; display: flex; justify-content: center; gap: 40px; }
.nav-item { font-size: 15px; color: #475569; font-weight: 600; transition: color 0.3s ease; }
.nav-item:hover { color: #3b82f6; background: transparent; transform: translateY(-1px); }

.nav-actions { display: flex; align-items: center; gap: 16px; }
.login-btn { color: #475569; font-weight: 600; }
.register-btn { border-radius: 12px; font-weight: 600; padding: 10px 20px; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
.admin-entry-btn { border-radius: 12px; font-weight: 600; background: #0f172a; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15,23,42,0.2); }
.admin-entry-btn:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15,23,42,0.3); }

.avatar-wrapper {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  padding: 6px 12px 6px 6px; border-radius: 24px;
  transition: all 0.3s ease;
}
.avatar-wrapper:hover { background: rgba(255,255,255,0.8); transform: translateY(-1px); }
.username { font-size: 14px; font-weight: 600; color: #0f172a; }
.arrow-icon { color: #64748b; font-size: 12px; }

/* --- 主体容器 --- */
.main-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

/* --- 首屏 Hero 区 --- */
.hero-section {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 24px;
  margin-bottom: 32px;
}
.carousel-container { height: 360px; background: #fff; }
.banner-item { position: relative; width: 100%; height: 100%; cursor: pointer; }
.banner-img { width: 100%; height: 100%; object-fit: cover; transition: transform 6s ease; }
.banner-item:hover .banner-img { transform: scale(1.04); }
.banner-mask {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0) 70%);
  display: flex; align-items: flex-end; padding: 48px;
}
.banner-text .title { color: #fff; font-size: 28px; font-weight: 700; margin: 0 0 12px 0; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.banner-text .desc { color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; font-weight: 400; }

/* 公告面板 */
.notice-panel { padding: 28px; display: flex; flex-direction: column; background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.panel-header h3 { margin: 0; font-size: 18px; color: #0f172a; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.notice-list { display: flex; flex-direction: column; gap: 16px; }
.notice-item {
  display: flex; align-items: flex-start; gap: 14px;
  cursor: pointer; padding: 14px; border-radius: 16px;
  transition: all 0.3s ease;
}
.notice-item:hover { background: #ffffff; transform: translateX(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.notice-indicator { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; box-shadow: 0 0 8px currentColor; }
.notice-indicator.system { background-color: #ef4444; color: #ef4444; }
.notice-indicator.feature { background-color: #3b82f6; color: #3b82f6; }
.notice-indicator.notice { background-color: #f59e0b; color: #f59e0b; }

.notice-content-wrapper { flex: 1; overflow: hidden; }
.notice-title { margin: 0 0 8px 0; font-size: 15px; color: #1e293b; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notice-date { font-size: 12px; color: #64748b; font-weight: 500; }

/* --- 统计条 (流光数字) --- */
.stats-section {
  display: flex; justify-content: space-around; align-items: center;
  padding: 36px 40px; margin-bottom: 56px;
  background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(16px);
}
.stat-item { text-align: center; flex: 1; position: relative; }
.stat-item:not(:last-child)::after {
  content: ''; position: absolute; right: 0; top: 10%; height: 80%; width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(15,23,42,0.1), transparent);
}
.stat-value { font-size: 40px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin-bottom: 8px; line-height: 1; }
.text-gradient-blue { background: linear-gradient(135deg, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-gradient-purple { background: linear-gradient(135deg, #8b5cf6, #d946ef); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-gradient-orange { background: linear-gradient(135deg, #f59e0b, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-gradient-green { background: linear-gradient(135deg, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat-label { font-size: 14px; color: #64748b; font-weight: 600; }

/* --- 核心能力矩阵 --- */
.features-section { margin-bottom: 72px; }
.section-heading { font-size: 26px; color: #0f172a; font-weight: 800; margin-bottom: 32px; letter-spacing: -0.5px; }
.feature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.feature-card { padding: 40px 24px; text-align: center; cursor: pointer; }
.feature-card:hover { transform: translateY(-8px); }
.icon-wrapper {
  width: 64px; height: 64px; margin: 0 auto 24px; border-radius: 20px;
  display: flex; align-items: center; justify-content: center; font-size: 32px;
}
/* 弥散光效图标背景 */
.bg-blur-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; box-shadow: inset 0 0 0 1px rgba(59,130,246,0.2), 0 8px 24px rgba(59,130,246,0.15); }
.bg-blur-green { background: rgba(16, 185, 129, 0.1); color: #10b981; box-shadow: inset 0 0 0 1px rgba(16,185,129,0.2), 0 8px 24px rgba(16,185,129,0.15); }
.bg-blur-orange { background: rgba(245, 158, 11, 0.1); color: #f59e0b; box-shadow: inset 0 0 0 1px rgba(245,158,11,0.2), 0 8px 24px rgba(245,158,11,0.15); }
.bg-blur-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; box-shadow: inset 0 0 0 1px rgba(139,92,246,0.2), 0 8px 24px rgba(139,92,246,0.15); }

.feature-card h3 { font-size: 19px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0; }
.feature-card p { font-size: 14px; color: #64748b; line-height: 1.7; margin: 0; font-weight: 500; }

/* --- 热门题目区 --- */
.popular-section { margin-bottom: 40px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;}
.btn-hover-glow { font-weight: 600; color: #3b82f6; transition: all 0.3s; }
.btn-hover-glow:hover { text-shadow: 0 0 12px rgba(59,130,246,0.4); transform: translateX(4px); }

.popular-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.question-card {
  padding: 24px; display: flex; flex-direction: column;
  background: rgba(255,255,255,0.8); backdrop-filter: blur(10px);
}
.question-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(15,23,42,0.06); }
.q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.custom-tag { border-radius: 8px; font-weight: 600; border: none; padding: 0 12px; }
.q-diff { font-size: 13px; font-weight: 700; background: #f1f5f9; padding: 4px 10px; border-radius: 8px; }
.q-diff.easy { color: #10b981; background: #ecfdf5; }
.q-diff.medium { color: #f59e0b; background: #fffbeb; }
.q-diff.hard { color: #ef4444; background: #fef2f2; }
.q-title { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0 0 20px 0; line-height: 1.6; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
.q-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 500; color: #64748b; }
.q-category { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: #f8fafc; border-radius: 8px; }
.q-metrics { display: flex; gap: 16px; }

/* --- 对话框深度美化 --- */
.glass-dialog { background: rgba(255,255,255,0.9) !important; backdrop-filter: blur(24px) !important; border-radius: 24px !important; }
:deep(.glass-dialog .el-dialog__header) { border-bottom: 1px solid rgba(15,23,42,0.06); padding: 24px 32px; }
:deep(.glass-dialog .el-dialog__title) { font-weight: 700; font-size: 18px; color: #0f172a; }
.detail-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px dashed rgba(15,23,42,0.1); }
.detail-meta .time { color: #64748b; font-size: 14px; font-weight: 500; }
.detail-content { font-size: 15px; line-height: 1.9; color: #334155; }

/* 响应式 */
@media (max-width: 992px) {
  .hero-section { grid-template-columns: 1fr; }
  .feature-grid { grid-template-columns: repeat(2, 1fr); }
  .popular-grid { grid-template-columns: repeat(2, 1fr); }
  .stats-section { flex-wrap: wrap; gap: 20px; padding: 24px; }
  .stat-item::after { display: none; }
  .stat-item { width: 45%; }
  .nav-menu { display: none; }
}
@media (max-width: 576px) {
  .feature-grid, .popular-grid { grid-template-columns: 1fr; }
  .stat-item { width: 100%; }
}
</style>