/**
 * Утилиты для работы с аутентификацией
 */

const TOKEN_KEY = 'admin_token'
const ADMIN_KEY = 'admin_data'

/**
 * Сохраняет токен в localStorage
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Получает токен из localStorage
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Удаляет токен из localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}

/**
 * Сохраняет данные администратора
 */
export const setAdmin = (admin) => {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

/**
 * Получает данные администратора
 */
export const getAdmin = () => {
  const adminData = localStorage.getItem(ADMIN_KEY)
  return adminData ? JSON.parse(adminData) : null
}

/**
 * Проверяет, авторизован ли пользователь
 */
export const isAuthenticated = () => {
  return !!getToken()
}
