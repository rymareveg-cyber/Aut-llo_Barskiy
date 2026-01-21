import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { setToken, setAdmin } from '../utils/auth'

const API_BASE_URL = '/api'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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
        if (!response.data.registration_available) {
          // Если регистрация недоступна, перенаправляем на страницу входа
          navigate('/admin/login')
        }
      } catch (error) {
        console.error('Ошибка проверки регистрации:', error)
      }
    }
    checkRegistration()
  }, [navigate])

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

    // Проверка совпадения паролей
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      setIsSubmitting(false)
      return
    }

    // Проверка минимальной длины пароля
    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      setIsSubmitting(false)
      return
    }

    try {
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      }

      const response = await axios.post(`${API_BASE_URL}/auth/register`, registerData)
      
      // После регистрации автоматически входим
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: formData.username,
        password: formData.password,
      })
      
      // Сохраняем токен и данные администратора
      setToken(loginResponse.data.access_token)
      setAdmin(loginResponse.data.admin)
      
      // Перенаправляем в админ-панель
      navigate('/admin')
    } catch (error) {
      console.error('Ошибка регистрации:', error)
      setError(
        error.response?.data?.detail || 
        'Произошла ошибка при регистрации'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!registrationAvailable) {
    return null // Показываем ничего, пока проверяем доступность регистрации
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
              Регистрация администратора
            </h1>
            <p className="text-slate-300">
              Создайте первую учетную запись
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
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Введите username (минимум 3 символа)"
                required
                minLength={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Пароль *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Введите пароль (минимум 6 символов)"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Подтвердите пароль *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Повторите пароль"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting || !formData.username || !formData.email || !formData.password || !formData.confirmPassword}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-8 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Регистрация...
                </span>
              ) : (
                'Зарегистрироваться'
              )}
            </motion.button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Вернуться к входу
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default Register

