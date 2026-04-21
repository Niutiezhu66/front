<template>
  <div class="paper-create-container">
    <el-page-header @back="goBack" title="返回" :content="pageTitle"></el-page-header>

    <el-tabs v-model="activeTab" class="creation-tabs">
      <!-- 手动组卷 -->
      <el-tab-pane label="手动组卷" name="manual">
        <el-form :model="manualForm" ref="manualFormRef" label-width="120px" class="form-section">
          <el-form-item label="试卷名称" required>
            <el-input v-model="manualForm.name" placeholder="请输入试卷名称"></el-input>
          </el-form-item>
          <el-form-item label="考试时长(分钟)" required>
            <el-input-number v-model="manualForm.duration" :min="1" controls-position="right"></el-input-number>
          </el-form-item>
          <el-form-item label="试卷描述">
            <el-input type="textarea" v-model="manualForm.description" placeholder="请输入试卷描述"></el-input>
          </el-form-item>
        </el-form>

        <div class="question-selection">
          <h3>选择题目</h3>
          
          <!-- 题目筛选区域 -->
          <div class="filter-section">
            <el-row :gutter="20">
              <el-col :span="6">
                <!-- 第一个下拉框：选择主类型 -->
                <el-select v-model="selectedType" placeholder="请选择题目类型" clearable @change="handleTypeChange">
                  <el-option label="选择题" value="CHOICE"></el-option>
                  <el-option label="判断题" value="JUDGE"></el-option>
                  <el-option label="简答题" value="TEXT"></el-option>
                </el-select>
              </el-col>
              <el-col :span="6">
                <!-- 第二个下拉框：根据主类型动态加载子分类 -->
                <el-select 
                  v-model="selectedCategory" 
                  placeholder="请选择题目分类" 
                  clearable 
                  @change="handleCategoryChange" 
                  :disabled="!selectedType"
                >
                  <el-option 
                    v-for="category in subCategories" 
                    :key="category.id" 
                    :label="category.name" 
                    :value="category.id"
                  ></el-option>
                </el-select>
              </el-col>
              <el-col :span="4">
                <!-- 第三个下拉框：选择难度 -->
                <el-select v-model="selectedDifficulty" placeholder="题目难度" clearable @change="handleDifficultyChange">
                  <el-option label="简单" value="EASY"></el-option>
                  <el-option label="中等" value="MEDIUM"></el-option>
                  <el-option label="困难" value="HARD"></el-option>
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-button type="primary" @click="handleSearch" icon="Search">搜索</el-button>
                <el-button @click="resetFilters" icon="Refresh">重置</el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 题目列表 -->
          <div class="question-table-container">
            <el-table 
              :data="filteredQuestions" 
              @selection-change="handleSelectionChange" 
              row-key="id" 
              ref="questionTable"
              max-height="500"
              stripe
              v-loading="loading"
              element-loading-text="正在加载题目..."
            >
              <el-table-column type="selection" width="55" :reserve-selection="true"></el-table-column>
              <el-table-column prop="id" label="ID" width="80"></el-table-column>
              <el-table-column prop="title" label="题干" min-width="300" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="question-title">{{ row.title }}</div>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="题目类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="getQuestionTypeTag(row.type)" size="small">
                    {{ getQuestionTypeText(row.type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="difficulty" label="题目难度" width="100">
                <template #default="{ row }">
                  <el-tag :type="getDifficultyType(row.difficulty)" size="small">
                    {{ getDifficultyText(row.difficulty) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="category" label="所属分类" width="120">
                <template #default="{ row }">
                  <span>{{ getCategoryName(row.categoryId) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="分数" width="120">
                <template #default="{ row }">
                  <el-input-number 
                    v-model="questionScores[row.id]" 
                    :min="1" 
                    :max="100" 
                    size="small" 
                    controls-position="right"
                    style="width: 80px"
                  ></el-input-number>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 空状态 -->
            <div v-if="!loading && filteredQuestions.length === 0" class="empty-state">
              <el-empty description="暂无符合条件的题目" />
            </div>
          </div>
        </div>

        <div class="summary-section">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="summary-item">
                <span class="label">已选题目：</span>
                <span class="value">{{ selectedQuestions.length }} 题</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="summary-item">
                <span class="label">试卷总分：</span>
                <span class="value">{{ totalScore }} 分</span>
              </div>
            </el-col>
            <el-col :span="8">
              <el-button 
                type="primary" 
                @click="handleManualSubmit" 
                :disabled="selectedQuestions.length === 0" 
                size="large"
              >
                {{ isEditMode ? '更新试卷' : '创建试卷' }}
              </el-button>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- AI智能组卷 -->
      <el-tab-pane label="AI智能组卷" name="ai">
        <el-form :model="aiForm" ref="aiFormRef" label-width="120px" class="ai-form">
          
          <el-form-item label="试卷名称" required>
            <el-input v-model="aiForm.name" placeholder="请输入试卷名称"></el-input>
          </el-form-item>
          <el-form-item label="考试时长(分钟)" required>
            <el-input-number v-model="aiForm.duration" :min="1" controls-position="right"></el-input-number>
          </el-form-item>
          <el-form-item label="试卷描述">
            <el-input type="textarea" v-model="aiForm.description" placeholder="请输入试卷描述"></el-input>
          </el-form-item>

          <el-divider content-position="center">题目配置</el-divider>

          <!-- 动态配置区域 -->
          <div v-for="(config, index) in aiForm.configs" :key="index" class="ai-config-row">
             <el-row :gutter="15" align="middle">
                <el-col :span="3">
                  <el-tag size="large">{{ config.label }}</el-tag>
                </el-col>
                <el-col :span="9">
                   <el-select 
                      v-model="config.categoryIds" 
                      placeholder="请选择题目分类 (可多选)" 
                      multiple 
                      collapse-tags
                      collapse-tags-tooltip
                      clearable
                      style="width: 100%;"
                    >
                      <el-option 
                        v-for="category in getSubCategoriesForType(config.type)" 
                        :key="category.id" 
                        :label="category.name" 
                        :value="category.id"
                      ></el-option>
                    </el-select>
                </el-col>
                 <el-col :span="6">
                  <el-input-number v-model="config.count" :min="0" controls-position="right" style="width: 100%;">
                    <template #prepend>数量</template>
                  </el-input-number>
                </el-col>
                <el-col :span="6">
                   <el-input-number v-model="config.score" :min="0" controls-position="right" style="width: 100%;">
                     <template #prepend>分数</template>
                  </el-input-number>
                </el-col>
             </el-row>
          </div>
          
          <el-divider></el-divider>

          <div class="summary-section" style="margin-top: 0;">
             <el-row :gutter="20" align="middle">
                <el-col :span="16">
                  <div class="summary-item">
                    <span class="label">预计总分：</span>
                    <span class="value">{{ aiTotalScore }} 分</span>
                  </div>
                   <div class="summary-item" style="margin-left: 20px;">
                    <span class="label">预计总题数：</span>
                    <span class="value">{{ aiTotalCount }} 题</span>
                  </div>
                </el-col>
                <el-col :span="8">
                   <el-button type="primary" @click="handleAiSubmit" size="large">AI一键组卷</el-button>
                </el-col>
             </el-row>
          </div>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPapers, createPaper, createPaperWithAI, getPaperById } from '../api/paper.js'
import request from '../utils/request' // Using request directly for questions

const router = useRouter()
const route = useRoute()
const activeTab = ref('manual')

// 响应式变量，用于判断是创建还是编辑模式
const isEditMode = ref(false)
// 动态计算页面标题
const pageTitle = computed(() => isEditMode.value ? '编辑试卷' : '创建新试卷')
// 存储当前试卷ID
const paperId = ref(null)
const editingTeacherId = ref(null)

// 引用表格实例
const questionTable = ref(null)

// Manual Form
const manualForm = ref({ name: '', description: '', duration: 60 })
const selectedQuestions = ref([])
const questionScores = ref({})

// AI Form - 重构AI表单的数据结构
const aiForm = ref({
  name: '', // 新增：试卷名称
  description: '', // 新增：试卷描述
  duration: 60, // 新增：考试时长
  configs: [ // 新增：结构化配置
    { type: 'CHOICE', label: '选择题', categoryIds: [], count: 5, score: 5 },
    { type: 'JUDGE', label: '判断题', categoryIds: [], count: 5, score: 5 },
    { type: 'TEXT', label: '简答题', categoryIds: [], count: 2, score: 10 },
  ]
})

// AI组卷预计总分
const aiTotalScore = computed(() => {
  return aiForm.value.configs.reduce((sum, config) => {
    return sum + (config.count * config.score)
  }, 0)
})

// AI组卷预计总题数
const aiTotalCount = computed(() => {
  return aiForm.value.configs.reduce((sum, config) => {
    return sum + config.count
  }, 0)
})

// 筛选相关
const selectedType = ref('') // 主类型筛选, e.g., 'CHOICE'
const selectedCategory = ref(null) // 子分类筛选, e.g., 1, 2, 3
const selectedDifficulty = ref('') // 难度筛选, e.g., 'EASY'
const categoryTree = ref([]) // 完整的分类树
const categoryMap = ref({}) // 用于快速查找分类名称
const filteredQuestions = ref([]) // 改为响应式数据
const loading = ref(false) // 添加加载状态

const goBack = () => router.back()

// 获取所有题目，增加一个回调函数用于处理回显
const fetchAllQuestions = async (callback) => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      size: 1000, // 获取所有题目
      page: 1
    }
    // 添加筛选条件，类型要和后端一致
    if (selectedType.value) {
      params.type = selectedType.value
    }
    if (selectedCategory.value) {
      params.categoryId = selectedCategory.value
    }
    if (selectedDifficulty.value) {
      params.difficulty = selectedDifficulty.value
    }
    const res = await request.get('/api/questions/list', { params })
    filteredQuestions.value = res.data.records
    
    // 为新获取的题目设置默认分数
    filteredQuestions.value.forEach(q => {
      if (!questionScores.value[q.id]) {
        questionScores.value[q.id] = 5 // 默认分数
      }
    })

    // 如果有回调函数，则在数据加载后执行
    if (callback) {
      callback()
    }
  } catch (error) {
    ElMessage.error('获取题目列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类树
const fetchCategories = async () => {
   try {
    const res = await request.get('/api/categories/tree');
    categoryTree.value = res.data;
    
    // 构建分类映射表
    const buildCategoryMap = (cats) => {
      cats.forEach(cat => {
        categoryMap.value[cat.id] = cat.name
        if (cat.children && cat.children.length > 0) {
          buildCategoryMap(cat.children)
        }
      })
    }
    buildCategoryMap(res.data);
  } catch (error) {
    ElMessage.error('获取分类列表失败');
  }
}

// 新增：计算属性，用于获取当前主类型下的子分类
const subCategories = computed(() => {
  if (!selectedType.value || !categoryTree.value.length) {
    return []
  }
  let parentCategoryName = ''
  switch (selectedType.value) {
    case 'CHOICE':
      parentCategoryName = '选择题'
      break
    case 'JUDGE':
      parentCategoryName = '判断题'
      break
    case 'TEXT':
      parentCategoryName = '简答题'
      break
    default:
      return []
  }
  const parentCategory = categoryTree.value.find(cat => cat.name === parentCategoryName)
  return parentCategory ? parentCategory.children : []
})

// 类型选择变化
const handleTypeChange = () => {
  // 当主类型变化时，必须清空子分类的选择，因为子分类列表已改变
  selectedCategory.value = null
  fetchAllQuestions() // 重新获取题目
}

// 子分类选择变化
const handleCategoryChange = () => {
  fetchAllQuestions() // 重新获取题目
}

// 难度选择变化
const handleDifficultyChange = () => {
  fetchAllQuestions() // 重新获取题目
}

// 搜索
const handleSearch = () => {
  fetchAllQuestions() // 重新获取题目
}

// 重置筛选条件
const resetFilters = () => {
  selectedType.value = ''
  selectedCategory.value = null
  selectedDifficulty.value = ''
  fetchAllQuestions() // 重新获取题目
}

// 选择变化处理
const handleSelectionChange = (selection) => {
  selectedQuestions.value = selection
}

// 计算总分
const totalScore = computed(() => {
  return selectedQuestions.value.reduce((sum, q) => {
    return sum + (questionScores.value[q.id] || 0)
  }, 0)
})

// 获取题目类型标签样式
const getQuestionTypeTag = (type) => {
  const map = {
    'CHOICE': 'primary',
    'JUDGE': 'success',
    'TEXT': 'warning'
  }
  return map[type] || 'info'
}

// 获取题目类型中文显示
const getQuestionTypeText = (type) => {
  const map = {
    'CHOICE': '选择题',
    'JUDGE': '判断题',
    'TEXT': '简答题'
  }
  return map[type] || type
}

// 获取难度标签样式
const getDifficultyType = (difficulty) => {
  const map = {
    'EASY': 'success',
    'MEDIUM': 'warning',
    'HARD': 'danger'
  }
  return map[difficulty] || 'info'
}

// 获取难度中文显示
const getDifficultyText = (difficulty) => {
  const map = {
    'EASY': '简单',
    'MEDIUM': '中等',
    'HARD': '困难'
  }
  return map[difficulty] || difficulty
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  return categoryMap.value[categoryId] || '未知分类'
}
// 获取当前登录用户信息的辅助函数
const getCurrentUserId = () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    const userInfo = JSON.parse(userInfoStr)
    return userInfo.userId // 获取登录用户的ID
  }
  return null
}

const resolveTeacherId = () => {
  if (isEditMode.value) {
    return editingTeacherId.value
  }
  return getCurrentUserId()
}

// 手动提交
const handleManualSubmit = async () => {
  const teacherId = resolveTeacherId()
  if (!teacherId) {
    ElMessage.error(isEditMode.value ? '试卷缺少所属教师信息，暂时无法保存！' : '无法获取当前登录教师信息，请尝试重新登录！')
    return
  }

  const paperData = {
    name: manualForm.value.name,
    description: manualForm.value.description,
    duration: manualForm.value.duration,
    teacherId: teacherId, // ✨ 新增：传递教师ID给后端
    questions: {},
  }
  selectedQuestions.value.forEach(q => {
    paperData.questions[q.id] = questionScores.value[q.id]
  })

  try {
    // 根据是否为编辑模式，调用不同接口
    if (isEditMode.value) {
      await request.put(`/api/papers/${paperId.value}`, paperData)
      ElMessage.success('试卷更新成功')
    } else {
      await request.post('/api/papers', paperData)
      ElMessage.success('试卷创建成功')
    }
    router.push('/admin/paper-manage')
  } catch (error) {
    console.log(error);
    console.log("---------------");
    ElMessage.error(isEditMode.value ? error.message : '创建失败')
  }
}

// AI提交 - 更新提交逻辑
const handleAiSubmit = async () => {
  const teacherId = resolveTeacherId()
  if (!teacherId) {
    ElMessage.error(isEditMode.value ? '试卷缺少所属教师信息，暂时无法保存！' : '无法获取当前登录教师信息，请尝试重新登录！')
    return
  }

  // 过滤掉数量为0的配置项
  const rules = aiForm.value.configs
    .filter(config => config.count > 0)
    .map(config => ({
      type: config.type,
      categoryIds: config.categoryIds,
      count: config.count,
      score: config.score
    }));

  if (rules.length === 0) {
    ElMessage.warning('请至少配置一种题目的数量和分数');
    return;
  }
  
  const paperData = {
    name: aiForm.value.name,
    description: aiForm.value.description,
    duration: aiForm.value.duration,
    teacherId: teacherId, // ✨ 新增：传递教师ID给后端
    rules: rules
  };

  try {
    await request.post('/api/papers/ai', paperData)
    ElMessage.success('AI智能组卷成功，快去试卷列表查看吧！')
    router.push('/admin/paper-manage')
  } catch (error) {
    ElMessage.error('AI智能组卷失败，请检查配置或联系管理员')
  }
}
// // 手动提交
// const handleManualSubmit = async () => {
//   const paperData = {
//     name: manualForm.value.name,
//     description: manualForm.value.description,
//     duration: manualForm.value.duration,
//     questions: {},
//   }
//   selectedQuestions.value.forEach(q => {
//     paperData.questions[q.id] = questionScores.value[q.id]
//   })

//   try {
//     // 根据是否为编辑模式，调用不同接口
//     if (isEditMode.value) {
//       await request.put(`/api/papers/${paperId.value}`, paperData)
//       ElMessage.success('试卷更新成功')
//     } else {
//       await request.post('/api/papers', paperData)
//       ElMessage.success('试卷创建成功')
//     }
//     router.push('/admin/paper-manage')
//   } catch (error) {
//     console.log(error);
//     console.log("---------------");
//     ElMessage.error(isEditMode.value ? error.message : '创建失败')
//   }
// }

// // AI提交 - 更新提交逻辑
// const handleAiSubmit = async () => {
//   // 过滤掉数量为0的配置项
//   const rules = aiForm.value.configs
//     .filter(config => config.count > 0)
//     .map(config => ({
//       type: config.type,
//       categoryIds: config.categoryIds,
//       count: config.count,
//       score: config.score
//     }));

//   if (rules.length === 0) {
//     ElMessage.warning('请至少配置一种题目的数量和分数');
//     return;
//   }
  
//   const paperData = {
//     name: aiForm.value.name,
//     description: aiForm.value.description,
//     duration: aiForm.value.duration,
//     rules: rules
//   };

//   try {
//     await request.post('/api/papers/ai', paperData)
//     ElMessage.success('AI智能组卷成功，快去试卷列表查看吧！')
//     router.push('/admin/paper-manage')
//   } catch (error) {
//     ElMessage.error('AI智能组卷失败，请检查配置或联系管理员')
//   }
// }

// 为AI组卷提供指定类型的子分类
const getSubCategoriesForType = (type) => {
  if (!type || !categoryTree.value.length) return [];
  
  let parentCategoryName = '';
  switch (type) {
    case 'CHOICE': parentCategoryName = '选择题'; break;
    case 'JUDGE': parentCategoryName = '判断题'; break;
    case 'TEXT': parentCategoryName = '简答题'; break;
    default: return [];
  }
  
  const parentCategory = categoryTree.value.find(cat => cat.name === parentCategoryName);
  return parentCategory ? parentCategory.children : [];
}

// 新增：加载试卷数据用于编辑回显
const loadPaperDataForEdit = async () => {
  try {
    const res = await request.get(`/api/papers/${paperId.value}`)
    const paperData = res.data
    
    editingTeacherId.value = paperData.teacherId ?? null

    // 1. 回填表单信息，同时填充手动和AI两个表单
    manualForm.value.name = paperData.name
    manualForm.value.description = paperData.description
    manualForm.value.duration = paperData.duration || 60
    
    aiForm.value.name = paperData.name
    aiForm.value.description = paperData.description
    aiForm.value.duration = paperData.duration || 60

    // 2. 回填题目选择和分数
    if (paperData.questions && paperData.questions.length > 0) {
      const paperQuestionIds = paperData.questions.map(q => q.id);
      
      // 直接从当前已加载的题目列表 `filteredQuestions` 中筛选
      const newSelectedQuestions = filteredQuestions.value.filter(q => 
        paperQuestionIds.includes(q.id)
      );
      
      // 更新选中的题目列表
      selectedQuestions.value = newSelectedQuestions;

      // 更新分数映射表，只更新试卷中题目的分数，不覆盖其他题目的默认分
      paperData.questions.forEach(q => {
        questionScores.value[q.id] = q.paperScore 
      })

      // 3. 在DOM更新后，执行表格勾选操作
      await nextTick()
      
      if (questionTable.value && selectedQuestions.value.length > 0) {
        questionTable.value.clearSelection()
        selectedQuestions.value.forEach(row => {
          // 确保 row 是表格数据源中的有效对象
          questionTable.value.toggleRowSelection(row, true)
        })
      }
    }
  } catch (error) {
    ElMessage.error('加载试卷信息失败，请检查网络或联系管理员')
    console.error('加载试卷详情失败:', error);
  }
}

onMounted(async () => {
  // 检查路由中是否有ID
  paperId.value = route.query.id
  
  // 必须先加载分类，因为筛选框和分类显示需要
  await fetchCategories()

  // 必须先加载完所有题目，为后续编辑模式的数据匹配做准备
  await fetchAllQuestions()

  if (paperId.value) {
    // --- 编辑模式 ---
    // 进入编辑模式，设置标志位
    isEditMode.value = true
    // 加载并回显试卷数据
    await loadPaperDataForEdit()
  }
})

</script>

<style scoped>
/* ==========================================
   全局基础容器与环境光动态背景
   ========================================== */
.paper-create-container {
  min-height: calc(100vh - 72px);
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

/* 动态光晕背景效果 */
.paper-create-container::before, .paper-create-container::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.4;
  animation: float 25s infinite alternate ease-in-out;
  pointer-events: none;
  z-index: -1;
}
.paper-create-container::before {
  top: -5%; left: -5%; width: 40vw; height: 40vw;
  background: radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%);
}
.paper-create-container::after {
  bottom: -10%; right: -5%; width: 50vw; height: 50vw;
  background: radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%);
  animation-delay: -5s;
}
@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(4%, 6%) scale(1.05); }
}

