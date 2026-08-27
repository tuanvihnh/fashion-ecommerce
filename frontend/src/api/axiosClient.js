import axios from 'axios'

const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: Tự động gắn JWT token vào mọi request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: Xử lý lỗi 401, 429 (rate limit) và lỗi mạng
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Lỗi mạng (mất kết nối, server không phản hồi)
    if (!error.response) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.')
      })
      return Promise.reject(error)
    }

    // Token hết hạn
    if (error.response.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    // Rate limit exceeded
    if (error.response.status === 429) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.')
      })
    }

    return Promise.reject(error)
  }
)

export default axiosClient
