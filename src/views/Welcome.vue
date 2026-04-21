<template>
  <div class="dashboard-container">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div class="welcome-banner premium-card animate-fade-up" style="animation-delay: 0.1s;">
      <div class="banner-left">
        <div class="avatar-box glass-effect">
          <el-avatar :size="64" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
        </div>
        <div class="welcome-text">
          <h1 class="greeting">{{ timeGreeting }}，{{ userName }}！</h1>
          <p class="date-subtitle">今天是 {{ currentDate }}</p>
        </div>
      </div>
      <div class="banner-right">
        <div class="weather-widget glass-effect">
          <el-icon class="weather-icon"><Sunny /></el-icon>
          <div class="weather-info">
            <span class="temp">{{ roleName }}</span>
            <span class="desc">{{ dashboardHint }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title animate-fade-up" style="animation-delay: 0.2s;">核心工作台</div>
    <div class="stats-grid animate-fade-up" style="animation-delay: 0.2s;">
      <div class="tool-card premium-card">
        <div class="tool-header">
          <div>
            <div class="tool-title">{{ summaryCardA.title }}</div>
            <div class="tool-subtitle">{{ summaryCardA.desc }}</div>
          </div>
          <div class="icon-wrapper bg-blur-blue"><el-icon><Document /></el-icon></div>
        </div>
        <div class="tool-value-row">
          <span class="tool-value text-gradient-blue">{{ summaryCardA.value }}</span>
          <span class="tool-unit">{{ summaryCardA.unit }}</span>
        </div>
        <div class="tool-footer-tip">{{ summaryCardA.tip }}</div>
      </div>

      <div class="tool-card premium-card">
        <div class="tool-header">
          <div>
            <div class="tool-title">{{ summaryCardB.title }}</div>
            <div class="tool-subtitle">{{ summaryCardB.desc }}</div>
          </div>
          <div class="icon-wrapper bg-blur-green"><el-icon><Files /></el-icon></div>
        </div>
        <div class="tool-value-row">
          <span class="tool-value text-gradient-green">{{ summaryCardB.value }}</span>
          <span class="tool-unit">{{ summaryCardB.unit }}</span>
        </div>
        <div class="tool-footer-tip">{{ summaryCardB.tip }}</div>
      </div>

      <div class="tool-card premium-card">
        <div class="tool-header">
          <div>
            <div class="tool-title">{{ summaryCardC.title }}</div>
            <div class="tool-subtitle">{{ summaryCardC.desc }}</div>
          </div>
          <div class="icon-wrapper bg-blur-orange"><el-icon><User /></el-icon></div>
        </div>
        <div class="tool-value-row">
          <span class="tool-value text-gradient-orange">{{ summaryCardC.value }}</span>
          <span class="tool-unit">{{ summaryCardC.unit }}</span>
        </div>
        <div class="tool-footer-tip">{{ summaryCardC.tip }}</div>
      </div>

      <div class="tool-card premium-card">
        <div class="tool-header">
          <div>
            <div class="tool-title">{{ summaryCardD.title }}</div>
            <div class="tool-subtitle">{{ summaryCardD.desc }}</div>
          </div>
          <div class="icon-wrapper bg-blur-purple"><el-icon><DataAnalysis /></el-icon></div>
        </div>
        <div class="tool-value-row">
          <span class="tool-value text-gradient-purple">{{ summaryCardD.value }}</span>
          <span class="tool-unit">{{ summaryCardD.unit }}</span>
        </div>
        <div class="tool-footer-tip">{{ summaryCardD.tip }}</div>
      </div>
    </div>

    <div class="section-title animate-fade-up" style="animation-delay: 0.25s;">运营看板</div>
    <div class="panel-grid animate-fade-up" style="animation-delay: 0.25s;">
      <div class="panel-card premium-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">最新公告</div>
            <div class="panel-subtitle">最近发布的系统公告</div>
          </div>
          <el-button v-if="roleName !== '老师'" text type="primary" @click="router.push('/admin/notice-manage')">查看全部</el-button>
        </div>
        <div v-if="noticeList.length" class="list-wrap">
          <div class="list-item" v-for="notice in noticeList" :key="notice.id">
            <div class="list-main">
              <div class="list-title">{{ notice.title }}</div>
              <div class="list-meta">{{ getNoticeTypeText(notice.type) }} · {{ formatTime(notice.createTime) }}</div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无公告" :image-size="72" />
      </div>

      <div class="panel-card premium-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">{{ recentListTitle }}</div>
            <div class="panel-subtitle">{{ recentListSubtitle }}</div>
          </div>
          <el-button text type="primary" @click="router.push(recentListPath)">前往处理</el-button>
        </div>
        <div v-if="recentItems.length" class="list-wrap">
          <div class="list-item" v-for="item in recentItems" :key="item.id">
            <div class="list-main">
              <div class="list-title">{{ item.title }}</div>
              <div class="list-meta">{{ item.meta }}</div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="72" />
      </div>
    </div>

    <div class="section-title animate-fade-up" style="animation-delay: 0.3s;">快捷入口</div>
    <div class="quick-actions-grid animate-fade-up" style="animation-delay: 0.3s;">
      <div class="action-card premium-card glass-effect" v-for="action in quickActions" :key="action.title" @click="router.push(action.path)">
        <div class="action-icon-box" :class="action.bgClass"><el-icon><component :is="action.icon" /></el-icon></div>
        <div class="action-info"><h3>{{ action.title }}</h3><p>{{ action.desc }}</p></div>
        <el-icon class="action-arrow"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Promotion, Folder, Sunny, ArrowRight, Document, Files, User, DataAnalysis } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const currentDate = ref('')
