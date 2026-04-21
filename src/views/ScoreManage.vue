<template>
  <div class="score-manage-container">
    <div class="search-bar">
      <el-input v-model="searchForm.studentName" placeholder="考生姓名" clearable style="width: 200px" @input="handleSearch" />
      <el-input v-model="searchForm.studentNumber" placeholder="学号/工号" clearable style="width: 200px" @input="handleSearch" />
      <el-select v-model="searchForm.status" placeholder="考试状态" clearable style="width: 180px" @change="handleSearch">
        <el-option label="进行中" :value="0" />
        <el-option label="待阅卷/阅卷中" :value="1" />
        <el-option label="已批阅" :value="2" />
      </el-select>
      <el-date-picker
        v-model="searchForm.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        style="width: 300px"
        @change="handleSearch"
      />
      <el-button type="primary" @click="handleSearch" icon="Search">搜索</el-button>
      <el-button @click="resetSearch" icon="Refresh">重置</el-button>
    </div>

    <div class="table-container">
      <el-table :data="examRecords" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="记录ID" width="80" />
        <el-table-column prop="studentName" label="考生姓名" width="120" />
        <el-table-column prop="studentNumber" label="学号/工号" width="120" />
        <el-table-column prop="paper.name" label="试卷名称" min-width="200" />
        <el-table-column prop="score" label="得分" width="100">
          <template #default="scope">
            <span v-if="scope.row.status === '已批阅'">{{ scope.row.score }}</span>
            <span v-else class="text-muted">{{ getStatusText(scope.row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paper.totalScore" label="总分" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="scope">{{ formatDateTime(scope.row.startTime) }}</template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="180">
          <template #default="scope">{{ scope.row.endTime ? formatDateTime(scope.row.endTime) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)" icon="View">查看详情</el-button>
            <el-button v-if="canTriggerGrade(scope.row.status)" size="small" type="primary" @click="gradeExam(scope.row)" :loading="scope.row.grading" icon="Edit">{{ getGradeActionText(scope.row.status) }}</el-button>
            <el-button v-if="scope.row.status === '阅卷中'" size="small" disabled icon="Loading">阅卷中</el-button>
            <el-button size="small" type="danger" @click="deleteRecord(scope.row)" icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, Edit, Delete, Loading } from '@element-plus/icons-vue'
import request from '../utils/request'
import { gradeExam as triggerExamGrade } from '../api/exam'

const router = useRouter()
const examRecords = ref([])
const loading = ref(false)
const pagination = reactive({ current: 1, size: 20, total: 0 })
const searchForm = reactive({ studentName: '', studentNumber: '', status: '', dateRange: [] })

const getExamRecords = async () => {
  loading.value = true
  try {
    const params = { 
      page: pagination.current, size: pagination.size, studentName: searchForm.studentName, 
      studentNumber: searchForm.studentNumber, status: searchForm.status, 
      startDate: searchForm.dateRange?.[0], endDate: searchForm.dateRange?.[1] 
    }
    const res = await request.get('/api/exam-records/list', { params })
    examRecords.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    ElMessage.error('获取考试记录失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.current = 1; getExamRecords(); }
const resetSearch = () => { Object.assign(searchForm, { studentName: '', studentNumber: '', status: '', dateRange: [] }); handleSearch(); }
const handleSizeChange = (size) => { pagination.size = size; pagination.current = 1; getExamRecords(); }
const handleCurrentChange = (current) => { pagination.current = current; getExamRecords(); }

const getStatusText = (status) => ({ '进行中': '进行中', '待阅卷': '待阅卷', '阅卷中': '阅卷中', '阅卷失败': '阅卷失败', '已完成': '待阅卷', '已批阅': '已批阅' }[status] || status)
const getStatusType = (status) => ({ '进行中': 'warning', '待阅卷': 'info', '阅卷中': 'primary', '阅卷失败': 'danger', '已完成': 'info', '已批阅': 'success' }[status] || 'info')
const canTriggerGrade = (status) => ['待阅卷', '阅卷失败', '已完成'].includes(status)
const getGradeActionText = (status) => status === '阅卷失败' ? '重试阅卷' : '启动阅卷'
const formatDateTime = (dateTime) => dateTime ? new Date(dateTime).toLocaleString('zh-CN') : '-'

const viewDetail = (record) => router.push(`/exam-result/${record.id}`)

const gradeExam = async (record) => {
  try {
    record.grading = true
    await triggerExamGrade(record.id)
    ElMessage.success(record.status === '阅卷失败' ? '已重新加入后台阅卷' : '已加入后台阅卷队列')
    getExamRecords()
  } catch (error) {
    ElMessage.error(error.message || '触发阅卷失败')
  } finally {
    record.grading = false
  }
}

const deleteRecord = async (record) => {
  try {
    await ElMessageBox.confirm(`确定要删除考生 ${record.studentName} 的考试记录吗？`, '确认删除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await request.delete(`/api/exam-records/${record.id}`)
    ElMessage.success('删除成功')
    getExamRecords()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => getExamRecords())

</script>

<style scoped>
/* ==========================================
   全局基础容器与环境光动态背景
   ========================================== */
.score-manage-container {
  padding: 24px;
  min-height: calc(100vh - 72px);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

/* 动态光晕背景效果 */
.score-manage-container::before, .score-manage-container::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.4;
  animation: float 25s infinite alternate ease-in-out;
  pointer-events: none;
  z-index: -1;
}
.score-manage-container::before {
  top: -5%; left: -5%; width: 40vw; height: 40vw;
  background: radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%);
}
.score-manage-container::after {
  bottom: -10%; right: -5%; width: 50vw; height: 50vw;
  background: radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%);
  animation-delay: -5s;
}
@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(4%, 6%) scale(1.05); }
}

/* ==========================================
   高端毛玻璃卡片统一样式 (玻璃态视效)
   ========================================== */
.search-bar, .table-container {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05);
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.search-bar {
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  animation-delay: 0s;
}

.table-container {
  padding: 16px;
  overflow: hidden;
  animation-delay: 0.1s;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==========================================
   输入框、选择器与日期组件美化
   ========================================== */
:deep(.el-input__wrapper), 
:deep(.el-select .el-input__wrapper),
:deep(.el-date-editor.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 12px;
  box-shadow: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 6px 16px;
}

:deep(.el-input__wrapper:focus-within), 
:deep(.el-select .el-input__wrapper.is-focus),
:deep(.el-date-editor.el-input__wrapper.is-active) {
  background: #fff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
}

:deep(.el-range-input) {
  background: transparent;
}

/* ==========================================
   按钮悬浮与渐变美化
   ========================================== */
.el-button {
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.el-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
}
.el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35);
}
.el-button--danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
}
.el-button--danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.35);
}
.el-button--default:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

