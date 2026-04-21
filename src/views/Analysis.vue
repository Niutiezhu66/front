<template>
    <div class="analysis-container">
      <div class="ambient-background">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
      </div>
  
      <div class="content-wrapper">
        <el-page-header @back="$router.back()" title="返回" content="学情深度诊断中心" class="page-header animate-fade-up" />
  
        <el-card class="action-card mb-24 premium-card glass-effect animate-fade-up" shadow="never" style="animation-delay: 0.1s;">
          <div class="action-content">
            <div class="user-info">
              <el-avatar :size="56" class="avatar glass-effect" style="background: rgba(59,130,246,0.1); color: #3b82f6;">{{ userName.charAt(0).toUpperCase() }}</el-avatar>
              <div class="info-text">
                <h3>{{ userName }} 的专属学情档案</h3>
                <p class="text-muted">基于全局历史轨迹分析 · 上次诊断时间：{{ lastDiagnosisTime }}</p>
              </div>
            </div>
            <el-button type="primary" size="large" @click="generateAIDiagnosis" :loading="aiGenerating" class="generate-btn btn-hover-glow">
              <el-icon class="el-icon--left"><DataAnalysis /></el-icon>
              {{ aiGenerating ? '系统深度诊断中...' : '生成最新诊断报告' }}
            </el-button>
          </div>
        </el-card>
  
        <el-row :gutter="24" class="mb-24 animate-fade-up" style="animation-delay: 0.2s;">
          <el-col :xs="24" :md="10">
            <el-card class="chart-card premium-card glass-effect" shadow="never">
              <template #header><div class="card-header"><el-icon><PieChart /></el-icon> 知识掌握度雷达</div></template>
              <div ref="radarChartRef" class="radar-chart"></div>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="14">
            <el-card class="overview-card premium-card glass-effect" shadow="never">
              <template #header><div class="card-header"><el-icon><Aim /></el-icon> 核心盲区精准定位</div></template>
              <el-skeleton :rows="5" animated :loading="aiGenerating">
                <template #default>
                  <div class="score-overview">
                    <div class="score-box glass-effect-light">
                      <span class="score-label">学习健康度</span>
                      <span class="score-value" :class="getScoreClass(healthScore)">{{ healthScore }}</span>
                    </div>
                    <div class="tags-box">
                      <h4><span class="dot success"></span> 优势领跑</h4>
                      <div class="tag-group">
                        <el-tag v-for="tag in strongPoints" :key="tag" type="success" effect="plain" class="custom-tag">{{ tag }}</el-tag>
                        <span v-if="!strongPoints.length" class="text-muted text-sm">暂无明显优势</span>
                      </div>
                      <h4 class="mt-15"><span class="dot danger"></span> 急需攻克</h4>
                      <div class="tag-group">
                        <el-tag v-for="tag in weakPoints" :key="tag" type="danger" effect="plain" class="custom-tag">{{ tag }}</el-tag>
                        <span v-if="!weakPoints.length" class="text-muted text-sm">基础较均衡</span>
                      </div>
                    </div>
                  </div>
                  <el-divider border-style="dashed" class="light-divider" />
                  <div class="blind-spots">
                    <h4 class="section-title">近期暴露的核心错题：</h4>
                    <p v-if="!blindSpots.length" class="empty-hint">太棒了，近期表现完美，无明显盲区！</p>
                    <el-collapse v-model="activeBlindSpot" v-else class="custom-collapse">
                      <el-collapse-item v-for="(spot, index) in blindSpots" :key="index" :name="index">
                        <template #title><div class="collapse-title"><span class="index-num">{{ index + 1 }}</span> {{ spot.title }}</div></template>
                        <div class="spot-content glass-effect-light">
                          <p class="spot-desc"><strong>题目：</strong>{{ spot.description }}</p>
                          <div class="spot-error"><strong>作答：</strong>{{ spot.errorExample }}</div>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </template>
              </el-skeleton>
            </el-card>
          </el-col>
        </el-row>
  
        <el-card class="report-card premium-card glass-effect animate-fade-up" shadow="never" style="animation-delay: 0.3s;">
          <template #header>
            <div class="card-header report-header">
              <div class="report-title-main"><el-icon><Document /></el-icon>学习诊断与提升方案</div>
              <div class="report-title-sub">基于宏观数据的系统化指导建议</div>
            </div>
          </template>
          <el-skeleton :rows="8" animated :loading="aiGenerating">
            <template #default>
              <div class="report-body">
                <el-empty v-if="!aiSuggestion" description="点击上方按钮，生成详尽诊断报告" />
                <div v-else class="report-shell glass-effect-light">
                  <div class="report-watermark">CONFIDENTIAL</div>
                  <div class="report-content markdown-body" v-html="renderedAiSuggestion"></div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </el-card>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { DataAnalysis, PieChart, Aim, Document } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import * as echarts from 'echarts'
  import { getAIDiagnosis } from '../api/user' 
  
  const userName = ref('同学')
  const lastDiagnosisTime = ref(new Date().toLocaleString())
  const aiGenerating = ref(false)
  
  const healthScore = ref(0)
  const strongPoints = ref([])
  const weakPoints = ref([])
  const blindSpots = ref([])
  const activeBlindSpot = ref([0])
  const aiSuggestion = ref('')
  
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
    closeList()
    return html.join('')
  }
  
  const renderedAiSuggestion = computed(() => renderMarkdown(aiSuggestion.value))
  let radarChart = null
  const radarChartRef = ref(null)
  
  const initRadarChart = (chartData) => {
    if (!radarChartRef.value) return
    if (radarChart) radarChart.dispose()
    radarChart = echarts.init(radarChartRef.value)
    if (!chartData || !chartData.length) chartData = [{ name: '暂无数据', score: 0 }, { name: '请先考试', score: 0 }]
  
    const option = {
      tooltip: { trigger: 'item', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderColor: '#e2e8f0', textStyle: { color: '#0f172a' } },
      radar: {
        indicator: chartData.map(item => ({ name: item.name, max: 100 })),
        splitArea: { areaStyle: { color: ['transparent'] } },
        axisLine: { lineStyle: { color: 'rgba(15,23,42,0.1)' } },
        splitLine: { lineStyle: { color: 'rgba(15,23,42,0.1)' } },
        axisName: { color: '#475569', fontSize: 13, fontWeight: 600 }
      },
      series: [{
        name: '掌握度', type: 'radar',
        data: [{
          value: chartData.map(item => item.score),
          name: '当前得分率(%)',
          itemStyle: { color: '#3b82f6' },
          areaStyle: { color: 'rgba(59, 130, 246, 0.25)' },
          lineStyle: { width: 3, color: '#3b82f6', shadowBlur: 10, shadowColor: 'rgba(59, 130, 246, 0.4)' }
        }]
      }]
    }
    radarChart.setOption(option)
  }
  
  const generateAIDiagnosis = async () => {
    if (aiGenerating.value) return
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const userId = userInfo.userId || userInfo.id
    if (!userId) return ElMessage.error('请先登录系统')
  
    aiGenerating.value = true
    ElMessage.info('系统正在聚合您的历史轨迹...')
    try {
      const res = await getAIDiagnosis(userId)
      if (res.code === 200 && res.data) {
        const data = res.data
        healthScore.value = data.healthScore; strongPoints.value = data.strongPoints || []; weakPoints.value = data.weakPoints || []; blindSpots.value = data.blindSpots || []; aiSuggestion.value = data.aiSuggestion; lastDiagnosisTime.value = new Date().toLocaleString()
        initRadarChart(data.radarData)
        ElMessage.success('诊断报告生成完毕！')
      } else ElMessage.warning(res.message || '诊断失败，可能缺少数据')
    } catch (error) { ElMessage.error('服务异常') } finally { aiGenerating.value = false }
  }
  
  const getScoreClass = (score) => { if (score >= 80) return 'score-excellent'; if (score >= 60) return 'score-good'; return 'score-warning' }
  const handleResize = () => { if (radarChart) radarChart.resize() }
  onMounted(() => { const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}'); if (userInfo.studentName || userInfo.username) userName.value = userInfo.studentName || userInfo.username; nextTick(() => { initRadarChart([]) }); window.addEventListener('resize', handleResize); generateAIDiagnosis() })
  onUnmounted(() => { window.removeEventListener('resize', handleResize); if (radarChart) radarChart.dispose() })
  </script>
  
  <style scoped>
  .analysis-container { position: relative; min-height: calc(100vh - 60px); background-color: #f8fafc; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
  .ambient-background { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
  .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; animation: float 20s infinite alternate ease-in-out; }
  .blob-1 { top: -10%; left: -5%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%); }
  .blob-2 { bottom: -20%; right: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%); animation-delay: -5s; }
  @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(5%, 5%) scale(1.05); } }
  
  .content-wrapper { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
  .animate-fade-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  
  .premium-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 24px; box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  .premium-card:hover { transform: translateY(-2px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.1); }
  .glass-effect-light { background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.8); }
  
  .mb-24 { margin-bottom: 24px; }
  .text-muted { color: #64748b; font-size: 14px; font-weight: 500; }
  .page-header { margin-bottom: 24px; font-weight: 700; color: #0f172a; }
  
  .action-content { display: flex; justify-content: space-between; align-items: center; padding: 12px; }
  .user-info { display: flex; align-items: center; gap: 20px; }
  .info-text h3 { margin: 0 0 6px 0; color: #0f172a; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
  .generate-btn { border-radius: 12px; font-weight: 600; padding: 0 24px; }
  .btn-hover-glow { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); transition: all 0.3s; }
  .btn-hover-glow:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4); }
  
  .card-header { font-weight: 700; font-size: 17px; color: #0f172a; display: flex; align-items: center; gap: 8px; }
  .card-header .el-icon { color: #3b82f6; font-size: 20px; }
  .radar-chart { width: 100%; height: 340px; }
  
  .score-overview { display: flex; gap: 32px; align-items: stretch; }
  .score-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 32px; border-radius: 16px; min-width: 140px; }
  .score-label { font-size: 13px; color: #64748b; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .score-value { font-size: 48px; font-weight: 800; font-family: -apple-system, sans-serif; line-height: 1; }
  .score-excellent { background: linear-gradient(135deg, #10b981, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .score-good { background: linear-gradient(135deg, #f59e0b, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .score-warning { background: linear-gradient(135deg, #ef4444, #dc2626); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  
  .tags-box h4 { margin: 0 0 12px 0; font-size: 15px; color: #1e293b; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
  .dot.success { color: #10b981; background-color: #10b981; }
  .dot.danger { color: #ef4444; background-color: #ef4444; }
  .tag-group { display: flex; flex-wrap: wrap; gap: 10px; }
  .custom-tag { border-radius: 8px; padding: 0 16px; height: 30px; line-height: 28px; font-weight: 600; border: none; background: rgba(255,255,255,0.6); backdrop-filter: blur(4px); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  
  .light-divider { border-color: rgba(15,23,42,0.1); margin: 24px 0; }
  .section-title { font-size: 16px; color: #0f172a; font-weight: 700; margin-bottom: 16px; }
  
  :deep(.custom-collapse) { border: none; }
  :deep(.custom-collapse .el-collapse-item__header) { background: transparent; border-bottom: 1px solid rgba(15,23,42,0.05); font-weight: 600; font-size: 15px; color: #1e293b; padding: 10px 0; }
  :deep(.custom-collapse .el-collapse-item__wrap) { background: transparent; border: none; }
  .index-num { display: inline-block; width: 22px; height: 22px; background: #e2e8f0; color: #475569; text-align: center; line-height: 22px; border-radius: 6px; font-size: 12px; margin-right: 10px; font-weight: bold; }
  .spot-content { padding: 16px 20px; border-radius: 12px; margin-top: 8px; }
  .spot-desc { color: #475569; font-size: 14px; margin: 0 0 12px 0; line-height: 1.6; font-weight: 500; }
  .spot-error { color: #b91c1c; font-size: 14px; background: rgba(254,242,242,0.6); padding: 12px 16px; border-radius: 8px; border-left: 3px solid #ef4444; }
  
  .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(15,23,42,0.05); padding-bottom: 16px; }
  .report-title-main { font-size: 19px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px; }
  .report-title-sub { font-size: 14px; color: #64748b; font-weight: 500; }
  
  .report-body { background: transparent; padding: 10px; }
  .report-shell { position: relative; border-radius: 16px; padding: 40px 60px; min-height: 300px; overflow: hidden; }
  .report-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; color: rgba(15,23,42,0.03); font-weight: 900; letter-spacing: 10px; pointer-events: none; z-index: 0; }
  
  .report-content { position: relative; z-index: 1; color: #334155; font-size: 16px; line-height: 1.85; }
  .report-content :deep(h1), .report-content :deep(h2), .report-content :deep(h3) { color: #0f172a; margin-top: 1.8em; margin-bottom: 0.8em; font-weight: 700; }
  .report-content :deep(h1) { font-size: 24px; border-bottom: 2px solid rgba(15,23,42,0.05); padding-bottom: 10px; }
  .report-content :deep(h2) { font-size: 19px; position: relative; padding-left: 16px; }
  .report-content :deep(h2)::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 4px; background: linear-gradient(to bottom, #3b82f6, #8b5cf6); border-radius: 2px; }
  .report-content :deep(h3) { font-size: 17px; }
  .report-content :deep(p) { margin-bottom: 1.2em; font-weight: 400; }
  .report-content :deep(ul) { padding-left: 24px; margin-bottom: 1.2em; list-style-type: none; }
  .report-content :deep(li) { position: relative; margin-bottom: 0.6em; }
  .report-content :deep(li)::before { content: "•"; color: #3b82f6; font-weight: bold; position: absolute; left: -16px; }
  .report-content :deep(strong) { font-weight: 700; color: #0f172a; background: linear-gradient(to top, rgba(59,130,246,0.15) 30%, transparent 30%); padding: 0 4px; }
  .report-content :deep(code) { font-family: ui-monospace, monospace; font-size: 0.9em; background: rgba(15,23,42,0.04); padding: 4px 8px; border-radius: 6px; color: #0f172a; }
  </style>