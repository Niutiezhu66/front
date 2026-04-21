<template>
  <div class="paper-manage-container">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div class="content-wrapper animate-fade-up">
      <div class="header premium-card glass-effect">
        <div class="header-left">
          <h2><el-icon><Files /></el-icon> 试卷档案管理</h2>
        </div>
        <div class="header-right">
          <el-input v-model="searchKeyword" placeholder="按试卷名称搜索" class="custom-input search-input" clearable @clear="getPaperList" @keyup.enter="handleSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" @click="handleSearch" class="btn-hover-glow"><el-icon><Search /></el-icon> 搜索</el-button>
          <el-button type="danger" plain @click="handleBatchDelete" class="btn-hover-danger" :disabled="selectedPapers.length === 0">
            <el-icon><Delete /></el-icon> 批量移除 ({{ selectedPapers.length }})
          </el-button>
          <el-button type="primary" @click="goToCreatePage" class="btn-hover-glow create-btn">
            <el-icon><Plus /></el-icon> 创建新试卷
          </el-button>
        </div>
      </div>
      
      <div class="paper-list premium-card glass-effect animate-fade-up" style="animation-delay: 0.1s;">
        <el-table :data="paperList" v-loading="loading" class="custom-table" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="编号" width="80">
            <template #default="{ row }"><span class="id-text">#{{ row.id }}</span></template>
          </el-table-column>
          <el-table-column prop="name" label="试卷名称" min-width="220" show-overflow-tooltip>
            <template #default="{ row }"><span class="title-text">{{ row.name }}</span></template>
          </el-table-column>
          <el-table-column prop="status" label="发布状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'" effect="plain" class="status-tag" round>
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="questionCount" label="题量" width="100" align="center">
            <template #default="{ row }"><span class="meta-val">{{ row.questionCount }}</span><span class="meta-unit">道</span></template>
          </el-table-column>
          <el-table-column prop="totalScore" label="总分" width="100" align="center">
            <template #default="{ row }"><span class="meta-val">{{ row.totalScore }}</span><span class="meta-unit">分</span></template>
          </el-table-column>
          <el-table-column prop="duration" label="限时" width="100" align="center">
            <template #default="{ row }"><span class="meta-val">{{ row.duration }}</span><span class="meta-unit">m</span></template>
          </el-table-column>
          <el-table-column label="管理面版" width="280" align="right" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 'DRAFT' || row.status === '待发布'" size="small" type="success" link class="action-btn text-success" @click="updateStatus(row, 'PUBLISHED')"><el-icon><CaretRight /></el-icon> 发布开考</el-button>
              <el-button v-if="row.status === 'PUBLISHED'" size="small" type="warning" link class="action-btn text-warning" @click="updateStatus(row, 'DRAFT')"><el-icon><VideoPause /></el-icon> 停止停考</el-button>
              <el-button size="small" type="primary" link class="action-btn" @click="editPaper(row)"><el-icon><Edit /></el-icon> 编辑</el-button>
              <el-button size="small" type="danger" link class="action-btn text-danger" @click="deletePaper(row)"><el-icon><Delete /></el-icon> 删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, CaretRight, Edit, Delete, VideoPause, Search, Files } from '@element-plus/icons-vue'
import { getPapers } from '../api/paper.js' 
import request from '../utils/request'

const router = useRouter()
const loading = ref(false)
const paperList = ref([])
const searchKeyword = ref('')
const selectedPapers = ref([])

const getStatusText = (status) => ({ 'PUBLISHED': '已发布', 'DRAFT': '草稿', '待发布': '待发布' }[status] || '未知状态')

// [逻辑完全保留原版]
const getPaperList = async () => {
  loading.value = true
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    let currentUserId = null; let currentRole = null 
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr)
      currentUserId = userInfo.userId
      currentRole = String(userInfo.role) 
    }
    const res = await request.get('/api/papers/list', {
      params: { name: searchKeyword.value || undefined, userId: currentUserId, role: currentRole }
    })
    if (res.code === 200) { paperList.value = res.data } 
    else { ElMessage.error(res.message || '获取试卷列表失败') }
  } catch (error) { ElMessage.error('获取试卷列表异常') } finally { loading.value = false }
}

