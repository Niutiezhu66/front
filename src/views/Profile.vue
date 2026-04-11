<template>
    <div class="profile-container">
      <el-page-header @back="$router.back()" title="返回" content="个人中心" class="page-header" />
  
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span><el-icon><Document /></el-icon> 我的考试记录</span>
          </div>
        </template>
  
        <el-table 
          :data="examRecords" 
          v-loading="loading" 
          stripe 
          style="width: 100%"
          empty-text="暂无考试记录"
        >
          <el-table-column label="试卷名称" min-width="200">
            <template #default="{ row }">
              <strong>{{ row.paper?.name || '未知试卷' }}</strong>
            </template>
          </el-table-column>
          
          <el-table-column prop="startTime" label="考试时间" width="180"></el-table-column>
          
          <el-table-column prop="score" label="最终得分" width="100" align="center">
            <template #default="{ row }">
               <el-tag :type="getScoreTag(row.score, row.paper?.totalScore)" size="large" effect="dark">
                 {{ row.score ?? '-' }} 分
               </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
               <el-tag :type="getStatusTag(row.status)">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
  
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                link 
                @click="viewEvaluation(row)" 
                :disabled="row.status !== '已批阅'"
              >
                <el-icon><ChatDotRound /></el-icon> 查看评价
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <el-dialog 
        v-model="evaluationVisible" 
        title="💡 AI 综合考试评价" 
        width="600px"
        destroy-on-close
      >
        <div class="evaluation-content">
          <p v-if="!currentEvaluation" class="empty-eval">暂无评价记录或尚未完成批阅。</p>
          <div v-else class="markdown-text">{{ currentEvaluation }}</div>
        </div>
        <template #footer>
          <el-button type="primary" @click="evaluationVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { Document, ChatDotRound } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import { getMyExamRecords } from '../api/exam'
  
  const examRecords = ref([])
  const loading = ref(false)
  
  // 评价弹窗控制
  const evaluationVisible = ref(false)
  const currentEvaluation = ref('')
  
 // 获取用户ID
const getUserId = () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    const info = JSON.parse(userInfoStr)
    return info.userId
  }
  return null
}
  
  // 加载考试记录
  const loadExamRecords = async () => {
    const userId = getUserId()
    if (!userId) {
      ElMessage.warning('请先登录')
      return
    }
  
    loading.value = true
    try {
      const res = await getMyExamRecords(userId)
      if (res.code === 200) {
        examRecords.value = res.data
      } else {
        ElMessage.error(res.message || '获取考试记录失败')
      }
    } catch (error) {
      console.error(error)
      ElMessage.error('网络异常，无法加载考试记录')
    } finally {
      loading.value = false
    }
  }
  
  // 查看评价
  const viewEvaluation = (row) => {
    // 根据后端的 gradeExam 逻辑，AI总评价是被存放在了 answers 字段中
    currentEvaluation.value = row.answers
    evaluationVisible.value = true
  }
  
  // 样式辅助函数
  const getScoreTag = (score, totalScore) => {
    if (score == null) return 'info'
    const percentage = totalScore ? (score / totalScore) : (score / 100) // 假设没总分按100算
    if (percentage >= 0.8) return 'success'
    if (percentage >= 0.6) return 'warning'
    return 'danger'
  }
  
  const getStatusTag = (status) => {
    switch (status) {
      case '已批阅': return 'success'
      case '已完成': return 'primary'
      case '进行中': return 'warning'
      default: return 'info'
    }
  }
  
  onMounted(() => {
    loadExamRecords()
  })
  </script>
  
  <style scoped>
  .profile-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  
  .page-header {
    margin-bottom: 24px;
    background: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  }
  
  .box-card {
    border-radius: 8px;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    font-weight: bold;
    font-size: 16px;
  }
  
  .card-header .el-icon {
    margin-right: 8px;
    color: #409eff;
  }
  
  .evaluation-content {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }
  
  .markdown-text {
    line-height: 1.8;
    font-size: 14px;
    color: #333;
    white-space: pre-wrap; /* 关键：保留后端的换行符 */
  }
  
  .empty-eval {
    color: #909399;
    text-align: center;
    font-style: italic;
  }
  </style>