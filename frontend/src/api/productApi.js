import axiosClient from './axiosClient'

const productApi = {
  getAll: (params) => axiosClient.get('/products', { params }),
  getBySlug: (slug) => axiosClient.get(`/products/${slug}`),
  create: (data) => axiosClient.post('/products', data),
  update: (id, data) => axiosClient.put(`/products/${id}`, data),
}

export default productApi