const timeGreeting = ref('您好')
const userName = ref('管理员')
const roleName = ref('管理员')
const currentUser = ref({})
const noticeList = ref([])
const recentItems = ref([])
const systemStats = ref({ questionCount: 0, userCount: 0, examCount: 0, todayExamCount: 0, categoryCount: 0, paperCount: 0 })
const teacherStats = ref({ totalExams: 0, totalStudents: 0, avgScore: 0, passRate: 0 })
const teacherStudentCount = ref(0)
const teacherPaperCount = ref(0)
const adminTeacherCount = ref(0)
const adminStudentCount = ref(0)

const dashboardHint = computed(() => roleName.value === '老师' ? '关注学生、试卷与教学分析' : '关注题库、用户与公告运营')

const quickActions = computed(() => {
  if (roleName.value === '老师') {
    return [
      { title: '我的学生', desc: '查看学生名单与绑定关系', icon: User, path: '/admin/my-students', bgClass: 'bg-blur-blue' },
      { title: '试卷管理', desc: '管理自己创建的试卷', icon: Files, path: '/admin/paper-manage', bgClass: 'bg-blur-green' },
      { title: '成绩管理', desc: '查看考试结果与批阅情况', icon: DataAnalysis, path: '/admin/score-manage', bgClass: 'bg-blur-orange' },
      { title: '教学分析', desc: '查看班级整体学情趋势', icon: Promotion, path: '/admin/teacher-analysis', bgClass: 'bg-blur-purple' },
    ]
  }
  return [
    { title: '题库维护', desc: '录入、编辑与管理考试题目', icon: Document, path: '/admin/question-manage', bgClass: 'bg-blur-blue' },
    { title: '试卷组建', desc: '自定义组卷或智能一键生成', icon: Files, path: '/admin/paper-manage', bgClass: 'bg-blur-green' },
    { title: '系统公告', desc: '向全平台师生发布通知广播', icon: Promotion, path: '/admin/notice-manage', bgClass: 'bg-blur-orange' },
    { title: '分类管理', desc: '配置题目及试卷的层级分类', icon: Folder, path: '/admin/category-manage', bgClass: 'bg-blur-purple' },
  ]
})

const summaryCardA = computed(() => {
  if (roleName.value === '老师') {
    return { title: '我的试卷数', desc: '当前账号名下试卷', value: teacherPaperCount.value, unit: '份', tip: '来自试卷管理真实数据' }
  }
  return { title: '题库总量', desc: '系统当前可用题目数', value: systemStats.value.questionCount || 0, unit: '道', tip: '来自 /api/stats/overview' }
})

const summaryCardB = computed(() => {
  if (roleName.value === '老师') {
    return { title: '参考总人次', desc: '教学分析中的累计参考数据', value: teacherStats.value.totalStudents || 0, unit: '人次', tip: '来自 /api/stats/teacher/{teacherId}' }
  }
  return { title: '试卷总数', desc: '系统已创建试卷', value: systemStats.value.paperCount || 0, unit: '份', tip: '含草稿与已发布试卷' }
})

const summaryCardC = computed(() => {
  if (roleName.value === '老师') {
    return { title: '班级均分', desc: '当前教学平均成绩', value: Number(teacherStats.value.avgScore || 0).toFixed(1), unit: '分', tip: '便于快速判断整体掌握情况' }
  }
  return { title: '教师 / 学生', desc: '平台用户结构', value: `${adminTeacherCount.value} / ${adminStudentCount.value}`, unit: '人', tip: '来自用户分页接口 total' }
})

