<template>
  <div class="auth-wrapper">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
    </div>

    <div class="auth-container minimal-glass-card animate-fade-up">
      <div class="brand-section register-brand">
        <div class="brand-content stagger-fade-in">
          <div class="logo-box pale-glass">
            <img src="../assets/logo.svg" alt="logo" class="brand-logo" />
          </div>
          <h1 class="brand-title">欢迎加入我们</h1>
          <p class="brand-desc">开启智能化、高效率的在线评估与学习之旅</p>

          <div class="features">
            <div class="feature-item"><el-icon>
                <Check />
              </el-icon> 极速响应的考试体验</div>
            <div class="feature-item"><el-icon>
                <Check />
              </el-icon> 智能化的成绩追踪</div>
            <div class="feature-item"><el-icon>
                <Check />
              </el-icon> 完善的师生关系管理</div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-header stagger-fade-in" style="--stagger-delay: 0.1s">
          <h2>创建新账号</h2>
          <p class="subtitle">请填写以下信息以完成注册</p>
        </div>

        <el-form :model="regForm" :rules="rules" ref="regFormRef" class="auth-form" size="large">
          <el-form-item prop="username" class="stagger-fade-in" style="--stagger-delay: 0.15s">
            <el-input v-model="regForm.username" placeholder="请输入登录账号" clearable class="minimal-input">
              <template #prefix><el-icon class="input-icon">
                  <User />
                </el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password" class="stagger-fade-in" style="--stagger-delay: 0.2s">
            <el-input type="password" v-model="regForm.password" placeholder="请设置不少于6位的密码" show-password
              class="minimal-input">
              <template #prefix><el-icon class="input-icon">
                  <Lock />
                </el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="nickname" class="stagger-fade-in" style="--stagger-delay: 0.25s">
            <el-input v-model="regForm.nickname" placeholder="请输入真实姓名或昵称" clearable class="minimal-input">
              <template #prefix><el-icon class="input-icon">
                  <EditPen />
                </el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="userId" class="stagger-fade-in" style="--stagger-delay: 0.3s">
            <el-input v-model.number="regForm.userId" placeholder="请输入学号或教职工号" clearable class="minimal-input">
              <template #prefix><el-icon class="input-icon">
                  <Postcard />
                </el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="role" class="stagger-fade-in role-form-item" style="--stagger-delay: 0.35s">
            <el-radio-group v-model="regForm.role" class="minimal-radio-group">
              <el-radio-button :label="2">学生</el-radio-button>
              <el-radio-button :label="1">教师</el-radio-button>

            </el-radio-group>
          </el-form-item>

          <el-form-item class="stagger-fade-in action-item" style="--stagger-delay: 0.4s">
            <el-button type="primary" class="submit-btn minimal-btn" @click="handleRegister" :loading="loading">
              立 刻 注 册
            </el-button>
          </el-form-item>

          <div class="form-footer stagger-fade-in" style="--stagger-delay: 0.45s">
            <span class="hint-text">已有账号？</span>
            <el-button type="primary" link class="nav-link" @click="$router.push('/login')">
              直接登录 <el-icon class="ml-1">
                <Right />
              </el-icon>
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
import { User, Lock, Check, Right, EditPen, Postcard } from '@element-plus/icons-vue'
import { register } from '@/api/user'

const router = useRouter()
const regFormRef = ref(null)
const loading = ref(false)

const regForm = reactive({ username: '', password: '', nickname: '', role: 2, userId: null })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码不能少于6位', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入姓名/昵称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择身份角色', trigger: 'change' }],
  userId: [
    { required: true, message: '请输入学号或工号', trigger: 'blur' },
    { type: 'number', message: '编号必须为数字', trigger: 'blur' }
  ]
}

const handleRegister = () => {
  regFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      register(regForm).then(res => {
        loading.value = false
        if (res.code === 200) {
          ElMessage.success('注册成功，请登录！')
          router.push('/login')
        } else {
          ElMessage.error(res.message || '注册失败')
        }
      }).catch((error) => {
        loading.value = false
        ElMessage.error(error.message || '网络请求异常')
      })
    } else {
      ElMessage.warning('请检查完善注册信息！')
    }
  })
}
</script>

<style scoped>
/* 继承高度统一的极简淡色美学 */
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
  opacity: 0.35;
  animation: float-smooth 25s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
}

.blob-1 {
  top: -10%;
  left: -5%;
  width: 50vw;
  height: 50vw;
  background: #bae6fd;
}

.blob-2 {
  bottom: -20%;
  right: -10%;
  width: 60vw;
  height: 60vw;
  background: #e9d5ff;
  animation-delay: -5s;
}

