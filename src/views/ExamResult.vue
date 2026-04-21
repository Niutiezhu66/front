<template>
  <div class="exam-result-page">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>正在生成全景评估报告，请稍候...</p>
    </div>

    <div v-else-if="examRecord" class="result-container">
      <div class="result-header premium-card glass-effect animate-fade-up">
        <div class="header-left">
          <h2><el-icon class="mr-2"><Trophy /></el-icon>考试评估报告</h2>
          <div class="exam-info">
            <span class="info-tag"><el-icon><Document /></el-icon> {{ examRecord.paper.name }}</span>
            <span class="info-tag" v-if="examRecord.studentName"><el-icon><User /></el-icon> {{ examRecord.studentName }}</span>
            <span class="info-tag"><el-icon><Timer /></el-icon> {{ formatDateTime(examRecord.endTime) }} 交卷</span>
          </div>
        </div>
        <div class="header-right">
          <el-tag :type="getStatusTagType(examRecord.status)" class="status-tag" effect="dark" round>
            {{ getStatusText(examRecord.status) }}
          </el-tag>
        </div>
      </div>

      <div v-if="isPendingStatus(examRecord.status) || isFailedStatus(examRecord.status)" class="pending-card premium-card glass-effect animate-fade-up" style="animation-delay: 0.1s;">
        <div class="pending-icon">
          <el-icon :class="{ 'is-loading': !isFailedStatus(examRecord.status) }"><Loading /></el-icon>
        </div>
        <h3>{{ isFailedStatus(examRecord.status) ? '本次阅卷暂时失败' : '系统正在后台阅卷中' }}</h3>
        <p>
          {{ isFailedStatus(examRecord.status)
            ? 'AI 服务暂时不可用，您可以稍后刷新页面或联系老师重试阅卷。'
            : '答卷已提交成功，系统会自动刷新当前页面，生成分数、逐题点评和综合分析。' }}
        </p>
        <div class="pending-meta">
          <span>当前状态：{{ getStatusText(examRecord.status) }}</span>
          <span v-if="lastUpdatedText">最近刷新：{{ lastUpdatedText }}</span>
        </div>
        <el-button v-if="isFailedStatus(examRecord.status)" type="primary" @click="fetchExamResult(false)">重新检查</el-button>
      </div>

      <div class="score-section animate-fade-up" style="animation-delay: 0.1s;">
        <div class="score-card premium-card glass-effect">
          <div class="score-card-inner">
            <div class="score-ring">
              <div class="score-value" :class="scoreClass">{{ examRecord.score || 0 }}</div>
              <div class="score-divider">/ {{ examRecord.paper.totalScore }} 分</div>
            </div>
            <div class="score-meta">
              <div class="meta-grade" :class="scoreClass">{{ getGradeText(scorePercentage) }}</div>
              <div class="meta-percentage">得分率 {{ scorePercentage }}%</div>
            </div>
          </div>
        </div>

        <div v-if="rankingInfo" class="rank-card premium-card glass-effect">
          <div class="rank-header">本卷全站排名</div>
          <div class="rank-number-group">
            <span class="rank-number" :class="getRankClass()">{{ rankingInfo.currentRank }}</span>
            <span class="rank-suffix">/ {{ rankingInfo.totalParticipants }}</span>
          </div>
          <div class="rank-beat">超越了 {{ rankingInfo.beatPercentage }}% 的同学</div>
          <div class="rank-motivation">{{ getMotivationMessage() }}</div>
        </div>

        <div class="details-grid premium-card glass-effect">
          <div class="detail-item">
            <div class="detail-icon blue"><el-icon><Files /></el-icon></div>
            <div class="detail-val">{{ actualQuestionCount }} <span class="unit">道</span></div>
            <div class="detail-label">有效作答</div>
          </div>
          <div class="detail-item">
            <div class="detail-icon green"><el-icon><Select /></el-icon></div>
            <div class="detail-val">{{ correctCount }} <span class="unit">道</span></div>
            <div class="detail-label">完全正确</div>
          </div>
          <div class="detail-item">
            <div class="detail-icon red"><el-icon><CloseBold /></el-icon></div>
            <div class="detail-val">{{ wrongCount }} <span class="unit">道</span></div>
            <div class="detail-label">错误数</div>
          </div>
          <div class="detail-item">
            <div class="detail-icon purple"><el-icon><Clock /></el-icon></div>
            <div class="detail-val">{{ examDuration }}</div>
            <div class="detail-label">答题用时</div>
          </div>
        </div>
      </div>

      <el-card shadow="never" v-if="examRecord.status === '已批阅' && examRecord.answers" class="report-card premium-card glass-effect animate-fade-up" style="animation-delay: 0.2s;">
        <template #header>
          <div class="card-header report-header">
            <div class="report-title-main"><el-icon><Monitor /></el-icon> AI 专家综合诊断</div>
            <div class="report-title-sub">基于试卷结构的系统性分析</div>
          </div>
        </template>
        <div class="report-shell glass-effect-light">
          <div class="report-watermark">CONFIDENTIAL</div>
          <div class="report-content markdown-body" v-html="renderedAiSummary"></div>
        </div>
      </el-card>

      <div v-if="examRecord.status === '已批阅'" class="detailed-results animate-fade-up" style="animation-delay: 0.3s;">
        <h3 class="section-heading">答题详情与逐题解析</h3>
        
        <div v-for="(answerRecord, index) in examRecord.answerRecords" :key="answerRecord.id" class="question-result-card premium-card glass-effect">
          <div class="q-header">
            <div class="q-number">第 {{ index + 1 }} 题 <span class="q-type">{{ getQuestionTypeByRecord(answerRecord) }}</span></div>
            <div class="q-score" :class="getScoreClassByRecord(answerRecord)">
              {{ answerRecord.score || 0 }} / {{ getQuestionMaxScore(answerRecord.questionId) }} 分
            </div>
          </div>
          
          <div class="q-body">
            <div class="q-title">{{ getQuestionTitleByRecord(answerRecord) }}</div>
            
            <div v-if="getQuestionByRecord(answerRecord)?.type === 'CHOICE' && getQuestionByRecord(answerRecord)?.choices" class="q-choices glass-effect-light">
              <div v-for="(choice, idx) in getQuestionByRecord(answerRecord).choices" :key="idx" class="choice-item">
                <span class="choice-label">{{ String.fromCharCode(65 + idx) }}</span>
                <span class="choice-text">{{ choice.content }}</span>
              </div>
            </div>
            
            <div class="answer-comparison">
              <div class="answer-box user-box" :class="getScoreClassByRecord(answerRecord) === 'full' ? 'correct' : (getScoreClassByRecord(answerRecord) === 'zero' ? 'wrong' : 'partial')">
                <div class="box-title">您的作答</div>
                <div class="box-content">{{ getFormattedUserAnswer(answerRecord) }}</div>
              </div>
              <div class="answer-box standard-box">
                <div class="box-title">标准参考答案</div>
                <div class="box-content">{{ getFormattedCorrectAnswer(answerRecord) }}</div>
              </div>
            </div>
            
            <div v-if="answerRecord.aiCorrection && getQuestionByRecord(answerRecord)?.type === 'TEXT'" class="q-ai-feedback glass-effect-light">
              <div class="feedback-title"><el-icon><ChatDotRound /></el-icon> AI 专家点评与得分依据</div>
              <p class="feedback-text">{{ answerRecord.aiCorrection }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons premium-card glass-effect animate-fade-up" style="animation-delay: 0.4s;">
        <el-button type="primary" size="large" @click="retakeChallenge" class="btn-hover-glow" v-if="examRecord.paper">🚀 再次挑战</el-button>
        <el-button size="large" @click="viewRanking" class="btn-hover-glow-plain" v-if="examRecord.paper">🏆 查看榜单</el-button>
        <el-button size="large" @click="goToExamList" class="btn-hover-glow-plain">📝 考试列表</el-button>
        <el-button size="large" @click="goHome" class="btn-hover-glow-plain">
          <el-icon class="mr-1"><HomeFilled /></el-icon> 返回首页
        </el-button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, ChatDotRound, Download, Trophy, Timer, User, Document, Files, Select, CloseBold, Clock, Monitor } from '@element-plus/icons-vue'
