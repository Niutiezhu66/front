<template>
  <div class="layout-container">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <aside class="sidebar glass-sidebar">
      <div class="brand-header" @click="goAdminWelcome">
        <div class="logo-box">
          <img class="logo" src="../assets/logo.svg" alt="logo" />
        </div>
        <span class="brand-name">管理控制台</span>
      </div>
      
      <el-scrollbar class="custom-scrollbar">
        <el-menu
          :default-active="activeMenu"
          class="custom-menu"
          @select="handleMenuSelect"
          router
          unique-opened
        >
          <el-sub-menu index="user" v-if="isAdmin || isTeacher">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/admin/system-users" v-if="isAdmin">用户账号管理</el-menu-item>
            <el-menu-item index="/admin/user-manage" v-if="isAdmin">用户关系管理</el-menu-item>
            <el-menu-item index="/admin/my-students" v-if="isTeacher">我的学生</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="question">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>试题管理</span>
            </template>
            <el-menu-item index="/admin/question-manage">题库维护</el-menu-item>
            <el-menu-item index="/admin/category-manage">分类管理</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="exam">
            <template #title>
              <el-icon><Files /></el-icon>
              <span>考试管理</span>
            </template>
            <el-menu-item index="/admin/paper-manage">试卷组建</el-menu-item>
            <el-menu-item index="/admin/score-manage">成绩统计</el-menu-item>
            <el-menu-item index="/admin/teacher-analysis">
              <el-icon><DataBoard /></el-icon>
              <span>教学分析与改进</span>
            </el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="system" v-if="userRole == 0">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </template>
            <el-menu-item index="/admin/banner-manage">轮播图配置</el-menu-item>
            <el-menu-item index="/admin/notice-manage">系统公告</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>
    </aside>

    <div class="main-wrapper">
      <header class="top-header glass-header">
        <div class="header-left">
          <span class="greeting">Hi, {{ userName || '管理员' }} <span class="wave">👋</span></span>
        </div>
        
        <div class="header-tools">
          <el-tooltip content="访问前台门户" placement="bottom" :show-after="300">
            <el-button text class="tool-btn btn-hover-glow" @click="goHome">
              <el-icon :size="18"><Monitor /></el-icon>
              <span class="btn-text">前台系统</span>
            </el-button>
          </el-tooltip>
          
          <div class="divider"></div>
          
          <el-tooltip content="安全退出" placement="bottom" :show-after="300">
            <el-button text class="tool-btn logout-btn" @click="handleLogout">
              <el-icon :size="18"><SwitchButton /></el-icon>
              <span class="btn-text">安全退出</span>
            </el-button>
          </el-tooltip>
        </div>
      </header>

      <main class="content-body">
        <div class="page-container">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Document, Files, User, Setting, 
  Monitor, SwitchButton, DataBoard
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const userRole = ref('')
const userName = ref('') 

const isAdmin = computed(() => String(userRole.value) === '0' || userRole.value === 'ADMIN')
const isTeacher = computed(() => String(userRole.value) === '1' || userRole.value === 'TEACHER')
const activeMenu = computed(() => route.path)

onMounted(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    const userInfo = JSON.parse(userInfoStr)
    userRole.value = userInfo.role
    userName.value = userInfo.realName || userInfo.username
  }
})

const goHome = () => router.push('/') 
const goAdminWelcome = () => router.push('/admin/welcome') 
const handleMenuSelect = (index) => router.push(index)

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出系统并注销登录状态吗？', '安全退出', {
    confirmButtonText: '确定退出',
    cancelButtonText: '继续留在此页',
    type: 'warning',
    customClass: 'premium-dialog glass-dialog'
  }).then(() => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('token')
    ElMessage.success('已安全退出登录')
    router.replace('/login')
  }).catch(() => {})
}
</script>

<style scoped>
/* 1. 基础布局 & 环境光效 */
.layout-container {
  display: flex;
  height: 100vh;
  background-color: #f8fafc;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.ambient-background { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float 25s infinite alternate ease-in-out; }
.blob-1 { top: -10%; left: -5%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%); }
.blob-2 { bottom: -10%; right: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%); animation-delay: -5s; }
.blob-3 { top: 40%; left: 40%; width: 30vw; height: 30vw; background: radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%); animation-delay: -10s; }
@keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(4%, 8%) scale(1.05); } }

