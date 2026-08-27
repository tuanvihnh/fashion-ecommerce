import axiosClient from './axiosClient'

const authApi = {
  register: (data) => axiosClient.post('/auth/register', data),
  login: (email, password) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    return axiosClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  getMe: () => axiosClient.get('/users/me'),
}

export default authApi
