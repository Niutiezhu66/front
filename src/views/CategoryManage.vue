<template>
  <div class="category-manage-container">
    <div class="tips-section">
      <el-alert
        title="分类管理规范"
        type="info"
        description="管理考试题目分类，支持两级架构。删除父级分类前，请务必确保其下无挂载的子分类及相关题目数据。"
        show-icon
        :closable="false"
        class="custom-alert"
      />
    </div>

    <div class="table-wrapper">
      <el-table 
        :data="categoryTree"
        v-loading="loading"
        row-key="id"
        class="custom-table"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :header-cell-style="{ background: '#fafafa', color: '#1d2129', fontWeight: 500 }"
      >
        <el-table-column prop="id" label="ID" width="100" />
        
        <el-table-column prop="name" label="分类名称" min-width="220">
          <template #default="{ row }">
            <span class="category-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="层级" width="120">
          <template #default="{ row }">
            <el-tag :type="row.parentId === 0 ? 'primary' : 'info'" effect="light" size="small" round>
              {{ row.parentId === 0 ? '一级分类' : '二级分类' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="sort" label="排序权重" width="120" />
        
        <el-table-column prop="description" label="分类描述" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-secondary">{{ row.description || '--' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="createTime" label="创建时间" width="180" />
        
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-group">
              <el-button link type="primary" @click="viewCategory(row)">查看</el-button>
              <el-divider direction="vertical" />
              
              <el-button link type="primary" @click="editCategory(row)">编辑</el-button>
              
              <template v-if="row.parentId === 0 && (row.name === '选择题' || row.name === '判断题' || row.name === '简答题')">
                <el-divider direction="vertical" />
                <el-button link type="success" @click="addSubCategory(row)">添加子类</el-button>
              </template>
              
              <el-divider direction="vertical" />
              <el-button link type="danger" @click="deleteCategory(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="480px" 
      @close="closeDialog"
      destroy-on-close
      class="custom-dialog"
    >
      <el-form :model="categoryForm" :rules="formRules" ref="categoryFormRef" label-width="90px" class="clean-form">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" clearable />
        </el-form-item>
        
        <el-form-item v-if="isAddSubCategory" label="所属父级" prop="parentId">
          <el-input :model-value="getParentCategoryName(categoryForm.parentId)" disabled class="is-disabled-light" />
        </el-form-item>
        
        <el-form-item label="排序权重" prop="sort">
          <el-input-number 
            v-model="categoryForm.sort" 
            :min="0" 
            :max="999" 
            controls-position="right"
            class="full-width-number"
          />
          <div class="form-tip">数字越小排序越靠前</div>
        </el-form-item>
        
        <el-form-item label="分类描述" prop="description">
          <el-input 
            v-model="categoryForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="选填，请输入该分类的简要描述" 
            resize="none"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="saveCategory">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="分类详情" v-model="viewDialogVisible" width="540px" class="custom-dialog">
      <el-descriptions :column="1" border class="custom-descriptions" v-if="viewCategoryData">
        <el-descriptions-item label="分类名称">
          <span class="fw-500">{{ viewCategoryData.name }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="分类层级">
          <el-tag :type="viewCategoryData.level === 1 ? 'primary' : 'info'" size="small" effect="light">
            {{ viewCategoryData.level === 1 ? '一级分类' : '二级分类' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属父类" v-if="viewCategoryData.level === 2">
          {{ getParentCategoryName(viewCategoryData.parentId) }}
        </el-descriptions-item>
        <el-descriptions-item label="排序权重">
          {{ viewCategoryData.sort }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ viewCategoryData.createTime || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="分类描述">
          <span class="text-secondary">{{ viewCategoryData.description || '暂无描述' }}</span>
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="viewDialogVisible = false">我知道了</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const categoryTree = ref([])
const allCategories = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const categoryFormRef = ref(null)
const viewCategoryData = ref(null)
const isAddSubCategory = ref(false)

const categoryForm = reactive({ id: null, name: '', parentId: null, level: 1, sort: 0, description: '' })

const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' }, 
    { min: 2, max: 50, message: '长度需在 2 到 50 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请设置排序', trigger: 'blur' }, 
    { type: 'number', min: 0, max: 999, message: '排序范围为 0-999', trigger: 'blur' }
  ]
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const response = await request.get('/api/categories/tree')
    categoryTree.value = response.data
    allCategories.value = flattenTree(response.data || [])
  } catch (error) {
    ElMessage.error('获取分类数据失败')
  } finally {
    loading.value = false
  }
}

const flattenTree = (nodes) => {
  const list = [];
  if (!nodes) return list;
  for (const node of nodes) {
    const { children, ...rest } = node;
    list.push(rest);
    if (children && children.length > 0) {
      list.push(...flattenTree(children));
    }
  }
  return list;
}

const getParentCategoryName = (parentId) => {
  if (!parentId) return '--'
  const parent = allCategories.value.find(cat => cat.id === parentId)
  return parent ? parent.name : '--'
}

const addSubCategory = (parentCategory) => {
  dialogTitle.value = `添加子类至「${parentCategory.name}」`
  isEdit.value = false
  isAddSubCategory.value = true
  resetForm()
  categoryForm.parentId = parentCategory.id
  categoryForm.level = 2
  dialogVisible.value = true
}

const editCategory = (category) => {
  dialogTitle.value = '编辑分类配置'
  isEdit.value = true
  isAddSubCategory.value = category.parentId !== 0
  Object.assign(categoryForm, category)
  dialogVisible.value = true
}

const viewCategory = (category) => {
  viewCategoryData.value = { ...category }
  viewDialogVisible.value = true
}

const deleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(
      `删除后该分类将无法恢复，确认删除分类「${category.name}」吗？`, 
      '高危操作确认', 
      { 
        confirmButtonText: '确认删除', 
        cancelButtonText: '暂不删除', 
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    await request.delete(`/api/categories/${category.id}`)
    ElMessage.success('分类已成功移除')
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除操作失败')
  }
}

const saveCategory = async () => {
  try {
    await categoryFormRef.value.validate()
    categoryForm.level = categoryForm.parentId ? 2 : 1
    const url = isEdit.value ? `/api/categories` : '/api/categories'
    const method = isEdit.value ? 'put' : 'post'
    await request[method](url, categoryForm)
    ElMessage.success(isEdit.value ? '配置更新成功' : '新分类创建成功')
    closeDialog()
    fetchCategories()
  } catch (error) {
    // 校验失败或接口报错
  }
}

const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(categoryForm, { id: null, name: '', parentId: null, level: 1, sort: 0, description: '' })
  if (categoryFormRef.value) categoryFormRef.value.clearValidate()
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.category-manage-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px); /* 假设你有60px的header */
  box-sizing: border-box;
}

/* 提示区样式弱化，更像原生系统一部分 */
.tips-section {
  margin-bottom: 16px;
}
.custom-alert {
  border: 1px solid #e1f3d8;
  background-color: #f0f9eb;
  color: #67c23a;
  border-radius: 6px;
}
:deep(.custom-alert .el-alert__title) {
  font-weight: 600;
  color: #333;
}
:deep(.custom-alert .el-alert__description) {
  color: #666;
  margin-top: 4px;
}

/* 表格容器白底卡片化 */
.table-wrapper {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  border: 1px solid #ebeef5;
}

/* 表格内文字及排版规范 */
.category-name {
  font-weight: 500;
  color: #1d2129;
}
.text-secondary {
  color: #86909c;
  font-size: 13px;
}

/* 操作按钮组，使用分割线代替实心背景 */
.action-group {
  display: flex;
  align-items: center;
}
:deep(.action-group .el-button) {
  padding: 0 4px;
  height: auto;
  font-weight: 400;
}
:deep(.action-group .el-divider--vertical) {
  margin: 0 12px;
  border-color: #e5e6eb;
}

/* 弹窗通用样式 */
:deep(.custom-dialog .el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px 16px;
}
:deep(.custom-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}
:deep(.custom-dialog .el-dialog__body) {
  padding: 24px;
}
:deep(.custom-dialog .el-dialog__footer) {
  border-top: 1px solid #f0f0f0;
  padding: 16px 24px;
}

/* 表单定制化 */
.clean-form .full-width-number {
  width: 100%;
}
.form-tip {
  font-size: 12px;
  color: #86909c;
  line-height: 1.2;
  margin-top: 6px;
  width: 100%;
}
/* 优化被禁用的输入框视觉效果，避免太灰导致看不清 */
:deep(.is-disabled-light .el-input__inner) {
  color: #4e5969;
  -webkit-text-fill-color: #4e5969;
}

/* 描述列表样式定制 */
.fw-500 {
  font-weight: 500;
  color: #1d2129;
}
:deep(.custom-descriptions .el-descriptions__label) {
  width: 100px;
  color: #4e5969;
  background-color: #fafafa !important;
}
:deep(.custom-descriptions .el-descriptions__content) {
  color: #1d2129;
}
</style>