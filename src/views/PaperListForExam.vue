<template>
  <div class="paper-list-container">
    <div class="ambient-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div class="content-wrapper">
      <div class="header-section animate-fade-up">
        <el-page-header @back="goBack" title="返回" class="custom-page-header">
          <template #content>
            <span class="header-title">选择试卷，开始评估</span>
          </template>
        </el-page-header>

        <div class="search-bar-wrapper">
          <el-input 
            v-model="searchKeyword" 
            placeholder="输入试卷名称，快速定位目标测试" 
            class="pill-search-input glass-effect-light"
            clearable
            @clear="fetchPublishedPapers"
            @keyup.enter="handleSearch"
          >
            <template #prefix><el-icon class="search-icon"><Search /></el-icon></template>
            <template #append>
              <el-button class="search-btn" type="primary" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
      </div>

      <div class="paper-list" v-loading="loading">
        <transition-group name="list-stagger" tag="div" class="list-grid" v-if="paperList.length > 0">
          <div v-for="(paper, index) in paperList" :key="paper.id" class="paper-card premium-card glass-effect" :style="{ animationDelay: `${index * 0.1}s` }">
            <div class="card-left">
              <div class="paper-icon"><el-icon><Document /></el-icon></div>
              <div class="paper-info">
                <h3 class="paper-name">{{ paper.name }}</h3>
                <p class="paper-description">{{ paper.description || '本次考试暂无附加描述信息' }}</p>
                <div class="paper-tags">
                  <span class="tag-item"><el-icon><CollectionTag /></el-icon>{{ paper.questionCount }} 道题</span>
                  <span class="tag-item"><el-icon><TrophyBase /></el-icon>{{ paper.totalScore }} 分满分</span>
                  <span class="tag-item"><el-icon><Timer /></el-icon>限时 {{ paper.duration }} 分钟</span>
                </div>
              </div>
            </div>
            <div class="card-right">
              <el-button type="primary" size="large" class="start-btn btn-hover-glow" @click="handleStartExam(paper.id)" :loading="startingExamId === paper.id">
                <span class="btn-text">开始作答</span>
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </transition-group>
        
        <div v-else-if="!loading" class="empty-state premium-card glass-effect">
          <el-empty description="当前暂无已发布的在线测试卷或未找到匹配项" :image-size="120" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPapers } from '../api/paper.js'
import { Search, CollectionTag, TrophyBase, Timer, Document, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false); const paperList = ref([]); const searchKeyword = ref(''); const startingExamId = ref(null);

const fetchPublishedPapers = async () => {
  loading.value = true
  try {
    const res = await getPapers({ status: 'PUBLISHED', name: searchKeyword.value })
    paperList.value = res.data || []
  } catch (error) { ElMessage.error('获取试卷列表失败') } finally { loading.value = false }
}

const handleSearch = () => { fetchPublishedPapers() }
const handleStartExam = (paperId) => { router.push(`/exam/start/${paperId}`) }
const goBack = () => { router.back() }

onMounted(() => { fetchPublishedPapers() })
</script>

<style scoped>
.paper-list-container { position: relative; min-height: calc(100vh - 60px); background-color: #f8fafc; padding: 40px 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; overflow: hidden; }
.ambient-background { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float 20s infinite alternate ease-in-out; }
.blob-1 { top: -10%; left: 10%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%); }
.blob-2 { bottom: -20%; right: 10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%); animation-delay: -5s; }
@keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(3%, 5%) scale(1.05); } }

.content-wrapper { position: relative; z-index: 1; max-width: 1000px; margin: 0 auto; }
.animate-fade-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

.premium-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px; box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.glass-effect { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(16px); }

.header-section { margin-bottom: 40px; text-align: center; }
:deep(.custom-page-header) { margin-bottom: 32px; }
:deep(.custom-page-header .el-page-header__content) { display: flex; width: 100%; justify-content: center; transform: translateX(-30px); }
.header-title { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; }

.search-bar-wrapper { max-width: 640px; margin: 0 auto; }
/* 胶囊型搜索框 */
:deep(.pill-search-input .el-input__wrapper) { border-radius: 100px 0 0 100px; padding: 12px 24px; background: rgba(255,255,255,0.8); border: 1px solid rgba(15,23,42,0.05); box-shadow: 0 8px 24px rgba(15,23,42,0.03); transition: all 0.3s; }
:deep(.pill-search-input .el-input__wrapper:focus-within) { border-color: #3b82f6; background: #fff; box-shadow: 0 8px 32px rgba(59,130,246,0.1); }
:deep(.pill-search-input .el-input__inner) { font-size: 15px; color: #0f172a; font-weight: 500; }
:deep(.pill-search-input .el-input-group__append) { border-radius: 0 100px 100px 0; padding: 0; border: none; background: transparent; }
.search-icon { font-size: 18px; color: #94a3b8; margin-right: 8px; }
.search-btn { height: 100%; border-radius: 0 100px 100px 0; padding: 0 32px; font-size: 16px; font-weight: 600; background: #0f172a; border-color: #0f172a; transition: all 0.3s; }
.search-btn:hover { background: #3b82f6; border-color: #3b82f6; }

.list-grid { display: flex; flex-direction: column; gap: 20px; }

.paper-card { display: flex; justify-content: space-between; align-items: center; padding: 28px 32px; animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; opacity: 0; }
.paper-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 20px 40px -10px rgba(59, 130, 246, 0.1); border-color: #fff; }

.card-left { display: flex; gap: 24px; align-items: center; flex: 1; min-width: 0; }
.paper-icon { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%); color: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(59,130,246,0.2); }
.paper-info { flex: 1; min-width: 0; }
.paper-name { margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.paper-description { margin: 0 0 16px 0; color: #64748b; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.paper-tags { display: flex; gap: 12px; flex-wrap: wrap; }
.tag-item { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(241,245,249,0.8); border: 1px solid rgba(15,23,42,0.05); border-radius: 8px; font-size: 13px; font-weight: 600; color: #475569; }
.tag-item .el-icon { color: #8b5cf6; font-size: 15px; }

.card-right { margin-left: 32px; flex-shrink: 0; }
.start-btn { height: 48px; padding: 0 28px; border-radius: 14px; font-size: 16px; font-weight: 600; border: none; overflow: hidden; position: relative; }
.btn-hover-glow { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #fff; box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.btn-hover-glow:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4); padding: 0 24px 0 32px; }

.empty-state { padding: 60px; }

@media (max-width: 768px) { .paper-card { flex-direction: column; align-items: flex-start; gap: 24px; padding: 24px; } .card-right { margin-left: 0; width: 100%; } .start-btn { width: 100%; } }
</style>