/* ==========================================
   页头与选项卡美化
   ========================================== */
:deep(.el-page-header) {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 16px 24px;
  box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05);
  margin-bottom: 24px;
  animation: fadeInUp 0.5s ease forwards;
}
:deep(.el-page-header__content) {
  font-weight: 700;
  color: #0f172a;
}

.creation-tabs {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.8);
  animation: fadeInUp 0.6s ease forwards;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: rgba(15, 23, 42, 0.06);
}
:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.3s;
}
:deep(.el-tabs__item.is-active) {
  color: #3b82f6;
}
:deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
  background-color: #3b82f6;
}

/* ==========================================
   表单与输入框高级质感
   ========================================== */
.form-section, .ai-form {
  max-width: 900px;
  margin: 0 auto 24px auto;
  padding: 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #1e293b;
}

:deep(.el-input__wrapper), 
:deep(.el-textarea__inner), 
:deep(.el-select .el-input__wrapper),
:deep(.el-input-number .el-input__wrapper) {
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(15,23,42,0.06);
  border-radius: 12px;
  box-shadow: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 6px 16px;
}
:deep(.el-textarea__inner) {
  border-radius: 16px;
  padding: 12px 16px;
}
:deep(.el-input__wrapper:focus-within), 
:deep(.el-textarea__inner:focus),
:deep(.el-select .el-input__wrapper.is-focus) {
  background: #fff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
}

