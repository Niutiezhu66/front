<template>
  <div class="login-wrapper">
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>

    <div class="login-container">
      <div class="brand-section">
        <div class="brand-content">
          <div class="logo-box">
            <el-icon :size="32" color="#ffffff"><Monitor /></el-icon>
          </div>
          <h1 class="brand-title">中小学生</h1>
          <h1 class="brand-title">在线考试系统</h1>
          <p class="brand-desc">专业 · 稳定 · 高效的现代化线上评估平台</p>
          
          <div class="features">
            <div class="feature-item"><el-icon><Check /></el-icon> 智能化题库管理</div>
            <div class="feature-item"><el-icon><Check /></el-icon> 灵活的试卷组建</div>
            <div class="feature-item"><el-icon><Check /></el-icon> 多维度的成绩分析</div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p class="subtitle">请使用您的专属账号登录系统</p>
        </div>

        <el-form 
          :model="loginForm" 
          :rules="rules" 
          ref="loginFormRef" 
          class="login-form"
          size="large"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入用户名/学号" 
              clearable
              class="custom-input"
            >
              <template #prefix>
                <el-icon class="input-icon"><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input 
              type="password" 
              v-model="loginForm.password" 
              placeholder="请输入登录密码" 
              show-password 
              @keyup.enter="handleLogin"
              class="custom-input"
            >
              <template #prefix>
                <el-icon class="input-icon"><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button 
              type="primary" 
              class="submit-btn" 
              @click="handleLogin" 
              :loading="loading"
            >
              登 录 系统
            </el-button>
          </el-form-item>

          <div class="form-footer">
            <span class="register-text">还没有账号？</span>
            <el-button type="primary" link class="register-link" @click="$router.push('/register')">
              立即注册 <el-icon class="ml-1"><Right /></el-icon>
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
// 引入所需的图标
import { User, Lock, Monitor, Check, Right } from '@element-plus/icons-vue'
import { login } from '@/api/user'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = () => {
  loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      login(loginForm).then(res => {
        loading.value = false
        // 注意：根据您后端的 Result 封装，可能是 res.code === 200 
        if (res.code === 200) { 
          ElMessage.success('登录成功')
          // 1. 将数据存入本地，供 Home 和 考试功能使用
          localStorage.setItem('userInfo', JSON.stringify(res.data))
          
          const role = Number(res.data.role)
          // 2. 路由分流
          if (role === 0 || role === 1) {
            router.push('/admin') // 管理员或老师进入后台
          } else {
            router.push('/home')  // 学生进入前端首页
          }
        } else {
          ElMessage.error(res.message || '登录失败')
        }
      }).catch((e) => { 
        // 【关键修改】：捕获拦截器抛出的异常，提取后端真正的错误提示
        loading.value = false 
        ElMessage.error(e.message || '登录失败，请检查网络或联系管理员')
      })
    }
  })
}
</script>

<style scoped>
/* 全局页面容器 */
.login-wrapper {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f7f9;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 柔和的背景装饰形状 */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
}
.shape-1 {
  width: 500px;
  height: 500px;
  background: rgba(22, 119, 255, 0.15);
  top: -100px;
  left: -100px;
}
.shape-2 {
  width: 400px;
  height: 400px;
  background: rgba(114, 46, 209, 0.1);
  bottom: -50px;
  right: -50px;
}

/* 核心卡片容器 */
.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  width: 900px;
  height: 520px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 左侧品牌宣发区 (深色渐变) */
.brand-section {
  width: 45%;
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  padding: 50px 40px;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

/* 左侧内部光效叠加 */
.brand-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%);
}

.brand-content {
  position: relative;
  z-index: 2;
}

.logo-box {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  backdrop-filter: blur(4px);
}

.brand-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 16px;
  letter-spacing: 1px;
}

.brand-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 40px;
  line-height: 1.6;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}
.feature-item .el-icon {
  margin-right: 10px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px;
  border-radius: 50%;
  font-size: 12px;
}

/* 右侧表单区 */
.form-section {
  width: 55%;
  padding: 50px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #ffffff;
}

.form-header {
  margin-bottom: 40px;
}

.form-header h2 {
  font-size: 28px;
  color: #1d2129;
  font-weight: 600;
  margin: 0 0 8px;
}

.form-header .subtitle {
  color: #86909c;
  font-size: 14px;
  margin: 0;
}

/* 深度定制 Element Plus 输入框样式 */
:deep(.custom-input .el-input__wrapper) {
  box-shadow: 0 0 0 1px #e5e6eb inset;
  background-color: #f7f8fa;
  padding: 8px 15px;
  border-radius: 8px;
  transition: all 0.3s;
}

:deep(.custom-input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #1677ff inset;
  background-color: #ffffff;
}

:deep(.custom-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2) inset;
  background-color: #ffffff;
}

:deep(.custom-input .el-input__inner) {
  color: #1d2129;
}

.input-icon {
  font-size: 18px;
  color: #86909c;
  margin-right: 4px;
}

/* 登录按钮定制 */
.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #1677ff 0%, #0958d9 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
  margin-top: 10px;
  transition: all 0.3s;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.4);
  background: linear-gradient(90deg, #4096ff 0%, #1677ff 100%);
}

.submit-btn:active {
  transform: translateY(1px);
}

/* 底部注册链接区 */
.form-footer {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.register-text {
  color: #86909c;
  margin-right: 8px;
}

.register-link {
  font-weight: 500;
  font-size: 14px;
}

.ml-1 {
  margin-left: 4px;
}

/* 响应式处理：屏幕较小时转为上下布局 */
@media screen and (max-width: 768px) {
  .login-container {
    width: 90%;
    height: auto;
    flex-direction: column;
  }
  .brand-section {
    width: 100%;
    padding: 40px 30px;
  }
  .form-section {
    width: 100%;
    padding: 40px 30px;
  }
}
</style>