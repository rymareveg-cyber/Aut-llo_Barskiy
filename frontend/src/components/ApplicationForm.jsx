import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import FormField from './FormField'
import ServiceSelect from './ServiceSelect'

// Используем относительный путь /api для работы через Nginx прокси
const API_BASE_URL = '/api'

const ApplicationForm = ({ onApplicationCreated }) => {
  const [formData, setFormData] = useState({
    service_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    comments: '',
  })

  const [services, setServices] = useState([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const [contactType, setContactType] = useState('phone') // 'phone' или 'email'

  // Загружаем услуги при монтировании компонента
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true)
        const response = await axios.get(`${API_BASE_URL}/admin-settings/`)
        setServices(response.data || [])
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error)
        setSubmitStatus({
          type: 'error',
          message: 'Не удалось загрузить список услуг. Пожалуйста, обновите страницу.',
        })
      } finally {
        setIsLoadingServices(false)
      }
    }

    fetchServices()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'service_id' ? parseInt(value) || '' : value,
    }))
  }

  const validateContact = (value, type) => {
    if (!value) return false
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    }
    if (type === 'phone') {
      // Убираем все нецифровые символы и проверяем длину
      const digits = value.replace(/\D/g, '')
      return digits.length >= 10
    }
    return false
  }

  const formatPhone = (value) => {
    // Убираем все нецифровые символы
    const digits = value.replace(/\D/g, '')
    
    // Форматируем как +7 (XXX) XXX-XX-XX
    if (digits.length === 0) return ''
    if (digits.length <= 1) return `+${digits}`
    if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`
    if (digits.length <= 9) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, phone: formatPhone(value), email: '' }))
    setContactType('phone')
  }

  const handleEmailChange = (e) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, email: value, phone: '' }))
    setContactType('email')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Валидация
    if (contactType === 'phone' && !validateContact(formData.phone, 'phone')) {
      setSubmitStatus({
        type: 'error',
        message: 'Пожалуйста, введите корректный номер телефона',
      })
      return
    }
    
    if (contactType === 'email' && !validateContact(formData.email, 'email')) {
      setSubmitStatus({
        type: 'error',
        message: 'Пожалуйста, введите корректный email адрес',
      })
      return
    }

    // Проверяем, что указан хотя бы один контакт
    if (!formData.phone && !formData.email) {
      setSubmitStatus({
        type: 'error',
        message: 'Пожалуйста, укажите телефон или email',
      })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Подготавливаем данные для отправки
      const submitData = {
        service_id: formData.service_id ? parseInt(formData.service_id) : null,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone || null,
        email: formData.email || null,
        comments: formData.comments.trim() || null,
      }
      
      const response = await axios.post(`${API_BASE_URL}/applications/`, submitData)
      setSubmitStatus({ 
        type: 'success', 
        message: 'Спасибо! Ваша заявка успешно отправлена. Мы свяжемся с вами в ближайшее время.' 
      })
      
      // Устанавливаем ID заявки для отслеживания метрик
      if (response.data?.id && onApplicationCreated) {
        onApplicationCreated(response.data.id)
      }
      
      // Сброс формы
      setFormData({
        service_id: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        comments: '',
      })
      setContactType('phone')
    } catch (error) {
      console.error('Ошибка отправки заявки:', error)
      let errorMessage = 'Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.'
      
      if (error.response) {
        // Сервер ответил с ошибкой
        if (error.response.data?.detail) {
          errorMessage = Array.isArray(error.response.data.detail)
            ? error.response.data.detail.map((err) => err.msg || err).join(', ')
            : error.response.data.detail
        } else if (error.response.status === 422) {
          errorMessage = 'Пожалуйста, проверьте правильность заполнения всех полей.'
        } else if (error.response.status >= 500) {
          errorMessage = 'Сервер временно недоступен. Пожалуйста, попробуйте позже.'
        }
      } else if (error.request) {
        // Запрос был отправлен, но ответа не получено
        errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету.'
      }
      
      setSubmitStatus({
        type: 'error',
        message: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-2xl"
    >
      <div className="glass-strong rounded-3xl shadow-2xl p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
            Autéllo
          </h1>
          <p className="text-xl text-slate-300">
            Оставьте заявку и мы свяжемся с вами
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Услуги - главный элемент формы */}
          <ServiceSelect
            label="Выберите услугу *"
            name="service_id"
            value={formData.service_id}
            onChange={handleChange}
            services={services}
            isLoading={isLoadingServices}
            required
          />
          {services.length === 0 && !isLoadingServices && (
            <p className="text-sm text-yellow-400">
              Услуги не найдены. Обратитесь к администратору.
            </p>
          )}

          {/* Контактные данные */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Имя *"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Ваше имя"
                required
              />
              <FormField
                label="Фамилия *"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Ваша фамилия"
                required
              />
            </div>

            {/* Контакт с переключателем типа */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Контакт для связи *
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setContactType('phone')
                    setFormData((prev) => ({ ...prev, email: '' }))
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    contactType === 'phone'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  Телефон
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContactType('email')
                    setFormData((prev) => ({ ...prev, phone: '' }))
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    contactType === 'email'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  Email
                </button>
              </div>
              {contactType === 'phone' ? (
                <>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="+7 (999) 123-45-67"
                    required={!formData.email}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  />
                  {formData.phone && !validateContact(formData.phone, 'phone') && (
                    <p className="text-sm text-red-400 mt-1">
                      Введите корректный номер телефона
                    </p>
                  )}
                </>
              ) : (
                <>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    placeholder="example@email.com"
                    required={!formData.phone}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  />
                  {formData.email && !validateContact(formData.email, 'email') && (
                    <p className="text-sm text-red-400 mt-1">
                      Введите корректный email адрес
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Комментарий (необязательно) */}
            <FormField
              label="Дополнительная информация"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              type="textarea"
              rows={4}
              placeholder="Расскажите подробнее о вашей задаче (необязательно)"
            />
          </div>

          {submitStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg ${
                submitStatus.type === 'success'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {submitStatus.message}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isSubmitting || !formData.service_id || !formData.first_name || !formData.last_name || (!formData.phone && !formData.email)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-8 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Отправка...
              </span>
            ) : (
              'Отправить заявку'
            )}
          </motion.button>

          <p className="text-xs text-slate-400 text-center">
            Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
          </p>
        </form>
      </div>
    </motion.div>
  )
}

export default ApplicationForm
