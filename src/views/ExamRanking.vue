<template>
  <div class="exam-ranking-page">
    <div class="page-header">
      <div class="header-decoration">
        <div class="trophy-animation">🏆</div>
        <div class="stars">
          <span class="star">⭐</span>
          <span class="star">⭐</span>
          <span class="star">⭐</span>
        </div>
      </div>
      <h2 class="main-title">🏆 考试排行榜 🏆</h2>
      <p class="subtitle">🎯 挑战极限，追求卓越！看看谁是学霸之王？</p>
      <div class="title-underline"></div>
    </div>

    <div class="filter-bar">
      <div class="filter-label">🔍 筛选条件：</div>
      <el-select v-model="selectedPaperId" placeholder="📚 选择试卷" clearable style="width: 300px"
        @change="handlePaperChange" class="custom-select">
        <el-option v-for="paper in paperList" :key="paper.id" :label="paper.name" :value="paper.id" />
      </el-select>

      <el-select v-model="rankingLimit" placeholder="📊 显示数量" style="width: 150px" @change="loadRanking"
        class="custom-select">
        <el-option label="前10名" :value="10" />
        <el-option label="前20名" :value="20" />
        <el-option label="前50名" :value="50" />
        <el-option label="前100名" :value="100" />
      </el-select>

      <el-button type="primary" @click="loadRanking" :loading="loading" icon="Refresh" class="refresh-btn">
        🔄 刷新排行榜
      </el-button>
    </div>

    <div class="main-content">
      <div class="ranking-container">
        <div v-if="rankingList.length > 0" class="champion-showcase">
          <div class="champion-crown">👑</div>
          <div class="champion-info">
            <div class="champion-name">{{ rankingList[0].studentName }}</div>
            <div class="champion-score">{{ rankingList[0].score }}分</div>
            <div class="champion-title">🎉 当前考试之王！🎉</div>
          </div>
        </div>

        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="10" animated />
        </div>

        <div v-else-if="rankingList.length > 0" class="ranking-list">
          <div v-for="(record, index) in rankingList" :key="record.id" class="ranking-item"
            :class="{ 'top-three': index < 3 }">
            <div class="rank-number" :class="getRankClass(index + 1)">
              <span v-if="index === 0">🥇</span>
              <span v-else-if="index === 1">🥈</span>
              <span v-else-if="index === 2">🥉</span>
              <span v-else>{{ index + 1 }}</span>
            </div>

            <div class="student-info">
              <div class="student-name">{{ record.studentName }}</div>
              <div class="paper-name">📝 {{ record.paper?.name }}</div>
              <div class="exam-time">📅 {{ formatDateTime(record.endTime) }}</div>
            </div>

            <div class="score-info">
              <div class="score">{{ record.score }}</div>
              <div class="total-score">/ {{ record.paper?.totalScore }}</div>
              <div class="percentage">
                {{ calculatePercentage(record.score, record.paper?.totalScore) }}%
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-text">暂无排行榜数据</div>
          <div class="empty-hint">快去参加考试，成为第一个上榜的人吧！</div>
        </div>
      </div>

      <div v-if="allRecords.length > 0" class="statistics-sidebar">
        <div class="stats-title">{{ statsTitle }}</div>
        <div class="stats-vertical">
          <div class="stat-card-vertical">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <div class="stat-value">{{ totalParticipants }}</div>
              <div class="stat-label">参与人数</div>
            </div>
          </div>

          <div class="stat-card-vertical">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <div class="stat-value">{{ averageScore }}</div>
              <div class="stat-label">平均分</div>
            </div>
          </div>

          <div class="stat-card-vertical">
            <div class="stat-icon">🎯</div>
            <div class="stat-info">
              <div class="stat-value">{{ maxScore }}</div>
              <div class="stat-label">最高分</div>
            </div>
          </div>

          <div class="stat-card-vertical">
            <div class="stat-icon">📉</div>
            <div class="stat-info">
              <div class="stat-value">{{ minScore }}</div>
              <div class="stat-label">最低分</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="comment-section">
      <div class="comment-header">
        <div>
          <div class="comment-title">💬 排行榜评论区</div>
          <div class="comment-subtitle">{{ commentScopeTitle }}</div>
        </div>
        <div class="comment-count">共 {{ commentList.length }} 条评论</div>
      </div>

      <div class="comment-form-card">
        <div v-if="!isLoggedIn" class="login-tip">
          <span>登录后才可以发表评论，但所有人都能查看评论。</span>
          <el-button type="primary" @click="goLogin">去登录</el-button>
        </div>

        <template v-else>
          <div class="current-user">当前评论用户：{{ currentDisplayName }}</div>
          <el-input v-model="commentContent" type="textarea" :rows="4" maxlength="500" show-word-limit resize="none"
            placeholder="请输入你对这场考试的看法、难度评价或学习建议..." />
          <div class="comment-form-actions">
            <span class="comment-hint">请文明发言，最多 500 字</span>
            <el-button type="primary" :loading="submittingComment" @click="submitComment">
              发表评论
            </el-button>
          </div>
        </template>
      </div>

      <div class="comment-list-card" v-loading="commentLoading">
        <div v-if="commentList.length > 0" class="comment-list">
          <div v-for="comment in commentList" :key="comment.id" class="comment-item">
            <div class="comment-avatar">{{ getCommentAvatar(comment) }}</div>

            <div class="comment-body">
              <div class="comment-meta">
                <span class="comment-author">{{ getCommentAuthor(comment) }}</span>
                <span class="comment-time">{{ formatDateTime(comment.createTime) }}</span>
              </div>

              <div class="comment-content">{{ comment.content }}</div>

              <div v-if="canDeleteComment(comment)" class="comment-actions">
                <el-button type="danger" link :loading="deletingCommentId === comment.id"
                  @click="deleteComment(comment)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="comment-empty">
          暂无评论，来发表第一条看法吧。
        </div>
      </div>
    </div>

    <div class="motivation-section">
      <div class="motivation-text">💪 每一次挑战都是成长的机会！加油冲刺更高的排名吧！</div>
      <div class="floating-emojis">
        <span class="emoji">🌟</span>
        <span class="emoji">🚀</span>
        <span class="emoji">💎</span>
        <span class="emoji">🔥</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()

