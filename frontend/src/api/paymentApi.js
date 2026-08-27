import axiosClient from './axiosClient'

const paymentApi = {
  createUrl: (orderId) => axiosClient.post(`/payments/create_url/${orderId}`),
}

export default paymentApi