/* 表格内小按钮精简样式 */
:deep(.el-table .el-button--small) {
  padding: 6px 12px;
  border-radius: 8px;
}

/* ==========================================
   表格透明化与细节重构
   ========================================== */
:deep(.el-table) {
  background: transparent;
  --el-table-border-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(241, 245, 249, 0.6);
}
:deep(.el-table th.el-table__cell) {
  background: transparent;
  color: #64748b;
  font-weight: 600;
  font-size: 14px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}
:deep(.el-table td.el-table__cell) {
  background: transparent;
  border-bottom: 1px dashed rgba(15, 23, 42, 0.06);
  padding: 16px 0;
  color: #1e293b;
}

/* Tag 标签美化 */
:deep(.el-tag) {
  border: none;
  font-weight: 600;
  border-radius: 8px;
  padding: 0 12px;
}

.text-muted {
  color: #94a3b8;
  font-weight: 500;
  font-size: 13px;
  background: rgba(15, 23, 42, 0.04);
  padding: 4px 8px;
  border-radius: 6px;
}

/* ==========================================
   分页器居中与玻璃态
   ========================================== */
.pagination-container {
  padding: 24px 0 8px 0;
  display: flex;
  justify-content: center;
}
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #3b82f6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
:deep(.el-pagination.is-background .btn-next), 
:deep(.el-pagination.is-background .btn-prev), 
:deep(.el-pagination.is-background .el-pager li) {
  border-radius: 8px;
  background: rgba(241, 245, 249, 0.8);
  transition: all 0.3s;
}
:deep(.el-pagination.is-background .el-pager li:hover:not(.is-active)) {
  background: #fff;
  color: #3b82f6;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

/* 优雅的自定义滚动条 */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.1); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(15, 23, 42, 0.2); }

/* 响应式调整 */
@media (max-width: 768px) {
  .search-bar { flex-direction: column; align-items: stretch; }
  .search-bar .el-input, .search-bar .el-select, .search-bar .el-date-editor {
    width: 100% !important;
  }
}
</style>