/* 计数器按钮圆角适配 */
:deep(.el-input-number__increase), :deep(.el-input-number__decrease) {
  background: rgba(241, 245, 249, 0.8);
  border: none;
}
:deep(.el-input-number.is-controls-right .el-input-number__increase) {
  border-radius: 0 12px 0 0;
}
:deep(.el-input-number.is-controls-right .el-input-number__decrease) {
  border-radius: 0 0 12px 0;
}

/* ==========================================
   操作区、筛选与区块美化
   ========================================== */
.filter-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
  animation: fadeInUp 0.7s ease forwards;
}

.question-selection h3 {
  color: #0f172a;
  font-weight: 700;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 4px solid #3b82f6;
  border-radius: 2px;
}

/* 按钮渐变与浮空效果 */
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

/* ==========================================
   表格透明化与细节
   ========================================== */
.question-table-container {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}
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
  border-bottom: 1px solid rgba(15,23,42,0.06);
}
:deep(.el-table td.el-table__cell) {
  background: transparent;
  border-bottom: 1px dashed rgba(15,23,42,0.06);
  padding: 16px 0;
}

.question-title {
  color: #1e293b;
  font-weight: 500;
  line-height: 1.5;
}

:deep(.el-tag) {
  border: none;
  font-weight: 600;
  border-radius: 8px;
  padding: 0 12px;
}