const loading = ref(false)
const rankingList = ref([])
const paperList = ref([])
const selectedPaperId = ref(null)
const rankingLimit = ref(10)
const allRecords = ref([])

const commentLoading = ref(false)
const submittingComment = ref(false)
const deletingCommentId = ref(null)
const commentList = ref([])
const commentContent = ref('')

const averageScore = computed(() => {
  if (allRecords.value.length === 0) return 0
  const total = allRecords.value.reduce((sum, record) => sum + Number(record.score), 0)
  return (total / allRecords.value.length).toFixed(1)
})

const maxScore = computed(() => {
  if (allRecords.value.length === 0) return 0
  return Math.max(...allRecords.value.map(record => Number(record.score)))
})

const minScore = computed(() => {
  if (allRecords.value.length === 0) return 0
  return Math.min(...allRecords.value.map(record => Number(record.score)))
})

const totalParticipants = computed(() => allRecords.value.length)

const statsTitle = computed(() => {
  if (selectedPaperId.value) {
    const selectedPaper = paperList.value.find(p => p.id === selectedPaperId.value)
    return `📊 ${selectedPaper?.name || '选中试卷'} 统计`
  }
  return '📊 全部试卷统计'
})

const currentUser = computed(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (!userInfoStr) return null
  try {
    return JSON.parse(userInfoStr)
  } catch {
    return null
  }
})

const isLoggedIn = computed(() => !!currentUser.value)

const currentDisplayName = computed(() => {
  if (!currentUser.value) return '未登录用户'
  return currentUser.value.realName || currentUser.value.username || `用户${currentUser.value.id}`
})

const commentScopeTitle = computed(() => {
  if (selectedPaperId.value) {
    const selectedPaper = paperList.value.find(p => p.id === selectedPaperId.value)
    return `当前试卷：${selectedPaper?.name || '选中试卷'}`
  }
  return '当前范围：全部试卷排行榜'
})

