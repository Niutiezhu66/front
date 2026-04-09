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

// 老师获取自己名下的学生
export function getMyStudents(teacherId) {
  return request({
    url: '/api/user/myStudents',
    method: 'get',
    params: { teacherId }
  })
}