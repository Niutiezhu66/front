<template>
  <div class="auth-wrapper">
    <div class="ambient-z">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
    </div>

    <div class="auth-container minimal-glass-card animate-fade-up">
      <div class="brand-section">
        <div class="brand-content stagger-fade-in">
          <div class="logo-box pale-glass">
            <img src="../assets/logo.svg" alt="logo" class="brand-logo" />
          </div>
          <h1 class="brand-title">中小学生<br>在线考试系统</h1>
          <p class="brand-desc">专业 · 稳定 · 高效的现代化线上评估平台</p>

          <div class="features">
            <div class="feature-item"><el-icon><Check /></el-icon> 智能化题库管理</div>
            <div class="feature-item"><el-icon><Check /></el-icon> 灵活的试卷组建</div>
            <div class="feature-item"><el-icon><Check /></el-icon> 多维度的成绩分析</div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-header stagger-fade-in" style="--stagger-delay: 0.1s">
          <h2>欢迎回来</h2>
          <p class="subtitle">请使用您的专属账号登录系统</p>
        </div>

        <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="auth-form" size="large">
          <el-form-item prop="username" class="stagger-fade-in" style="--stagger-delay: 0.2s">
            <el-input v-model="loginForm.username" placeholder="请输入用户名/学号" clearable class="minimal-input">
              <template #prefix><el-icon class="input-icon"><User /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password" class="stagger-fade-in" style="--stagger-delay: 0.3s">
            <el-input type="password" v-model="loginForm.password" placeholder="请输入登录密码" show-password @keyup.enter="handleLogin" class="minimal-input">
              <template #prefix><el-icon class="input-icon"><Lock /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item class="stagger-fade-in action-item" style="--stagger-delay: 0.4s">
            <el-button type="primary" class="submit-btn minimal-btn" @click="handleLogin" :loading="loading">
              登 录 系 统
            </el-button>
          </el-form-item>

          <div class="form-footer stagger-fade-in" style="--stagger-delay: 0.5s">
            <span class="hint-text">还没有账号？</span>
            <el-button type="primary" link class="nav-link" @click="$router.push('/register')">
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
import { User, Lock, Check, Right } from '@element-plus/icons-vue'
import { login } from '@/api/user'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({ username: '', password: '' })
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
        if (res.code === 200) {
          ElMessage.success('登录成功')
          localStorage.setItem('userInfo', JSON.stringify(res.data))
          const role = Number(res.data.role)
          if (role === 0 || role === 1) router.push('/admin')
          else router.push('/home')
        } else {
          ElMessage.error(res.message || '登录失败')
        }
      }).catch((e) => {
        loading.value = false
        ElMessage.error(e.message || '登录失败，请检查网络')
      })
    }
  })
}
</script>

<style scoped>
.auth-wrapper {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  padding: 40px 20px;
}

/* 偏淡的极简环境光 */
.ambient-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f5f9 100%);
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.35; /* 降低透明度，更柔和 */
  animation: float-smooth 25s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
}

