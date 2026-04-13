<template>
    <div class="analysis-container">
      <el-page-header @back="$router.back()" title="返回" content="AI 学情诊断中心" class="page-header" />
  
      <el-card class="action-card mb-20" shadow="hover">
        <div class="action-content">
          <div class="user-info">
            <el-avatar :size="50" class="avatar">{{ userName.charAt(0).toUpperCase() }}</el-avatar>
            <div class="info-text">
              <h3>{{ userName }} 的专属学习报告</h3>
              <p class="text-muted">上次诊断时间：{{ lastDiagnosisTime }}</p>
            </div>
          </div>
          <el-button type="primary" size="large" @click="generateAIDiagnosis" :loading="aiGenerating">
            <el-icon class="el-icon--left"><MagicStick /></el-icon>
            {{ aiGenerating ? 'AI 深度分析中(约15秒)...' : '重新生成 AI 诊断' }}
          </el-button>
        </div>
      </el-card>
  
      <el-row :gutter="20" class="mb-20">
        <el-col :xs="24" :md="10">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span><el-icon><DataLine /></el-icon> 知识点真实掌握率雷达图</span>
              </div>
            </template>
            <div ref="radarChartRef" class="radar-chart"></div>
          </el-card>
        </el-col>
  
        <el-col :xs="24" :md="14">
          <el-card class="overview-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span><el-icon><Warning /></el-icon> 核心盲区精准定位</span>
              </div>
            </template>
            
            <el-skeleton :rows="5" animated :loading="aiGenerating">
              <template #default>
                <div class="score-overview">
                  <div class="score-box">
                    <span class="score-label">综合学习健康度</span>
                    <span class="score-value" :class="getScoreClass(healthScore)">{{ healthScore }}</span>
                  </div>
                  <div class="tags-box">
                    <h4>🌟 优势领域：</h4>
                    <el-tag v-for="tag in strongPoints" :key="tag" type="success" effect="light" class="mr-2 mb-2">{{ tag }}</el-tag>
                    <h4 class="mt-10">🚨 急需提升：</h4>
                    <el-tag v-for="tag in weakPoints" :key="tag" type="danger" effect="light" class="mr-2 mb-2">{{ tag }}</el-tag>
                  </div>
                </div>
  
                <el-divider border-style="dashed" />
  
                <div class="blind-spots">
                  <h4>🎯 近期暴露的核心知识盲区：</h4>
                  <p v-if="!blindSpots.length" class="text-muted">太棒了，近期没有发现明显的错题盲区！</p>
                  <el-collapse v-model="activeBlindSpot" v-else>
                    <el-collapse-item v-for="(spot, index) in blindSpots" :key="index" :title="(index + 1) + '. ' + spot.title" :name="index">
                      <p class="spot-desc"><strong>题目：</strong>{{ spot.description }}</p>
                      <p class="spot-error"><strong>你的错误作答：</strong>{{ spot.errorExample }}</p>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </template>
            </el-skeleton>
          </el-card>
        </el-col>
      </el-row>
  
      <el-card class="suggestion-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="ai-title"><el-icon><Monitor /></el-icon> AI 导师专属提升规划</span>
          </div>
        </template>
        <el-skeleton :rows="8" animated :loading="aiGenerating">
          <template #default>
            <div class="markdown-body">
              <p v-if="!aiSuggestion" class="empty-text">点击上方按钮，让 AI 基于您的真实考试数据生成深度规划。</p>
              <div v-else class="suggestion-content">{{ aiSuggestion }}</div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  import { MagicStick, DataLine, Warning, Monitor } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import * as echarts from 'echarts'
  // 引入刚刚在 user.js 里写的接口
  import { getAIDiagnosis } from '../api/user' 
  
  const userName = ref('同学')
  const lastDiagnosisTime = ref(new Date().toLocaleString())
  const aiGenerating = ref(false)
  
  // 响应式数据绑定
  const healthScore = ref(0)
  const strongPoints = ref([])
  const weakPoints = ref([])
  const blindSpots = ref([])
  const activeBlindSpot = ref([0])
  const aiSuggestion = ref('')
  
  let radarChart = null
  const radarChartRef = ref(null)
  
  // 初始化雷达图
  const initRadarChart = (chartData) => {
    if (!radarChartRef.value) return
    if (radarChart) {
      radarChart.dispose()
    }
    
    radarChart = echarts.init(radarChartRef.value)
    
    // 如果没有任何考试数据，显示默认空图
    if (!chartData || !chartData.length) {
      chartData = [
        { name: '暂无数据', score: 0 }, { name: '去考试吧', score: 0 }
      ]
    }
  
    const indicator = chartData.map(item => ({ name: item.name, max: 100 }))
    const scores = chartData.map(item => item.score)
  
    const option = {
      tooltip: { trigger: 'item' },
      radar: {
        indicator: indicator,
        splitArea: {
          areaStyle: {
            color: ['rgba(64, 158, 255, 0.1)', 'rgba(64, 158, 255, 0.05)', 'rgba(64, 158, 255, 0.02)', 'transparent']
          }
        },
        axisLine: { lineStyle: { color: '#e4e7ed' } },
        splitLine: { lineStyle: { color: '#e4e7ed' } },
        axisName: { color: '#606266', fontWeight: 'bold' }
      },
      series: [
        {
          name: '真实掌握率',
          type: 'radar',
          data: [
            {
              value: scores,
              name: '当前得分率(%)',
              itemStyle: { color: '#409eff' },
              areaStyle: { color: 'rgba(64, 158, 255, 0.4)' },
              lineStyle: { width: 2 }
            }
          ]
        }
      ]
    }
    radarChart.setOption(option)
  }
  
  // 真实调用后端 AI 诊断接口
  const generateAIDiagnosis = async () => {
    if (aiGenerating.value) return
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const userId = userInfo.userId
    
    if (!userId) {
      ElMessage.error('请先登录系统')
      return
    }
  
    aiGenerating.value = true
    ElMessage.info('AI 正在调取您的历史试卷并深度分析，请耐心等待...')
    
    try {
      const res = await getAIDiagnosis(userId)
      if (res.code === 200 && res.data) {
        const data = res.data
        
        healthScore.value = data.healthScore
        strongPoints.value = data.strongPoints || []
        weakPoints.value = data.weakPoints || []
        blindSpots.value = data.blindSpots || []
        aiSuggestion.value = data.aiSuggestion
        
        lastDiagnosisTime.value = new Date().toLocaleString()
        
        // 更新真实雷达图
        initRadarChart(data.radarData)
        
        ElMessage.success('诊断报告已成功生成！')
      } else {
        ElMessage.warning(res.message || '生成诊断报告失败，可能缺少考试数据')
      }
    } catch (error) {
      console.error('诊断接口调用失败:', error)
      ElMessage.error('网络异常或大模型超时，请稍后再试')
    } finally {
      aiGenerating.value = false
    }
  }
  
  // 样式辅助
  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent'
    if (score >= 60) return 'score-good'
    return 'score-warning'
  }
  
  const handleResize = () => {
    if (radarChart) radarChart.resize()
  }
  
  onMounted(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (userInfo.studentName || userInfo.username) {
      userName.value = userInfo.studentName || userInfo.username
    }
  
    // 渲染基础空图
    nextTick(() => {
      initRadarChart([])
    })
    window.addEventListener('resize', handleResize)
    
    // 进入页面自动生成真实报告
    generateAIDiagnosis()
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (radarChart) radarChart.dispose()
  })
  </script>
  
  <style scoped>
  .analysis-container { max-width: 1200px; margin: 0 auto; padding: 30px 20px; background-color: #f4f7f9; min-height: 100vh; }
  .page-header { margin-bottom: 20px; background: #fff; padding: 16px 20px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
  .mb-20 { margin-bottom: 20px; }
  .mr-2 { margin-right: 8px; }
  .mt-10 { margin-top: 10px; }
  .action-card { border-radius: 12px; border: none; background: linear-gradient(to right, #ffffff, #f0f7ff); }
  .action-content { display: flex; justify-content: space-between; align-items: center; }
  .user-info { display: flex; align-items: center; gap: 16px; }
  .info-text h3 { margin: 0 0 4px 0; color: #303133; }
  .text-muted { margin: 0; color: #909399; font-size: 13px; }
  .card-header { font-weight: bold; font-size: 16px; display: flex; align-items: center; color: #303133; }
  .card-header .el-icon { margin-right: 8px; color: #409eff; }
  .ai-title { background: -webkit-linear-gradient(45deg, #409eff, #8a2be2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 18px; }
  .chart-card, .overview-card, .suggestion-card { border-radius: 12px; border: none; height: 100%; }
  .radar-chart { width: 100%; height: 380px; }
  .score-overview { display: flex; justify-content: space-between; align-items: flex-start; }
  .score-box { display: flex; flex-direction: column; align-items: center; background: #f8fbff; padding: 20px; border-radius: 12px; min-width: 120px; }
  .score-label { font-size: 14px; color: #606266; margin-bottom: 8px; }
  .score-value { font-size: 42px; font-weight: 900; }
  .score-excellent { color: #67c23a; }
  .score-good { color: #e6a23c; }
  .score-warning { color: #f56c6c; }
  .tags-box h4 { margin: 0 0 10px 0; font-size: 14px; color: #606266; }
  .blind-spots h4 { color: #f56c6c; margin-bottom: 16px; }
  .spot-desc { color: #606266; font-size: 14px; margin-bottom: 6px; }
  .spot-error { color: #e6a23c; font-size: 13px; background: #fdf6ec; padding: 8px; border-radius: 6px; }
  .suggestion-content { line-height: 1.8; font-size: 15px; color: #333; white-space: pre-wrap; background: #f9fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #409eff; }
  .empty-text { text-align: center; color: #909399; padding: 40px 0; }
  </style>