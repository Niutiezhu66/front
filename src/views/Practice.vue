<template>
  <div class="practice-page">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div class="navbar glass-header">
      <div class="nav-container">
        <div class="logo">
          <img src="../assets/logo.svg" alt="logo" class="logo-img" />
          <span class="title">智能训练馆</span>
        </div>
        <div class="nav-actions">
          <el-button text class="nav-btn" @click="goBack"><el-icon>
              <ArrowLeft />
            </el-icon>返回主页</el-button>
          <el-button text class="nav-btn" @click="goToExam"><el-icon>
              <Document />
            </el-icon>在线测试</el-button>
          <el-button text class="nav-btn text-primary" @click="showStats"><el-icon>
              <DataAnalysis />
            </el-icon>我的统计</el-button>
          <div class="divider"></div>
          <el-button text class="nav-btn text-danger" @click="resetAllPractice"><el-icon>
              <RefreshRight />
            </el-icon>重置记录</el-button>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="sidebar premium-card glass-effect animate-fade-up">
        <div class="sidebar-header">
          <h3><el-icon>
              <FolderOpened />
            </el-icon> 知识图谱</h3>
          <el-button link type="primary" @click="resetCategoryFilter" :disabled="!selectedCategoryId"
            class="reset-btn">重置筛选</el-button>
        </div>
        <div class="category-tree">
          <el-tree :data="categoryTree" :props="{ label: 'name', children: 'children' }"
            @node-click="handleCategorySelect" node-key="id" :current-node-key="selectedCategoryId" highlight-current
            :expand-on-click-node="false" default-expand-all class="custom-tree">
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <span class="node-label">{{ node.label }}</span>
                <span v-if="data.count !== undefined" class="node-count">{{ data.count }}</span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>

      <div class="content-area animate-fade-up" style="animation-delay: 0.1s;">
        <div class="search-bar premium-card glass-effect">
          <el-input v-model="searchForm.keyword" placeholder="搜索题目内容..." clearable class="custom-input search-input"
            @input="handleSearch">
            <template #prefix><el-icon>
                <Search />
              </el-icon></template>
          </el-input>
          <el-select v-model="searchForm.type" placeholder="所有题型" clearable class="custom-select"
            @change="handleSearch">
            <el-option label="选择题" value="CHOICE" />
            <el-option label="判断题" value="JUDGE" />
            <el-option label="简答题" value="TEXT" />
          </el-select>
          <el-select v-model="searchForm.difficulty" placeholder="所有难度" clearable class="custom-select"
            @change="handleSearch">
            <el-option label="简单" value="EASY" />
            <el-option label="中等" value="MEDIUM" />
            <el-option label="困难" value="HARD" />
          </el-select>
          <div class="action-group">
            <el-button type="primary" class="btn-hover-glow" @click="handleSearch"><el-icon>
                <Search />
              </el-icon> 检索</el-button>
            <el-button v-if="!searchForm.collected" type="warning" plain class="collect-btn"
              @click="showCollectedQuestions"><el-icon>
                <Star />
              </el-icon> 看收藏</el-button>
            <el-button v-if="searchForm.collected" type="info" plain class="collect-btn"
              @click="backToNormalMode"><el-icon>
                <ArrowLeft />
              </el-icon> 回题库</el-button>
          </div>
        </div>

        <div v-if="searchForm.collected" class="collected-mode-tip">
          <el-alert title="我的星标题库" type="warning" :closable="false" show-icon class="custom-alert">
            <template #default>共为您筛选出 <strong>{{ pagination.total }}</strong> 道重点收藏题目。</template>
          </el-alert>
        </div>

        <div class="question-list" v-loading="loading">
          <div v-for="(question, index) in questionList" :key="question.id"
            class="question-card premium-card glass-effect"
            :class="{ 'answered': question.isAnswered, 'correct': question.isCorrect, 'target-question': String(question.id) === String(targetQuestionId) }"
            :id="`question-${question.id}`">
            <div class="question-header">
              <div class="question-info">
                <span class="question-badge">第 {{ (pagination.current - 1) * pagination.size + index + 1 }} 题</span>
                <el-tag :type="getQuestionTypeTag(question.type)" effect="plain" class="type-tag">{{
                  getQuestionTypeText(question.type) }}</el-tag>
                <el-tag :type="getDifficultyType(question.difficulty)" effect="plain" class="diff-tag">{{
                  getDifficultyText(question.difficulty) }}</el-tag>
                <span class="category-name"><el-icon>
                    <Folder />
                  </el-icon> {{ question.categoryName }}</span>
              </div>
              <div class="question-actions">
                <el-button link :type="question.showAnswer ? 'primary' : 'info'" @click="toggleAnswer(question)"
                  class="action-btn">
                  <el-icon>
                    <component :is="question.showAnswer ? 'Hide' : 'View'" />
                  </el-icon> {{ question.showAnswer ? '隐藏解析' : '看解析' }}
                </el-button>
                <el-button link :type="question.isCollected ? 'warning' : 'info'" @click="toggleCollect(question)"
                  class="action-btn">
                  <el-icon>
                    <component :is="question.isCollected ? 'StarFilled' : 'Star'" />
                  </el-icon> {{ question.isCollected ? '已摘录' : '摘录' }}
                </el-button>
              </div>
            </div>

            <div class="question-content">
              <h4 class="question-title">{{ question.title }}</h4>

              <div v-if="question.type === 'CHOICE' && question.choices" class="block-options">
                <div v-for="(choice, choiceIndex) in question.choices" :key="choiceIndex" class="option-block"
                  :class="{ 'correct': question.showAnswer && choice.isCorrect, 'selected': getChoiceSelected(question, choice) }"
                  @click="selectChoice(question, choice)">
                  <span class="option-label">{{ String.fromCharCode(65 + choiceIndex) }}</span>
                  <span class="option-text">{{ choice.content }}</span>
                  <el-icon v-if="question.showAnswer && choice.isCorrect" class="correct-icon">
                    <CircleCheckFilled />
                  </el-icon>
                </div>
              </div>

              <div v-if="question.type === 'JUDGE'" class="block-options judge-options">
                <el-radio-group v-model="question.userAnswer" @change="handleJudgeAnswer(question)"
                  class="full-width-radio">
                  <el-radio label="TRUE" class="option-block judge-block">正确 (T)</el-radio>
                  <el-radio label="FALSE" class="option-block judge-block">错误 (F)</el-radio>
                </el-radio-group>
              </div>

              <div v-if="question.type === 'TEXT'" class="text-answer">
                <el-input v-model="question.userAnswer" type="textarea" :rows="4" placeholder="在此推演您的解答过程..."
                  @blur="handleTextAnswer(question)" class="custom-textarea" />
              </div>

              <el-collapse-transition>
                <div v-if="question.showAnswer" class="answer-section glass-effect-light">
                  <div class="answer-header"><el-icon>
                      <Opportunity />
                    </el-icon><span>标准答案</span></div>
                  <div class="answer-content">
                    <div v-if="question.type === 'CHOICE'">
                      <div v-for="(choice, choiceIndex) in question.choices" :key="choiceIndex">
                        <span v-if="choice.isCorrect" class="correct-answer-text">{{ String.fromCharCode(65 +
                          choiceIndex) }}.
                          {{ choice.content }}</span>
                      </div>
                    </div>
                    <div v-else-if="question.type === 'JUDGE'"><span class="correct-answer-text">{{
                      question.answer?.answer
                        === 'TRUE' ? '正确' : '错误' }}</span></div>
                    <div v-else>
                      <div class="text-answer-content markdown-body">{{ question.answer?.answer }}</div>
                    </div>
                  </div>

                  <div v-if="question.analysis" class="analysis-section">
                    <div class="analysis-header"><el-icon>
                        <Reading />
                      </el-icon><span>深度解析</span></div>
                    <div class="analysis-content markdown-body">{{ question.analysis }}</div>
                  </div>
                </div>
              </el-collapse-transition>

              <el-collapse-transition>
                <div v-if="question.isAnswered && question.showAnswer && question.type !== 'TEXT'"
                  class="feedback-section">
                  <div class="feedback-alert" :class="question.isCorrect ? 'is-success' : 'is-error'">
                    <el-icon class="feedback-icon">
                      <component :is="question.isCorrect ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
                    </el-icon>
                    <div class="feedback-msg">
                      <strong>{{ question.isCorrect ? '回答完全正确！' : '很遗憾，回答错误。' }}</strong>
                      <span v-if="!question.isCorrect" class="wrong-detail">您的轨迹：{{ question.type === 'CHOICE' ?
                        formatChoiceUserAnswer(question) : (question.userAnswer === 'TRUE' ? '正确' : '错误') }}</span>
                    </div>
                  </div>
                </div>
              </el-collapse-transition>
            </div>
          </div>

          <div v-if="!loading && questionList.length === 0" class="empty-state premium-card glass-effect">
            <el-empty description="当前知识域暂无题目，请尝试切换节点" :image-size="100" />
          </div>
        </div>

        <div class="pagination-wrapper" v-if="questionList.length > 0">
          <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size"
            :page-sizes="[5, 10, 20, 50]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange" @current-change="handleCurrentChange" background
            class="custom-pagination" />
        </div>
      </div>
    </div>

    <el-dialog v-model="statsDialogVisible" title="我的训练统计报告" width="680px" class="premium-dialog glass-dialog">
      <div class="stats-content">
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-num text-gradient-blue">{{ practiceStats.totalQuestions }}</div>
            <div class="stat-label">库内总题量</div>
          </div>
          <div class="stat-box">
            <div class="stat-num text-gradient-purple">{{ practiceStats.answeredCount }}</div>
            <div class="stat-label">已练题数</div>
          </div>
          <div class="stat-box">
            <div class="stat-num text-gradient-green">{{ practiceStats.correctCount }}</div>
            <div class="stat-label">消灭错题</div>
          </div>
          <div class="stat-box">
            <div class="stat-num text-gradient-orange">{{ practiceStats.correctRate }}%</div>
            <div class="stat-label">全盘胜率</div>
          </div>
        </div>

        <div class="stats-detail">
          <h4 class="detail-title"><el-icon>
              <DataLine />
            </el-icon> 细分领域掌握度</h4>
          <el-table :data="practiceStats.categoryStats" class="custom-table" height="280">
            <el-table-column prop="categoryName" label="知识图谱节点" min-width="120" />
            <el-table-column prop="totalCount" label="题量" width="80" align="center" />
            <el-table-column prop="answeredCount" label="覆盖" width="80" align="center" />
            <el-table-column label="胜率" width="120" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.correctRate" :color="row.correctRate > 60 ? '#10b981' : '#f59e0b'"
                  :stroke-width="6" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
