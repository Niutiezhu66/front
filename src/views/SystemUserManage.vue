<template>
    <div class="system-user-container">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>👥 用户账号管理</span>
          </div>
        </template>
  
        <div class="header-actions">
          <div>
            <el-input 
              v-model="userQuery.keyword" 
              placeholder="搜索账号/姓名/工号" 
              style="width: 250px; margin-right: 10px;" 
              clearable 
              @clear="fetchUsers" 
              @keyup.enter="fetchUsers" 
            />
            <el-select v-model="userQuery.role" placeholder="全部角色" style="width: 150px; margin-right: 10px;" clearable @change="fetchUsers">
              <el-option label="管理员" value="0" />
              <el-option label="教师" value="1" />
              <el-option label="学生" value="2" />
            </el-select>
            <el-button type="primary" @click="fetchUsers">搜索</el-button>
          </div>
          <div>
            <el-button type="success" @click="openUserDialog('add')">
              <el-icon><Plus /></el-icon> 新增用户
            </el-button>
          </div>
        </div>
  
        <el-table :data="userTableData" border style="width: 100%; margin-top: 20px;" v-loading="userLoading">
          <el-table-column prop="id" label="系统ID" width="80" align="center" />
          <el-table-column prop="username" label="用户名(账号)" align="center" />
          <el-table-column prop="realName" label="真实姓名" align="center">
            <template #default="{ row }">{{ row.realName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="userId" label="工号/学号" align="center" />
          <el-table-column prop="role" label="角色" align="center" width="100">
            <template #default="{ row }">
              <el-tag :type="row.role == '0' ? 'danger' : (row.role == '1' ? 'success' : 'info')">
                {{ row.role == '0' ? '管理员' : (row.role == '1' ? '教师' : '学生') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="注册时间" align="center" width="180">
            <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="180" fixed="right">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="openUserDialog('edit', scope.row)">编辑</el-button>
              <el-popconfirm title="确定删除该用户吗？此操作不可逆！" @confirm="handleDeleteUser(scope.row.id)">
                <template #reference>
                  <el-button type="danger" link size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
  
        <div style="margin-top: 20px; text-align: right;">
          <el-pagination 
            v-model:current-page="userQuery.current" 
            v-model:page-size="userQuery.size"
            :page-sizes="[10, 20, 50]" 
            layout="total, sizes, prev, pager, next, jumper" 
            :total="userTotal"
            @size-change="fetchUsers" 
            @current-change="fetchUsers" 
          />
        </div>
      </el-card>
  
      <el-dialog v-model="userDialogVisible" :title="dialogType === 'add' ? '新增用户' : '编辑用户'" width="500px" destroy-on-close>
        <el-form :model="userForm" label-width="100px" ref="userFormRef">
          <el-form-item label="用户名" required>
            <el-input v-model="userForm.username" :disabled="dialogType === 'edit'" placeholder="请输入登录账号" />
          </el-form-item>
          <el-form-item label="密码" :required="dialogType === 'add'">
            <el-input v-model="userForm.password" placeholder="为空则不修改" show-password />
          </el-form-item>
          <el-form-item label="真实姓名">
            <el-input v-model="userForm.realName" placeholder="请输入真实姓名" />
          </el-form-item>
          <el-form-item label="工号/学号" required>
            <el-input v-model="userForm.userId" placeholder="请输入数字ID" />
          </el-form-item>
          <el-form-item label="角色" required>
            <el-radio-group v-model="userForm.role">
              <el-radio label="0">管理员</el-radio>
              <el-radio label="1">教师</el-radio>
              <el-radio label="2">学生</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="userDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitUserForm" :loading="submitLoading">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import { getUserPage, addUser, updateUser, deleteUser } from '../api/user'
  
  const userLoading = ref(false)
  const userTableData = ref([])
  const userTotal = ref(0)
  const userQuery = reactive({
    current: 1,
    size: 10,
    keyword: '',
    role: ''
  })
  
  // 获取用户列表
  const fetchUsers = async () => {
    userLoading.value = true
    try {
      const res = await getUserPage(userQuery)
      if (res.code === 200) {
        userTableData.value = res.data.records || []
        userTotal.value = res.data.total || 0
      }
    } catch (error) {
      ElMessage.error(error.message || '获取用户列表失败')
    } finally {
      userLoading.value = false
    }
  }
  
  // 增改弹窗逻辑
  const userDialogVisible = ref(false)
  const dialogType = ref('add') 
  const submitLoading = ref(false)
  const userFormRef = ref(null)
  const userForm = reactive({
    id: null,
    username: '',
    password: '',
    realName: '',
    userId: '',
    role: '2'
  })
  
  const openUserDialog = (type, row = null) => {
    dialogType.value = type
    if (type === 'add') {
      Object.assign(userForm, { id: null, username: '', password: '', realName: '', userId: '', role: '2' })
    } else {
      Object.assign(userForm, { 
        id: row.id, 
        username: row.username, 
        password: '', 
        realName: row.realName, 
        userId: row.userId, 
        role: row.role ? String(row.role) : '2' 
      })
    }
    userDialogVisible.value = true
  }
  
  const submitUserForm = async () => {
    if (!userForm.username || !userForm.userId || !userForm.role) {
      return ElMessage.warning('请填写带星号的必填项')
    }
    submitLoading.value = true
    try {
      let res;
      if (dialogType.value === 'add') {
        res = await addUser(userForm)
      } else {
        res = await updateUser(userForm)
      }
      
      if (res.code === 200) {
        ElMessage.success(dialogType.value === 'add' ? '新增成功' : '修改成功')
        userDialogVisible.value = false
        fetchUsers()
      }
    } catch (e) {
      ElMessage.error(e.message || '操作失败')
    } finally {
      submitLoading.value = false
    }
  }
  
  const handleDeleteUser = async (id) => {
    try {
      const res = await deleteUser(id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchUsers()
      }
    } catch (e) {
      ElMessage.error(e.message || '删除失败')
    }
  }
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
  }
  
  onMounted(() => {
    fetchUsers()
  })
  </script>
  
  <style scoped>
  .system-user-container {
    padding: 20px;
  }
  .card-header {
    font-weight: bold;
  }
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .dialog-footer {
    margin-top: 20px;
    text-align: right;
  }
  </style>