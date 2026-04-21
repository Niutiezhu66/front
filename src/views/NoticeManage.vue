<template>
  <div class="notice-manage-container">
    <div class="action-bar">
      <el-button type="primary" @click="showAddDialog" icon="Plus">添加公告</el-button>
      <el-button @click="getNoticeList" icon="Refresh">刷新列表</el-button>
    </div>

    <div class="notice-list">
      <el-table :data="noticeList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip>
          <template #default="scope">
            <div class="content-preview">{{ scope.row.content.substring(0, 50) }}{{ scope.row.content.length > 50 ? '...' : '' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTagColor(scope.row.type)">{{ getTypeText(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="100">
          <template #default="scope">
            <el-tag :type="getPriorityTagColor(scope.row.priority)">{{ getPriorityText(scope.row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isActive ? 'success' : 'danger'">{{ scope.row.isActive ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="400" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewNoticeDetail(scope.row)" icon="View">查看</el-button>
            <el-button size="small" @click="editNotice(scope.row)" icon="Edit">编辑</el-button>
            <el-button size="small" :type="scope.row.isActive ? 'warning' : 'success'" @click="toggleStatus(scope.row)" icon="Switch">{{ scope.row.isActive ? '禁用' : '启用' }}</el-button>
            <el-button size="small" type="danger" @click="deleteNotice(scope.row)" icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" :close-on-click-modal="false">
      <el-form :model="noticeForm" :rules="noticeRules" ref="noticeFormRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="noticeForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="noticeForm.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="noticeForm.type" placeholder="请选择公告类型">
            <el-option label="系统公告" value="SYSTEM" />
            <el-option label="新功能" value="FEATURE" />
            <el-option label="通知" value="NOTICE" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="noticeForm.priority" placeholder="请选择优先级">
            <el-option label="普通" :value="0" />
            <el-option label="重要" :value="1" />
            <el-option label="紧急" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="noticeForm.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNotice" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" :title="viewNotice.title" width="600px">
      <div class="notice-detail" v-if="viewNotice">
        <div class="notice-meta">
          <el-tag :type="getTypeTagColor(viewNotice.type)" style="margin-right: 10px;">{{ getTypeText(viewNotice.type) }}</el-tag>
          <el-tag :type="getPriorityTagColor(viewNotice.priority)" style="margin-right: 10px;">{{ getPriorityText(viewNotice.priority) }}</el-tag>
          <el-tag :type="viewNotice.isActive ? 'success' : 'danger'">{{ viewNotice.isActive ? '启用' : '禁用' }}</el-tag>
        </div>
        <div class="notice-content">{{ viewNotice.content }}</div>
        <div class="notice-time">创建时间：{{ viewNotice.createTime }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, View, Edit, Switch, Delete } from '@element-plus/icons-vue'
import request from '../utils/request'

const loading = ref(false)
const noticeList = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const noticeFormRef = ref()
const viewNotice = ref({})

const noticeForm = reactive({ id: null, title: '', content: '', type: 'NOTICE', priority: 0, isActive: true })

const noticeRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
  type: [{ required: true, message: '请选择公告类型', trigger: 'change' }]
}

const getNoticeList = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/notices/list')
    noticeList.value = res.data || []
  } catch (error) {
    ElMessage.error('获取公告列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => { resetForm(); dialogTitle.value = '添加公告'; dialogVisible.value = true; }
const viewNoticeDetail = (notice) => { viewNotice.value = notice; viewDialogVisible.value = true; }
const editNotice = (notice) => { Object.assign(noticeForm, notice); dialogTitle.value = '编辑公告'; dialogVisible.value = true; }

const resetForm = () => {
  Object.assign(noticeForm, { id: null, title: '', content: '', type: 'NOTICE', priority: 0, isActive: true })
  if (noticeFormRef.value) noticeFormRef.value.resetFields()
}

const submitNotice = async () => {
  if (!noticeFormRef.value) return
  try {
    await noticeFormRef.value.validate()
    submitLoading.value = true
    const isEdit = noticeForm.id !== null
    const url = isEdit ? '/api/notices/update' : '/api/notices/add'
    const method = isEdit ? 'put' : 'post'
    await request[method](url, noticeForm)
    ElMessage.success(isEdit ? '公告更新成功' : '公告添加成功')
    dialogVisible.value = false
    await getNoticeList()
  } catch (error) {
    ElMessage.error(error?.message || '提交失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

const toggleStatus = async (notice) => {
  try {
    const newStatus = !notice.isActive
    const statusText = newStatus ? '启用' : '禁用'
    await ElMessageBox.confirm(`确认${statusText}公告"${notice.title}"？`, '确认操作', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    await request.put(`/api/notices/toggle/${notice.id}?isActive=${newStatus}`)
    ElMessage.success(`公告${statusText}成功`)
    await getNoticeList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error?.message || '状态切换失败')
  }
}

const deleteNotice = async (notice) => {
  try {
    await ElMessageBox.confirm(`确认删除公告"${notice.title}"？此操作不可恢复！`, '确认删除', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'danger' })
    await request.delete(`/api/notices/delete/${notice.id}`)
    ElMessage.success('公告删除成功')
    await getNoticeList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error?.message || '删除失败，请重试')
  }
}

const getTypeTagColor = (type) => ({ 'SYSTEM': 'danger', 'FEATURE': 'success', 'NOTICE': 'warning' }[type] || 'info')
const getTypeText = (type) => ({ 'SYSTEM': '系统', 'FEATURE': '新功能', 'NOTICE': '通知' }[type] || '其他')
const getPriorityTagColor = (priority) => ({ 0: 'info', 1: 'warning', 2: 'danger' }[priority] || 'info')
const getPriorityText = (priority) => ({ 0: '普通', 1: '重要', 2: '紧急' }[priority] || '普通')

onMounted(() => getNoticeList())

</script>

<style scoped>
/* 修复了 transform 导致的弹窗遮罩被锁在容器内的问题 */
.notice-manage-container {
  padding: 24px;
  animation: viewFadeIn 0.5s ease forwards;
}
@keyframes viewFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 顶部操作栏 */
.action-bar {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 20px 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.05);
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  overflow: hidden; /* 防止内部溢出破坏圆角 */
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.action-bar:hover {
  box-shadow: 0 12px 40px rgba(31, 38, 135, 0.08);
}

/* 主体列表卡片 */
.notice-list {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.05);
  padding: 20px 24px;
  overflow: hidden; /* 核心修复：表格背景不再漏出直角 */
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 文本截断预览 */
.content-preview { 
  color: #64748b; 
  line-height: 1.6; 
  font-weight: 500;
  font-size: 13px;
}

/* === Element Plus 组件美化 === */
:deep(.el-button) {
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
}
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
}

:deep(.el-table) {
  background: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  border-radius: 12px;
}
:deep(.el-table th.el-table__cell) {
  width: fit-content;
  background: rgba(255, 255, 255, 0.4);
  color: #1e293b;
  font-weight: 700;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  padding: 14px 0;
}
:deep(.el-table td.el-table__cell) {
  border-bottom: 1px dashed rgba(0,0,0,0.04);
  transition: background 0.3s ease;
  padding: 12px 0;
}
:deep(.el-table__body tr:hover > td.el-table__cell) {
  background-color: rgba(64, 158, 255, 0.08) !important;
}

:deep(.el-tag) { border-radius: 8px; font-weight: 600; border: none; padding: 0 10px; }

:deep(.el-input__wrapper), :deep(.el-textarea__inner), :deep(.el-select .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  background: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  border: 1px solid transparent;
}
:deep(.el-input__wrapper:focus), :deep(.el-textarea__inner:focus) {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  background: #ffffff;
}

/* 完美解决弹窗直角与遮罩层级 */
:deep(.el-overlay) {
  backdrop-filter: blur(8px);
  background-color: rgba(15, 23, 42, 0.4) !important;
}
:deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(24px) !important;
  border-radius: 24px !important;
  overflow: hidden !important; /* 切掉默认头尾直角，完美贴合圆弧 */
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  animation: dialogFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes dialogFadeIn {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
:deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding: 24px 32px;
  background: linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%);
}
:deep(.el-dialog__title) { font-weight: 800; font-size: 18px; color: #0f172a; }
:deep(.el-dialog__body) { padding: 24px 32px; }
:deep(.el-dialog__footer) {
  padding: 16px 32px;
  border-top: 1px solid rgba(0,0,0,0.05);
  background: rgba(255, 255, 255, 0.5);
}

/* 公告详情阅读面板优化 */
.notice-detail { padding: 0; }
.notice-meta { 
  margin-bottom: 20px; 
  padding-bottom: 16px; 
  border-bottom: 1px dashed rgba(0,0,0,0.1); 
  display: flex;
  align-items: center;
}
.notice-content { 
  margin-bottom: 24px; 
  line-height: 1.8; 
  color: #334155; 
  white-space: pre-wrap; 
  font-size: 15px;
  background: rgba(255,255,255,0.6);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.8);
  overflow: hidden;
}
.notice-time { 
  color: #64748b; 
  font-size: 13px; 
  text-align: right; 
  font-weight: 600;
}
</style>