const getPaperList = async () => {
  try {
    const res = await request.get('/api/papers/list', {
      params: { status: 'PUBLISHED' }
    })
    paperList.value = res.data || []
  } catch (error) {
    console.error('获取试卷列表失败：', error)
    ElMessage.error('获取试卷列表失败')
  }
}

const loadRanking = async () => {
  loading.value = true
  try {
    const displayParams = {
      paperId: selectedPaperId.value,
      limit: rankingLimit.value
    }

    const statsParams = {
      paperId: selectedPaperId.value,
      limit: 1000
    }

    const [rankingRes, statsRes] = await Promise.all([
      request.get('/api/exam-records/ranking', { params: displayParams }),
      request.get('/api/exam-records/ranking', { params: statsParams })
    ])

    rankingList.value = rankingRes.data || []
    allRecords.value = statsRes.data || []
  } catch (error) {
    console.error('获取排行榜数据失败：', error)
    ElMessage.error('获取排行榜数据失败')
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  commentLoading.value = true
  try {
    const res = await request.get('/api/exam-ranking-comments', {
      params: {
        paperId: selectedPaperId.value
      }
    })
    commentList.value = res.data || []
  } catch (error) {
    console.error('获取评论失败：', error)
    ElMessage.error('获取评论失败')
  } finally {
    commentLoading.value = false
  }
}

const submitComment = async () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再评论')
    router.push('/login')
    return
  }

  const content = commentContent.value.trim()
  if (!content) {
    ElMessage.warning('评论内容不能为空')
    return
  }

  if (content.length > 500) {
    ElMessage.warning('评论内容不能超过500字')
    return
  }

  submittingComment.value = true
  try {
    await request.post('/api/exam-ranking-comments', {
      paperId: selectedPaperId.value,
      userId: currentUser.value.userId,
      content
    })
    ElMessage.success('评论发表成功')
    commentContent.value = ''
    await loadComments()
  } catch (error) {
    console.error('发表评论失败：', error)
    ElMessage.error(error.message || '发表评论失败')
  } finally {
    submittingComment.value = false
  }
}

const deleteComment = async (comment) => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  deletingCommentId.value = comment.id
  try {
    await request.delete(`/api/exam-ranking-comments/${comment.id}`, {
      params: {
        userId: currentUser.value.userId
      }
    })
    ElMessage.success('删除成功')
    await loadComments()
  } catch (error) {
    console.error('删除评论失败：', error)
    ElMessage.error(error.message || '删除评论失败')
  } finally {
    deletingCommentId.value = null
  }
}

const handlePaperChange = async () => {
  await Promise.all([loadRanking(), loadComments()])
}

const goLogin = () => {
  router.push('/login')
}

const getCommentAuthor = (comment) => {
  return comment.userRealName || comment.username || '匿名用户'
}

const getCommentAvatar = (comment) => {
  const name = getCommentAuthor(comment)
  return name ? name.slice(0, 1).toUpperCase() : '匿'
}

const canDeleteComment = (comment) => {
  return !!currentUser.value && Number(currentUser.value.userId) === Number(comment.userId)
}

const getRankClass = (rank) => {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return 'rank-normal'
}

const calculatePercentage = (score, totalScore) => {
  if (!score || !totalScore) return 0
  return ((score / totalScore) * 100).toFixed(1)
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN')
}

onMounted(async () => {
  await getPaperList()
  await Promise.all([loadRanking(), loadComments()])
})
</script>

<style scoped>
/* =========================================
   全局美学变量 (顶级毛玻璃与通透感)
========================================= */
:root {
  --glass-bg: rgba(255, 255, 255, 0.6);
  --glass-bg-light: rgba(255, 255, 255, 0.4);
  --glass-border: rgba(255, 255, 255, 0.7);
  --glass-shadow: 0 16px 40px rgba(31, 38, 135, 0.08);
  --glass-shadow-hover: 0 24px 56px rgba(31, 38, 135, 0.16);
  --primary-color: #409eff;
  --text-main: #0f172a;
  --text-sub: #64748b;
  --hover-transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); /* 顶级丝滑缓动 */
  --border-radius-card: 32px; /* 极致弧形 */
  --border-radius-element: 20px;
}