/* ==========================================
   状态汇总与 AI 配置项区块
   ========================================== */
.summary-section {
  margin-top: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  position: sticky;
  bottom: 20px;
  z-index: 10;
}

.summary-item {
  display: flex;
  align-items: baseline;
  justify-content: center;
}
.summary-item .label {
  font-weight: 600;
  color: #64748b;
  font-size: 15px;
}
.summary-item .value {
  font-size: 24px;
  color: #3b82f6;
  font-weight: 800;
  font-family: ui-monospace, monospace;
}

/* AI智能组卷独立卡片 */
.ai-config-row {
  margin-bottom: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  transition: all 0.3s;
}
.ai-config-row:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

:deep(.el-divider__text) {
  background-color: transparent;
  color: #94a3b8;
  font-weight: 600;
}
:deep(.el-divider) {
  border-top-color: rgba(15,23,42,0.06);
}

/* 进场动画 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==========================================
   优雅的自定义滚动条
   ========================================== */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.1); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(15,23,42,0.2); }

/* 响应式设计 */
@media (max-width: 1200px) {
  .paper-create-container { padding: 16px; }
  .summary-section {
    position: static;
    margin-top: 24px;
  }
}
@media (max-width: 768px) {
  .filter-section .el-row, .ai-config-row .el-row { gap: 12px; }
  .filter-section .el-col, .ai-config-row .el-col {
    width: 100%;
    max-width: 100%;
    flex: none;
  }
  .summary-item { justify-content: flex-start; margin-bottom: 12px; }
}
</style>