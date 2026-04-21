<template>
  <div class="exam-wrapper">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <transition name="fade">
      <div v-if="isGrading" class="grading-overlay">
        <div class="grading-content premium-card">
          <div class="grading-icon-wrapper">
            <div class="glow-ring"></div>
            <el-icon class="is-loading grading-icon"><Loading /></el-icon>
          </div>
          <h3>已交卷，正在转入后台阅卷</h3>
          <p>系统已保存您的答卷，正在跳转到结果页查看实时进度</p>
          <div class="grading-progress">
            <el-progress :percentage="gradingProgress" :stroke-width="6" :show-text="false" color="#3b82f6" class="custom-progress" />
            <p class="progress-text">{{ gradingStatusText }}</p>
          </div>
        </div>
      </div>
    </transition>
    
    <header class="exam-header glass-header">
      <div class="header-left">
        <h2 class="paper-title">{{ examRecord.paper?.name || '在线评估系统' }}</h2>
        <div class="student-info" v-if="examRecord.studentName">
          <el-icon><User /></el-icon>
          <span>{{ examRecord.studentName }} 的专属答卷</span>
        </div>
      </div>
      <div class="header-right">
        <div class="timer-display" :class="{ 'time-warning': remainingTime < 300 }">
          <el-icon><Timer /></el-icon>
          <span>{{ formattedTime }}</span>
        </div>
        <el-progress :percentage="progressPercentage" :stroke-width="6" :show-text="false" :color="remainingTime < 300 ? '#ef4444' : '#3b82f6'" class="timer-progress" />
      </div>
    </header>

    <main class="question-area" v-if="examRecord.paper">
      <div class="questions-container">
        <div v-for="(group, type) in groupedQuestions" :key="type" class="question-group animate-fade-up">
          <div class="group-title-wrapper">
            <h3 class="group-title">{{ getQuestionTypeName(type) }}</h3>
            <div class="group-line"></div>
          </div>
          
          <div v-for="(question, index) in group" :key="question.id" class="question-card premium-card glass-effect">
            <div class="question-title-area">
              <span class="question-badge">第 {{ question.globalIndex }} 题</span>
              <span class="question-score">{{ question.paperScore }} 分</span>
            </div>
            <p class="question-content">{{ question.title }}</p>
            
            <div class="question-options">
              <el-radio-group v-if="question.type === 'CHOICE' && !question.multi" v-model="answers[question.id]" class="block-options">
                <el-radio v-for="(choice, optIndex) in question.choices" :key="choice.id" :label="getOptionLabel(optIndex)" class="option-block">
                  <span class="option-label">{{ getOptionLabel(optIndex) }}</span>
                  <span class="option-text">{{ choice.content }}</span>
                </el-radio>
              </el-radio-group>
              <el-checkbox-group v-if="question.type === 'CHOICE' && question.multi" v-model="answers[question.id]" class="block-options">
                <el-checkbox v-for="(choice, optIndex) in question.choices" :key="choice.id" :label="getOptionLabel(optIndex)" class="option-block">
                  <span class="option-label">{{ getOptionLabel(optIndex) }}</span>
                  <span class="option-text">{{ choice.content }}</span>
                </el-checkbox>
              </el-checkbox-group>
              <el-radio-group v-else-if="question.type === 'JUDGE'" v-model="answers[question.id]" class="block-options judge-options">
                <el-radio label="T" class="option-block judge-block"><span class="option-text">正确</span></el-radio>
                <el-radio label="F" class="option-block judge-block"><span class="option-text">错误</span></el-radio>
              </el-radio-group>
              <div v-else-if="question.type === 'TEXT'" class="textarea-wrapper">
                <div class="textarea-warning"><el-icon><Warning /></el-icon> 防作弊开启：禁止从外部复制粘贴</div>
                <el-input 
                  type="textarea" :rows="6" placeholder="请在此输入您的解答..." v-model="answers[question.id]"
                  class="custom-textarea" @paste.prevent="handlePasteAttempt" @contextmenu.prevent="handleRightClick" @keydown="handleKeyDown" autocomplete="off" spellcheck="false"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="submission-footer animate-fade-up">
         <el-button type="primary" size="large" @click="submit" :loading="isSubmitting" class="submit-btn btn-hover-glow">
            <el-icon class="el-icon--left" v-if="!isSubmitting"><Check /></el-icon>
            确认并结束考试
         </el-button>
      </div>
    </main>
  </div>
</template>

<script setup>
// [注：此处的 script setup 逻辑与您提供的完全一致，未做任何删改，仅保留逻辑]
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getExamRecordById, submitAnswers } from '../api/exam.js';
import { Timer, User, Loading, Warning, Check } from '@element-plus/icons-vue';

