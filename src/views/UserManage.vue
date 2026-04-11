<template>
  <div class="user-manage-container">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>📁 师生数据管理</span>
            </div>
          </template>
          <div style="text-align: center; padding: 30px 0;">
            <el-button type="primary" size="large" @click="showBatchImportDialog">
              <el-icon>
                <UploadFilled />
              </el-icon> 批量导入师生 (Excel)
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>🔗 修改师生关联关系</span>
            </div>
          </template>
          <el-form label-width="120px" class="relation-form">
            <el-form-item label="教师系统ID">
              <el-input v-model="relationForm.teacherId" placeholder="请输入教师在数据库中的ID" />
            </el-form-item>
            <el-form-item label="学生学号">
              <el-input v-model="relationForm.studentUserId" placeholder="请输入学生学号" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleAdminBind" :loading="btnLoading">强制绑定</el-button>
              <el-button type="danger" @click="handleAdminUnbind" :loading="btnLoading">强制解绑</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="batchImportDialogVisible" title="批量导入师生" width="800px" :before-close="handleDialogClose"
      destroy-on-close>
      <el-steps :active="batchImportStep" finish-status="success" align-center style="margin-bottom: 30px;">
        <el-step title="上传文件" />
        <el-step title="数据预览" />
        <el-step title="导入结果" />
      </el-steps>

      <div v-show="batchImportStep === 0" class="step-content">
        <div class="template-download">
          <el-button type="primary" link @click="downloadTemplate">
            <el-icon>
              <Download />
            </el-icon> 点击下载Excel导入模板
          </el-button>
        </div>

        <el-upload ref="uploadRef" class="upload-demo" drag action="#" :auto-upload="false"
          :on-change="handleFileChange" :before-upload="beforeUpload" accept=".xlsx, .xls" :limit="1">
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">将 Excel 文件拖到此处，或 <em>点击选择文件</em></div>
        </el-upload>

        <div class="dialog-footer">
          <el-button @click="batchImportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="previewExcelData" :loading="previewLoading">下一步：数据预览</el-button>
        </div>
      </div>

      <div v-show="batchImportStep === 1" class="step-content">
        <el-alert title="请确认以下解析出的数据是否准确" type="warning" show-icon style="margin-bottom: 15px;" />

        <el-table :data="previewData" border height="400">
          <el-table-column prop="username" label="用户名(账号)" width="150" />
          <el-table-column prop="password" label="密码" width="120" />
          <el-table-column prop="realName" label="真实姓名" width="120" />

          <el-table-column prop="role" label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="row.role == '1' ? 'success' : 'info'">
                {{ row.role == '1' ? '老师' : (row.role == '2' ? '学生' : row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="userId" label="学号/工号" width="150" />
          <el-table-column prop="teacherId" label="所属教师工号" min-width="150" />
        </el-table>

        <div class="dialog-footer">
          <el-button @click="batchImportStep = 0">上一步</el-button>
          <el-button type="primary" @click="confirmImport" :loading="importLoading">确认导入</el-button>
        </div>
      </div>

      <div v-show="batchImportStep === 2" class="step-content">
        <el-result :icon="importResult.success ? 'success' : 'error'" :title="importResult.title"
          :sub-title="importResult.message">
          <template #extra>
            <el-button type="primary" @click="batchImportDialogVisible = false">关闭</el-button>
          </template>
        </el-result>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Download } from '@element-plus/icons-vue'
import { previewImportUsers, confirmImportUsers, adminBindStudent, unbindStudentRelation } from '../api/user'
import request from '../utils/request'

const btnLoading = ref(false)
const relationForm = reactive({
  teacherId: '',
  studentUserId: '',
  studentDbId: ''
})

// === 批量导入相关状态 ===
const batchImportDialogVisible = ref(false)
const batchImportStep = ref(0)
const uploadRef = ref(null)
const selectedFile = ref(null)
const previewData = ref([])

const previewLoading = ref(false)
const importLoading = ref(false)
const importResult = reactive({
  success: false,
  title: '',
  message: ''
})

// 打开弹窗
const showBatchImportDialog = () => {
  batchImportDialogVisible.value = true
  resetBatchImport()
}

// 重置状态
const resetBatchImport = () => {
  batchImportStep.value = 0
  selectedFile.value = null
  previewData.value = []
  importResult.success = false
  importResult.title = ''
  importResult.message = ''
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 对话框关闭拦截
const handleDialogClose = (done) => {
  if (batchImportStep.value === 1) {
    ElMessageBox.confirm('数据尚未导入，确认关闭吗？', '提示', { type: 'warning' })
      .then(() => done())
      .catch(() => { })
  } else {
    done()
  }
}
// 下载 Excel 模板 
const downloadTemplate = async () => {
  try {
    // 使用原生 fetch 绕过 axios 拦截器
    const response = await fetch('/api/user/batch/template')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '用户导入模板.xlsx' // 设置下载的文件名
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('下载模板出错:', error)
    ElMessage.error('模板下载失败')
  }
}

// 文件选择
const handleFileChange = (file) => {
  selectedFile.value = file
}

// 上传校验
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件！')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB！')
    return false
  }
  return false // 阻止默认上传，我们自己控制接口
}

