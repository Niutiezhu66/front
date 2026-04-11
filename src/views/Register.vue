<template>
  <div class="register-wrapper">
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>

    <div class="register-container">
      <div class="brand-section">
        <div class="brand-content">
          <div class="logo-box">
            <el-icon :size="32" color="#ffffff"><Monitor /></el-icon>
          </div>
          <h1 class="brand-title">欢迎加入我们</h1>
          <p class="brand-desc">开启智能化、高效率的在线评估与学习之旅</p>
          
          <div class="features">
            <div class="feature-item"><el-icon><Check /></el-icon> 极速响应的考试体验</div>
            <div class="feature-item"><el-icon><Check /></el-icon> 智能化的成绩追踪</div>
            <div class="feature-item"><el-icon><Check /></el-icon> 完善的师生关系管理</div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-header">
          <h2>创建新账号</h2>
          <p class="subtitle">请填写以下信息以完成注册</p>
        </div>

        <el-form 
          :model="regForm" 
          :rules="rules" 
          ref="regFormRef" 
          class="register-form"
          size="large"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="regForm.username" 
              placeholder="请输入登录账号" 
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
              v-model="regForm.password" 
              placeholder="请设置不少于6位的密码" 
              show-password 
              class="custom-input"
            >
              <template #prefix>
                <el-icon class="input-icon"><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="nickname">
            <el-input 
              v-model="regForm.nickname" 
              placeholder="请输入真实姓名或昵称" 
              clearable
              class="custom-input"
            >
              <template #prefix>
                <el-icon class="input-icon"><EditPen /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="userId">
            <el-input 
              v-model="regForm.userId" 
              placeholder="请输入学号或教职工号" 
              clearable
              class="custom-input"
            >
              <template #prefix>
                <el-icon class="input-icon"><Postcard /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="role" class="role-form-item">
            <el-radio-group v-model="regForm.role" class="custom-radio-group">
              <el-radio-button :label="2">我是学生</el-radio-button>
              <el-radio-button :label="1">我是教师</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item class="action-item">
            <el-button 
              type="primary" 
              class="submit-btn" 
              @click="handleRegister" 
              :loading="loading"
            >
              立刻注册
            </el-button>
          </el-form-item>

          <div class="form-footer">
            <span class="login-text">已有账号？</span>
            <el-button type="primary" link class="login-link" @click="$router.push('/login')">
              直接登录 <el-icon class="ml-1"><Right /></el-icon>
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
import { User, Lock, Monitor, Check, Right, EditPen, Postcard } from '@element-plus/icons-vue'
import { register } from '@/api/user'

const router = useRouter()
const regFormRef = ref(null)
const loading = ref(false)

const regForm = reactive({
  username: '',
  password: '',
  nickname: '',
  role: 2, 
  userId: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }, 
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ],
  nickname: [{ required: true, message: '请输入姓名/昵称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择身份角色', trigger: 'change' }],
  userId: [{ required: true, message: '请输入学号或工号', trigger: 'blur' }]
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
        ElMessage.error(error.message || error.msg || '网络请求异常，请检查后端是否正常启动')
      })
    } else {
      ElMessage.warning('请检查红色提示框，完善注册信息！')
    }
  })
}
</script>

<style scoped>
/* 容器及背景（与Login保持统一） */
.register-wrapper {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f7f9;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  padding: 20px 0;
}

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

/* 注册卡片容器 */
.register-container {
  position: relative;
  z-index: 1;
  display: flex;
  width: 900px;
  min-height: 600px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 左侧品牌宣发区 */
.brand-section {
  width: 42%;
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  padding: 50px 40px;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

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
  font-size: 30px;
  font-weight: 600;
  margin: 0 0 16px;
  letter-spacing: 1px;
}

.brand-desc {
  font-size: 14px;
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
  width: 58%;
  padding: 45px 55px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #ffffff;
}

.form-header {
  margin-bottom: 30px;
}

.form-header h2 {
  font-size: 26px;
  color: #1d2129;
  font-weight: 600;
  margin: 0 0 8px;
}

.form-header .subtitle {
  color: #86909c;
  font-size: 14px;
  margin: 0;
}

/* 深度定制 Element Plus 控件样式 */
:deep(.custom-input .el-input__wrapper) {
  box-shadow: 0 0 0 1px #e5e6eb inset;
  background-color: #f7f8fa;
  padding: 6px 15px;
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
  margin-right: 6px;
}

/* 角色单选框胶囊化 */
.role-form-item {
  margin-bottom: 24px;
}
.custom-radio-group {
  width: 100%;
  display: flex;
}
:deep(.custom-radio-group .el-radio-button) {
  flex: 1;
}
:deep(.custom-radio-group .el-radio-button__inner) {
  width: 100%;
  border-radius: 8px;
  border-color: #e5e6eb;
  background-color: #f7f8fa;
  color: #4e5969;
  box-shadow: none !important;
  transition: all 0.2s;
}
:deep(.custom-radio-group .el-radio-button:first-child .el-radio-button__inner) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
:deep(.custom-radio-group .el-radio-button:last-child .el-radio-button__inner) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
:deep(.custom-radio-group .el-radio-button.is-active .el-radio-button__inner) {
  background-color: #1677ff;
  border-color: #1677ff;
  color: #ffffff;
}

/* 提交按钮 */
.action-item {
  margin-bottom: 15px;
}

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

/* 底部登录跳转区 */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.login-text {
  color: #86909c;
  margin-right: 6px;
}

.login-link {
  font-weight: 500;
  font-size: 14px;
}

.ml-1 {
  margin-left: 4px;
}

/* 响应式 */
@media screen and (max-width: 768px) {
  .register-container {
    width: 90%;
    min-height: auto;
    flex-direction: column;
  }
  .brand-section {
    width: 100%;
    padding: 30px;
  }
  .form-section {
    width: 100%;
    padding: 30px;
  }
}
</style>