const route = useRoute(); const router = useRouter();
const examRecord = ref({}); const answers = ref({}); const timer = ref(null);
const remainingTime = ref(0); const totalTime = ref(0);
const isSubmitting = ref(false); const isGrading = ref(false);
const gradingProgress = ref(0); const gradingStatusText = ref('');

const pendingStatuses = ['待阅卷', '阅卷中', '阅卷失败', '已完成', 'COMPLETED'];

const getExamData = async () => {
  try {
    const res = await getExamRecordById(route.params.id); examRecord.value = res.data;
    if (pendingStatuses.includes(examRecord.value.status) || examRecord.value.status === '已批阅') {
      ElMessage.warning({ message: '该考试已提交，正在跳转到结果页面...', duration: 1500, showClose: false });
      setTimeout(() => { router.replace(`/exam-result/${route.params.id}`); }, 1000); return;
    }
    if (examRecord.value.status !== '进行中' && examRecord.value.status !== 'IN_PROGRESS') {
      ElMessage.error({ message: '考试状态异常，正在跳转到考试列表...', duration: 2000, showClose: false });
      setTimeout(() => { router.replace('/exam/list'); }, 2000); return;
    }
    totalTime.value = (examRecord.value.paper?.duration || 0) * 60; remainingTime.value = totalTime.value; startTimer();
  } catch (error) { ElMessage.error('加载考试信息失败，正在跳转到考试列表...'); setTimeout(() => { router.replace('/exam/list'); }, 2000); }
};

const startTimer = () => {
  timer.value = setInterval(() => {
    if (remainingTime.value > 0) { remainingTime.value--; } else {
      clearInterval(timer.value);
      ElMessage.error({ message: '⏰ 考试时间已到！系统将在3秒后自动交卷...', duration: 3000, showClose: false });
      disableAllInputs(); setTimeout(() => { forceSubmit(); }, 3000);
    }
  }, 1000);
};

const disableAllInputs = () => {
  const radioInputs = document.querySelectorAll('.el-radio__input input'); radioInputs.forEach(input => { input.disabled = true; });
  const checkboxInputs = document.querySelectorAll('.el-checkbox__input input'); checkboxInputs.forEach(input => { input.disabled = true; });
  const textareas = document.querySelectorAll('.el-textarea__inner'); textareas.forEach(textarea => { textarea.disabled = true; textarea.style.backgroundColor = '#f1f5f9'; textarea.style.cursor = 'not-allowed'; });
  showTimeUpOverlay();
};

const showTimeUpOverlay = () => {
  const overlay = document.createElement('div'); overlay.className = 'time-up-overlay';
  overlay.innerHTML = `<div class="time-up-content premium-card">
      <div class="time-up-icon">⏰</div>
      <h3>考试时间已到</h3>
      <p>系统正在自动交卷，请保持网络畅通...</p>
      <div class="countdown-progress"></div>
    </div>`;
  document.body.appendChild(overlay);
};

const forceSubmit = async () => {
  if (isSubmitting.value) return; isSubmitting.value = true;
  try {
    const examRecordId = route.params.id; if (!examRecordId || examRecordId === 'undefined') throw new Error('考试记录ID无效');
    if (pendingStatuses.includes(examRecord.value.status) || examRecord.value.status === '已批阅') {
      showSubmitSuccessOverlay('答卷已提交，正在进入结果页...');
      redirectToResult(examRecordId, 600);
      return;
    }
    const formattedAnswers = Object.entries(answers.value).map(([questionId, answer]) => ({ questionId: Number(questionId), userAnswer: Array.isArray(answer) ? answer.sort().join(',') : answer }));
    await submitAnswers(examRecordId, formattedAnswers);
    const overlay = document.querySelector('.time-up-overlay'); if (overlay) overlay.remove();
    ElMessage.success('系统已自动交卷，后台正在阅卷！');
    showSubmitSuccessOverlay('系统正在后台阅卷，结果页会自动刷新进度...');
    redirectToResult(examRecordId);
  } catch (error) {
    const overlay = document.querySelector('.time-up-overlay'); if (overlay) overlay.remove();
    if (error.message && error.message.includes('已完成')) {
      showSubmitSuccessOverlay('答卷已提交，正在进入结果页...');
      redirectToResult(route.params.id, 600);
    } else {
      ElMessage.error(error.message || '交卷失败');
      isGrading.value = false;
    }
  } finally { isSubmitting.value = false; }
};

const redirectToResult = (examRecordId, delay = 800) => {
  setTimeout(() => {
    isGrading.value = false;
    router.push(`/exam-result/${examRecordId}`);
  }, delay);
};

const showSubmitSuccessOverlay = (text = '已提交答卷，正在进入结果页...') => {
  isGrading.value = true;
  gradingProgress.value = 100;
  gradingStatusText.value = text;
};