.blob-1 { top: -10%; left: -5%; width: 50vw; height: 50vw; background: #bae6fd; }
.blob-2 { bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: #e9d5ff; animation-delay: -5s; }
.blob-3 { top: 30%; left: 40%; width: 45vw; height: 45vw; background: #d9f99d; animation-delay: -10s; }
.blob-4 { bottom: 10%; left: 10%; width: 35vw; height: 35vw; background: #c7d2fe; animation-delay: -15s; }

@keyframes float-smooth {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  50% { transform: translate(3%, 5%) scale(1.02) rotate(3deg); }
  100% { transform: translate(-2%, 3%) scale(1.05) rotate(-1deg); }
}

/* 进场动画缓冲 */
.animate-fade-up {
  opacity: 0;
  animation: fadeInUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.stagger-fade-in {
  opacity: 0;
  transform: translateY(15px);
  animation: fadeInUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: var(--stagger-delay, 0s);
}

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}

/* 极简淡色毛玻璃卡片 */
.minimal-glass-card {
  display: flex;
  width: 1000px;
  height: 600px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 40px; /* 超大圆角弧度 */
  box-shadow: 
    0 20px 50px -10px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  overflow: hidden;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.minimal-glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 30px 60px -15px rgba(15, 23, 42, 0.06);
}

/* 品牌区 - 淡雅半透明 */
.brand-section {
  width: 45%;
  background: linear-gradient(145deg, rgba(224, 242, 254, 0.4) 0%, rgba(243, 232, 255, 0.3) 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.5);
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.pale-glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.03);
}

.brand-logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
  opacity: 0.9;
}

.brand-title {
  font-size: 34px;
  font-weight: 700;
  color: #1e293b; /* 深岩灰，保持极简 */
  margin: 0 0 16px;
  letter-spacing: 1px;
  line-height: 1.25;
}

.brand-desc {
  font-size: 15px;
  color: #64748b;
  margin-bottom: 48px;
  line-height: 1.6;
}

.features { display: flex; flex-direction: column; gap: 20px; }
.feature-item { display: flex; align-items: center; font-size: 15px; font-weight: 500; color: #475569; }
.feature-item .el-icon {
  margin-right: 16px;
  background: rgba(255, 255, 255, 0.8);
  color: #818cf8; /* 淡靛蓝 */
  padding: 6px;
  border-radius: 50%;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

/* 表单区 */
.form-section {
  width: 55%;
  padding: 60px 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header { margin-bottom: 40px; }
.form-header h2 { font-size: 28px; color: #0f172a; font-weight: 700; margin: 0 0 8px; }
.form-header .subtitle { color: #94a3b8; font-size: 14px; margin: 0; }

/* 极简输入框 */
:deep(.minimal-input .el-input__wrapper) {
  box-shadow: none;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.6);
  padding: 12px 20px;
  border-radius: 20px; /* 更圆润 */
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

:deep(.minimal-input .el-input__wrapper:hover) {
  background-color: rgba(255, 255, 255, 0.8);
  border-color: #cbd5e1;
}

:deep(.minimal-input .el-input__wrapper.is-focus) {
  background-color: #ffffff;
  border-color: #a5b4fc;
  box-shadow: 0 0 0 4px rgba(165, 180, 252, 0.15);
}

.input-icon { font-size: 18px; color: #cbd5e1; margin-right: 8px; transition: color 0.3s; }
:deep(.is-focus) .input-icon { color: #818cf8; }

/* 按钮淡雅交互 */
.action-item { margin-top: 10px; margin-bottom: 20px; }

.minimal-btn {
  width: 100%;
  height: 54px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 20px;
  letter-spacing: 2px;
  border: none;
  background: rgba(129, 140, 248, 0.85); /* 柔和的淡紫/蓝色 */
  color: #fff;
  backdrop-filter: blur(4px);
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 8px 20px -6px rgba(129, 140, 248, 0.4);
}

.minimal-btn:hover {
  background: rgba(129, 140, 248, 1);
  transform: translateY(-2px);
  box-shadow: 0 12px 25px -6px rgba(129, 140, 248, 0.5);
}

.minimal-btn:active {
  transform: translateY(1px);
  box-shadow: 0 4px 10px -6px rgba(129, 140, 248, 0.4);
}

.form-footer { display: flex; align-items: center; justify-content: center; font-size: 14px; }
.hint-text { color: #94a3b8; margin-right: 8px; }
.nav-link { font-weight: 600; font-size: 14px; color: #818cf8; transition: color 0.3s; }
.nav-link:hover { color: #6366f1; }

@media screen and (max-width: 992px) {
  .minimal-glass-card { width: 90%; height: auto; flex-direction: column; border-radius: 32px; }
  .brand-section, .form-section { width: 100%; padding: 40px; border-right: none; }
}
</style>