import config from '@/configs/config'
import useAuthStore from '@/stores/authStore'
import axios from 'axios'

export const serverAxios = axios.create({
  baseURL: `${config.serverBaseUrl}/${config.serverVersion}`,
  withCredentials: true,
})

export const cacheAxios = axios.create({
  baseURL: config.cacheBaseUrl,
})

serverAxios.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().access?.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)