const formattedTime = computed(() => { const minutes = Math.floor(remainingTime.value / 60); const seconds = remainingTime.value % 60; return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; });
const progressPercentage = computed(() => { if (totalTime.value === 0) return 0; const passedTime = totalTime.value - remainingTime.value; return Math.floor((passedTime / totalTime.value) * 100); });
const getOptionLabel = (index) => { return String.fromCharCode(65 + index); };

const groupedQuestions = computed(() => {
  if (!examRecord.value.paper?.questions) return {};
  let globalIndex = 0;
  return examRecord.value.paper.questions.reduce((acc, q) => {
    q.globalIndex = ++globalIndex;
    if (q.type === 'CHOICE' && q.multi) answers.value[q.id] = []; else answers.value[q.id] = '';
    if (!acc[q.type]) acc[q.type] = []; acc[q.type].push(q); return acc;
  }, {});
});

const getQuestionTypeName = (type) => { const map = { 'CHOICE': '选择题专区', 'JUDGE': '判断题专区', 'TEXT': '简答题专区' }; return map[type] || '其他题目'; };

const submit = async () => {
  if (isSubmitting.value) { ElMessage.warning('正在交卷中，请稍候...'); return; }
  if (pendingStatuses.includes(examRecord.value.status) || examRecord.value.status === '已批阅') {
    showSubmitSuccessOverlay('答卷已提交，正在进入结果页...');
    redirectToResult(route.params.id, 600);
    return;
  }
  try { await ElMessageBox.confirm('确定要结束并提交考卷吗？提交后将无法修改任何答案。', '确认交卷', { confirmButtonText: '确定交卷', cancelButtonText: '继续答题', type: 'warning', customClass: 'glass-dialog' }); } catch (error) { return; }
  isSubmitting.value = true;
  const formattedAnswers = Object.entries(answers.value).map(([questionId, answer]) => ({ questionId: Number(questionId), userAnswer: Array.isArray(answer) ? answer.sort().join(',') : answer }));
  try {
    const examRecordId = route.params.id; if (!examRecordId || examRecordId === 'undefined') throw new Error('考试记录ID无效');
    await submitAnswers(examRecordId, formattedAnswers);
    ElMessage.success('交卷成功，系统正在后台阅卷！');
    showSubmitSuccessOverlay('已交卷，结果页将展示实时阅卷进度...');
    redirectToResult(examRecordId);
  } catch (error) {
    if (error.message && error.message.includes('已完成')) {
      ElMessage.success('考试已完成');
      showSubmitSuccessOverlay('答卷已提交，正在进入结果页...');
      redirectToResult(route.params.id, 600);
    } else {
      ElMessage.error(error.message || '交卷失败');
      isGrading.value = false;
    }
  } finally { isSubmitting.value = false; }
};

const handlePasteAttempt = () => { ElMessage.warning('为保证公平性，防作弊系统已拦截您的粘贴操作。'); };
const handleRightClick = () => { ElMessage.warning('系统监控中：禁止使用右键菜单。'); };
const handleKeyDown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'v') { event.preventDefault(); ElMessage.warning('系统监控中：已拦截 Ctrl+V 快捷键。'); return; }
  if (event.key === 'F12') { event.preventDefault(); ElMessage.warning('系统监控中：禁止唤出开发者工具。'); return; }
};
onMounted(() => { getExamData(); });
onUnmounted(() => { clearInterval(timer.value); });
</script>

<style scoped>
/* 全局页面容器与高级背景 */
.exam-wrapper { position: relative; min-height: 100vh; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding-bottom: 60px; overflow-x: hidden; }
.ambient-background { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float 25s infinite alternate ease-in-out; }
.blob-1 { top: -10%; right: -5%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%); }
.blob-2 { bottom: -20%; left: -10%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%); animation-delay: -5s; }
@keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(4%, 8%) scale(1.05); } }
.animate-fade-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

/* 高级毛玻璃组件 */
.premium-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px; box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05); transition: all 0.3s ease; }
.glass-effect { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(16px); }