import { getExamRecordById } from '../api/exam.js'
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const examRecord = ref(null)
const rankingInfo = ref(null)
const pollTimer = ref(null)
const lastUpdatedText = ref('')
const pendingStatuses = ['待阅卷', '阅卷中', '已完成']
const failedStatuses = ['阅卷失败']

// --- 高级 Markdown 渲染器 (用于 AI 总评) ---
const escapeHtml = (text = '') => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const applyInlineMarkdown = (text = '') => text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')
const renderMarkdown = (markdown = '') => {
  if (!markdown.trim()) return ''
  const escaped = escapeHtml(markdown).replace(/\r\n/g, '\n')
  const lines = escaped.split('\n')
  const html = []; let inList = false; const closeList = () => { if (inList) { html.push('</ul>'); inList = false } }
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
const renderedAiSummary = computed(() => renderMarkdown(examRecord.value?.answers || ''))

// --- 核心指标计算 ---
const scorePercentage = computed(() => {
  if (!examRecord.value || !examRecord.value.paper || !examRecord.value.score) return 0
  return Math.round((examRecord.value.score / examRecord.value.paper.totalScore) * 100)
})

const scoreClass = computed(() => {
  const percentage = scorePercentage.value
  if (percentage >= 90) return 'excellent'
  if (percentage >= 80) return 'good'
  if (percentage >= 60) return 'pass'
  return 'fail'
})

const correctCount = computed(() => examRecord.value?.answerRecords?.filter(r => r.isCorrect === 1).length || 0)
const wrongCount = computed(() => examRecord.value?.answerRecords?.filter(r => r.isCorrect === 0).length || 0)
const partialCount = computed(() => examRecord.value?.answerRecords?.filter(r => r.isCorrect === 2).length || 0)
const actualQuestionCount = computed(() => examRecord.value?.answerRecords?.length || 0)

const examDuration = computed(() => {
  if (!examRecord.value?.startTime || !examRecord.value?.endTime) return '未知'
  const diffMins = Math.max(0, Math.floor((new Date(examRecord.value.endTime) - new Date(examRecord.value.startTime)) / 60000))
  return `${diffMins} 分钟`
})

const isPendingStatus = (status) => pendingStatuses.includes(status)
const isFailedStatus = (status) => failedStatuses.includes(status)
const stopPolling = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}
const startPollingIfNeeded = () => {
  stopPolling()
  if (!examRecord.value || !isPendingStatus(examRecord.value.status)) return
  pollTimer.value = setInterval(() => fetchExamResult(false), 3000)
}
const getStatusText = (status) => ({ '进行中': '考场中', '待阅卷': '等待系统接单', '阅卷中': 'AI阅卷中', '阅卷失败': '阅卷失败', '已完成': '等待AI阅卷', '已批阅': '评估完成' }[status] || status)
const getStatusTagType = (status) => ({ '进行中': 'warning', '待阅卷': 'info', '阅卷中': 'primary', '阅卷失败': 'danger', '已完成': 'info', '已批阅': 'success' }[status] || 'info')
const getQuestionTypeText = (type) => ({ 'CHOICE': '选择题', 'JUDGE': '判断题', 'TEXT': '简答题' }[type] || '未知')
const formatDateTime = (dateTime) => dateTime ? new Date(dateTime).toLocaleString('zh-CN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : '未知'

// --- 题目辅助取值 ---
const getQuestionByRecord = (record) => examRecord.value?.paper?.questions?.find(q => q.id === record.questionId)
const getQuestionTitleByRecord = (record) => getQuestionByRecord(record)?.title || '题目内容丢失'
const getQuestionTypeByRecord = (record) => getQuestionTypeText(getQuestionByRecord(record)?.type || 'UNKNOWN')
const getQuestionMaxScore = (questionId) => examRecord.value?.paper?.questions?.find(q => q.id === questionId)?.paperScore || 10
const getScoreClassByRecord = (record) => {
  const score = record.score || 0; const max = getQuestionMaxScore(record.questionId)
  if (score === 0) return 'zero'; if (score >= max) return 'full'; return 'partial'
}

const formatJudgeAnswer = (ans) => {
  if (!ans) return '未作答'
  const s = ans.toString().toUpperCase()
  return ['T', 'TRUE', '正确', '对'].includes(s) ? '正确' : (['F', 'FALSE', '错误', '错'].includes(s) ? '错误' : ans)
}
const getFormattedUserAnswer = (r) => {
  if (!r.userAnswer) return '未作答'
  return getQuestionByRecord(r)?.type === 'JUDGE' ? formatJudgeAnswer(r.userAnswer) : r.userAnswer
}
const getFormattedCorrectAnswer = (r) => {
  const q = getQuestionByRecord(r); if (!q?.answer?.answer) return '参考信息缺失'
  return q.type === 'JUDGE' ? formatJudgeAnswer(q.answer.answer) : q.answer.answer
}

const getGradeText = (percentage) => { if (percentage >= 90) return 'S 卓越'; if (percentage >= 80) return 'A 优秀'; if (percentage >= 60) return 'B 合格'; return 'C 待提升' }

// --- 排名拉取 ---
const fetchRankingInfo = async (examRecordId, paperId) => {
  try {
    const res = await fetch(`http://localhost:8080/api/exam-records/ranking?paperId=${paperId}&limit=1000`).then(r => r.json())
    if (res.code === 200) {
      const sorted = res.data.sort((a, b) => b.score - a.score)
      const currentRankIndex = sorted.findIndex(r => r.id === examRecordId)
      if (currentRankIndex !== -1) {
        const currentRank = currentRankIndex + 1; const total = sorted.length
        rankingInfo.value = { currentRank, totalParticipants: total, beatPercentage: total > 1 ? Math.round(((total - currentRank) / (total - 1)) * 100) : 0 }
      }
    }
  } catch (e) {}
}

const getRankClass = () => {
  const r = rankingInfo.value?.currentRank; if (!r) return ''
  return r === 1 ? 'rank-gold' : r === 2 ? 'rank-silver' : r === 3 ? 'rank-bronze' : 'rank-normal'
}
const getMotivationMessage = () => {
  const r = rankingInfo.value?.currentRank; const p = scorePercentage.value
  if (r === 1 && p >= 90) return '完美制霸，巅峰表现！'
  if (r === 1) return '恭喜夺魁，继续保持！'
  if (r <= 3) return '稳居三甲，实力超群！'
  if (r <= 10) return '跻身前十，大有可为！'
  if (p >= 80) return '基础扎实，冲刺高分！'
  return '找出盲区，下次逆袭！'
}

const fetchExamResult = async (showLoading = true) => {
  if (showLoading) loading.value = true
  try {
    const id = route.params.id || route.query.id; if (!id) throw new Error('ID缺失')
    const res = await getExamRecordById(id); examRecord.value = res.data
    lastUpdatedText.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    if (examRecord.value.status === '已批阅') {
      stopPolling()
      await fetchRankingInfo(examRecord.value.id, examRecord.value.examId)
    } else if (isPendingStatus(examRecord.value.status)) {
      startPollingIfNeeded()
    } else {
      stopPolling()
    }
  } catch (e) {
    stopPolling()
    ElMessage.error('加载结果失败')
  } finally {
    if (showLoading) loading.value = false
  }
}

const retakeChallenge = () => router.push(`/exam/start/${examRecord.value.paper.id}`)
const viewRanking = () => router.push({ path: '/exam-ranking', query: { paperId: examRecord.value.paper.id } })
const goHome = () => router.push('/')
const goToExamList = () => router.push('/exam/list')

// 防返回
const preventBackToExam = () => {
  const url = window.location.href; window.history.pushState({ page: 'exam-result', preventBack: true }, '', url)
  const onPop = (e) => {
    if (e.state?.preventBack) { window.history.pushState({ page: 'exam-result', preventBack: true }, '', url); return }
    if (document.referrer.includes('/exam/')) { e.preventDefault(); router.replace('/exam/list'); window.history.pushState({ page: 'exam-result', preventBack: true }, '', url) }
  }
  window.addEventListener('popstate', onPop)
  return () => window.removeEventListener('popstate', onPop)
}

onMounted(() => {
  fetchExamResult()
  if (route.path.includes('/exam-result/')) router.replace({ path: route.path, query: { ...route.query, fromExam: 'true' } })
  const cleanup = preventBackToExam()
  onUnmounted(() => {
    cleanup()
    stopPolling()
  })
})
</script>

<style scoped>
/* 核心布局底色与环境光 */
.exam-result-page { position: relative; min-height: 100vh; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 32px 24px; overflow-x: hidden; }
.ambient-background { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; animation: float 25s infinite alternate ease-in-out; }
.blob-1 { top: -5%; left: 0%; width: 45vw; height: 45vw; background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%); }
.blob-2 { bottom: -10%; right: -5%; width: 55vw; height: 55vw; background: radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%); animation-delay: -5s; }
@keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(3%, 5%) scale(1.05); } }

