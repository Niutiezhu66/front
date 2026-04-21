<template>
  <div class="banner-manage-container">
    <div class="action-bar">
      <el-button type="primary" @click="showAddDialog" icon="Plus">添加轮播图</el-button>
      <el-button @click="getBannerList" icon="Refresh">刷新列表</el-button>
    </div>

    <div class="banner-list">
      <el-table :data="bannerList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="预览图" width="120">
          <template #default="scope">
            <el-image :src="normalizeImageUrl(scope.row.imageUrl)" :preview-src-list="getPreviewList(scope.row.imageUrl)" fit="cover" style="width: 80px; height: 45px; border-radius: 4px;" :preview-teleported="true" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="linkUrl" label="跳转链接" min-width="150" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isActive ? 'success' : 'danger'">{{ scope.row.isActive ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="editBanner(scope.row)" icon="Edit">编辑</el-button>
            <el-button size="small" :type="scope.row.isActive ? 'warning' : 'success'" @click="toggleBannerStatus(scope.row)" icon="Switch">{{ scope.row.isActive ? '禁用' : '启用' }}</el-button>
            <el-button size="small" type="danger" @click="deleteBanner(scope.row)" icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
      <el-form :model="bannerForm" :rules="bannerRules" ref="bannerFormRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="bannerForm.title" placeholder="请输入轮播图标题" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="bannerForm.description" type="textarea" :rows="3" placeholder="请输入轮播图描述" />
        </el-form-item>
        <el-form-item label="图片" prop="imageUrl">
          <el-radio-group v-model="imageInputType" @change="handleImageInputTypeChange" style="margin-bottom: 10px;">
            <el-radio label="upload">上传图片到服务器</el-radio>
            <el-radio label="url">输入外部图片URL</el-radio>
          </el-radio-group>
          <div v-if="imageInputType === 'upload'">
            <el-upload ref="uploadRef" :action="uploadAction" :headers="uploadHeaders" :show-file-list="false" :on-success="handleUploadSuccess" :on-error="handleUploadError" :before-upload="beforeUpload" accept="image/*" :loading="uploadLoading">
              <el-button type="primary" :loading="uploadLoading"><el-icon><Upload /></el-icon>{{ uploadLoading ? '上传中...' : '选择图片文件' }}</el-button>
            </el-upload>
            <div class="upload-tips"><p>支持 JPG、PNG、GIF 格式，文件大小不超过 5MB</p></div>
          </div>
          <div v-if="imageInputType === 'url'">
            <el-input v-model="bannerForm.imageUrl" placeholder="请输入图片URL地址（支持外部网站图片）" style="margin-bottom: 10px;" />
            <div class="url-tips"><p>可以输入其他网站的图片地址，例如：https://example.com/image.jpg</p></div>
          </div>
          <div v-if="bannerForm.imageUrl" class="preview-image">
            <el-image :src="normalizeImageUrl(bannerForm.imageUrl)" fit="cover" style="width: 200px; height: 112px; border-radius: 4px; margin-top: 10px;" :preview-src-list="getPreviewList(bannerForm.imageUrl)" :preview-teleported="true" />
            <div style="margin-top: 5px; font-size: 12px; color: #999;">点击图片可预览</div>
          </div>
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="bannerForm.linkUrl" placeholder="请输入跳转链接（可选）" />
          <div class="link-tips">
            <p><strong>支持的链接格式：</strong></p>
            <p>• 外部网站：https://www.baidu.com</p>
            <p>• 内部页面：/practice 或 /exam/list</p>
            <p>• 留空则点击无跳转效果</p>
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="bannerForm.sortOrder" :min="0" :max="999" placeholder="数字越小排序越靠前" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="bannerForm.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBanner" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Plus, Refresh, Edit, Switch, Delete } from '@element-plus/icons-vue'
import request from '../utils/request'

const loading = ref(false)
const bannerList = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const bannerFormRef = ref()
const imageInputType = ref('upload')
const uploadRef = ref()
const uploadLoading = ref(false)

const uploadAction = ref('/api/banners/upload-image')
const uploadHeaders = ref({})

const bannerForm = reactive({ id: null, title: '', description: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true })

const bannerRules = {
  title: [{ required: true, message: '请输入轮播图标题', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请选择图片或输入图片URL', trigger: 'blur' }]
}

const normalizeImageUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\/(localhost|127\.0\.0\.1):9000\//i.test(url)) {
    const minioPrefix = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1):9000\//i, '')
    return `/api/files/minio/${encodeURI(minioPrefix)}`
  }
  if (/^https?:\/\//i.test(url)) {
    return encodeURI(url)
  }
  return url
}