/* =========================================
   页面主容器与动态流体环境光晕 (Ambient Orbs)
========================================= */
.exam-ranking-page {
  padding: 40px 32px;
  max-width: 1320px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  z-index: 1;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--text-main);
  overflow-x: hidden;
}

/* 动态迷幻背景层 */
.exam-ranking-page::before {
  content: '';
  position: fixed;
  inset: -20%;
  z-index: -1;
  background: 
    radial-gradient(circle at 10% 20%, rgba(255, 215, 0, 0.12), transparent 45%),
    radial-gradient(circle at 90% 10%, rgba(139, 92, 246, 0.15), transparent 45%),
    radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.15), transparent 50%),
    linear-gradient(135deg, #f3f6fc 0%, #e8f0fe 100%);
  background-size: 200% 200%;
  animation: ambientShift 25s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
  filter: blur(30px);
}

@keyframes ambientShift {
  0% { transform: rotate(0deg) scale(1); background-position: 0% 50%; }
  50% { transform: rotate(2deg) scale(1.05); background-position: 100% 50%; }
  100% { transform: rotate(-2deg) scale(0.95); background-position: 50% 100%; }
}

/* =========================================
   页头与荣耀动效
========================================= */
.page-header {
  text-align: center;
  margin-bottom: 56px;
  position: relative;
  animation: fadeDown 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.header-decoration {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 28px;
  margin-bottom: 20px;
}

.trophy-animation {
  font-size: 64px;
  animation: floatTrophy 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  filter: drop-shadow(0 12px 24px rgba(255, 215, 0, 0.4));
}
@keyframes floatTrophy {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-16px) scale(1.08); }
}

.stars { display: flex; gap: 12px; }
.star {
  font-size: 32px;
  animation: twinkle 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  filter: drop-shadow(0 4px 12px rgba(255, 215, 0, 0.5));
}
.star:nth-child(2) { animation-delay: 0.8s; font-size: 42px; margin-top: -16px; }
.star:nth-child(3) { animation-delay: 1.6s; }
@keyframes twinkle {
  0%, 100% { opacity: 0.5; transform: scale(0.85) rotate(0deg); filter: hue-rotate(0deg); }
  50% { opacity: 1; transform: scale(1.2) rotate(15deg); filter: hue-rotate(20deg); }
}

/* 流光文字渐变 */
.main-title {
  font-size: 46px;
  margin: 0 0 16px;
  font-weight: 900;
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textShine 5s linear infinite;
  letter-spacing: 3px;
  filter: drop-shadow(0 4px 16px rgba(245, 158, 11, 0.2));
}
@keyframes textShine { to { background-position: 200% center; } }

.subtitle {
  color: var(--text-sub);
  margin: 0 0 28px;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 1px;
}

.title-underline {
  width: 100px;
  height: 8px;
  background: linear-gradient(90deg, #ff6b6b, #f59e0b, #48bb78);
  margin: 0 auto;
  border-radius: 8px;
  animation: rainbowWidth 4s cubic-bezier(0.25, 0.8, 0.25, 1) infinite alternate;
}
@keyframes rainbowWidth {
  from { width: 80px; filter: hue-rotate(0deg); }
  to { width: 160px; filter: hue-rotate(60deg); }
}

/* =========================================
   操作栏 (高级毛玻璃悬浮舱)
========================================= */
.filter-bar {
  display: flex;
  gap: 28px;
  margin-bottom: 48px;
  justify-content: center;
  align-items: center;
  background: var(--glass-bg);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  padding: 28px 40px;
  border-radius: var(--border-radius-card);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
  transition: var(--hover-transition);
}
.filter-bar:hover {
  transform: translateY(-2px) scale(1.005);
  box-shadow: var(--glass-shadow-hover);
}

.filter-label { color: var(--text-main); font-weight: 800; font-size: 18px; }

/* Element Plus 覆盖 */
:deep(.custom-select .el-input__wrapper) {
  border-radius: 16px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.04);
  background: rgba(255, 255, 255, 0.85);
  transition: var(--hover-transition);
  padding: 8px 16px;
}
:deep(.custom-select .el-input__wrapper:hover), 
:deep(.custom-select .el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(64,158,255,0.2);
  background: #ffffff;
}