// [脚本内容与您原文件完全一致，逻辑未改动]
import { nextTick, ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, ArrowLeft, Document, DataAnalysis, View, Hide, Star, StarFilled, CircleCheckFilled, CircleCloseFilled, Opportunity, Reading, Folder, FolderOpened, RefreshRight, DataLine } from '@element-plus/icons-vue'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const categoryTree = ref([]); const selectedCategoryId = ref(''); const questionList = ref([]); const loading = ref(false)
const targetQuestionId = ref('')
const targetQuestionDetail = ref(null)
const viewedQuestionIds = ref(new Set())
const pagination = reactive({ current: 1, size: 10, total: 0 })
const searchForm = reactive({ keyword: '', type: '', difficulty: '', collected: false })
const practiceStats = ref({ totalQuestions: 0, answeredCount: 0, correctCount: 0, correctRate: 0, categoryStats: [] })
const statsDialogVisible = ref(false)

const getCategoryTree = async () => {
  try {
    const res = await request.get('/api/categories/tree'); categoryTree.value = res.data || []
    if (categoryTree.value.length > 0) {
      let foundCategory = false
      for (const parentCategory of categoryTree.value) {
        if (parentCategory.children && parentCategory.children.length > 0) {
          for (const childCategory of parentCategory.children) {
            if (childCategory.count && childCategory.count > 0) { selectedCategoryId.value = childCategory.id; foundCategory = true; break }
          }
          if (foundCategory) break
        }
      }
      if (!foundCategory) searchForm.type = 'CHOICE'
      await getQuestionList()
    }
  } catch (error) { ElMessage.error('获取分类树失败') }
}