const getPreviewList = (url) => {
  const normalizedUrl = normalizeImageUrl(url)
  return normalizedUrl ? [normalizedUrl] : []
}

const getBannerList = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/banners/list')
    bannerList.value = res.data || []
  } catch (error) {
    ElMessage.error('获取轮播图列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => { resetForm(); dialogTitle.value = '添加轮播图'; dialogVisible.value = true; }
const editBanner = (banner) => { Object.assign(bannerForm, banner); dialogTitle.value = '编辑轮播图'; dialogVisible.value = true; }

const resetForm = () => {
  Object.assign(bannerForm, { id: null, title: '', description: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true })
  imageInputType.value = 'upload'
  if (bannerFormRef.value) bannerFormRef.value.resetFields()
}

const submitBanner = async () => {
  if (!bannerFormRef.value) return
  try {
    await bannerFormRef.value.validate()
    submitLoading.value = true
    const isEdit = bannerForm.id !== null
    const url = isEdit ? '/api/banners/update' : '/api/banners/add'
    const method = isEdit ? 'put' : 'post'
    await request[method](url, bannerForm)
    ElMessage.success(isEdit ? '轮播图更新成功' : '轮播图添加成功')
    dialogVisible.value = false
    await getBannerList()
  } catch (error) {
    ElMessage.error(error?.message || '操作失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

const toggleBannerStatus = async (banner) => {
  try {
    const newStatus = !banner.isActive
    await request.put(`/api/banners/toggle/${banner.id}?isActive=${newStatus}`)
    banner.isActive = newStatus
    ElMessage.success(`轮播图已${newStatus ? '启用' : '禁用'}`)
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const deleteBanner = async (banner) => {
  try {
    await ElMessageBox.confirm(`确定要删除轮播图"${banner.title}"吗？`, '确认删除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await request.delete(`/api/banners/delete/${banner.id}`)
    ElMessage.success('删除成功')
    await getBannerList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleImageInputTypeChange = () => { bannerForm.imageUrl = '' }

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB！')
    return false
  }
  uploadLoading.value = true
  return true
}

const handleUploadSuccess = (response, file) => {
  uploadLoading.value = false
  if (response.code === 200) {
    bannerForm.imageUrl = response.data
    ElMessage.success('图片上传成功！')
  } else {
    ElMessage.error(response.message || '图片上传失败！')
  }
}

const handleUploadError = (error, file) => {
  uploadLoading.value = false
  ElMessage.error(error?.message || '图片上传失败，请重试！')
}

onMounted(() => getBannerList())

</script>

<style scoped>
/* 修复了 transform 导致的弹窗遮罩高度被限制问题，仅保留透明度渐变 */
.banner-manage-container {
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
  overflow: hidden; /* 修复直角溢出 */
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.action-bar:hover {
  box-shadow: 0 12px 40px rgba(31, 38, 135, 0.08);
}

/* 主体列表卡片 */
.banner-list {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.05);
  padding: 20px 24px;
  overflow: hidden; /* 核心修复：防止内部表格直角溢出破坏外层圆角 */
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* === Element Plus 组件深度美化 === */
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

:deep(.el-image) {
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
  overflow: hidden;
}
:deep(.el-image:hover) {
  transform: scale(1.05);
}

:deep(.el-tag) {
  border-radius: 8px;
  font-weight: 600;
  border: none;
  padding: 0 12px;
}

/* 表格通透化与圆角适配 */
:deep(.el-table) {
  background: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  border-radius: 12px;
}
:deep(.el-table th.el-table__cell) {
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

/* === 表单与弹窗 === */
:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
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

/* 完美解决弹窗高度限制与内部直角溢出 */
:deep(.el-overlay) {
  backdrop-filter: blur(8px);
  background-color: rgba(15, 23, 42, 0.4) !important;
}
:deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(24px) !important;
  border-radius: 24px !important;
  overflow: hidden !important; /* 核心修复：切掉头部底部死角 */
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

/* 内部小卡片细节 */
.preview-image {
  margin-top: 12px; text-align: center; padding: 16px;
  background: rgba(255,255,255,0.4); border-radius: 16px;
  border: 1px dashed rgba(64,158,255,0.4); transition: all 0.3s;
  overflow: hidden;
}
.upload-tips, .url-tips { margin-top: 8px; font-size: 12px; color: #64748b; font-weight: 500; }
.link-tips {
  margin-top: 12px; font-size: 13px; color: #334155; line-height: 1.6;
  background: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px; padding: 12px 16px; overflow: hidden;
}
.link-tips p { margin: 0 0 4px 0; }
.link-tips p:last-child { margin-bottom: 0; }
</style>