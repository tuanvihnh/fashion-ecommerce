import axiosClient from './axiosClient'

const orderApi = {
  create: (data) => axiosClient.post('/orders', data),
  getMyOrders: (params) => axiosClient.get('/orders', { params }),
  getById: (id) => axiosClient.get(`/orders/${id}`),
  cancel: (id) => axiosClient.post(`/orders/${id}/cancel`),
  // Admin
  getAllOrders: (params) => axiosClient.get('/orders/admin/all', { params }),
  updateStatus: (id, data) => axiosClient.patch(`/orders/admin/${id}/status`, data),
}

export default orderApi
