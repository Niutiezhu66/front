<template>
  <div class="profile-container">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div class="content-wrapper animate-fade-up">
      <el-page-header @back="$router.back()" title="返回" class="custom-page-header">
        <template #content>
          <span class="header-title">个人中心概览</span>
        </template>
      </el-page-header>

      <el-row :gutter="24" class="profile-panels">
        <el-col :xs="24" :lg="14">
          <el-card class="premium-card glass-effect panel-card" shadow="never">
            <template #header>
              <div class="card-header">
                <div class="header-icon bg-blur-blue"><el-icon><UserFilled /></el-icon></div>
                <span>个人资料</span>
              </div>
            </template>

            <el-form
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-width="92px"
              class="profile-form"
            >
              <el-row :gutter="18">
                <el-col :xs="24" :md="12">
                  <el-form-item label="用户名" prop="username">
                    <el-input v-model="profileForm.username" placeholder="请输入用户名" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="姓名" prop="realName">
                    <el-input v-model="profileForm.realName" placeholder="请输入姓名" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="角色">
                    <el-input :model-value="roleText" disabled />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :md="12">
                  <el-form-item label="学号/工号">
                    <el-input :model-value="profileForm.userId" disabled />
                  </el-form-item>
                </el-col>
              </el-row>

              <div class="panel-actions">
                <el-button class="secondary-btn" @click="resetProfileForm">重置</el-button>
                <el-button type="primary" class="primary-btn" :loading="profileSaving" @click="submitProfile">
                  保存资料
                </el-button>
              </div>
            </el-form>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="10">
          <el-card class="premium-card glass-effect panel-card" shadow="never">
            <template #header>
              <div class="card-header">
                <div class="header-icon bg-blur-purple"><el-icon><Lock /></el-icon></div>
                <span>修改密码</span>
              </div>
            </template>

            <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="92px"
              class="profile-form"
            >
              <el-form-item label="旧密码" prop="oldPassword">
                <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
              </el-form-item>

              <div class="password-tip">密码修改成功后保持当前登录状态，下次请使用新密码登录。</div>

              <div class="panel-actions">
                <el-button class="secondary-btn" @click="resetPasswordForm">清空</el-button>
                <el-button type="primary" class="primary-btn" :loading="passwordSaving" @click="submitPassword">
                  修改密码
                </el-button>
              </div>
            </el-form>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="box-card premium-card glass-effect" shadow="never">
        <template #header>
          <div class="card-header">
            <div class="header-icon bg-blur-blue"><el-icon><Document /></el-icon></div>
            <span>我的测评档案</span>
          </div>
        </template>

        <el-table :data="examRecords" v-loading="loading" class="custom-table" style="width: 100%" empty-text="尚无考试归档记录">
          <el-table-column label="测试项目" min-width="240">
            <template #default="{ row }">
              <div class="paper-cell">
                <div class="paper-icon"><el-icon><Files /></el-icon></div>
                <span class="paper-name">{{ row.paper?.name || '未知试卷信息' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="startTime" label="参与时间" width="200">
            <template #default="{ row }"><span class="text-muted fw-500">{{ row.startTime }}</span></template>
          </el-table-column>

          <el-table-column prop="score" label="量化评估" width="140" align="center">
            <template #default="{ row }">
              <span class="score-text" :class="getScoreClass(row.score, row.paper?.totalScore)">
                {{ row.score ?? '-' }}<span class="score-unit">分</span>
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="阶段状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.status)" effect="plain" class="status-tag" round>{{ row.status }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="控制面板" width="260" align="right" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link class="action-btn" @click="viewDetail(row)" :disabled="row.status === '进行中'">
                <el-icon><View /></el-icon> 全局复盘
              </el-button>
              <el-button type="success" link class="action-btn text-success" @click="viewEvaluation(row)" :disabled="row.status !== '已批阅'">
                <el-icon><ChatDotRound /></el-icon> 查收点评
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-dialog
        v-model="evaluationVisible"
        title="系统教研洞察报告"
        width="720px"
        class="premium-dialog glass-dialog"
        append-to-body
        destroy-on-close
      >
        <div class="evaluation-content report-shell glass-effect-light">
          <div class="report-watermark">CONFIDENTIAL</div>
          <el-empty v-if="!currentEvaluation" description="尚无针对本次考核的有效评估报告" :image-size="80" />
          <div v-else class="report-content markdown-body" v-html="renderedEvaluation"></div>
        </div>
        <template #footer>
          <el-button class="dialog-close-btn" @click="evaluationVisible = false">阅毕，关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Document, ChatDotRound, View, Files, UserFilled, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getMyExamRecords } from '../api/exam'
import { updateProfile, changePassword } from '../api/user'
import { useRouter } from 'vue-router'

const examRecords = ref([])
const loading = ref(false)
const router = useRouter()
const evaluationVisible = ref(false)
const currentEvaluation = ref('')
const profileSaving = ref(false)
const passwordSaving = ref(false)
const profileFormRef = ref()
const passwordFormRef = ref()

const getUserInfo = () => JSON.parse(localStorage.getItem('userInfo') || '{}')
const getUserId = () => {
  const info = getUserInfo()
  return info.id || info.userId
}

const profileForm = ref({
  id: null,
  username: '',
  realName: '',
  role: '',
  userId: ''
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const roleText = computed(() => ({ '0': '管理员', '1': '教师', '2': '学生' }[profileForm.value.role] || '未知角色'))

const validateConfirmPassword = (_, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
    return
  }
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
    return
  }
  callback()
}

const profileRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
}

const syncProfileForm = () => {
  const info = getUserInfo()
  profileForm.value = {
    id: info.id || null,
    username: info.username || '',
    realName: info.realName || '',
    role: info.role || '',
    userId: info.userId || ''
  }
}

const resetProfileForm = () => {
  syncProfileForm()
  profileFormRef.value?.clearValidate()
}

const resetPasswordForm = () => {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  passwordFormRef.value?.clearValidate()
}

const loadExamRecords = async () => {
  const userId = getUserId()
  if (!userId) return ElMessage.warning('请先登录系统')
  loading.value = true
  try {
    const res = await getMyExamRecords(userId)
    if (res.code === 200) examRecords.value = res.data
  } catch (error) {
    ElMessage.error('无法读取归档数据')
  } finally {
    loading.value = false
  }
}

const submitProfile = async () => {
  await profileFormRef.value?.validate()
  profileSaving.value = true
  try {
    const res = await updateProfile({
      id: profileForm.value.id,
      username: profileForm.value.username,
      realName: profileForm.value.realName
    })
    const current = getUserInfo()
    const nextUserInfo = { ...current, ...res.data, password: undefined }
    delete nextUserInfo.password
    localStorage.setItem('userInfo', JSON.stringify(nextUserInfo))
    syncProfileForm()
    ElMessage.success('个人资料已更新')
  } catch (error) {
    ElMessage.error(error.message || '个人资料更新失败')
  } finally {
    profileSaving.value = false
  }
}

const submitPassword = async () => {
  await passwordFormRef.value?.validate()
  passwordSaving.value = true
  try {
    await changePassword({
      id: profileForm.value.id,
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    resetPasswordForm()
    ElMessage.success('密码修改成功')
  } catch (error) {
    ElMessage.error(error.message || '密码修改失败')
  } finally {
    passwordSaving.value = false
  }
}

const viewDetail = (row) => router.push(`/exam-result/${row.id}`)
const viewEvaluation = (row) => {
  currentEvaluation.value = row.answers
  evaluationVisible.value = true
}

const getScoreClass = (score, total) => {
  if (score == null) return ''
  const p = total ? score / total : score / 100
  if (p >= 0.8) return 'text-success'
  if (p >= 0.6) return 'text-warning'
  return 'text-danger'
}
const getStatusTag = (status) => ({ '已批阅': 'success', '待阅卷': 'info', '阅卷中': 'primary', '阅卷失败': 'danger', '已完成': 'info', '进行中': 'warning' }[status] || 'info')

const escapeHtml = (text = '') => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const applyInlineMarkdown = (text = '') => text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')
const renderMarkdown = (markdown = '') => {
  if (!markdown.trim()) return ''
  const escaped = escapeHtml(markdown).replace(/\r\n/g, '\n')
  const lines = escaped.split('\n')
  const html = []
  let inList = false
  const closeList = () => { if (inList) { html.push('</ul>'); inList = false } }
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) { closeList(); continue }
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/)
    if (headingMatch) { closeList(); const level = headingMatch[1].length; html.push(`<h${level}>${applyInlineMarkdown(headingMatch[2])}</h${level}>`); continue }
    const listMatch = line.match(/^(\d+[\.、]|[-*+])\s+(.*)$/)
    if (listMatch) { if (!inList) { html.push('<ul>'); inList = true } html.push(`<li>${applyInlineMarkdown(listMatch[2])}</li>`); continue }
    closeList(); html.push(`<p>${applyInlineMarkdown(line)}</p>`)
  }
  closeList(); return html.join('')
}
const renderedEvaluation = computed(() => renderMarkdown(currentEvaluation.value))

