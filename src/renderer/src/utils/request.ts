import axios from 'axios'

const request = axios.create({
  // baseURL: import.meta.env.VITE_APP_BASE_API,
  baseURL: 'http://localhost:48080/admin-api',
  timeout: 5000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    let token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    token = '45f7cfd6700f491e8782d68ae43bad17'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      config.headers['tenant-id'] = 2395
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 对响应做点什么
    return response.data
  },
  error => {
    // 对响应错误做点什么
    return Promise.reject(error)
  }
)

export default request
