<template>
    <div class="my-students-container">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>👩‍🏫 我的学生管理</span>
            <div class="bind-action">
              <el-input 
                v-model="bindStudentId" 
                placeholder="请输入学生学号" 
                style="width: 200px; margin-right: 10px;"
                clearable
              />
              <el-button type="primary" @click="handleBind" :loading="binding">
                绑定学生
              </el-button>
            </div>
          </div>
        </template>
  
        <el-table :data="studentList" v-loading="loading" stripe style="width: 100%">
          <el-table-column prop="userId" label="学号" width="150" />
          <el-table-column prop="realName" label="姓名" width="150">
            <template #default="{ row }">
              {{ row.realName || row.username }}
            </template>
          </el-table-column>
          <el-table-column prop="username" label="系统账号" />
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-popconfirm 
                title="确定要解除与该学生的绑定吗？" 
                @confirm="handleUnbind(row.userId)"
              >
                <template #reference>
                  <el-button type="danger" link>解除绑定</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { getMyStudents, teacherBindStudent, unbindStudentRelation } from '../api/user'
  
  const studentList = ref([])
  const loading = ref(false)
  const binding = ref(false)
  const bindStudentId = ref('')
  
  // 获取当前登录的教师ID
  const getTeacherId = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return userInfo.userId
  }
  
  // 加载学生列表
  const loadStudents = async () => {
    const teacherId = getTeacherId()
    if (!teacherId) return
    
    loading.value = true
    try {
      const res = await getMyStudents(teacherId)
      if (res.code === 200) {
        studentList.value = res.data || []
      }
    } catch (error) {
      ElMessage.error('获取学生列表失败')
    } finally {
      loading.value = false
    }
  }
  
  // 绑定学生
  const handleBind = async () => {
    if (!bindStudentId.value) {
      ElMessage.warning('请输入学生学号！')
      return
    }
    
    binding.value = true
    try {
      const res = await teacherBindStudent(getTeacherId(), bindStudentId.value)
      if (res.code === 200) {
        ElMessage.success(res.message || '绑定成功！')
        bindStudentId.value = ''
        loadStudents() // 刷新列表
      } else {
        ElMessage.error(res.message || '绑定失败')
      }
    } catch (error) {
      console.error(error)
    } finally {
      binding.value = false
    }
  }
  
  // 解除绑定
  const handleUnbind = async (studentId) => {
    try {
      const res = await unbindStudentRelation(getTeacherId(), studentId)
      if (res.code === 200) {
        ElMessage.success('解除绑定成功！')
        loadStudents() // 刷新列表
      } else {
        ElMessage.error(res.message || '解绑失败')
      }
    } catch (error) {
      console.error(error)
    }
  }
  
  onMounted(() => {
    loadStudents()
  })
  </script>
  
  <style scoped>
  .my-students-container {
    padding: 20px;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
  .bind-action {
    display: flex;
    align-items: center;
  }
  </style>