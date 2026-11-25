import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('nexushr_token')
    const tokenType =
      sessionStorage.getItem('nexushr_tokenType') || 'Bearer'

    if (token) {
      config.headers.Authorization = `${tokenType} ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

export default api

