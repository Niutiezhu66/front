<template>
    <div class="login-container">
        <el-card class="login-card">
            <h2 style="text-align: center; margin-bottom: 20px;">在线考试系统</h2>
            <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="0px">
                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" clearable></el-input>
                </el-form-item>
                <el-form-item prop="password">
                    <el-input type="password" v-model="loginForm.password" placeholder="请输入密码" prefix-icon="Lock"
                        show-password @keyup.enter="handleLogin"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" style="width: 100%;" @click="handleLogin" :loading="loading">登
                        录</el-button>
                </el-form-item>
                <div class="links">
                    <span>还没有账号？ <el-link type="primary" @click="$router.push('/register')">立即注册</el-link></span>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '@/api/user'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
    username: '',
    password: ''
})

const rules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

//const handleLogin = () => {
//     loginFormRef.value.validate((valid) => {
//         if (valid) {
//             loading.value = true
//             login(loginForm).then(res => {
//                 loading.value = false
//                 if (res.code === 200) {
//                     ElMessage.success('登录成功')
//                     // 保存用户信息 (例如存在localStorage中)
//                     localStorage.setItem('userInfo', JSON.stringify(res.data))
//                     // 角色判断跳转: 0-管理, 1-教师, 2-学生
//                     // if (res.data.role === 2) {
//                     //   router.push('/home') // 学生首页
//                     // } else {
//                     //   router.push('/admin') // 教师/管理首页
//                     // }
//                     // 使用 == 只判断值，不判断数据类型；或者把字符串转成数字比对
//                     if (Number(res.data.role) === 2 || res.data.role === 'user' || res.data.role === 'student') {
//                         router.push('/home') // 学生进前端首页
//                     } else {
//                         router.push('/admin') // 管理员或老师进后台管理
//                     }
//                 } else {
//                     ElMessage.error(res.message || '登录失败')
//                 }
//             }).catch(() => {
//                 loading.value = false
//             })
//         }
//     })
//}



const handleLogin = () => {
  loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      login(loginForm).then(res => {
        loading.value = false
        // 注意：根据您后端的 Result 封装，可能是 res.code === 200 
        if (res.code === 200) { 
          ElMessage.success('登录成功')
          // 1. 将数据存入本地，供 Home 和 考试功能使用
          localStorage.setItem('userInfo', JSON.stringify(res.data))
          
          const role = Number(res.data.role)
          // 2. 路由分流
          if (role === 0 || role === 1) {
            router.push('/admin') // 管理员或老师进入后台
          } else {
            router.push('/home')  // 学生进入前端首页
          }
        } else {
          ElMessage.error(res.message || '登录失败')
        }
      }).catch(() => { loading.value = false })
    }
  })
}




</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f2f5;
}

.login-card {
    width: 400px;
    padding: 20px;
    border-radius: 8px;
}

.links {
    text-align: right;
    font-size: 14px;
}
</style>