// 步骤1：解析并预览数据
const previewExcelData = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择 Excel 文件')
    return
  }
  previewLoading.value = true
  try {
    const res = await previewImportUsers(selectedFile.value.raw)
    if (res.code === 200) {
      previewData.value = res.data
      batchImportStep.value = 1
      ElMessage.success(`解析成功，共找到 ${res.data.length} 条有效数据`)
    } else {
      ElMessage.error(res.message || '文件解析失败')
    }
  } catch (error) {
    ElMessage.error('解析过程中发生异常')
  } finally {
    previewLoading.value = false
  }
}

// 步骤2：确认导入
// const confirmImport = async () => {
//   importLoading.value = true
//   try {
//     const res = await confirmImportUsers(previewData.value)
//     if (res.code === 200) {
//       importResult.success = true
//       importResult.title = '导入成功！'
//       importResult.message = res.message || '数据已成功保存到数据库'
//       batchImportStep.value = 2
//     } else {
//       importResult.success = false
//       importResult.title = '导入失败'
//       importResult.message = res.message || '部分数据可能存在异常'
//       batchImportStep.value = 2
//     }
//   } catch (error) {
//     importResult.success = false
//     importResult.title = '导入出错'
//     importResult.message = '网络或服务器异常'
//     batchImportStep.value = 2
//   } finally {
//     importLoading.value = false
//   }
// }

// 步骤2：确认导入
const confirmImport = async () => {
  importLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value.raw)

    const res = await request({
      url: '/api/user/batch/import-users',
      method: 'post',
      data: formData,
      // ⚠️ 【关键补救】：必须加上这行，强制覆盖 request.js 默认的 application/json
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (res.code === 200) {
      importResult.success = true
      importResult.title = '导入成功！'
      importResult.message = res.data || res.message || '数据已成功保存到数据库'
      batchImportStep.value = 2
    } else {
      importResult.success = false
      importResult.title = '导入失败'
      importResult.message = res.message || '部分数据可能存在异常'
      batchImportStep.value = 2
    }
  } catch (error) {
    console.error('导入接口报错详情:', error)
    
    importResult.success = false
    importResult.title = '导入出错'
    importResult.message = error.response?.data?.message || error.message || '网络或服务器异常'
    batchImportStep.value = 2
  } finally {
    importLoading.value = false
  }
}


// === 强制绑定/解绑逻辑 ===
const handleAdminBind = async () => {
  if (!relationForm.teacherId || !relationForm.studentUserId) {
    ElMessage.warning('请填写完整的教师ID和学生学号')
    return
  }
  btnLoading.value = true
  try {
    const res = await adminBindStudent(relationForm.teacherId, relationForm.studentUserId)
    if (res.code === 200) ElMessage.success('强制绑定成功')
    else ElMessage.error(res.message || '绑定失败')
  } catch (e) { } finally { btnLoading.value = false }
}

const handleAdminUnbind = async () => {
  if (!relationForm.teacherId || !relationForm.studentUserId) {
    ElMessage.warning('解绑暂需填入学生系统主键ID至"学生学号"输入框中')
    return
  }
  btnLoading.value = true
  try {
    const res = await unbindStudentRelation(relationForm.teacherId, relationForm.studentUserId)
    if (res.code === 200) ElMessage.success('强制解绑成功')
    else ElMessage.error(res.message || '解绑失败')
  } catch (e) { } finally { btnLoading.value = false }
}
</script>

<style scoped>
.user-manage-container {
  padding: 20px;
}

.card-header {
  font-weight: bold;
}

.relation-form {
  margin-top: 20px;
}

.step-content {
  margin-top: 30px;
  text-align: center;
}

.template-download {
  text-align: right;
  margin-bottom: 10px;
}

.dialog-footer {
  margin-top: 20px;
  text-align: right;
}
</style>