const summaryCardD = computed(() => {
  if (roleName.value === '老师') {
    return { title: '及格率', desc: '当前班级整体通过情况', value: Number(teacherStats.value.passRate || 0).toFixed(1), unit: '%', tip: '可直接进入教学分析查看详情' }
  }
  return { title: '今日考试', desc: '今日新增考试记录', value: systemStats.value.todayExamCount || 0, unit: '场', tip: '帮助观察平台当天活跃度' }
})

const recentListTitle = computed(() => roleName.value === '老师' ? '我的学生' : '最新题目')
const recentListSubtitle = computed(() => roleName.value === '老师' ? '优先跟进当前已绑定学生' : '最近录入的题目与分类')
const recentListPath = computed(() => roleName.value === '老师' ? '/admin/my-students' : '/admin/question-manage')

const initGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) timeGreeting.value = '凌晨好'
  else if (hour < 9) timeGreeting.value = '早上好'
  else if (hour < 12) timeGreeting.value = '上午好'
  else if (hour < 14) timeGreeting.value = '中午好'
  else if (hour < 18) timeGreeting.value = '下午好'
  else timeGreeting.value = '晚上好'
}

const getCurrentBusinessUserId = () => currentUser.value.userId || currentUser.value.id

const getCurrentDbUserId = () => currentUser.value.id || currentUser.value.userId

const formatTime = (dateStr) => {
  if (!dateStr) return '未知时间'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getNoticeTypeText = (type) => ({ SYSTEM: '系统', FEATURE: '更新', NOTICE: '通知' }[type] || '公告')

const loadNotices = async () => {
  try {
    const res = await request.get('/api/notices/latest', { params: { limit: 5 } })
    noticeList.value = res.data || []
  } catch (error) {
    noticeList.value = []
  }
}

const loadAdminStats = async () => {
  const [statsRes, teacherRes, studentRes, questionRes] = await Promise.all([
    request.get('/api/stats/overview'),
    request.get('/api/user/page', { params: { current: 1, size: 1, role: '1' } }),
    request.get('/api/user/page', { params: { current: 1, size: 1, role: '2' } }),
    request.get('/api/questions/list', { params: { page: 1, size: 5 } })
  ])
  systemStats.value = statsRes.data || systemStats.value
  adminTeacherCount.value = teacherRes.data?.total || 0
  adminStudentCount.value = studentRes.data?.total || 0
  recentItems.value = (questionRes.data?.records || []).map(item => ({
    id: item.id,
    title: item.title,
    meta: `${item.type || '未知题型'} · ${item.difficulty || '未知难度'}`
  }))
}

const loadTeacherStats = async () => {
  const businessUserId = getCurrentBusinessUserId()
  const teacherId = getCurrentDbUserId()
  if (!businessUserId) return
  const [statsRes, studentsRes, papersRes] = await Promise.all([
    request.get(`/api/stats/teacher/${businessUserId}/overview`),
    request.get('/api/user/myStudents', { params: { teacherId: businessUserId } }),
    request.get('/api/papers/list', { params: { userId: businessUserId, role: '1' } })
  ])
  teacherStats.value = statsRes.data || teacherStats.value
  const students = studentsRes.data || []
  teacherStudentCount.value = students.length
  teacherPaperCount.value = (papersRes.data || []).length
  recentItems.value = students.slice(0, 5).map((item, index) => ({
    id: item.id || `${index}`,
    title: item.studentName || item.realName || item.username || `学生${index + 1}`,
    meta: `${item.studentUserId || item.userId || item.studentNo || '未登记学号'}${teacherId ? ' · 已绑定' : ''}`
  }))
  if (!recentItems.value.length) {
    recentItems.value = (papersRes.data || []).slice(0, 5).map(item => ({
      id: item.id,
      title: item.name,
      meta: `${item.status || '未知状态'} · ${item.questionCount || 0}题`
    }))
  }
}

const loadDashboard = async () => {
  await loadNotices()
  try {
    if (roleName.value === '老师') {
      await loadTeacherStats()
    } else {
      await loadAdminStats()
    }
  } catch (error) {
    recentItems.value = []
  }
}

onMounted(() => {
  currentDate.value = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  initGreeting()
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    currentUser.value = JSON.parse(userInfoStr)
    roleName.value = String(currentUser.value.role) === '1' ? '老师' : '管理员'
    userName.value = currentUser.value.realName || currentUser.value.username || roleName.value
  }
  loadDashboard()
})
</script>

