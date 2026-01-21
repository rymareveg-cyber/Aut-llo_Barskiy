import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { setToken, setAdmin } from '../utils/auth'

const API_BASE_URL = '/api'

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [registrationAvailable, setRegistrationAvailable] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Проверяем, доступна ли регистрация
    const checkRegistration = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/check-registration`)
        setRegistrationAvailable(response.data.registration_available)
      } catch (error) {
        console.error('Ошибка проверки регистрации:', error)
        // При ошибке 502 или других ошибках сервера показываем кнопку регистрации
        // на случай, если это первый запуск и админов еще нет
        if (error.response?.status === 502 || error.response?.status >= 500) {
          // Предполагаем, что регистрация доступна при ошибке сервера
          // (на случай первого запуска)
          setRegistrationAvailable(true)
        }
      }
    }
    checkRegistration()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, formData)
      
      // Сохраняем токен и данные администратора
      setToken(response.data.access_token)
      setAdmin(response.data.admin)
      
      // Перенаправляем в админ-панель (используем replace для замены истории)
      navigate('/admin', { replace: true })
    } catch (error) {
      console.error('Ошибка входа:', error)
      setError(
        error.response?.data?.detail || 
        'Неверный username или пароль'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl shadow-2xl p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              Вход в админ-панель
            </h1>
            <p className="text-slate-300">
              Введите ваши учетные данные
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Введите username"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Пароль
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Введите пароль"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting || !formData.username || !formData.password}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-8 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Вход...
                </span>
              ) : (
                'Войти'
              )}
            </motion.button>

            {registrationAvailable && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/admin/register')}
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Зарегистрироваться
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default Login