.loading-container { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; color: #64748b; font-size: 16px; }
.loading-container .el-icon { font-size: 40px; color: #3b82f6; margin-bottom: 16px; }

/* 玻璃质感主容器 */
.result-container { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
.animate-fade-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

.premium-card { background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 24px; box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05); transition: all 0.3s ease; }
.glass-effect-light { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.6); }
.pending-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 32px; gap: 14px; }
.pending-icon { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(59,130,246,0.08); color: #3b82f6; font-size: 32px; }
.pending-card h3 { margin: 0; font-size: 24px; color: #0f172a; }
.pending-card p { margin: 0; max-width: 640px; color: #64748b; line-height: 1.8; }
.pending-meta { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; color: #475569; font-size: 14px; font-weight: 600; }

/* 头部模块 */
.result-header { display: flex; justify-content: space-between; align-items: center; padding: 28px 36px; }
.header-left h2 { margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #0f172a; display: flex; align-items: center; }
.header-left h2 .el-icon { color: #f59e0b; }
.exam-info { display: flex; gap: 16px; flex-wrap: wrap; }
.info-tag { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #475569; background: #f1f5f9; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; }

/* 得分与指标布局 */
.score-section { display: grid; grid-template-columns: 3fr 3fr 6fr; gap: 24px; }
@media (max-width: 992px) { .score-section { grid-template-columns: 1fr 1fr; } .details-grid { grid-column: 1 / -1; } }
@media (max-width: 600px) { .score-section { grid-template-columns: 1fr; } }

/* 分数环卡片 */
.score-card { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px 24px; position: relative; overflow: hidden; }
.score-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
.score-ring { text-align: center; margin-bottom: 24px; }
.score-value { font-size: 64px; font-weight: 800; font-family: -apple-system, sans-serif; line-height: 1; background: linear-gradient(135deg, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.score-value.excellent { background: linear-gradient(135deg, #10b981, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.score-value.good { background: linear-gradient(135deg, #3b82f6, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.score-value.pass { background: linear-gradient(135deg, #f59e0b, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.score-value.fail { background: linear-gradient(135deg, #ef4444, #dc2626); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.score-divider { font-size: 16px; color: #94a3b8; font-weight: 600; margin-top: 4px; }
.score-meta { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.meta-grade { font-size: 14px; font-weight: 700; padding: 4px 16px; border-radius: 20px; border: 2px solid #cbd5e1; color: #475569; }
.meta-grade.excellent { border-color: #10b981; color: #10b981; }
.meta-percentage { font-size: 13px; font-weight: 600; color: #64748b; }

/* 排名卡片 */
.rank-card { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px 24px; background: linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05)); }
.rank-header { font-size: 15px; font-weight: 700; color: #475569; margin-bottom: 20px; letter-spacing: 1px; }
.rank-number-group { display: flex; align-items: baseline; margin-bottom: 16px; }
.rank-number { font-size: 56px; font-weight: 800; font-family: -apple-system, sans-serif; line-height: 1; color: #1e293b; }
.rank-number.rank-gold { color: #f59e0b; text-shadow: 0 4px 12px rgba(245,158,11,0.3); }
.rank-number.rank-silver { color: #94a3b8; }
.rank-number.rank-bronze { color: #b45309; }
.rank-suffix { font-size: 20px; font-weight: 600; color: #94a3b8; margin-left: 8px; }
.rank-beat { font-size: 14px; font-weight: 600; color: #3b82f6; background: #eff6ff; padding: 4px 12px; border-radius: 8px; margin-bottom: 12px; }
.rank-motivation { font-size: 13px; color: #64748b; font-weight: 500; text-align: center; }

/* 数据网格 */
.details-grid { display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 16px; padding: 24px; }
.detail-item { display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.4); border-radius: 16px; border: 1px solid rgba(255,255,255,0.6); padding: 20px 10px; transition: transform 0.2s; }
.detail-item:hover { transform: translateY(-2px); background: rgba(255,255,255,0.8); }
.detail-icon { font-size: 24px; margin-bottom: 12px; }
.detail-icon.blue { color: #3b82f6; } .detail-icon.green { color: #10b981; } .detail-icon.red { color: #ef4444; } .detail-icon.purple { color: #8b5cf6; }
.detail-val { font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1; margin-bottom: 6px; }
.detail-val .unit { font-size: 13px; font-weight: 500; color: #94a3b8; margin-left: 2px; }
.detail-label { font-size: 13px; font-weight: 600; color: #64748b; }

/* AI 总评 (复用 Analysis 的排版引擎) */
.report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(15,23,42,0.05); padding-bottom: 16px; margin-bottom: -10px; }
.report-title-main { font-size: 18px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
.report-title-main .el-icon { color: #8b5cf6; font-size: 20px; }
.report-title-sub { font-size: 13px; color: #64748b; }
.report-shell { position: relative; border-radius: 16px; padding: 32px 48px; margin-top: 24px; overflow: hidden; }
.report-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-20deg); font-size: 80px; color: rgba(15,23,42,0.03); font-weight: 900; letter-spacing: 10px; pointer-events: none; z-index: 0; }
.report-content { position: relative; z-index: 1; color: #334155; font-size: 15px; line-height: 1.8; }
.report-content :deep(h1), .report-content :deep(h2), .report-content :deep(h3) { color: #0f172a; margin-top: 1.8em; margin-bottom: 0.8em; font-weight: 700; }
.report-content :deep(h2) { font-size: 17px; padding-left: 14px; border-left: 4px solid #8b5cf6; }
.report-content :deep(p) { margin-bottom: 1.2em; }
.report-content :deep(ul) { padding-left: 24px; margin-bottom: 1.2em; list-style-type: none; }
.report-content :deep(li) { position: relative; margin-bottom: 0.5em; }
.report-content :deep(li)::before { content: "•"; color: #8b5cf6; font-weight: bold; position: absolute; left: -16px; }
.report-content :deep(strong) { font-weight: 700; color: #0f172a; background: linear-gradient(to top, rgba(139,92,246,0.15) 30%, transparent 30%); padding: 0 4px; }

/* 逐题解析列表 */
.section-heading { font-size: 20px; font-weight: 700; color: #0f172a; margin: 40px 0 20px 4px; }
.question-result-card { padding: 0; margin-bottom: 24px; overflow: hidden; }
.q-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: rgba(241, 245, 249, 0.6); border-bottom: 1px solid rgba(15,23,42,0.05); }
.q-number { font-size: 15px; font-weight: 700; color: #1e293b; display: flex; align-items: center; }
.q-type { background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 6px; font-size: 12px; margin-left: 12px; font-weight: 600; }
.q-score { font-weight: 700; font-size: 14px; padding: 4px 12px; border-radius: 8px; }
.q-score.full { background: #dcfce7; color: #059669; } .q-score.partial { background: #fef3c7; color: #d97706; } .q-score.zero { background: #fee2e2; color: #dc2626; }

.q-body { padding: 24px; }
.q-title { font-size: 16px; font-weight: 500; color: #0f172a; line-height: 1.6; margin-bottom: 20px; }

.q-choices { border-radius: 12px; padding: 16px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.choice-item { display: flex; align-items: center; background: #fff; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; }
.choice-label { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #f1f5f9; color: #475569; border-radius: 6px; font-weight: 700; font-size: 13px; margin-right: 12px; flex-shrink: 0; }
.choice-text { font-size: 14px; color: #334155; font-weight: 500; line-height: 1.4; }

.answer-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
@media (max-width: 768px) { .answer-comparison { grid-template-columns: 1fr; } }
.answer-box { padding: 16px; border-radius: 12px; border-left: 4px solid; }
.box-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; opacity: 0.8; }
.box-content { font-size: 15px; font-weight: 600; }
.user-box.correct { background: #ecfdf5; border-left-color: #10b981; color: #065f46; }
.user-box.wrong { background: #fef2f2; border-left-color: #ef4444; color: #991b1b; }
.user-box.partial { background: #fffbeb; border-left-color: #f59e0b; color: #92400e; }
.standard-box { background: #f8fafc; border-left-color: #64748b; color: #334155; }

.q-ai-feedback { padding: 16px 20px; border-radius: 12px; border-left: 4px solid #8b5cf6; }
.feedback-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #7c3aed; margin-bottom: 8px; }
.feedback-text { margin: 0; font-size: 14px; color: #4c1d95; line-height: 1.6; font-weight: 500; }

/* 底部按钮组 */
.action-buttons { display: flex; justify-content: center; gap: 20px; padding: 24px; margin-top: 40px; }
.btn-hover-glow { height: 48px; border-radius: 12px; font-weight: 700; font-size: 16px; padding: 0 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; color: #fff; box-shadow: 0 8px 24px rgba(59,130,246,0.3); transition: all 0.3s; }
.btn-hover-glow:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(59,130,246,0.4); }
.btn-hover-glow-plain { height: 48px; border-radius: 12px; font-weight: 600; font-size: 15px; padding: 0 24px; background: #fff; border: 1px solid #e2e8f0; color: #475569; transition: all 0.3s; }
.btn-hover-glow-plain:hover { transform: translateY(-2px); color: #0f172a; border-color: #cbd5e1; box-shadow: 0 8px 24px rgba(15,23,42,0.06); }
.mr-1 {
  margin-right: 4px;
}
</style>