<style scoped>
.dashboard-container { position: relative; padding: 32px; background-color: transparent; min-height: calc(100vh - 60px); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; z-index: 1; }
.ambient-background { position: fixed; inset: 0; z-index: -1; pointer-events: none; background: #f8fafc; }
.blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.5; animation: float 25s infinite alternate ease-in-out; }
.blob-1 { top: -10%; right: -5%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 60%); }
.blob-2 { bottom: -20%; left: -10%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(139,92,246,0.1), transparent 60%); animation-delay: -5s; }
@keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(3%, 5%) scale(1.05); } }
.animate-fade-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.premium-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 24px; box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.premium-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.1); }
.glass-effect { background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.6); }
.section-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 40px 0 20px 4px; }
.welcome-banner { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 40px 48px; overflow: hidden; background: linear-gradient(120deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%); }
.banner-left { display: flex; align-items: center; gap: 24px; z-index: 2; }
.avatar-box { padding: 4px; border-radius: 50%; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06); }
.greeting { font-size: 26px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
.date-subtitle { font-size: 15px; color: #64748b; margin: 0; font-weight: 500; }
.banner-right { z-index: 2; }
.weather-widget { display: flex; align-items: center; gap: 14px; padding: 12px 24px; border-radius: 30px; }
.weather-icon { font-size: 32px; color: #f59e0b; filter: drop-shadow(0 4px 8px rgba(245,158,11,0.3)); }
.weather-info { display: flex; flex-direction: column; }
.weather-info .temp { font-size: 18px; font-weight: 700; color: #0f172a; }
.weather-info .desc { font-size: 13px; color: #64748b; font-weight: 500; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.tool-card { padding: 24px; display: flex; flex-direction: column; min-height: 220px; }
.tool-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 12px; }
.tool-title { font-size: 18px; font-weight: 700; color: #0f172a; }
.tool-subtitle { margin-top: 6px; color: #64748b; font-size: 13px; line-height: 1.5; }
.tool-value-row { display: flex; align-items: baseline; gap: 8px; margin-top: 8px; }
.tool-value { font-size: 36px; font-weight: 800; line-height: 1; }
.tool-unit { color: #64748b; font-size: 14px; }
.tool-footer-tip { margin-top: auto; padding-top: 12px; color: #64748b; font-size: 13px; }
.text-gradient-blue { background: linear-gradient(135deg, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-gradient-green { background: linear-gradient(135deg, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-gradient-orange { background: linear-gradient(135deg, #f59e0b, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-gradient-purple { background: linear-gradient(135deg, #8b5cf6, #d946ef); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.icon-wrapper { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.bg-blur-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; box-shadow: inset 0 0 0 1px rgba(59,130,246,0.2); }
.bg-blur-green { background: rgba(16, 185, 129, 0.1); color: #10b981; box-shadow: inset 0 0 0 1px rgba(16,185,129,0.2); }
.bg-blur-orange { background: rgba(245, 158, 11, 0.1); color: #f59e0b; box-shadow: inset 0 0 0 1px rgba(245,158,11,0.2); }
.bg-blur-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; box-shadow: inset 0 0 0 1px rgba(139,92,246,0.2); }
.panel-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.panel-card { padding: 24px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; }
.panel-title { font-size: 18px; font-weight: 700; color: #0f172a; }
.panel-subtitle { margin-top: 6px; color: #64748b; font-size: 13px; }
.list-wrap { display: flex; flex-direction: column; gap: 12px; }
.list-item { padding: 14px 16px; border-radius: 16px; background: rgba(248, 250, 252, 0.9); }
.list-title { font-size: 15px; font-weight: 600; color: #0f172a; line-height: 1.5; }
.list-meta { margin-top: 6px; font-size: 12px; color: #64748b; }
.quick-actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.action-card { padding: 28px 24px; display: flex; align-items: center; gap: 16px; cursor: pointer; position: relative; }
.action-icon-box { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.action-card:hover .action-icon-box { transform: scale(1.08) rotate(-5deg); }
.action-info h3 { margin: 0 0 6px 0; font-size: 17px; color: #0f172a; font-weight: 700; }
.action-info p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; font-weight: 500; }
.action-arrow { position: absolute; right: 24px; font-size: 18px; color: #cbd5e1; opacity: 0; transform: translateX(-10px); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.action-card:hover .action-arrow { opacity: 1; transform: translateX(0); color: #3b82f6; }
@media (max-width: 1200px) { .stats-grid, .quick-actions-grid, .panel-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .welcome-banner { flex-direction: column; align-items: flex-start; gap: 20px; } .banner-right { align-self: flex-end; } .stats-grid, .quick-actions-grid, .panel-grid { grid-template-columns: 1fr; } .tool-card { min-height: auto; } }
</style>
