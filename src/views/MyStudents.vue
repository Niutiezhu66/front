<template>
  <div class="my-students-container">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div class="content-wrapper animate-fade-up">
      <div class="page-header premium-card glass-effect">
        <div class="header-title">
          <el-icon><UserFilled /></el-icon>
          <h2>我的学生管理</h2>
        </div>
        <div class="bind-action">
          <el-input 
            v-model="bindStudentId" 
            placeholder="输入学生学号/ID进行绑定" 
            clearable
            class="custom-input"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" @click="handleBind" :loading="binding" class="btn-hover-glow">
            <el-icon class="el-icon--left"><Link /></el-icon> 绑定学生
          </el-button>
        </div>
      </div>

      <div class="table-card premium-card glass-effect animate-fade-up" style="animation-delay: 0.1s;">
        <el-table :data="studentList" v-loading="loading" class="custom-table" style="width: 100%" empty-text="暂无绑定的学生记录">
          <el-table-column prop="userId" label="学生学号" width="200">
            <template #default="{ row }"><span class="fw-600 id-text">{{ row.userId }}</span></template>
          </el-table-column>
          <el-table-column label="真实姓名" min-width="180">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="32" class="user-avatar">{{ (row.realName || row.username).charAt(0).toUpperCase() }}</el-avatar>
                <span class="fw-600 name-text">{{ row.realName || row.username }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="系统登录账号" min-width="180">
            <template #default="{ row }"><span class="text-muted">{{ row.username }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="right" fixed="right">
            <template #default="{ row }">
              <el-popconfirm title="确定要解除与该学生的绑定吗？" confirm-button-text="确认解除" confirm-button-type="danger" @confirm="handleUnbind(row.userId)">
                <template #reference>
                  <el-button type="danger" link class="action-btn text-danger">
                    <el-icon><Connection /></el-icon> 解除绑定
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyStudents, teacherBindStudent, unbindStudentRelation } from '../api/user'
import { UserFilled, Search, Link, Connection } from '@element-plus/icons-vue'

const studentList = ref([]); const loading = ref(false); const binding = ref(false); const bindStudentId = ref('')
const getTeacherId = () => { const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}'); return userInfo.userId || userInfo.id }

const loadStudents = async () => {
  const teacherId = getTeacherId(); if (!teacherId) return
  loading.value = true
  try {
    const res = await getMyStudents(teacherId)
    if (res.code === 200) studentList.value = res.data || []
  } catch (error) { ElMessage.error('获取学生列表失败') } finally { loading.value = false }
}

const handleBind = async () => {
  if (!bindStudentId.value) return ElMessage.warning('请输入学生学号！')
  binding.value = true
  try {
    const res = await teacherBindStudent(getTeacherId(), bindStudentId.value)
    if (res.code === 200) { ElMessage.success(res.message || '绑定成功！'); bindStudentId.value = ''; loadStudents() }
    else ElMessage.error(res.message || '绑定失败')
  } catch (error) { console.error(error) } finally { binding.value = false }
}

const handleUnbind = async (studentId) => {
  try {
    const res = await unbindStudentRelation(getTeacherId(), studentId)
    if (res.code === 200) { ElMessage.success('解除绑定成功！'); loadStudents() }
    else ElMessage.error(res.message || '解绑失败')
  } catch (error) { console.error(error) }
}

onMounted(() => { loadStudents() })
</script>

<style scoped>
.my-students-container { position: relative; min-height: calc(100vh - 60px); background-color: #f1f5f9; padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; overflow: hidden; }
.ambient-background { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; animation: float 20s infinite alternate ease-in-out; }
.blob-1 { top: -10%; left: -5%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%); }
.blob-2 { bottom: -20%; right: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%); animation-delay: -5s; }
@keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(5%, 5%) scale(1.05); } }

.content-wrapper { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }
.animate-fade-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

.premium-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px; box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05); transition: all 0.3s; }
.glass-effect { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(16px); }

.page-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; margin-bottom: 24px; }
.header-title { display: flex; align-items: center; gap: 12px; }
.header-title h2 { margin: 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px; }
.header-title .el-icon { font-size: 26px; color: #3b82f6; padding: 8px; background: rgba(59,130,246,0.1); border-radius: 12px; }

.bind-action { display: flex; align-items: center; gap: 16px; }
:deep(.custom-input .el-input__wrapper) { background: rgba(255,255,255,0.8); border: 1px solid rgba(15,23,42,0.08); border-radius: 12px; padding: 6px 16px; box-shadow: none; transition: all 0.3s; width: 260px; }
:deep(.custom-input .el-input__wrapper:focus-within) { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
.btn-hover-glow { border-radius: 12px; height: 40px; padding: 0 24px; font-weight: 600; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3); transition: all 0.3s; }
.btn-hover-glow:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4); }

.table-card { padding: 20px; }
:deep(.custom-table) { background: transparent; --el-table-border-color: transparent; --el-table-header-bg-color: transparent; --el-table-row-hover-bg-color: rgba(241, 245, 249, 0.6); }
:deep(.custom-table th.el-table__cell) { background: transparent; color: #64748b; font-weight: 600; font-size: 14px; padding: 16px 0; border-bottom: 1px solid rgba(15,23,42,0.06); }
:deep(.custom-table td.el-table__cell) { background: transparent; border-bottom: 1px dashed rgba(15,23,42,0.06); padding: 16px 0; transition: background 0.3s; }
.fw-600 { font-weight: 600; }
.id-text { color: #475569; font-family: ui-monospace, monospace; font-size: 14px; background: rgba(15,23,42,0.04); padding: 4px 10px; border-radius: 6px; }
.user-cell { display: flex; align-items: center; gap: 12px; }
.user-avatar { background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: #fff; font-weight: 700; font-size: 14px; }
.name-text { color: #0f172a; font-size: 15px; }
.text-muted { color: #64748b; font-size: 14px; font-weight: 500; }
.action-btn { font-weight: 600; border-radius: 8px; padding: 6px 12px; transition: all 0.2s; }
.action-btn:hover { background: rgba(239,68,68,0.1); }
</style>