.refresh-btn {
  border-radius: 16px !important;
  font-weight: 800 !important;
  padding: 22px 32px !important;
  font-size: 16px !important;
  background: linear-gradient(135deg, #ff6b6b, #f59e0b) !important;
  border: none !important;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3) !important;
  transition: var(--hover-transition) !important;
}
.refresh-btn:hover {
  transform: translateY(-4px) scale(1.02) !important;
  box-shadow: 0 12px 28px rgba(245, 158, 11, 0.4) !important;
}

/* =========================================
   主体内容区布局
========================================= */
.main-content {
  display: flex;
  gap: 40px;
  align-items: flex-start;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.ranking-container { flex: 2; margin-bottom: 0; }

/* =========================================
   冠军专属展示卡片 (奢华质感)
========================================= */
.champion-showcase {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 140, 0, 0.05) 100%);
  backdrop-filter: blur(32px);
  border: 1px solid rgba(255, 215, 0, 0.5);
  padding: 40px;
  border-radius: var(--border-radius-card);
  text-align: center;
  margin-bottom: 40px;
  box-shadow: 0 16px 40px rgba(218, 165, 32, 0.2);
  position: relative;
  overflow: hidden;
  transition: var(--hover-transition);
}
.champion-showcase:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 24px 56px rgba(218, 165, 32, 0.3);
}
.champion-showcase::after {
  content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent);
  transform: rotate(45deg);
  animation: shineGlass 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes shineGlass {
  0% { left: -100%; top: -100%; }
  20%, 100% { left: 100%; top: 100%; }
}