const handleSearch = () => { getPaperList() }
const goToCreatePage = () => { router.push('/admin/paper-create') }
const editPaper = (paper) => { router.push(`/admin/paper-create?id=${paper.id}`) }
const updateStatus = async (paper, status) => {
  try {
    const res = await request.post(`/api/papers/${paper.id}/status?status=${status}`)
    if (res.code === 200) { ElMessage.success(`状态已变更为：${getStatusText(status)}`); getPaperList() } 
    else { ElMessage.error(res.message || '更新状态失败') }
  } catch (error) { ElMessage.error('网络异常，状态更新失败') }
}
const deletePaper = async (paper) => {
  try {
    await ElMessageBox.confirm(`确定销毁试卷 "${paper.name}" 吗？此操作不可逆。`, '销毁确认', { confirmButtonText: '确认销毁', cancelButtonText: '取消', type: 'error', customClass: 'premium-dialog glass-dialog' })
    const res = await request.delete(`/api/papers/${paper.id}`)
    if (res.code === 200) { ElMessage.success('档案销毁成功'); getPaperList() } 
    else { ElMessage.error(res.message || '删除失败') }
  } catch (error) {}
}
const handleBatchDelete = async () => {
  if (selectedPapers.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定销毁选中的 ${selectedPapers.value.length} 份试卷吗？`, '批量销毁', { type: 'error', customClass: 'premium-dialog glass-dialog' })
    await Promise.all(selectedPapers.value.map(p => request.delete(`/api/papers/${p.id}`)))
    ElMessage.success('批量销毁完成'); selectedPapers.value = []; getPaperList()
  } catch (error) {}
}
const handleSelectionChange = (selected) => { selectedPapers.value = selected }
onMounted(() => { getPaperList() })
</script>

<style scoped>
.paper-manage-container { position: relative; min-height: calc(100vh - 72px); padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
.ambient-background { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.4; animation: float 25s infinite alternate ease-in-out; }
.blob-1 { top: -5%; left: -5%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%); }
.blob-2 { bottom: -10%; right: -5%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%); animation-delay: -5s; }
@keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(4%, 6%) scale(1.05); } }

.content-wrapper { position: relative; z-index: 1; max-width: 1400px; margin: 0 auto; }
.animate-fade-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.premium-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 20px; box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05); }
.glass-effect { position: relative; z-index: 1; }

.header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; margin-bottom: 24px; }
.header h2 { margin: 0; color: #0f172a; display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 700; }
.header h2 .el-icon { color: #3b82f6; font-size: 22px; }

.header-right { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
:deep(.custom-input .el-input__wrapper) { background: rgba(255,255,255,0.8); border: 1px solid rgba(15,23,42,0.06); border-radius: 12px; padding: 6px 16px; box-shadow: none; transition: all 0.3s; width: 220px; }
:deep(.custom-input .el-input__wrapper:focus-within) { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }

.btn-hover-glow { border-radius: 12px; font-weight: 600; padding: 0 20px; height: 38px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; color: #fff; box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25); transition: all 0.3s; }
.btn-hover-glow:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35); }
.btn-hover-danger { border-radius: 12px; font-weight: 600; height: 38px; }

.paper-list { padding: 24px; }
:deep(.custom-table) { background: transparent; --el-table-border-color: transparent; --el-table-header-bg-color: transparent; --el-table-row-hover-bg-color: rgba(241, 245, 249, 0.6); }
:deep(.custom-table th.el-table__cell) { background: transparent; color: #64748b; font-weight: 600; font-size: 14px; padding: 16px 0; border-bottom: 1px solid rgba(15,23,42,0.06); }
:deep(.custom-table td.el-table__cell) { background: transparent; border-bottom: 1px dashed rgba(15,23,42,0.06); padding: 16px 0; }

.id-text { color: #475569; font-family: ui-monospace, monospace; font-size: 14px; background: rgba(15,23,42,0.04); padding: 4px 8px; border-radius: 6px; }
.title-text { color: #1e293b; font-size: 15px; font-weight: 600; }
.status-tag { font-weight: 600; border: none; background: rgba(241,245,249,0.8); }

.meta-val { font-size: 16px; font-weight: 700; color: #0f172a; font-family: -apple-system, sans-serif; }
.meta-unit { font-size: 12px; color: #94a3b8; font-weight: 500; margin-left: 2px; }

.action-btn { font-weight: 600; border-radius: 8px; padding: 6px 10px; transition: all 0.2s; }
.action-btn:hover { background: rgba(59,130,246,0.08); }
.action-btn.text-success:hover { background: rgba(16,185,129,0.08); color: #10b981; }
.action-btn.text-warning:hover { background: rgba(245,158,11,0.08); color: #f59e0b; }
.action-btn.text-danger:hover { background: rgba(239,68,68,0.08); color: #ef4444; }

/* 全局弹窗 */
:global(.glass-dialog) { background: rgba(255,255,255,0.85) !important; backdrop-filter: blur(24px) !important; border-radius: 20px !important; border: 1px solid rgba(255,255,255,0.9) !important; box-shadow: 0 20px 40px rgba(15,23,42,0.1) !important; }
</style>