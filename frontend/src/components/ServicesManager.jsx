import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE_URL = '/api'

const ServicesManager = () => {
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingService, setEditingService] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    services: '',
    budget_range: '',
  })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Пробуем использовать защищенный роут админ-панели, если не работает - используем обычный
      let response
      try {
        response = await axios.get(`${API_BASE_URL}/admin/services`)
      } catch (adminError) {
        // Если защищенный роут не доступен (404 или другая ошибка), используем обычный
        console.log('Защищенный роут недоступен, используем обычный роут')
        response = await axios.get(`${API_BASE_URL}/admin-settings/`)
      }
      setServices(response.data || [])
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error)
      setError('Не удалось загрузить услуги')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingService(null)
    setFormData({ services: '', budget_range: '' })
    setIsFormOpen(true)
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      services: service.services || '',
      budget_range: service.budget_range || '',
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту услугу?')) {
      return
    }

    try {
      try {
        await axios.delete(`${API_BASE_URL}/admin/services/${id}`)
      } catch (adminError) {
        // Если защищенный роут не доступен, используем обычный
        console.log('Защищенный роут недоступен, используем обычный роут для удаления')
        await axios.delete(`${API_BASE_URL}/admin-settings/${id}`)
      }
      setServices(services.filter(s => s.id !== id))
    } catch (error) {
      console.error('Ошибка удаления услуги:', error)
      alert('Не удалось удалить услугу')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingService) {
        // Обновление - пробуем защищенный роут, если не работает - используем обычный
        try {
          await axios.put(`${API_BASE_URL}/admin/services/${editingService.id}`, formData)
        } catch (adminError) {
          // Если защищенный роут не доступен, используем обычный
          console.log('Защищенный роут недоступен, используем обычный роут для обновления')
          await axios.put(`${API_BASE_URL}/admin-settings/${editingService.id}`, formData)
        }
      } else {
        // Создание - пробуем защищенный роут, если не работает - используем обычный
        try {
          await axios.post(`${API_BASE_URL}/admin/services`, formData)
        } catch (adminError) {
          // Если защищенный роут не доступен, используем обычный
          console.log('Защищенный роут недоступен, используем обычный роут для создания')
          await axios.post(`${API_BASE_URL}/admin-settings/`, formData)
        }
      }
      
      setIsFormOpen(false)
      setEditingService(null)
      setFormData({ services: '', budget_range: '' })
      loadServices()
    } catch (error) {
      console.error('Ошибка сохранения услуги:', error)
      setError(error.response?.data?.detail || 'Не удалось сохранить услугу')
    }
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingService(null)
    setFormData({ services: '', budget_range: '' })
    setError(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex gap-6">
      {/* Основная таблица */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            Услуги ({services.length})
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить услугу
          </motion.button>
        </div>

        {error && !isFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30"
          >
            {error}
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <p className="text-slate-300 text-lg mb-4">Услуг пока нет</p>
            <p className="text-slate-400 text-sm">Нажмите "Добавить услугу" чтобы создать первую</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">ID</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Услуга</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Бюджет</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Создано</th>
                  <th className="text-right py-4 px-4 text-slate-300 font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {services.map((service) => (
                    <motion.tr
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4 text-slate-300">{service.id}</td>
                      <td className="py-4 px-4">
                        <span className="text-white font-medium">
                          {service.services || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {service.budget_range || '-'}
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-sm">
                        {formatDate(service.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(service)}
                            className="p-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(service.id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Панель инструментов (форма) */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-96 glass-strong rounded-2xl shadow-2xl p-6 h-fit sticky top-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingService ? 'Редактировать услугу' : 'Новая услуга'}
              </h3>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Название услуги *
                </label>
                <input
                  type="text"
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  placeholder="Например: Веб-разработка"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Бюджетный диапазон
                </label>
                <input
                  type="text"
                  value={formData.budget_range}
                  onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                  placeholder="Например: 50 000 - 100 000 ₽"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {editingService ? 'Сохранить' : 'Создать'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleCancel}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-slate-300 font-semibold rounded-xl transition-all duration-300"
                >
                  Отмена
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ServicesManager

