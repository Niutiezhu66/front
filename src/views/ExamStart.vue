<template>
  <div class="exam-start-container">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div class="exam-start-card premium-card glass-effect animate-fade-up">
      <div class="card-header">
        <div class="icon-box glass-effect-light">
          <el-icon><Monitor /></el-icon>
        </div>
        <h2 class="title">准备开始考试</h2>
        <p class="subtitle">请确认您的个人信息及试卷要求</p>
      </div>
      
      <div class="paper-info glass-effect-light" v-if="paperInfo">
        <h3 class="paper-name">{{ paperInfo.name }}</h3>
        <p class="paper-description">{{ paperInfo.description || '本次考试暂无附加描述，请仔细审题，沉着作答。' }}</p>
        <div class="paper-meta">
          <span class="meta-item"><el-icon><CollectionTag /></el-icon> 题目数量: <strong>{{ paperInfo.questionCount }} 道</strong></span>
          <span class="meta-item"><el-icon><TrophyBase /></el-icon> 试卷总分: <strong>{{ paperInfo.totalScore }} 分</strong></span>
          <span class="meta-item"><el-icon><Timer /></el-icon> 考试时长: <strong>{{ paperInfo.duration }} 分钟</strong></span>
        </div>
      </div>

      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        class="exam-form"
        @submit.prevent="handleStartExam"
      >
        <el-form-item label="考生姓名" class="custom-form-item">
          <el-input v-model="form.userName" disabled size="large" class="custom-input" />
        </el-form-item>

        <el-form-item label="学号/工号" prop="userId" class="custom-form-item">
          <el-input v-model="form.userId" disabled placeholder="自动获取中..." size="large" class="custom-input" />
        </el-form-item>

        <el-form-item class="action-item">
          <el-button type="primary" size="large" @click="handleStartExam" :loading="loading" class="submit-btn btn-hover-glow">
            <el-icon class="el-icon--left" v-if="!loading"><VideoPlay /></el-icon>
            确认无误，进入考场
          </el-button>
        </el-form-item>
      </el-form>

      <div class="exam-rules glass-effect-light">
        <h4><el-icon><Warning /></el-icon> 考场纪律与系统规则</h4>
        <ul>
          <li>考试全程由系统进行切屏及操作监控，请保持网络连接稳定。</li>
          <li>考试过程中请勿切换窗口、分屏或刷新页面，否则可能引发异常。</li>
          <li>考试时间结束时，系统将自动锁定并强制交卷。</li>
          <li>主观题禁止从外部直接复制粘贴，请手动输入您的答案。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPaperById } from '../api/paper.js'
import { startExam } from '../api/exam.js'
import { CollectionTag, TrophyBase, Timer, Monitor, VideoPlay, Warning } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const paperInfo = ref(null)

const userInfoStr = localStorage.getItem('userInfo')
const currentUser = userInfoStr ? JSON.parse(userInfoStr) : {}

const form = ref({
  userName: currentUser.realName || currentUser.username || '未知用户',
  userId: currentUser.userId || currentUser.id || ''
})

const rules = {
  userId: [{ required: true, message: '未能获取到您的学号/工号，请联系管理员或重新登录', trigger: 'change' }]
}

const getPaperInfo = async () => {
  try {
    const res = await getPaperById(route.params.paperId)
    paperInfo.value = res.data
  } catch (error) {
    ElMessage.error('获取试卷信息失败')
    router.push('/exam/list')
  }
}

const handleStartExam = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    const res = await startExam(route.params.paperId, form.value.userId, form.value.userName)
    ElMessage.success('考试环境构建成功，正在进入考场...')
    router.push(`/exam/${res.data.id}`)
  } catch (error) {
    ElMessage.error(error.message || '开始考试失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!form.value.userId) {
    ElMessage.error('用户状态已过期或未获取到学号/工号，请重新登录！')
    router.push('/login')
    return
  }
  getPaperInfo()
})
</script>

<style scoped>
.exam-start-container { position: relative; min-height: 100vh; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; overflow: hidden; }

/* 环境光 */
.ambient-background { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; animation: float 20s infinite alternate ease-in-out; }
.blob-1 { top: -10%; left: -5%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%); }
.blob-2 { bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%); animation-delay: -5s; }
@keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(5%, 10%) scale(1.1); } }
.animate-fade-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

/* 高级毛玻璃卡片 */
.premium-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 24px; box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.08); }
.glass-effect-light { background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.8); }

.exam-start-card { position: relative; z-index: 1; max-width: 640px; width: 100%; padding: 40px 48px; }

.card-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 32px; }
.icon-box { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #3b82f6; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(59,130,246,0.15); }
.title { font-size: 26px; color: #0f172a; margin: 0 0 8px; font-weight: 700; letter-spacing: 0.5px; }
.subtitle { color: #64748b; margin: 0; font-size: 15px; font-weight: 500; }

.paper-info { border-radius: 16px; padding: 24px; margin-bottom: 32px; }
.paper-name { font-size: 20px; color: #0f172a; margin: 0 0 12px; font-weight: 700; }
.paper-description { color: #475569; margin: 0 0 20px; line-height: 1.6; font-size: 14px; }
.paper-meta { display: flex; flex-wrap: wrap; gap: 16px; }
.meta-item { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #64748b; background: rgba(255,255,255,0.6); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.8); }
.meta-item strong { color: #0f172a; font-weight: 600; margin-left: 2px; }
.meta-item .el-icon { color: #3b82f6; }

.exam-form { margin-bottom: 32px; }
:deep(.custom-form-item .el-form-item__label) { font-weight: 600; color: #334155; padding-bottom: 8px; }
:deep(.custom-input .el-input__wrapper) { box-shadow: none; background-color: rgba(241, 245, 249, 0.6); border: 1px solid rgba(15,23,42,0.05); padding: 8px 16px; border-radius: 12px; }
:deep(.custom-input.is-disabled .el-input__wrapper) { background-color: rgba(241, 245, 249, 0.4); }
:deep(.custom-input .el-input__inner) { color: #0f172a; font-weight: 500; font-size: 15px; }

.action-item { margin-top: 32px; margin-bottom: 0; }
.submit-btn { width: 100%; height: 54px; font-size: 17px; font-weight: 600; border-radius: 16px; letter-spacing: 1px; border: none; }
.btn-hover-glow { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #fff; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3); }
.btn-hover-glow:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4); }

.exam-rules { border-radius: 16px; padding: 24px; position: relative; overflow: hidden; }
.exam-rules::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #f59e0b; }
.exam-rules h4 { color: #d97706; margin: 0 0 16px; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.exam-rules ul { margin: 0; padding-left: 20px; color: #475569; }
.exam-rules li { margin-bottom: 10px; line-height: 1.6; font-size: 14px; font-weight: 500; }
.exam-rules li:last-child { margin-bottom: 0; }

@media (max-width: 768px) { .exam-start-card { padding: 32px 24px; } .paper-meta { flex-direction: column; gap: 12px; } }
</style>