/* 2. 侧边栏：毛玻璃态 */
.sidebar {
  width: 260px;
  display: flex;
  flex-direction: column;
  z-index: 20;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.glass-sidebar {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 4px 0 24px rgba(15, 23, 42, 0.02);
}

.brand-header {
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  cursor: pointer;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
  transition: background-color 0.3s;
}
.brand-header:hover { background-color: rgba(255, 255, 255, 0.5); }
.logo-box { padding: 4px; background: #fff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; align-items: center; }
.brand-header .logo { width: 24px; height: 24px; object-fit: contain; }
.brand-name { margin-left: 12px; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px; }

/* 3. 菜单高定美化：去除默认样式，重构光泽选态 */
.custom-menu { border-right: none; padding: 12px 0; background: transparent; }
:deep(.el-menu) { background: transparent; }
:deep(.el-sub-menu__title),
:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 16px;
  border-radius: 12px;
  color: #475569;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
:deep(.el-sub-menu__title:hover),
:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(4px);
  color: #0f172a;
  box-shadow: 0 4px 12px rgba(15,23,42,0.03);
}
:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.05) 100%);
  color: #2563eb;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(59,130,246,0.2), 0 4px 12px rgba(59,130,246,0.05);
}
:deep(.el-menu-item.is-active::before) { display: none; /* 抛弃旧的粗糙边框，采用高光阴影 */ }
:deep(.el-sub-menu .el-menu) { background: transparent; }

/* 4. 顶栏：悬浮毛玻璃 */
.main-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; position: relative; z-index: 10; }
.top-header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 10;
}
.glass-header {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.02);
}

.greeting { font-size: 16px; color: #0f172a; font-weight: 600; letter-spacing: 0.5px; }
.wave { display: inline-block; animation: wave 2.5s infinite; transform-origin: 70% 70%; }
@keyframes wave { 0% { transform: rotate(0deg); } 10% { transform: rotate(14deg); } 20% { transform: rotate(-8deg); } 30% { transform: rotate(14deg); } 40% { transform: rotate(-4deg); } 50% { transform: rotate(10deg); } 60%, 100% { transform: rotate(0deg); } }

/* 工具按钮悬浮动效 */
.header-tools { display: flex; align-items: center; gap: 8px; }
.tool-btn { height: 42px; padding: 8px 16px; color: #475569; border-radius: 12px; transition: all 0.3s; }
.tool-btn:hover { background-color: rgba(255,255,255,0.9); color: #0f172a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15,23,42,0.04); }
.tool-btn .btn-text { margin-left: 6px; font-weight: 600; }
.logout-btn:hover { background-color: rgba(254,242,242,0.8); color: #ef4444; }

.divider { width: 1px; height: 16px; background-color: rgba(15,23,42,0.1); margin: 0 12px; }

/* 5. 路由主体：全透明，让内页卡片大显身手 */
.content-body { flex: 1; padding: 0; overflow-y: auto; overflow-x: hidden; }
.page-container {
  background: transparent; /* 关键：去掉死板白框，让内页自己的圆角卡片发光 */
  min-height: calc(100vh - 72px);
  padding: 0;
  box-shadow: none;
}

/* 6. 超平滑路由切换动画：向上浮现 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 对话框美化重置 */
:deep(.glass-dialog) { background: rgba(255,255,255,0.85) !important; backdrop-filter: blur(20px) !important; border-radius: 20px !important; border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 20px 40px rgba(15,23,42,0.1); }
:deep(.glass-dialog .el-message-box__title) { font-weight: 700; color: #0f172a; }
:deep(.glass-dialog .el-message-box__content) { font-size: 15px; color: #475569; padding: 12px 0; }
:deep(.glass-dialog .el-button--primary) { background: linear-gradient(135deg, #ef4444, #dc2626); border: none; box-shadow: 0 4px 12px rgba(239,68,68,0.2); border-radius: 8px; }
:deep(.glass-dialog .el-button--default) { border-radius: 8px; border-color: #cbd5e1; }
</style>