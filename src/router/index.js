import { createRouter, createWebHistory} from 'vue-router'
import { ElMessage } from 'element-plus' 

// 路由配置
const routes = [
  {
      path: '/',
      redirect: '/home'
    },
  // {
  //   path: '/',
  //   redirect: '/login'
  // },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },

//////////////////////////////////////////////
  // {
  //   path: '/',
  //   redirect: '/home'
  // },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { title: '个人中心' }
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('../views/AdminLayout.vue'),
    redirect: '/admin/welcome',
    children: [
      {
        path: 'welcome',
        name: 'Welcome',
        component: () => import('../views/Welcome.vue'),
        meta: { title: '欢迎' }
      },
      {
        path: 'question-manage',
        name: 'QuestionManage',
        component: () => import('../views/QuestionManage.vue'),
        meta: { title: '题目管理' }
      },
      {
        path: 'category-manage',
        name: 'CategoryManage',
        component: () => import('../views/CategoryManage.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'paper-manage',
        name: 'PaperManage',
        component: () => import('../views/PaperManage.vue'),
        meta: { title: '试卷管理' }
      },
      {
        path: 'score-manage',
        name: 'ScoreManage',
        component: () => import('../views/ScoreManage.vue'),
        meta: { title: '成绩管理' }
      },

      {
        path: 'user-manage',
        name: 'UserManage',
        component: () => import('../views/UserManage.vue'),
        meta: { title: '用户与关系管理' } // 仅管理员可用
      },
      {
        path: 'my-students',
        name: 'MyStudents',
        component: () => import('../views/MyStudents.vue'),
        meta: { title: '我的学生管理' } // 教师可用
      },

      {
        path: 'banner-manage',
        name: 'BannerManage',
        component: () => import('../views/BannerManage.vue'),
        meta: { title: '轮播图管理' }
      },
      {
        path: 'notice-manage',
        name: 'NoticeManage',
        component: () => import('../views/NoticeManage.vue'),
        meta: { title: '公告管理' }
      },
      
      {
        path: 'paper-create',
        name: 'PaperCreate',
        component: () => import('../views/PaperCreate.vue'),
        meta: { title: '创建新试卷' }
      }
    ]
  },
  {
    path: '/exam/list',
    name: 'PaperListForExam',
    component: () => import('../views/PaperListForExam.vue'),
    meta: { title: '选择考试' }
  },
  {
    path: '/exam/start/:paperId',
    name: 'ExamStart',
    component: () => import('../views/ExamStart.vue'),
    meta: { title: '开始考试' }
  },
  {
    path: '/exam/:id',
    name: 'Exam',
    component: () => import('../views/Exam.vue'),
    meta: { title: '在线考试' }
  },
  {
    path: '/exam-result',
    name: 'ExamResult',
    component: () => import('../views/ExamResult.vue'),
    meta: { title: '考试结果' }
  },
  {
    path: '/exam-result/:id',
    name: 'ExamResultById',
    component: () => import('../views/ExamResult.vue'),
    meta: { title: '考试结果' }
  },
  {
    path: '/exam-ranking',
    name: 'ExamRanking',
    component: () => import('../views/ExamRanking.vue'),
    meta: { title: '考试排行榜' }
  },
  {
    path: '/practice',
    name: 'Practice',
    component: () => import('../views/Practice.vue'),
    meta: { title: '刷题练习' }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
////
// 从 localStorage 获取当前登录用户信息
const userStr = localStorage.getItem('userInfo')
let userInfo = null
if (userStr) {
  try { userInfo = JSON.parse(userStr) } catch(e) {}
}

// 规则 A：如果是要去管理员后台（以 /admin 开头的路由，或者具体的后台路径）
if (to.path.startsWith('/admin')) {
  if (!userInfo) {
    ElMessage.warning('请先登录')
    return next('/login')
  }
  // 角色为 2 (学生) 则拒绝访问
  if (Number(userInfo.role) === 2) {
    ElMessage.error('权限不足：学生无法访问管理后台')
    return next('/home') // 踢回首页
  }
  return next() // 老师/管理员放行
}

// 规则 B：如果是必须要登录才能访问的前端页面（如：考试、答题模块）
// 根据您的实际路由路径，将需要登录的页面加到这个数组里
const requireAuthPaths = ['/exam', '/exam/start', '/practice', '/result']
const isRequireAuth = requireAuthPaths.some(path => to.path.includes(path))

if (isRequireAuth && !userInfo) {
  ElMessage.warning('此功能需要登录，请先登录')
  return next('/login')
}

  ////
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title + ' - 智能学习平台'
  }
  
  // 防止从考试结果页面返回到考试页面的逻辑
  if (from.path && from.path.includes('/exam-result/') && to.path && to.path.includes('/exam/')) {
    // 如果用户试图从结果页面返回到考试页面
    console.log('检测到从结果页面返回到考试页面的尝试')
    
    // 检查目标考试ID和来源结果页面ID是否相同
    const fromExamId = from.params.id
    const toExamId = to.params.id
    
    if (fromExamId === toExamId) {
      // 如果是同一个考试，阻止返回并重定向到考试列表
      console.log('阻止返回到已完成的考试，重定向到考试列表')
      next('/exam/list')
      return
    }
  }
  
  // 如果是访问考试页面，我们不能在这里检查考试状态（因为需要API调用）
  // 这个检查已经在Exam.vue的getExamData函数中处理了
  
  next()
})

// 路由后置守卫 - 设置页面标题  // 每次路由切换后设置页面标题
router.afterEach((to) => {
  document.title = to.meta.title + ' - 智能学习平台'  // 更改标题后缀
})

export default router 