const getQuestionList = async () => {
  if (searchForm.collected) { await getCollectedQuestions(); return }
  if (!selectedCategoryId.value && !searchForm.type && !searchForm.keyword && !searchForm.difficulty) { if (categoryTree.value.length > 0) ElMessage.warning('请先选择题目分类或筛选条件'); return }
  loading.value = true
  try {
    const params = { page: pagination.current, size: pagination.size }
    if (selectedCategoryId.value) params.categoryId = selectedCategoryId.value
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.type) params.type = searchForm.type
    if (searchForm.difficulty) params.difficulty = searchForm.difficulty
    const res = await request.get('/api/questions/list', { params })
    questionList.value = res.data.records || []
    pagination.total = res.data.total || 0
    ensureTargetQuestionVisible()
    await loadPracticeRecords()
    await scrollToTargetQuestion()
    if (questionList.value.length === 0 && pagination.current > 1) { pagination.current = 1; await getQuestionList() }
  } catch (error) { ElMessage.error('获取题目列表失败') } finally { loading.value = false }
}

const getCollectedQuestions = async () => {
  loading.value = true
  try {
    const records = JSON.parse(localStorage.getItem(getStorageKey()) || '{}')
    const collectedQuestionIds = Object.keys(records).filter(id => records[id].isCollected)
    if (collectedQuestionIds.length === 0) { questionList.value = []; pagination.total = 0; return }
    const params = { page: 1, size: 1000 }
    if (searchForm.type) params.type = searchForm.type
    if (searchForm.difficulty) params.difficulty = searchForm.difficulty
    const res = await request.get('/api/questions/list', { params })
    let filteredQuestions = (res.data.records || []).filter(q => collectedQuestionIds.includes(q.id.toString()))
    if (searchForm.keyword && searchForm.keyword.trim()) {
      const keyword = searchForm.keyword.trim().toLowerCase()
      filteredQuestions = filteredQuestions.filter(q => q.title && q.title.toLowerCase().includes(keyword))
    }
    questionList.value = filteredQuestions
    pagination.total = questionList.value.length
    const startIndex = (pagination.current - 1) * pagination.size
    questionList.value = questionList.value.slice(startIndex, startIndex + pagination.size)
    await loadPracticeRecords()
  } catch (error) { ElMessage.error('获取收藏题目失败') } finally { loading.value = false }
}

