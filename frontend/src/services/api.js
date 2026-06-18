import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const tagApi = {
  list: () => api.get('/tags'),
  get: (id) => api.get(`/tags/${id}`),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`),
}

export const machineApi = {
  list: () => api.get('/machines'),
  get: (id) => api.get(`/machines/${id}`),
  create: (data) => api.post('/machines', data),
  update: (id, data) => api.put(`/machines/${id}`, data),
  delete: (id) => api.delete(`/machines/${id}`),
  setOnline: (id) => api.post(`/machines/${id}/online`),
  setOffline: (id) => api.post(`/machines/${id}/offline`),
  getDeviceStatus: (id) => api.get(`/machines/${id}/device-status`),
}

export const channelApi = {
  listByMachine: (machineId) => api.get(`/channels/machine/${machineId}`),
  get: (id) => api.get(`/channels/${id}`),
  create: (data) => api.post('/channels', data),
  update: (id, data) => api.put(`/channels/${id}`, data),
  delete: (id) => api.delete(`/channels/${id}`),
  addStock: (id, quantity) => api.post(`/channels/${id}/stock/add?quantity=${quantity}`),
  reduceStock: (id, quantity) => api.post(`/channels/${id}/stock/reduce?quantity=${quantity}`),
  getTagStock: (machineId, tagId) => api.get(`/channels/tag/${tagId}/stock?machine_id=${machineId}`),
}

export const orderApi = {
  list: (params = {}) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  getByNo: (orderNo) => api.get(`/orders/no/${orderNo}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  dispense: (id) => api.post(`/orders/${id}/dispense`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  statistics: (machineId) => api.get('/orders/statistics/summary', { params: { machine_id: machineId } }),
}

export default api
