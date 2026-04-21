<template>
    <div class="teacher-analysis-container">
      <div class="ambient-background">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
      </div>
  
      <div class="content-wrapper">
        <div class="header premium-card glass-effect animate-fade-up" style="animation-delay: 0.1s;">
          <h2><el-icon><DataBoard /></el-icon> 教学教研深度分析中心</h2>
          <el-button type="primary" size="large" @click="fetchAnalysisData" :loading="aiGenerating" class="generate-btn btn-hover-glow">
            <el-icon class="el-icon--left"><MagicStick /></el-icon>
            {{ aiGenerating ? '系统汇编全盘数据中...' : '生成阶段性教研报告' }}
          </el-button>
        </div>
  
        <el-row :gutter="24" class="mb-24 animate-fade-up" style="animation-delay: 0.2s;">
          <el-col :span="6" v-for="(item, index) in topCards" :key="index">
            <el-card shadow="never" class="stat-card premium-card glass-effect">
              <div class="stat-content">
                <div class="stat-title">{{ item.title }}</div>
                <div class="stat-value">{{ item.value }}<span class="stat-unit">{{ item.unit }}</span></div>
              </div>
              <div class="stat-icon" :style="{ color: item.color, backgroundColor: item.color + '15', boxShadow: `inset 0 0 0 1px ${item.color}30` }">
                <el-icon><component :is="item.icon" /></el-icon>
              </div>
            </el-card>
          </el-col>
        </el-row>
  
        <el-row :gutter="24" class="mb-24 animate-fade-up" style="animation-delay: 0.3s;">
          <el-col :span="10">
            <el-card shadow="never" class="chart-card premium-card glass-effect">
              <template #header><div class="card-header">全盘分数段分布 (近期)</div></template>
              <div ref="pieChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
  
          <el-col :span="14">
            <el-card shadow="never" class="chart-card premium-card glass-effect">
              <template #header><div class="card-header">班级高频错题/薄弱考点 Top 5</div></template>
              <div ref="barChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
  
        <el-card shadow="never" class="report-card premium-card glass-effect animate-fade-up" style="animation-delay: 0.4s;">
          <template #header>
            <div class="card-header report-header">
              <div class="ai-title-main"><el-icon><Monitor /></el-icon><span>系统教研洞察报告</span></div>
              <div class="ai-title-sub">结构化洞察 · 宏观把控 · 教学复盘</div>
            </div>
          </template>
          <el-skeleton :rows="8" animated :loading="aiGenerating">
            <template #default>
              <div class="report-body">
                <el-empty v-if="!aiReport" description="点击右上角按钮，生成宏观教研报告" />
                <div v-else class="report-shell glass-effect-light">
                  <div class="report-watermark">TEACHER ONLY</div>
                  <div class="report-content markdown-body" v-html="renderedAiReport"></div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </el-card>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, onUnmounted, markRaw } from 'vue'
  import { DataBoard, MagicStick, User, Document, TrendCharts, Warning, Monitor } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import request from '@/utils/request'
  import { ElMessage } from 'element-plus'
  
  const aiGenerating = ref(false)
  const aiReport = ref('')
  
  // 【统一 Markdown 解析引擎】：与 Analysis.vue 保持绝对一致，去掉多余复杂的解析导致排版错乱的问题
  const escapeHtml = (text = '') => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const applyInlineMarkdown = (text = '') => text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
  
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
      if (headingMatch) { 
        closeList()
        const level = headingMatch[1].length
        html.push(`<h${level}>${applyInlineMarkdown(headingMatch[2])}</h${level}>`)
        continue 
      }
      
      const listMatch = line.match(/^(\d+[\.、]|[-*+])\s+(.*)$/)
      if (listMatch) { 
        if (!inList) { html.push('<ul>'); inList = true } 
        html.push(`<li>${applyInlineMarkdown(listMatch[2])}</li>`)
        continue 
      }
      
      closeList()
      html.push(`<p>${applyInlineMarkdown(line)}</p>`)
    }
    closeList()
    return html.join('')
  }
  
  const renderedAiReport = computed(() => renderMarkdown(aiReport.value))
  
  const topCards = ref([
    { title: '累计组织考试', value: 0, unit: '场', icon: markRaw(Document), color: '#3b82f6' },
    { title: '参考学生总人次', value: 0, unit: '人', icon: markRaw(User), color: '#8b5cf6' },
    { title: '班级平均分', value: 0, unit: '分', icon: markRaw(TrendCharts), color: '#10b981' },
    { title: '整体及格率', value: 0, unit: '%', icon: markRaw(Warning), color: '#f59e0b' }
  ])
  
  const pieChartRef = ref(null); const barChartRef = ref(null)
  let pieChart = null; let barChart = null
  
  const fetchAnalysisData = async () => {
    aiGenerating.value = true
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const currentUserId = userInfo.userId || userInfo.id
      const res = await request.get(`/api/stats/teacher/${currentUserId}`)
      if (res.code === 200) {
        const data = res.data
        topCards.value[0].value = data.totalExams || 0; 
        topCards.value[1].value = data.totalStudents || 0; 
        topCards.value[2].value = data.avgScore || 0; 
        topCards.value[3].value = data.passRate || 0
        
        initPieChart(data.scoreDistribution)
        initBarChart(data.weakPoints)
        aiReport.value = data.aiReport
        ElMessage.success('学情诊断完成！')
      } else {
        ElMessage.warning(res.message || '获取失败')
      }
    } catch (error) { 
      ElMessage.error('获取报告失败，请检查网络') 
    } finally { 
      aiGenerating.value = false 
    }
  }
  
  const initPieChart = (data) => {
    if (!pieChartRef.value) return; if (pieChart) pieChart.dispose(); pieChart = echarts.init(pieChartRef.value)
    const option = {
      tooltip: { trigger: 'item', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderColor: '#e2e8f0', textStyle: { color: '#0f172a' } },
      legend: { bottom: '0%', left: 'center', itemWidth: 12, itemHeight: 12, textStyle: { color: '#475569', fontWeight: 500 } },
      color: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
      series: [{ type: 'pie', radius: ['45%', '70%'], itemStyle: { borderColor: '#fff', borderWidth: 3 }, label: { show: false, position: 'center' }, emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold', color: '#0f172a' } }, data: data && data.length > 0 ? data : [{ name: '暂无数据', value: 0 }] }]
    }
    pieChart.setOption(option)
  }
  
  const initBarChart = (data) => {
    if (!barChartRef.value) return; if (barChart) barChart.dispose(); barChart = echarts.init(barChartRef.value)
    const categoryNames = data ? data.map(item => item.name) : []
    const errorRates = data ? data.map(item => item.value) : []
    const option = {
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderColor: '#e2e8f0' },
      grid: { left: '3%', right: '8%', bottom: '3%', top: '5%', containLabel: true },
      xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: 'rgba(15,23,42,0.05)' } }, axisLine: { show: false } },
      yAxis: { type: 'category', data: categoryNames.reverse(), axisLabel: { width: 120, overflow: 'truncate', color: '#475569', fontWeight: 500 }, axisLine: { lineStyle: { color: 'rgba(15,23,42,0.05)' } }, axisTick: { show: false } },
      series: [{ name: '错误率', type: 'bar', barWidth: '20px', itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#3b82f6' }]), borderRadius: [0, 6, 6, 0] }, label: { show: true, position: 'right', formatter: '{c}%', color: '#64748b', fontSize: 13, fontWeight: 600 }, data: errorRates.reverse() }]
    }
    barChart.setOption(option)
  }
  
  const handleResize = () => { if (pieChart) pieChart.resize(); if (barChart) barChart.resize() }
  onMounted(() => { window.addEventListener('resize', handleResize); fetchAnalysisData() })
  onUnmounted(() => { window.removeEventListener('resize', handleResize); if (pieChart) pieChart.dispose(); if (barChart) barChart.dispose() })
  </script>
  
  <style scoped>
  .teacher-analysis-container { position: relative; padding: 24px; min-height: calc(100vh - 60px); background-color: #f8fafc; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
  .ambient-background { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
  .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; animation: float 25s infinite alternate ease-in-out; }
  .blob-1 { top: -5%; right: -5%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%); }
  .blob-2 { bottom: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%); animation-delay: -5s; }
  @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(3%, 5%) scale(1.05); } }
  
  .content-wrapper { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }
  .animate-fade-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  
  .premium-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 24px; box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  .premium-card:hover { transform: translateY(-2px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.1); }
  .glass-effect-light { background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.8); }
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 24px 32px; border-radius: 24px; }
  .header h2 { margin: 0; color: #0f172a; display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
  .header h2 .el-icon { color: #3b82f6; font-size: 24px; }
  .btn-hover-glow { border-radius: 12px; font-weight: 600; padding: 0 24px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); transition: all 0.3s; }
  .btn-hover-glow:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4); }
  
  .mb-24 { margin-bottom: 24px; }
  
  .stat-card :deep(.el-card__body) { display: flex; justify-content: space-between; align-items: center; padding: 28px 24px; }
  .stat-content { display: flex; flex-direction: column; gap: 8px; }
  .stat-title { font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .stat-value { font-size: 36px; font-weight: 800; color: #0f172a; line-height: 1; font-family: -apple-system, sans-serif; }
  .stat-unit { font-size: 15px; font-weight: 500; color: #94a3b8; margin-left: 6px; }
  .stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; justify-content: center; align-items: center; font-size: 26px; }
  
  .chart-card { height: 100%; }
  .card-header { font-weight: 700; font-size: 17px; color: #0f172a; }
  .chart-container { width: 100%; height: 340px; }
  
  /* 报告容器完全对齐 Analysis.vue 结构 */
  .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(15,23,42,0.05); padding-bottom: 16px; margin-bottom: -10px; }
  .ai-title-main { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 19px; color: #0f172a; }
  .ai-title-main .el-icon { color: #3b82f6; font-size: 20px; }
  .ai-title-sub { font-size: 14px; color: #64748b; font-weight: 500; }
  
  .report-body { background: transparent; padding: 10px; }
  .report-shell { position: relative; border-radius: 16px; padding: 40px 60px; min-height: 300px; overflow: hidden; }
  .report-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; color: rgba(15,23,42,0.03); font-weight: 900; letter-spacing: 10px; pointer-events: none; z-index: 0; }
  
  /* Markdown 内容区完全复用 Analysis.vue 的美学代码 */
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