onMounted(() => {
  syncProfileForm()
  loadExamRecords()
})
</script>

<style scoped>
.profile-container { position: relative; min-height: calc(100vh - 60px); background-color: #f8fafc; padding: 40px 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; overflow: hidden; }
.ambient-background { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float 20s infinite alternate ease-in-out; }
.blob-1 { top: -10%; left: -5%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%); }
.blob-2 { bottom: -20%; right: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%); animation-delay: -5s; }
@keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(5%, 5%) scale(1.05); } }

.content-wrapper { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }
.animate-fade-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

:deep(.custom-page-header) { margin-bottom: 32px; }
:deep(.custom-page-header .el-page-header__content) { padding-top: 2px; }
.header-title { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; }

.profile-panels { margin-bottom: 24px; }
.premium-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px; box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05); }
.glass-effect { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(16px); }
.panel-card { height: 100%; }

.box-card { padding: 12px; }
:deep(.box-card .el-card__header), :deep(.panel-card .el-card__header) { border-bottom: 1px solid rgba(15,23,42,0.05); padding: 20px 24px; }
:deep(.panel-card .el-card__body) { padding: 24px; }
.card-header { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 18px; color: #0f172a; }
.header-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.bg-blur-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; box-shadow: inset 0 0 0 1px rgba(59,130,246,0.2); }
.bg-blur-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; box-shadow: inset 0 0 0 1px rgba(139,92,246,0.2); }
.profile-form { margin-top: 4px; }
.panel-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
.primary-btn { min-width: 112px; border-radius: 12px; font-weight: 600; }
.secondary-btn { min-width: 96px; border-radius: 12px; font-weight: 600; }
.password-tip { margin: 4px 0 12px; font-size: 13px; line-height: 1.7; color: #64748b; }

:deep(.custom-table) { background: transparent; --el-table-border-color: transparent; --el-table-header-bg-color: transparent; --el-table-row-hover-bg-color: rgba(241, 245, 249, 0.8); }
:deep(.custom-table th.el-table__cell) { background: transparent; color: #64748b; font-weight: 600; font-size: 14px; padding: 16px 0; border-bottom: 1px solid rgba(15,23,42,0.06); }
:deep(.custom-table td.el-table__cell) { background: transparent; border-bottom: 1px dashed rgba(15,23,42,0.06); padding: 20px 0; transition: background 0.3s; }

.paper-cell { display: flex; align-items: center; gap: 12px; }
.paper-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(15,23,42,0.04); color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.paper-name { font-size: 16px; font-weight: 600; color: #1e293b; }
.text-muted { color: #64748b; font-size: 14px; }
.fw-500 { font-weight: 500; }

.score-text { font-size: 22px; font-weight: 800; font-family: -apple-system, sans-serif; color: #0f172a; }
.score-unit { font-size: 13px; font-weight: 600; margin-left: 2px; color: #94a3b8; }
.text-success { color: #10b981 !important; }
.text-warning { color: #f59e0b !important; }
.text-danger { color: #ef4444 !important; }

.status-tag { font-weight: 600; border: none; background: rgba(241,245,249,0.8); }

.action-btn { font-weight: 600; font-size: 14px; border-radius: 8px; padding: 8px 12px; transition: all 0.2s; }
.action-btn:hover:not(:disabled) { background: rgba(59,130,246,0.08); }
.action-btn.text-success:hover:not(:disabled) { background: rgba(16,185,129,0.08); }

.report-shell { position: relative; border-radius: 16px; padding: 32px 40px; min-height: 200px; overflow: hidden; background: rgba(241,245,249,0.5); border: 1px solid rgba(15,23,42,0.05); }
.report-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-20deg); font-size: 80px; color: rgba(15,23,42,0.03); font-weight: 900; letter-spacing: 10px; pointer-events: none; z-index: 0; }

.report-content { position: relative; z-index: 1; color: #334155; font-size: 15px; line-height: 1.85; text-align: justify; }
.report-content :deep(h1), .report-content :deep(h2), .report-content :deep(h3) { color: #0f172a; margin-top: 1.8em; margin-bottom: 0.8em; font-weight: 600; }
.report-content :deep(h2) { font-size: 17px; position: relative; padding-left: 14px; }
.report-content :deep(h2)::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 4px; background: linear-gradient(to bottom, #8b5cf6, #3b82f6); border-radius: 2px; }
.report-content :deep(p) { margin-bottom: 1.2em; }
.report-content :deep(ul) { padding-left: 24px; margin-bottom: 1.2em; list-style-type: none; }
.report-content :deep(li) { position: relative; margin-bottom: 0.5em; }
.report-content :deep(li)::before { content: "•"; color: #8b5cf6; font-weight: bold; position: absolute; left: -16px; }
.report-content :deep(strong) { font-weight: 600; color: #0f172a; background: linear-gradient(to top, rgba(139,92,246,0.15) 30%, transparent 30%); padding: 0 4px; }

.dialog-close-btn { font-weight: 600; border-radius: 12px; padding: 0 24px; height: 40px; background: #f1f5f9; border-color: transparent; color: #475569; transition: all 0.3s; }
.dialog-close-btn:hover { background: #e2e8f0; color: #0f172a; }

:global(.glass-dialog) { background: rgba(255,255,255,0.85) !important; backdrop-filter: blur(24px) !important; border-radius: 24px !important; border: 1px solid rgba(255,255,255,0.9) !important; box-shadow: 0 20px 40px rgba(15,23,42,0.1) !important; overflow: hidden; }
:global(.glass-dialog .el-dialog__header) { border-bottom: 1px solid rgba(15,23,42,0.05) !important; padding: 24px 32px !important; margin-right: 0 !important; }
:global(.glass-dialog .el-dialog__title) { font-weight: 700 !important; font-size: 18px !important; color: #0f172a !important; display: flex !important; align-items: center !important; gap: 8px !important; }
:global(.glass-dialog .el-dialog__title::before) { content: "✨"; }
:global(.glass-dialog .el-dialog__body) { padding: 32px !important; }
:global(.glass-dialog .el-dialog__footer) { padding: 16px 32px 24px !important; border-top: 1px solid rgba(15,23,42,0.05) !important; }
</style>