const loadPracticeRecords = async () => {
  try {
    const records = JSON.parse(localStorage.getItem(getStorageKey()) || '{}')
    questionList.value.forEach(question => {
      const record = records[question.id]
      if (record) { question.userAnswer = record.userAnswer; question.isAnswered = record.isAnswered; question.isCorrect = record.isCorrect; question.isCollected = record.isCollected }
    })
  } catch (error) { }
}

const savePracticeRecord = (question) => {
  try {
    const records = JSON.parse(localStorage.getItem(getStorageKey()) || '{}')
    records[question.id] = { userAnswer: question.userAnswer, isAnswered: question.isAnswered, isCorrect: question.isCorrect, isCollected: question.isCollected, answeredAt: new Date().toISOString() }
    localStorage.setItem(getStorageKey(), JSON.stringify(records))
    updatePracticeStats()
  } catch (error) { }
}

const updatePracticeStats = async () => {
  try {
    const allQuestionsRes = await request.get('/api/questions/list', { params: { page: 1, size: 9999 } })
    const allQuestions = allQuestionsRes.data.records
    const records = JSON.parse(localStorage.getItem(getStorageKey()) || '{}')
    const answered = allQuestions.filter(q => records[q.id]?.isAnswered)
    const objectiveQuestions = answered.filter(q => q.type === 'CHOICE' || q.type === 'JUDGE')
    const correct = objectiveQuestions.filter(q => records[q.id]?.isCorrect)
    const categoryStats = {}
    allQuestions.forEach(question => {
      const categoryName = question.categoryName || '未分类'
      if (!categoryStats[categoryName]) categoryStats[categoryName] = { categoryName, totalCount: 0, answeredCount: 0, correctCount: 0, correctRate: 0 }
      categoryStats[categoryName].totalCount++
      if (records[question.id]?.isAnswered) {
        categoryStats[categoryName].answeredCount++
        if ((question.type === 'CHOICE' || question.type === 'JUDGE') && records[question.id]?.isCorrect) categoryStats[categoryName].correctCount++
      }
    })
    Object.values(categoryStats).forEach(stat => {
      const objectiveAnswered = stat.answeredCount
      stat.correctRate = objectiveAnswered > 0 ? Math.round((stat.correctCount / objectiveAnswered) * 100) : 0
    })
    practiceStats.value = { totalQuestions: allQuestions.length, answeredCount: answered.length, correctCount: correct.length, correctRate: objectiveQuestions.length > 0 ? Math.round((correct.length / objectiveQuestions.length) * 100) : 0, categoryStats: Object.values(categoryStats) }
  } catch (error) { }
}

