import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getAdmin, removeToken } from '../utils/auth'
import ServicesManager from './ServicesManager'
import BehaviorStatisticsModal from './BehaviorStatisticsModal'

const API_BASE_URL = '/api'

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('applications')
  const [applications, setApplications] = useState([])
  const [admins, setAdmins] = useState([])
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false)
  const [statistics, setStatistics] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false)
  const [services, setServices] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // Проверяем авторизацию
    const admin = getAdmin()
    if (!admin) {
      navigate('/admin/login')
      return
    }
    setCurrentAdmin(admin)

    // Загружаем данные
    loadData()
  }, [navigate])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Загружаем услуги для всех вкладок
      const servicesResponse = await axios.get(`${API_BASE_URL}/admin-settings/`)
      setServices(servicesResponse.data || [])
      
      if (activeTab === 'applications') {
        const [appsResponse, statsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/admin/applications?sort_by_temperature=true`),
          axios.get(`${API_BASE_URL}/admin/applications/statistics`).catch(err => {
            console.warn('Ошибка загрузки статистики:', err)
            // Возвращаем пустую статистику при ошибке
            return { data: { total: 0, by_temperature: { hot: 0, medium: 0, cold: 0 }, by_department: {}, total_budget: 0, budgets_by_temperature: { hot: 0, medium: 0, cold: 0 }, average_budget: 0 } }
          })
        ])
        setApplications(appsResponse.data)
        setStatistics(statsResponse.data)
      } else if (activeTab === 'admins') {
        const response = await axios.get(`${API_BASE_URL}/admin/admins`)
        setAdmins(response.data)
      }
      // services загружаются внутри компонента ServicesManager
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      if (error.response?.status === 401) {
        removeToken()
        navigate('/admin/login')
      } else {
        setError(`Не удалось загрузить данные: ${error.response?.data?.detail || error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const getServiceName = (serviceId) => {
    if (!serviceId) return '-'
    const service = services.find(s => s.id === serviceId)
    return service?.services || '-'
  }
  
  const handleViewApplication = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/applications/${id}`)
      setSelectedApplication(response.data)
      setIsApplicationModalOpen(true)
    } catch (error) {
      console.error('Ошибка загрузки заявки:', error)
      alert('Не удалось загрузить заявку')
    }
  }
  
  const getTemperatureIcon = (temperature) => {
    switch (temperature) {
      case 'hot':
        return '🔥'
      case 'medium':
        return '🌡️'
      case 'cold':
        return '❄️'
      default:
        return '📋'
    }
  }
  
  const formatBudget = (budget) => {
    if (!budget) return 'Не указан'
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(budget)
  }

  useEffect(() => {
    if (currentAdmin) {
      loadData()
    }
  }, [activeTab, currentAdmin])

  const handleLogout = () => {
    removeToken()
    navigate('/admin/login')
  }

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/admin/applications/${id}`)
      setApplications(applications.filter(app => app.id !== id))
    } catch (error) {
      console.error('Ошибка удаления заявки:', error)
      alert('Не удалось удалить заявку')
    }
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

  if (!currentAdmin) {
    return null
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
        <div className="max-w-[95vw] xl:max-w-[98vw] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-strong rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                Админ-панель
              </h1>
              <p className="text-lg text-slate-300">
                Добро пожаловать, <span className="text-primary-400 font-semibold">{currentAdmin.username}</span>!
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsStatisticsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Статистика
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Выйти
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-strong rounded-3xl shadow-2xl p-4 md:p-6 mb-6"
        >
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('applications')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'applications'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Заявки
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('services')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'services'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Услуги
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('admins')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'admins'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Администраторы
            </motion.button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-strong rounded-3xl shadow-2xl p-6 md:p-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-white/10 text-red-300 border border-white/20 backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          {isLoading && activeTab !== 'services' ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : activeTab === 'services' ? (
            <ServicesManager />
          ) : activeTab === 'applications' ? (
            <div>
              {/* Статистика */}
              {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm"
                  >
                    <div className="text-slate-400 text-sm mb-1">Всего заявок</div>
                    <div className="text-2xl font-bold text-white">{statistics.total}</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm"
                  >
                    <div className="text-slate-300 text-sm mb-1">🔥 Горячих</div>
                    <div className="text-2xl font-bold text-white">{statistics.by_temperature.hot}</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm"
                  >
                    <div className="text-slate-300 text-sm mb-1">🌡️ Теплых</div>
                    <div className="text-2xl font-bold text-white">{statistics.by_temperature.medium}</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm"
                  >
                    <div className="text-slate-300 text-sm mb-1">❄️ Холодных</div>
                    <div className="text-2xl font-bold text-white">{statistics.by_temperature.cold}</div>
                  </motion.div>
                </div>
              )}
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Заявки ({applications.length})
              </h2>
              {applications.length === 0 ? (
                <div className="text-center py-12 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <p className="text-slate-300 text-lg">Заявок пока нет</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 px-2">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left p-3 text-slate-300 font-semibold w-[140px]">Температура</th>
                        <th className="text-left p-3 text-slate-300 font-semibold w-[160px]">Клиент</th>
                        <th className="text-left p-3 text-slate-300 font-semibold w-[180px]">Услуга</th>
                        <th className="text-left p-3 text-slate-300 font-semibold w-[140px]">Ниша</th>
                        <th className="text-left p-3 text-slate-300 font-semibold w-[100px]">Компания</th>
                        <th className="text-left p-3 text-slate-300 font-semibold w-[110px]">Бюджет</th>
                        <th className="text-left p-3 text-slate-300 font-semibold w-[130px]">Отдел</th>
                        <th className="text-left p-3 text-slate-300 font-semibold w-[140px]">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                  {applications.map((app) => (
                        <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                          className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                          <td className="p-3">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                              <span className="text-base">{getTemperatureIcon(app.temperature)}</span>
                              <span className="font-semibold text-white text-xs">{app.temperature_info?.label || app.temperature}</span>
                              <span className="text-xs text-slate-400">({app.temperature_score})</span>
                          </div>
                          </td>
                          <td className="p-3">
                            <div className="text-white font-semibold text-sm">{app.first_name} {app.last_name}</div>
                            <div className="text-xs text-slate-400 truncate">{app.email || app.phone}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-300 text-sm truncate" title={getServiceName(app.service_id)}>
                              {getServiceName(app.service_id)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-300 text-sm truncate" title={app.business_niche || '-'}>
                              {app.business_niche || '-'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-300 text-sm">
                              {app.company_size || '-'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-300 text-sm">
                              {formatBudget(app.budget)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-300 text-sm truncate" title={app.department || '-'}>
                              {app.department || '-'}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleViewApplication(app.id)}
                                className="px-2.5 py-1.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap"
                              >
                                Открыть
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteApplication(app.id)}
                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                              >
                                Удалить
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                  ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Администраторы ({admins.length})
              </h2>
              {admins.length === 0 ? (
                <div className="text-center py-12 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <p className="text-slate-300 text-lg">Администраторов нет</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <motion.div
                      key={admin.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white/10 rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2">
                            {admin.username}
                          </h3>
                          <p className="text-slate-300 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {admin.email}
                          </p>
                          <p className="text-sm text-slate-400 mt-3">
                            Создан: {formatDate(admin.created_at)}
                          </p>
                        </div>
                        {admin.id === currentAdmin.id && (
                          <span className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold shadow-lg">
                            Вы
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Модальное окно статистики */}
      <BehaviorStatisticsModal
        isOpen={isStatisticsModalOpen}
        onClose={() => setIsStatisticsModalOpen(false)}
      />
      
      {/* Модальное окно детального просмотра заявки */}
      {isApplicationModalOpen && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-3xl shadow-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-white">
                Заявка #{selectedApplication.id}
              </h2>
              <button
                onClick={() => setIsApplicationModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Температура */}
            <div className="mb-6 p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{getTemperatureIcon(selectedApplication.temperature)}</span>
                <div>
                  <div className="text-xl font-bold text-white">{selectedApplication.temperature_info?.label}</div>
                  <div className="text-sm text-slate-400">Балл: {selectedApplication.temperature_score}/100</div>
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-2">{selectedApplication.temperature_info?.description}</p>
              <p className="text-sm font-semibold text-white">{selectedApplication.temperature_info?.needs_manager}</p>
            </div>
            
            {/* Информация о клиенте */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Имя</div>
                <div className="text-white font-semibold">{selectedApplication.first_name} {selectedApplication.last_name}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Телефон</div>
                <div className="text-white">{selectedApplication.phone || '-'}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Email</div>
                <div className="text-white">{selectedApplication.email || '-'}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Роль</div>
                <div className="text-white">{selectedApplication.role || '-'}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm md:col-span-2">
                <div className="text-slate-400 text-sm mb-1">Услуга</div>
                <div className="text-white font-semibold text-lg">{getServiceName(selectedApplication.service_id)}</div>
              </div>
            </div>
            
            {/* Бизнес информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Ниша бизнеса</div>
                <div className="text-white">{selectedApplication.business_niche || '-'}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Размер компании</div>
                <div className="text-white">{selectedApplication.company_size || '-'}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Объем задачи</div>
                <div className="text-white">{selectedApplication.task_volume || '-'}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Сроки</div>
                <div className="text-white">{selectedApplication.deadline || '-'}</div>
              </div>
            </div>
            
            {/* Бюджет и отдел */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Бюджет</div>
                <div className="text-white text-xl font-bold">{formatBudget(selectedApplication.budget)}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Рекомендуемый отдел</div>
                <div className="text-white text-lg font-semibold">{selectedApplication.department || '-'}</div>
              </div>
            </div>
            
            {/* Комментарий */}
            {selectedApplication.comments && (
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm mb-6">
                <div className="text-slate-400 text-sm mb-2">Комментарий</div>
                <div className="text-white">{selectedApplication.comments}</div>
              </div>
            )}
            
            {/* Контакты */}
            <div className="flex gap-3">
              {selectedApplication.phone && (
                <motion.a
                  href={`tel:${selectedApplication.phone}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-center transition-all"
                >
                  📞 Позвонить
                </motion.a>
              )}
              {selectedApplication.email && (
                <motion.a
                  href={`mailto:${selectedApplication.email}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-center transition-all"
                >
                  ✉️ Написать
                </motion.a>
              )}
            </div>
            
            <div className="text-sm text-slate-400 mt-4 text-center">
              Создано: {formatDate(selectedApplication.created_at)}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel

