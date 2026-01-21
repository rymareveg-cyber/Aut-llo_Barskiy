/**
 * Настройка axios для работы с аутентификацией
 */
import axios from 'axios'
import { getToken, removeToken } from './auth'

// Interceptor для запросов - добавляет токен
axios.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor для ответов - обрабатывает 401 ошибки
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url?.includes('/admin')) {
      // Токен недействителен, удаляем его
      removeToken()
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axios