/* 悬浮导航头 */
.exam-header { position: sticky; top: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(24px); border-bottom: 1px solid rgba(15, 23, 42, 0.06); box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02); }
.header-left .paper-title { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px; }
.student-info { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 13px; font-weight: 500; }
.header-right { display: flex; flex-direction: column; align-items: flex-end; width: 220px; }
.timer-display { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 6px; transition: color 0.3s; font-variant-numeric: tabular-nums; }
.timer-display.time-warning { color: #ef4444; animation: pulse-text 2s infinite; }
@keyframes pulse-text { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.timer-progress { width: 100%; }

/* 主区域与题型分组 */
.question-area { position: relative; z-index: 1; max-width: 900px; margin: 32px auto 0; padding: 0 20px; }
.question-group { margin-bottom: 40px; }
.group-title-wrapper { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.group-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; white-space: nowrap; }
.group-line { flex: 1; height: 1px; background: linear-gradient(to right, rgba(15,23,42,0.1), transparent); }

/* 题目卡片 */
.question-card { padding: 32px; margin-bottom: 20px; }
.question-card:hover { transform: translateY(-2px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.08); border-color: #fff; }
.question-title-area { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.question-badge { background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid #e2e8f0; }
.question-score { color: #3b82f6; font-size: 14px; font-weight: 700; background: rgba(59,130,246,0.1); padding: 4px 12px; border-radius: 8px; }
.question-content { font-size: 16px; color: #0f172a; line-height: 1.7; font-weight: 500; margin: 0 0 24px 0; }

/* 块级选项设计 (Block Options) */
.block-options { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.judge-options { flex-direction: row; }
.option-block { display: flex; align-items: center; width: 100%; padding: 14px 20px; margin: 0; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-sizing: border-box; }
.judge-block { flex: 1; justify-content: center; }
.option-block:hover { background: #fff; border-color: #cbd5e1; transform: translateX(4px); box-shadow: 0 4px 12px rgba(15,23,42,0.03); }
.judge-block:hover { transform: translateY(-2px); }

/* 深度定制 Element 单/多选框使其融合进 Block 中 */
:deep(.el-radio), :deep(.el-checkbox) { height: auto; }
:deep(.el-radio.is-checked), :deep(.el-checkbox.is-checked) { background: #eff6ff; border-color: #3b82f6; box-shadow: 0 4px 16px rgba(59,130,246,0.15); transform: translateX(4px); }
:deep(.judge-options .el-radio.is-checked) { transform: translateY(-2px); }
:deep(.el-radio__inner), :deep(.el-checkbox__inner) { border-color: #94a3b8; }
:deep(.el-radio__label), :deep(.el-checkbox__label) { display: flex; align-items: center; padding-left: 12px; flex: 1; white-space: normal; line-height: 1.5; color: #334155; font-size: 15px; }

.option-label { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #e2e8f0; color: #475569; border-radius: 6px; font-weight: 700; margin-right: 12px; font-size: 13px; transition: all 0.2s; flex-shrink: 0; }
:deep(.is-checked) .option-label { background: #3b82f6; color: #fff; }

/* 简答题区域 */
.textarea-wrapper { position: relative; }
.textarea-warning { position: absolute; right: 12px; top: -28px; font-size: 12px; font-weight: 600; color: #f59e0b; display: flex; align-items: center; gap: 4px; background: #fffbeb; padding: 4px 10px; border-radius: 6px; }
:deep(.custom-textarea .el-textarea__inner) { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 15px; color: #0f172a; line-height: 1.7; transition: all 0.3s; box-shadow: none; }
:deep(.custom-textarea .el-textarea__inner:focus) { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.15); }

/* 底部交卷区 */
.submission-footer { text-align: center; margin-top: 48px; padding-top: 32px; border-top: 1px dashed rgba(15,23,42,0.1); }
.submit-btn { padding: 0 48px; height: 56px; font-size: 18px; font-weight: 700; border-radius: 16px; border: none; letter-spacing: 1px; }
.btn-hover-glow { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #fff; box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.btn-hover-glow:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4); }

/* 系统级 AI 遮罩层 */
.grading-overlay, :global(.time-up-overlay) { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); z-index: 9999; display: flex; justify-content: center; align-items: center; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.grading-content, :global(.time-up-content) { background: rgba(255, 255, 255, 0.85); text-align: center; padding: 48px 60px; max-width: 420px; width: 90%; }
.grading-icon-wrapper { position: relative; width: 80px; height: 80px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; }
.glow-ring { position: absolute; inset: 0; border-radius: 50%; border: 3px solid transparent; border-top-color: #3b82f6; border-right-color: #8b5cf6; animation: spin 1.5s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.grading-icon { font-size: 32px; color: #0f172a; }
.grading-content h3, :global(.time-up-content h3) { margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a; }
.grading-content p, :global(.time-up-content p) { color: #64748b; font-size: 15px; margin: 0 0 24px 0; }
:deep(.custom-progress .el-progress-bar__outer) { background-color: #e2e8f0; border-radius: 10px; }
:deep(.custom-progress .el-progress-bar__inner) { border-radius: 10px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); transition: width 0.4s ease; }
.progress-text { margin-top: 12px !important; font-size: 13px !important; font-weight: 600; color: #3b82f6 !important; }

/* 响应式 */
@media (max-width: 768px) { .exam-header { flex-direction: column; padding: 16px; gap: 12px; text-align: center; } .header-right { width: 100%; align-items: center; } .question-card { padding: 24px 16px; } .judge-options { flex-direction: column; } .option-block:hover { transform: none; } :deep(.el-radio.is-checked), :deep(.el-checkbox.is-checked) { transform: none; } }
</style>