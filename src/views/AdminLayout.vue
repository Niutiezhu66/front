<template>
  <div class="layout-container">
    <aside class="sidebar">
      <div class="brand-header" @click="goAdminWelcome">
        <img class="logo" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" alt="logo" />
        <span class="brand-name">管理控制台</span>
      </div>
      
      <el-scrollbar>
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
            <el-menu-item index="/admin/user-manage" v-if="isAdmin">用户与关系</el-menu-item>
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
      <header class="top-header">
        <div class="header-left">
          <span class="greeting">Hi, {{ userName || '管理员' }} <span class="wave">👋</span></span>
        </div>
        
        <div class="header-tools">
          <el-tooltip content="访问前台系统" placement="bottom" :show-after="300">
            <el-button text class="tool-btn" @click="goHome">
              <el-icon :size="18"><Monitor /></el-icon>
              <span class="btn-text">前台门户</span>
            </el-button>
          </el-tooltip>
          
          <div class="divider"></div>
          
          <el-tooltip content="安全退出" placement="bottom" :show-after="300">
            <el-button text class="tool-btn logout-btn" @click="handleLogout">
              <el-icon :size十八="18"><SwitchButton /></el-icon>
              <span class="btn-text">退出</span>
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
  Monitor, SwitchButton
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
  ElMessageBox.confirm('确定要退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    customClass: 'logout-confirm-dialog'
  }).then(() => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('token')
    ElMessage.success('已退出登录')
    router.replace('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background-color: #f5f7f9;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}


.sidebar {
  width: 256px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.05);
  z-index: 20;
  transition: width 0.3s;
}

.brand-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.brand-header:hover {
  background-color: #fafafa;
}

.brand-header .logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.brand-name {
  margin-left: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2225;
  letter-spacing: 0.5px;
}

/* 菜单定制 */
.custom-menu {
  border-right: none;
  padding: 8px 0;
}

:deep(.el-sub-menu__title),
:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 12px;
  border-radius: 8px;
  color: #4e5969;
}

:deep(.el-menu-item.is-active) {
  background-color: #e8f3ff;
  color: #1677ff;
  font-weight: 500;
}

:deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: -12px;
  top: 10px;
  bottom: 10px;
  width: 4px;
  background-color: #1677ff;
  border-radius: 0 4px 4px 0;
}

/* 主体区域 */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 顶部导航 */
.top-header {
  height: 64px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.04);
  z-index: 10;
}

.greeting {
  font-size: 15px;
  color: #1d2129;
  font-weight: 500;
}

.wave {
  display: inline-block;
  animation: wave 2.5s infinite;
  transform-origin: 70% 70%;
}

@keyframes wave {
  0% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60%, 100% { transform: rotate(0deg); }
}

/* 工具栏 */
.header-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-btn {
  height: 40px;
  padding: 8px 12px;
  color: #4e5969;
  border-radius: 6px;
  transition: all 0.2s;
}

.tool-btn:hover {
  background-color: #f2f3f5;
  color: #1d2129;
}

.tool-btn .btn-text {
  margin-left: 6px;
  font-weight: 500;
}

.logout-btn:hover {
  background-color: #fff1f0;
  color: #f53f3f;
}

.divider {
  width: 1px;
  height: 16px;
  background-color: #e5e6eb;
  margin: 0 8px;
}

/* 内容区 */
.content-body {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.page-container {
  background: #ffffff;
  border-radius: 8px;
  min-height: calc(100vh - 104px);
  padding: 24px;
  /* 更高级的弥散阴影 */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03), 0 0 2px rgba(0, 0, 0, 0.04);
}

/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(15px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}
</style>