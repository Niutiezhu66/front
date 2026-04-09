<template>
    <div class="register-container">
      <el-card class="register-card">
        <h2 style="text-align: center; margin-bottom: 20px;">注册账号</h2>
        <el-form :model="regForm" :rules="rules" ref="regFormRef" label-width="80px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="regForm.username" placeholder="请输入登录账号"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input type="password" v-model="regForm.password" placeholder="请输入密码" show-password></el-input>
          </el-form-item>
          <el-form-item label="姓名/昵称" prop="nickname">
            <el-input v-model="regForm.nickname" placeholder="请输入真实姓名"></el-input>
          </el-form-item>
          <el-form-item label="身份角色" prop="role">
            <el-radio-group v-model="regForm.role">
              <el-radio :label="2">学生</el-radio>
              <el-radio :label="1">教师</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="学号/工号" prop="userNo">
            <el-input v-model="regForm.userNo" placeholder="请输入学号或工号"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleRegister" :loading="loading" style="width: 100%">立即注册</el-button>
          </el-form-item>
          <div class="links">
            <span>已有账号？ <el-link type="primary" @click="$router.push('/login')">直接登录</el-link></span>
          </div>
        </el-form>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { register } from '@/api/user'
  
  const router = useRouter()
  const regFormRef = ref(null)
  const loading = ref(false)
  
  const regForm = reactive({
    username: '',
    password: '',
    nickname: '',
    role: 2, // 默认学生
    userNo: ''
  })
  
  const rules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码不能少于6位', trigger: 'blur' }],
    nickname: [{ required: true, message: '请输入姓名/昵称', trigger: 'blur' }],
    role: [{ required: true, message: '请选择身份角色', trigger: 'change' }]
  }
  
  const handleRegister = () => {
    regFormRef.value.validate((valid) => {
      if (valid) {
        loading.value = true
        register(regForm).then(res => {
          loading.value = false
          if (res.code === 200) {
            ElMessage.success('注册成功，请登录！')
            router.push('/login')
          } else {
            ElMessage.error(res.message || '注册失败')
          }
        }).catch(() => {
          loading.value = false
        })
      }
    })
  }
  </script>
  
  <style scoped>
  .register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f2f5;
  }
  .register-card {
    width: 450px;
    padding: 20px;
    border-radius: 8px;
  }
  .links {
    text-align: right;
    font-size: 14px;
  }
  </style>