.blob-3 {
  top: 30%;
  left: 40%;
  width: 45vw;
  height: 45vw;
  background: #d9f99d;
  animation-delay: -10s;
}

.blob-4 {
  bottom: 10%;
  left: 10%;
  width: 35vw;
  height: 35vw;
  background: #c7d2fe;
  animation-delay: -15s;
}

@keyframes float-smooth {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }

  50% {
    transform: translate(3%, 5%) scale(1.02) rotate(3deg);
  }

  100% {
    transform: translate(-2%, 3%) scale(1.05) rotate(-1deg);
  }
}

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
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.minimal-glass-card {
  display: flex;
  width: 1050px;
  /* 稍宽以容纳表单 */
  min-height: 660px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(30px) saturate(120%);
  -webkit-backdrop-filter: blur(30px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 40px;
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

.brand-section {
  width: 42%;
  background: linear-gradient(145deg, rgba(233, 213, 255, 0.3) 0%, rgba(224, 242, 254, 0.4) 100%);
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
  color: #1e293b;
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

.features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 500;
  color: #475569;
}

.feature-item .el-icon {
  margin-right: 16px;
  background: rgba(255, 255, 255, 0.8);
  color: #a78bfa;
  /* 淡紫色点缀 */
  padding: 6px;
  border-radius: 50%;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.form-section {
  width: 58%;
  padding: 50px 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 30px;
}

.form-header h2 {
  font-size: 28px;
  color: #0f172a;
  font-weight: 700;
  margin: 0 0 8px;
}

.form-header .subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
}

:deep(.minimal-input .el-input__wrapper) {
  box-shadow: none;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.6);
  padding: 12px 20px;
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

:deep(.minimal-input .el-input__wrapper:hover) {
  background-color: rgba(255, 255, 255, 0.8);
  border-color: #cbd5e1;
}

:deep(.minimal-input .el-input__wrapper.is-focus) {
  background-color: #ffffff;
  border-color: #c4b5fd;
  box-shadow: 0 0 0 4px rgba(196, 181, 253, 0.15);
}

.input-icon {
  font-size: 18px;
  color: #cbd5e1;
  margin-right: 8px;
  transition: color 0.3s;
}

:deep(.is-focus) .input-icon {
  color: #a78bfa;
}

/* 角色单选框：极简无干扰设计 */
.role-form-item {
  margin-bottom: 24px;
}

.minimal-radio-group {
  width: 100%;
  display: flex;
  gap: 12px;
}

:deep(.minimal-radio-group .el-radio-button) {
  flex: 1;
}

:deep(.minimal-radio-group .el-radio-button__inner) {
  width: 100%;
  border-radius: 18px !important;
  border: 1px solid rgba(226, 232, 240, 0.6) !important;
  background-color: rgba(255, 255, 255, 0.4);
  color: #64748b;
  font-weight: 500;
  padding: 14px 0;
  box-shadow: none !important;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

:deep(.minimal-radio-group .el-radio-button:hover .el-radio-button__inner) {
  background-color: rgba(255, 255, 255, 0.8);
  border-color: #cbd5e1 !important;
}

:deep(.minimal-radio-group .el-radio-button.is-active .el-radio-button__inner) {
  background-color: #ffffff;
  border-color: #c4b5fd !important;
  color: #8b5cf6;
  font-weight: 600;
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.08) !important;
  transform: scale(1.02);
}

.action-item {
  margin-top: 5px;
  margin-bottom: 20px;
}

.minimal-btn {
  width: 100%;
  height: 54px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 20px;
  letter-spacing: 2px;
  border: none;
  background: rgba(167, 139, 250, 0.85);
  /* 略带紫调的极简按钮 */
  color: #fff;
  backdrop-filter: blur(4px);
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 8px 20px -6px rgba(167, 139, 250, 0.4);
}

.minimal-btn:hover {
  background: rgba(167, 139, 250, 1);
  transform: translateY(-2px);
  box-shadow: 0 12px 25px -6px rgba(167, 139, 250, 0.5);
}

.minimal-btn:active {
  transform: translateY(1px);
  box-shadow: 0 4px 10px -6px rgba(167, 139, 250, 0.4);
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.hint-text {
  color: #94a3b8;
  margin-right: 8px;
}

.nav-link {
  font-weight: 600;
  font-size: 14px;
  color: #a78bfa;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #8b5cf6;
}

@media screen and (max-width: 992px) {
  .minimal-glass-card {
    width: 90%;
    min-height: auto;
    flex-direction: column;
    border-radius: 32px;
  }

  .brand-section,
  .form-section {
    width: 100%;
    padding: 40px;
    border-right: none;
  }
}
</style>