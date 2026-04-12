import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/api/user/login',
    method: 'post',
    data
  })
}

export function register(data) {
  return request({
    url: '/api/user/register',
    method: 'post',
    data
  })
}

/**
 * 获取所有师生绑定关系（管理员）
 */
export function getAllRelations() {
  return request({
    url: '/api/user/admin/relations',
    method: 'get'
  })
}

// // 老师获取自己名下的学生
// export function getMyStudents(teacherId) {
//   return request({
//     url: '/api/user/myStudents',
//     method: 'get',
//     params: { teacherId }
//   })
// }

/**
 * 1. 管理员：预览待导入的师生Excel数据
 */
export function previewImportUsers(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/api/user/batch/preview-excel',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 2. 管理员：确认导入预览的师生数据
 */
export function confirmImportUsers(data) {
  return request({
    url: '/api/user/batch/import-users',
    method: 'post',
    data: data
  })
}

/**
 * 1. 管理员：一键导入师生 (Excel)
 */
export function importUsers(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/api/user/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 2. 教师：根据学号绑定学生
 */
export function teacherBindStudent(teacherId, studentUserId) {
  return request({
    url: '/api/user/teacher/bind',
    method: 'post',
    // 使用 FormData 或 params 传参，这里使用 params 对应后端的 @RequestParam
    params: { teacherId, studentUserId }
  })
}

/**
 * 3. 教师/管理员：解除师生绑定
 */
export function unbindStudentRelation(teacherId, studentId) {
  return request({
    url: '/api/user/teacher/unbind',
    method: 'post',
    params: { teacherId, studentId }
  })
}

/**
 * 4. 管理员：强制绑定师生关系
 */
export function adminBindStudent(teacherId, studentUserId) {
  return request({
    url: '/api/user/admin/bind',
    method: 'post',
    params: { teacherId, studentUserId }
  })
}

/**
 * 5. 获取教师名下绑定的学生列表
 */
export function getMyStudents(teacherId) {
  return request({
    url: '/api/user/myStudents',
    method: 'get',
    params: { teacherId }
  })
}