.champion-crown { font-size: 72px; margin-bottom: 20px; filter: drop-shadow(0 8px 16px rgba(255,215,0,0.6)); animation: floatTrophy 4s infinite;}
.champion-name { font-size: 36px; font-weight: 900; color: #b8860b; margin-bottom: 10px; letter-spacing: 2px; text-shadow: 0 2px 8px rgba(255,215,0,0.3);}
.champion-score { font-size: 48px; font-weight: 900; color: #d97706; margin-bottom: 16px; font-family: "SF Pro Display", sans-serif; filter: drop-shadow(0 4px 8px rgba(217, 119, 6, 0.2));}
.champion-title { font-size: 18px; color: #92400e; font-weight: 800; background: linear-gradient(90deg, rgba(255,215,0,0.1), rgba(255,215,0,0.3), rgba(255,215,0,0.1)); display: inline-block; padding: 8px 24px; border-radius: 24px; }

/* =========================================
   排行榜列表项 (流体动画悬浮卡)
========================================= */
.ranking-list { display: flex; flex-direction: column; gap: 20px; }

.ranking-item {
  display: flex;
  align-items: center;
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-element);
  padding: 24px 32px;
  box-shadow: 0 8px 24px rgba(31,38,135,0.05);
  transition: var(--hover-transition);
  position: relative;
  overflow: hidden;
}
.ranking-item::before {
  content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 6px;
  background: transparent; transition: var(--hover-transition);
}
.ranking-item:hover {
  transform: translateX(10px) scale(1.02);
  box-shadow: 0 16px 40px rgba(31,38,135,0.1);
  background: rgba(255,255,255,0.9);
}
.ranking-item:hover::before { background: var(--primary-color); }

/* 排名徽章圆润化 */
.rank-number {
  width: 72px; height: 72px; border-radius: 50%; /* 圆形徽章 */
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 900; margin-right: 28px;
  box-shadow: inset 0 2px 6px rgba(255,255,255,0.6), 0 8px 16px rgba(0,0,0,0.1);
  font-family: "SF Pro Display", sans-serif;
  transition: var(--hover-transition);
}
.ranking-item:hover .rank-number { transform: rotate(-10deg) scale(1.1); }

.rank-gold { background: linear-gradient(135deg, #ffe066 0%, #f59e0b 100%); color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.rank-silver { background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%); color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.rank-bronze { background: linear-gradient(135deg, #fde68a 0%, #d97706 100%); color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.rank-normal { background: rgba(255, 255, 255, 0.5); color: var(--text-sub); border: 2px solid rgba(15,23,42,0.05); box-shadow: none;}

.student-info { flex: 1; }
.student-name { font-size: 22px; font-weight: 800; margin-bottom: 8px; color: var(--text-main); }
.paper-name { font-size: 15px; color: var(--text-sub); margin-bottom: 6px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.exam-time { font-size: 14px; color: #94a3b8; font-weight: 600; }

.score-info { text-align: right; margin-left: 24px; display: flex; flex-direction: column; align-items: flex-end;}
.score { font-size: 36px; font-weight: 900; color: var(--primary-color); font-family: "SF Pro Display", sans-serif; line-height: 1; filter: drop-shadow(0 2px 4px rgba(64,158,255,0.2));}
.total-score { font-size: 15px; color: var(--text-sub); font-weight: 800; margin-top: 6px; }
.percentage {
  font-size: 14px; color: #10b981; margin-top: 8px; font-weight: 800;
  background: rgba(16, 185, 129, 0.15); padding: 4px 12px; border-radius: 12px;
}

/* =========================================
   统计侧边栏 (粘性悬浮布局)
========================================= */
.statistics-sidebar {
  flex: 1;
  max-width: 340px;
  min-width: 300px;
  padding: 32px;
  background: var(--glass-bg);
  backdrop-filter: blur(32px);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-card);
  box-shadow: var(--glass-shadow);
  position: sticky;
  top: 120px;
  transition: var(--hover-transition);
}
.statistics-sidebar:hover { transform: translateY(-4px); box-shadow: var(--glass-shadow-hover); }

.stats-title {
  font-size: 20px; font-weight: 900; color: var(--text-main);
  margin-bottom: 32px; padding-bottom: 20px;
  border-bottom: 2px dashed rgba(15,23,42,0.1);
  text-align: center;
}

.stats-vertical { display: flex; flex-direction: column; gap: 20px; }
.stat-card-vertical {
  display: flex; align-items: center; padding: 24px; gap: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 24px; border: 1px solid rgba(255,255,255,0.9);
  transition: var(--hover-transition);
}
.stat-card-vertical:hover { 
  transform: translateX(8px); 
  background: rgba(255, 255, 255, 0.95); 
  box-shadow: 0 12px 32px rgba(0,0,0,0.06); 
}
.stat-icon { 
  font-size: 40px; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.8); border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: var(--hover-transition);
}
.stat-card-vertical:hover .stat-icon { transform: scale(1.1) rotate(5deg); }
.stat-info { flex: 1; }
.stat-value { font-size: 32px; font-weight: 900; color: var(--primary-color); margin-bottom: 4px; font-family: "SF Pro Display", sans-serif; }
.stat-label { font-size: 15px; color: var(--text-sub); font-weight: 800; }

/* =========================================
   评论区 (深度弧形与柔和面板)
========================================= */
.comment-section { margin-top: 64px; display: flex; flex-direction: column; gap: 32px; animation: fadeInUp 0.8s 0.3s both; }

.comment-header {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--glass-bg-light); backdrop-filter: blur(24px);
  padding: 32px 40px; border-radius: var(--border-radius-card);
  border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow);
}
.comment-title { font-size: 26px; font-weight: 900; color: var(--text-main); }
.comment-subtitle, .comment-count { color: var(--text-sub); font-size: 16px; margin-top: 10px; font-weight: 700; }
.comment-count { background: rgba(64,158,255,0.1); color: var(--primary-color); padding: 8px 20px; border-radius: 20px; }

.comment-form-card, .comment-list-card {
  background: var(--glass-bg); backdrop-filter: blur(32px);
  border-radius: var(--border-radius-card); padding: 40px;
  border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow);
  transition: var(--hover-transition);
}
.comment-form-card:hover, .comment-list-card:hover { box-shadow: var(--glass-shadow-hover); }

.login-tip { display: flex; justify-content: space-between; align-items: center; color: var(--text-main); font-weight: 700; font-size: 16px; background: rgba(64,158,255,0.08); padding: 24px 32px; border-radius: 24px; }
.current-user { color: var(--text-sub); font-weight: 800; margin-bottom: 20px; font-size: 16px;}

:deep(.el-textarea__inner) {
  border-radius: 20px; background: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.03); transition: var(--hover-transition);
  padding: 20px; font-size: 16px; line-height: 1.6;
}
:deep(.el-textarea__inner:focus) { background: #fff; box-shadow: 0 0 0 3px rgba(64,158,255,0.2); }

.comment-form-actions { margin-top: 24px; display: flex; justify-content: space-between; align-items: center; }
.comment-hint { color: #94a3b8; font-size: 14px; font-weight: 600;}

.comment-list { display: flex; flex-direction: column; gap: 24px; }
.comment-item {
  display: flex; gap: 24px; padding: 32px; border-radius: 24px;
  background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255,255,255,0.9);
  transition: var(--hover-transition);
}
.comment-item:hover { background: rgba(255,255,255,0.95); box-shadow: 0 12px 32px rgba(0,0,0,0.05); transform: translateY(-4px); }

.comment-avatar {
  width: 56px; height: 56px; border-radius: 20px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white; font-weight: 900; font-size: 24px; box-shadow: 0 8px 16px rgba(118, 75, 162, 0.3);
}

.comment-body { flex: 1; }
.comment-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.comment-author { color: var(--text-main); font-weight: 900; font-size: 18px;}
.comment-time { color: #94a3b8; font-size: 14px; font-weight: 700;}
.comment-content { color: var(--text-sub); line-height: 1.9; font-size: 16px; font-weight: 600;}

/* =========================================
   空状态与底部激励语
========================================= */
.empty-state { text-align: center; padding: 100px 20px; background: rgba(255, 255, 255, 0.6); border-radius: var(--border-radius-card); border: 1px dashed rgba(15,23,42,0.1); }
.empty-icon { font-size: 80px; margin-bottom: 32px; animation: floatTrophy 4s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
.empty-text { font-size: 26px; color: var(--text-main); margin-bottom: 16px; font-weight: 900; }
.empty-hint { font-size: 16px; color: var(--text-sub); font-weight: 700; }

.motivation-section { margin-top: 80px; text-align: center; background: var(--glass-bg-light); backdrop-filter: blur(24px); padding: 56px; border-radius: var(--border-radius-card); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); transition: var(--hover-transition); }
.motivation-section:hover { transform: scale(1.02); }
.motivation-text { font-size: 24px; color: var(--text-main); margin-bottom: 32px; font-weight: 900; letter-spacing: 1px; }
.floating-emojis { display: flex; justify-content: center; gap: 48px; }
.emoji { font-size: 48px; animation: bounce 3s cubic-bezier(0.28, 0.84, 0.42, 1) infinite; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.15)); }
.emoji:nth-child(2) { animation-delay: 0.6s; } .emoji:nth-child(3) { animation-delay: 1.2s; } .emoji:nth-child(4) { animation-delay: 1.8s; }

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
  40% { transform: translateY(-32px) scale(1.1); }
  60% { transform: translateY(-16px) scale(1.05); }
}

/* =========================================
   响应式断点适配
========================================= */
@media (max-width: 1024px) {
  .main-content { flex-direction: column; }
  .statistics-sidebar { position: static; max-width: none; min-width: auto; margin-top: 32px; }
  .stats-vertical { flex-direction: row; flex-wrap: wrap; }
  .stat-card-vertical { flex: 1 1 calc(50% - 20px); flex-direction: column; text-align: center; }
  .stat-card-vertical:hover { transform: translateY(-8px); }
}
@media (max-width: 768px) {
  .exam-ranking-page { padding: 24px 16px; }
  .filter-bar { flex-direction: column; align-items: stretch; padding: 32px 24px; }
  .ranking-item { flex-direction: column; text-align: center; gap: 16px; }
  .rank-number { margin: 0 auto; }
  .score-info { margin: 0; align-items: center; }
  .comment-header, .login-tip { flex-direction: column; align-items: flex-start; gap: 20px; }
  .comment-item { flex-direction: column; align-items: center; text-align: center; }
  .comment-meta { flex-direction: column; gap: 8px; }
  .stats-vertical { flex-direction: column; }
  .stat-card-vertical { flex: 1 1 100%; }
}
</style>