const ensureTargetQuestionVisible = () => {
  if (!targetQuestionId.value || !targetQuestionDetail.value) return
  const exists = questionList.value.some(question => String(question.id) === String(targetQuestionId.value))
  if (!exists) {
    questionList.value = [targetQuestionDetail.value, ...questionList.value]
    pagination.total += 1
  }
}
const handleCategorySelect = (data) => {
  searchForm.collected = false
  targetQuestionId.value = ''
  targetQuestionDetail.value = null
  if (data.children && data.children.length > 0) {
    const categoryName = data.name; let questionType = ''
    switch (categoryName) { case '选择题': questionType = 'CHOICE'; break; case '判断题': questionType = 'JUDGE'; break; case '简答题': questionType = 'TEXT'; break; }
    searchForm.type = questionType; selectedCategoryId.value = ''
  } else { selectedCategoryId.value = data.id; searchForm.type = '' }
  pagination.current = 1; getQuestionList()
}
const resetCategoryFilter = () => { searchForm.collected = false; selectedCategoryId.value = ''; pagination.current = 1; getQuestionList() }
const handleSearch = () => { targetQuestionId.value = ''; targetQuestionDetail.value = null; if (!searchForm.collected) searchForm.collected = false; pagination.current = 1; getQuestionList() }
const markQuestionViewed = async (questionId) => {
  if (!questionId || viewedQuestionIds.value.has(String(questionId))) return
  viewedQuestionIds.value.add(String(questionId))
  try {
    await request.post(`/api/questions/${questionId}/view`)
  } catch (error) {}
}
const toggleAnswer = async (question) => {
  if (!question.showAnswer) {
    try {
      await markQuestionViewed(question.id)
      const res = await request.get(`/api/questions/${question.id}`)
      if (res.data) {
        Object.assign(question, res.data)
        question.showAnswer = true
      }
    } catch (error) { ElMessage.error('获取答案失败') }
  }
  else { question.showAnswer = false }
}
const getStorageKey = () => { const userInfoStr = localStorage.getItem('userInfo'); if (userInfoStr) { const info = JSON.parse(userInfoStr); return `practiceRecords_${info.userId || info.id}` }; return 'practiceRecords_guest' }
const toggleCollect = (question) => { question.isCollected = !question.isCollected; savePracticeRecord(question); ElMessage.success(question.isCollected ? '已收藏' : '已取消收藏') }
const selectChoice = async (question, choice) => {
  await markQuestionViewed(question.id)
  if (question.multi) { const answers = question.userAnswer ? question.userAnswer.split(',') : []; const index = answers.indexOf(choice.content); if (index > -1) answers.splice(index, 1); else answers.push(choice.content); question.userAnswer = answers.join(',') }
  else { question.userAnswer = choice.content }
  question.isAnswered = true; question.isCorrect = checkAnswerCorrect(question); savePracticeRecord(question)
}
const handleJudgeAnswer = async (question) => { await markQuestionViewed(question.id); question.isAnswered = true; question.isCorrect = checkAnswerCorrect(question); savePracticeRecord(question) }
const handleTextAnswer = async (question) => { if (question.userAnswer && question.userAnswer.trim()) { await markQuestionViewed(question.id); question.isAnswered = true; savePracticeRecord(question) } }
const checkAnswerCorrect = (question) => {
  if (question.type === 'CHOICE') {
    const correctAnswers = question.choices.filter(c => c.isCorrect).map(c => c.content)
    if (question.multi) { const userAnswers = question.userAnswer ? question.userAnswer.split(',') : []; return correctAnswers.length === userAnswers.length && correctAnswers.every(a => userAnswers.includes(a)) }
    else { return correctAnswers.includes(question.userAnswer) }
  } else if (question.type === 'JUDGE') { return question.userAnswer === question.answer?.answer } else { return true }
}
const getChoiceLabel = (question, answerContent) => { if (!question.choices || !answerContent) return ''; const index = question.choices.findIndex(c => c.content === answerContent); return index >= 0 ? String.fromCharCode(65 + index) : answerContent }
const formatChoiceUserAnswer = (question) => { if (!question.userAnswer) return ''; if (question.multi) { return question.userAnswer.split(',').map(a => getChoiceLabel(question, a)).join('、') } else { return getChoiceLabel(question, question.userAnswer) } }
const getChoiceSelected = (question, choice) => { if (!question.userAnswer) return false; if (question.multi) { return question.userAnswer.split(',').includes(choice.content) } else { return question.userAnswer === choice.content } }
const handleSizeChange = (size) => { targetQuestionId.value = ''; targetQuestionDetail.value = null; pagination.size = size; getQuestionList() }
const handleCurrentChange = (current) => { targetQuestionId.value = ''; targetQuestionDetail.value = null; pagination.current = current; getQuestionList() }
const showStats = () => { updatePracticeStats(); statsDialogVisible.value = true }
const getQuestionTypeText = (type) => ({ 'CHOICE': '选择题', 'JUDGE': '判断题', 'TEXT': '简答题' }[type] || type)
const getQuestionTypeTag = (type) => ({ 'CHOICE': 'primary', 'JUDGE': 'success', 'TEXT': 'warning' }[type] || 'info')
const getDifficultyText = (diff) => ({ 'EASY': '简单', 'MEDIUM': '中等', 'HARD': '困难' }[diff] || diff)
const getDifficultyType = (diff) => ({ 'EASY': 'success', 'MEDIUM': 'warning', 'HARD': 'danger' }[diff] || 'info')
const scrollToTargetQuestion = async () => {
  if (!targetQuestionId.value) return
  await nextTick()
  const element = document.getElementById(`question-${targetQuestionId.value}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
const initFromRoute = async () => {
  const { questionId, categoryId, fromHomeHot } = route.query
  targetQuestionId.value = questionId || ''
  targetQuestionDetail.value = null
  if (targetQuestionId.value) {
    try {
      if (fromHomeHot !== '1') {
        await markQuestionViewed(targetQuestionId.value)
      } else {
        viewedQuestionIds.value.add(String(targetQuestionId.value))
      }
      const res = await request.get(`/api/questions/${targetQuestionId.value}`)
      targetQuestionDetail.value = res.data || null
      if (targetQuestionDetail.value?.categoryId) {
        selectedCategoryId.value = targetQuestionDetail.value.categoryId
      }
      if (fromHomeHot === '1') {
        targetQuestionDetail.value = {
          ...targetQuestionDetail.value,
          showAnswer: false
        }
      }
    } catch (error) {
      targetQuestionDetail.value = null
    }
  }
  if (!selectedCategoryId.value && categoryId) {
    selectedCategoryId.value = Number(categoryId)
  }
  if (selectedCategoryId.value) {
    searchForm.type = ''
    searchForm.keyword = ''
    searchForm.difficulty = ''
    searchForm.collected = false
  }
}
const goBack = () => router.push('/home')
const goToExam = () => router.push('/exam/list')
const showCollectedQuestions = () => { targetQuestionId.value = ''; targetQuestionDetail.value = null; searchForm.keyword = ''; searchForm.type = ''; searchForm.difficulty = ''; selectedCategoryId.value = ''; searchForm.collected = true; pagination.current = 1; getQuestionList(); ElMessage.info('已进入星标题库模式') }
const resetAllPractice = async () => {
  try {
    await ElMessageBox.confirm('将清除所有答题记录与星星摘录，无法恢复！确认执行吗？', '系统警告', { confirmButtonText: '确认清除', cancelButtonText: '保留数据', type: 'warning', customClass: 'glass-dialog' })
    localStorage.removeItem(getStorageKey()); await getQuestionList(); ElMessage.success('已清空本地训练舱数据')
  } catch (error) { }
}
const backToNormalMode = () => { targetQuestionId.value = ''; targetQuestionDetail.value = null; searchForm.collected = false; if (categoryTree.value.length > 0) { for (const p of categoryTree.value) { if (p.children && p.children.length > 0) { selectedCategoryId.value = p.children[0].id; break } } } pagination.current = 1; getQuestionList() }
onMounted(async () => { await initFromRoute(); await getCategoryTree() })
</script>

<style scoped>
.practice-page {
  position: relative;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  overflow-x: hidden;
}

.ambient-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 25s infinite alternate ease-in-out;
}

.blob-1 {
  top: -10%;
  right: -5%;
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 70%);
}

.blob-2 {
  bottom: -20%;
  left: -10%;
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.1), transparent 70%);
  animation-delay: -5s;
}

@keyframes float {
  0% {
    transform: translate(0, 0) scale(1);
  }

  100% {
    transform: translate(4%, 8%) scale(1.05);
  }
}

.premium-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05);
  transition: all 0.3s;
}

.target-question {
  border-color: rgba(59, 130, 246, 0.45);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12), 0 10px 40px -10px rgba(15, 23, 42, 0.05);
}

.glass-effect {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
}

.glass-effect-light {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.animate-fade-up {
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 顶栏 */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 72px;
  padding: 0 32px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.glass-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.02);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-img {
  width: 36px;
  height: 36px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.5px;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  font-weight: 600;
  color: #475569;
  padding: 8px 16px;
  border-radius: 12px;
  transition: all 0.3s;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.text-primary {
  color: #3b82f6 !important;
}

.text-danger {
  color: #ef4444 !important;
}

.divider {
  width: 1px;
  height: 16px;
  background: rgba(15, 23, 42, 0.1);
  margin: 0 8px;
}

/* 核心布局 */
.main-content {
  display: flex;
  max-width: 1400px;
  margin: 32px auto;
  gap: 24px;
  padding: 0 24px;
  position: relative;
  z-index: 1;
  align-items: flex-start;
}

/* 侧边图谱 */
.sidebar {
  width: 300px;
  flex-shrink: 0;
  padding: 24px;
  position: sticky;
  top: 104px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.1);
  border-radius: 4px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-header h3 .el-icon {
  color: #8b5cf6;
  font-size: 18px;
}

.reset-btn {
  font-weight: 600;
  font-size: 13px;
}

/* Tree 定制 */
:deep(.custom-tree) {
  background: transparent;
  color: #334155;
}

:deep(.custom-tree .el-tree-node__content) {
  height: 40px;
  border-radius: 10px;
  margin-bottom: 4px;
  transition: all 0.2s;
}

:deep(.custom-tree .el-tree-node__content:hover) {
  background: rgba(241, 245, 249, 0.8);
}

:deep(.custom-tree .el-tree-node.is-current > .el-tree-node__content) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%);
  color: #2563eb;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.custom-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 8px;
}

.node-count {
  background: rgba(15, 23, 42, 0.05);
  color: #64748b;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
}

:deep(.is-current) .node-count {
  background: #3b82f6;
  color: #fff;
}

/* 右侧核心区 */
.content-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 搜索舱 */
.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px 24px;
  align-items: center;
}

:deep(.custom-input .el-input__wrapper),
:deep(.custom-select .el-select__wrapper) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: none;
  transition: all 0.3s;
}

:deep(.custom-input .el-input__wrapper:focus-within),
:deep(.custom-select .el-select__wrapper.is-focused) {
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-input {
  width: 300px;
}

.action-group {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.btn-hover-glow {
  border-radius: 12px;
  font-weight: 600;
  padding: 0 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
  transition: all 0.3s;
}

.btn-hover-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  color: #fff;
}

.collect-btn {
  border-radius: 12px;
  font-weight: 600;
  padding: 0 20px;
  transition: all 0.3s;
}

.collect-btn:hover {
  transform: translateY(-2px);
}

/* 题目卡片 */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.question-card {
  padding: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.question-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.08);
  border-color: #fff;
}

.question-card.answered {
  border-left: 4px solid #3b82f6;
}

.question-card.correct {
  border-left: 4px solid #10b981;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.question-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-badge {
  font-weight: 700;
  color: #1e293b;
  font-size: 15px;
}

.type-tag,
.diff-tag {
  border-radius: 6px;
  font-weight: 600;
  border: none;
  background: rgba(241, 245, 249, 0.8);
  padding: 0 10px;
}

.category-name {
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.question-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  font-weight: 600;
  font-size: 13px;
  border-radius: 8px;
  padding: 6px 12px;
}

.question-title {
  font-size: 16px;
  color: #0f172a;
  line-height: 1.7;
  font-weight: 500;
  margin: 0 0 24px 0;
}

/* 块级选项复用 Exam.vue 风格 */
.block-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-bottom: 20px;
}

.judge-options {
  flex-direction: row;
}

.full-width-radio {
  width: 100%;
  display: flex;
  gap: 12px;
}

.option-block {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 14px 20px;
  margin: 0;
  background: rgba(241, 245, 249, 0.5);
  border: 2px solid rgba(15, 23, 42, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.judge-block {
  flex: 1;
  justify-content: center;
}

.option-block:hover {
  background: #fff;
  border-color: #cbd5e1;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
}

.judge-block:hover {
  transform: translateY(-2px);
}

.option-block.selected {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
  transform: translateX(4px);
}

.option-block.correct {
  background: #ecfdf5;
  border-color: #10b981;
}

.option-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #e2e8f0;
  color: #475569;
  border-radius: 6px;
  font-weight: 700;
  margin-right: 12px;
  font-size: 13px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.option-block.selected .option-label {
  background: #3b82f6;
  color: #fff;
}

.option-block.correct .option-label {
  background: #10b981;
  color: #fff;
}

.option-text {
  flex: 1;
  line-height: 1.5;
  color: #334155;
  font-size: 15px;
}

.correct-icon {
  font-size: 20px;
  color: #10b981;
  margin-left: 12px;
}

:deep(.el-radio.option-block .el-radio__input),
:deep(.el-checkbox.option-block .el-checkbox__input) {
  display: none;
  /* 隐藏原生圈圈，只留块 */
}

:deep(.el-radio.option-block .el-radio__label),
:deep(.el-checkbox.option-block .el-checkbox__label) {
  padding: 0;
  width: 100%;
  display: flex;
  align-items: center;
}

/* 主观题 */
:deep(.custom-textarea .el-textarea__inner) {
  background: rgba(241, 245, 249, 0.5);
  border: 2px solid rgba(15, 23, 42, 0.05);
  border-radius: 12px;
  padding: 16px;
  font-size: 15px;
  color: #0f172a;
  line-height: 1.7;
  transition: all 0.3s;
  box-shadow: none;
}

:deep(.custom-textarea .el-textarea__inner:focus) {
  background: #fff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

/* 答案域 */
.answer-section {
  padding: 24px;
  border-radius: 16px;
  margin-top: 24px;
  position: relative;
  overflow: hidden;
}

.answer-section::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, #8b5cf6, #3b82f6);
}

.answer-header,
.analysis-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 700;
  color: #0f172a;
  font-size: 15px;
}

.answer-header .el-icon {
  color: #8b5cf6;
  font-size: 18px;
}

.analysis-header .el-icon {
  color: #3b82f6;
  font-size: 18px;
}

.correct-answer-text {
  display: block;
  font-weight: 600;
  color: #10b981;
  margin-bottom: 8px;
  font-size: 15px;
}

.text-answer-content {
  background: rgba(255, 255, 255, 0.7);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.05);
  color: #334155;
}

.analysis-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px dashed rgba(15, 23, 42, 0.1);
}

.analysis-content {
  color: #475569;
  line-height: 1.8;
  font-size: 14px;
}

/* 快速反馈 Alert 定制 */
.feedback-section {
  margin-top: 24px;
}

.feedback-alert {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid;
}

.feedback-alert.is-success {
  background: #ecfdf5;
  border-color: #10b981;
}

.feedback-alert.is-error {
  background: #fef2f2;
  border-color: #ef4444;
}

.feedback-icon {
  font-size: 24px;
  margin-top: 2px;
}

.is-success .feedback-icon {
  color: #10b981;
}

.is-error .feedback-icon {
  color: #ef4444;
}

.feedback-msg strong {
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
  color: #0f172a;
}

.wrong-detail {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.empty-state {
  padding: 80px 0;
}

.pagination-wrapper {
  padding: 24px 0;
  display: flex;
  justify-content: center;
}

/* 对话框美化 */
:deep(.glass-dialog) {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(24px) !important;
  border-radius: 24px !important;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-box {
  background: rgba(241, 245, 249, 0.6);
  padding: 24px 16px;
  border-radius: 16px;
  text-align: center;
  border: 1px solid rgba(15, 23, 42, 0.05);
}

.stat-num {
  font-size: 32px;
  font-weight: 800;
  font-family: -apple-system, sans-serif;
  line-height: 1;
  margin-bottom: 8px;
}

.text-gradient-blue {
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-gradient-purple {
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-gradient-orange {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-gradient-green {
  background: linear-gradient(135deg, #10b981, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.detail-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-title .el-icon {
  color: #3b82f6;
}

:deep(.custom-table) {
  background: transparent;
  --el-table-border-color: rgba(15, 23, 42, 0.05);
  --el-table-header-bg-color: rgba(241, 245, 249, 0.6);
}

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    position: static;
    max-height: 300px;
    margin-bottom: 24px;
  }

  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .action-group {
    margin-left: 0;
    justify-content: flex-start;
  }

  .judge-options {
    flex-direction: column;
  }
}
</style>