import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE_URL = '/api'

const BehaviorStatisticsModal = ({ isOpen, onClose }) => {
  const [statistics, setStatistics] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [heatmapCanvas, setHeatmapCanvas] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadStatistics()
    }
  }, [isOpen])

  useEffect(() => {
    if (statistics && statistics.all_cursor_positions && heatmapCanvas) {
      // Небольшая задержка для правильной инициализации canvas
      setTimeout(() => {
        drawHeatmap(heatmapCanvas, statistics.all_cursor_positions)
      }, 100)
    }
  }, [statistics, heatmapCanvas])

  const loadStatistics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_BASE_URL}/behavior-metrics/statistics/summary`)
      setStatistics(response.data)
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
      setError('Не удалось загрузить статистику')
    } finally {
      setIsLoading(false)
    }
  }

  const drawPageBackground = (ctx, width, height) => {
    // Рисуем фон страницы
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(1, '#1e1b4b')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Форма должна занимать всю высоту canvas для корректного отображения координат
    const formWidth = width * 0.65
    const formHeight = height * 1.0  // Форма на всю высоту canvas
    const formX = (width - formWidth) / 2
    const formY = 0  // Форма начинается с самого верха

    // Фон формы
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.fillRect(formX, formY, formWidth, formHeight)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 2
    ctx.strokeRect(formX, formY, formWidth, formHeight)

    // Заголовок формы
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Autéllo', formX + formWidth / 2, formY + 30)
    ctx.font = '14px Arial'
    ctx.fillText('Оставьте заявку и мы свяжемся с вами', formX + formWidth / 2, formY + 55)

    // Поля формы (уменьшенные размеры для размещения всех полей)
    const fieldHeight = 32
    const fieldSpacing = 14
    let currentY = formY + 75

    // Поле выбора услуги
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(formX + 15, currentY, formWidth - 30, fieldHeight)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.strokeRect(formX + 15, currentY, formWidth - 30, fieldHeight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('Выберите услугу', formX + 25, currentY + 20)
    currentY += fieldHeight + fieldSpacing

    // Поля имени и фамилии (рядом)
    const nameWidth = (formWidth - 45) / 2
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(formX + 15, currentY, nameWidth, fieldHeight)
    ctx.strokeRect(formX + 15, currentY, nameWidth, fieldHeight)
    ctx.fillText('Имя', formX + 25, currentY + 20)
    
    ctx.fillRect(formX + 25 + nameWidth, currentY, nameWidth, fieldHeight)
    ctx.strokeRect(formX + 25 + nameWidth, currentY, nameWidth, fieldHeight)
    ctx.fillText('Фамилия', formX + 35 + nameWidth, currentY + 20)
    currentY += fieldHeight + fieldSpacing

    // Переключатель Телефон/Email
    const toggleWidth = 70
    const toggleHeight = 28
    ctx.fillStyle = 'rgba(99, 102, 241, 0.4)'
    ctx.fillRect(formX + 15, currentY, toggleWidth, toggleHeight)
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)'
    ctx.strokeRect(formX + 15, currentY, toggleWidth, toggleHeight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = '11px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Телефон', formX + 15 + toggleWidth / 2, currentY + 18)
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(formX + 20 + toggleWidth, currentY, toggleWidth, toggleHeight)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.strokeRect(formX + 20 + toggleWidth, currentY, toggleWidth, toggleHeight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.fillText('Email', formX + 20 + toggleWidth + toggleWidth / 2, currentY + 18)
    
    currentY += toggleHeight + 8

    // Поле контакта
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(formX + 15, currentY, formWidth - 30, fieldHeight)
    ctx.strokeRect(formX + 15, currentY, formWidth - 30, fieldHeight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('+7 (999) 123-45-67', formX + 25, currentY + 20)
    currentY += fieldHeight + fieldSpacing

    // Поле комментария
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(formX + 15, currentY, formWidth - 30, fieldHeight * 1.5)
    ctx.strokeRect(formX + 15, currentY, formWidth - 30, fieldHeight * 1.5)
    ctx.fillText('Дополнительная информация', formX + 25, currentY + 18)
    currentY += fieldHeight * 1.5 + fieldSpacing + 8

    // Разделитель секции "Информация о проекте"
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(formX + 15, currentY)
    ctx.lineTo(formX + formWidth - 15, currentY)
    ctx.stroke()
    currentY += 12

    // Заголовок секции "Информация о проекте"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('Информация о проекте', formX + 15, currentY)
    currentY += 20

    // Ниша бизнеса
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(formX + 15, currentY, formWidth - 30, fieldHeight)
    ctx.strokeRect(formX + 15, currentY, formWidth - 30, fieldHeight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '11px Arial'
    ctx.fillText('Ниша бизнеса', formX + 25, currentY + 20)
    currentY += fieldHeight + fieldSpacing

    // Размер компании и Объем задачи (рядом)
    const selectWidth = (formWidth - 45) / 2
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(formX + 15, currentY, selectWidth, fieldHeight)
    ctx.strokeRect(formX + 15, currentY, selectWidth, fieldHeight)
    ctx.fillText('Размер компании', formX + 25, currentY + 20)
    
    ctx.fillRect(formX + 25 + selectWidth, currentY, selectWidth, fieldHeight)
    ctx.strokeRect(formX + 25 + selectWidth, currentY, selectWidth, fieldHeight)
    ctx.fillText('Объем задачи', formX + 35 + selectWidth, currentY + 20)
    currentY += fieldHeight + fieldSpacing

    // Роль и Сроки (рядом)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(formX + 15, currentY, selectWidth, fieldHeight)
    ctx.strokeRect(formX + 15, currentY, selectWidth, fieldHeight)
    ctx.fillText('Ваша роль', formX + 25, currentY + 20)
    
    ctx.fillRect(formX + 25 + selectWidth, currentY, selectWidth, fieldHeight)
    ctx.strokeRect(formX + 25 + selectWidth, currentY, selectWidth, fieldHeight)
    ctx.fillText('Сроки выполнения', formX + 35 + selectWidth, currentY + 20)
    currentY += fieldHeight + fieldSpacing

    // Бюджет
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(formX + 15, currentY, formWidth - 30, fieldHeight)
    ctx.strokeRect(formX + 15, currentY, formWidth - 30, fieldHeight)
    ctx.fillText('Примерный бюджет', formX + 25, currentY + 20)
    currentY += fieldHeight + fieldSpacing + 8

    // Кнопка отправки
    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)'
    ctx.fillRect(formX + 15, currentY, formWidth - 30, fieldHeight)
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)'
    ctx.strokeRect(formX + 15, currentY, formWidth - 30, fieldHeight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Отправить заявку', formX + formWidth / 2, currentY + 22)
    currentY += fieldHeight + 8

    // Текст согласия
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = '9px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Нажимая кнопку, вы соглашаетесь с обработкой персональных данных', formX + formWidth / 2, currentY + 10)
  }

  const drawHeatmap = (canvas, positions) => {
    if (!canvas || !positions || positions.length === 0) return

    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const width = canvas.width = rect.width
    const height = canvas.height = rect.height

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height)

    // Рисуем фон страницы с формой
    drawPageBackground(ctx, width, height)

    // Фильтруем валидные позиции
    const validPositions = positions.filter(p => p.x !== undefined && p.y !== undefined && p.x > 0 && p.y > 0)
    if (validPositions.length === 0) return

    // Ограничиваем количество обрабатываемых позиций для производительности
    const maxPositions = 10000
    const positionsToProcess = validPositions.length > maxPositions 
      ? validPositions.slice(0, maxPositions)
      : validPositions

    // Находим максимальные координаты для нормализации (используем reduce вместо spread для больших массивов)
    // Используем реальные максимальные координаты из данных, а не размер окна
    const maxX = positionsToProcess.reduce((max, p) => Math.max(max, p.x || 0), 0)
    const maxY = positionsToProcess.reduce((max, p) => Math.max(max, p.y || 0), 0)
    
    // Определяем параметры формы на canvas (должны совпадать с drawPageBackground)
    const formWidth = width * 0.65
    const formHeight = height * 1.0  // Форма на всю высоту
    const formX = (width - formWidth) / 2
    const formY = 0  // Форма начинается с верха
    
    // Предполагаем, что координаты записаны относительно всего экрана
    // Форма обычно центрирована и занимает ~60% ширины экрана
    // Вычисляем позицию формы на реальном экране
    const screenWidth = maxX > 0 ? maxX : window.innerWidth || 1920
    const screenHeight = maxY > 0 ? maxY : window.innerHeight || 1080
    
    const formWidthOnScreen = screenWidth * 0.6
    const formXOnScreen = (screenWidth - formWidthOnScreen) / 2
    
    // Форма на реальном экране начинается примерно с 10% от верха и занимает большую часть высоты
    // Но учитываем, что форма заканчивается на тексте согласия, который является последним элементом
    const formYOnScreen = screenHeight * 0.1
    const formHeightOnScreen = screenHeight * 0.85  // Форма занимает большую часть высоты до текста согласия
    
    // Масштабируем координаты относительно формы
    const scaleX = formWidth / formWidthOnScreen
    const scaleY = formHeight / formHeightOnScreen  // Используем реальную высоту формы на экране
    
    // Преобразуем координаты относительно формы на canvas
    positionsToProcess.forEach(pos => {
      // Смещаем координаты относительно начала формы на экране
      const relativeX = pos.x - formXOnScreen
      const relativeY = pos.y - formYOnScreen
      
      // Масштабируем и смещаем относительно формы на canvas (formY = 0, так как форма начинается с верха)
      pos._scaledX = relativeX * scaleX + formX
      pos._scaledY = relativeY * scaleY + formY
    })
    
    const densityMap = {}
    const gridSize = 15

    positionsToProcess.forEach(pos => {
      // Используем предвычисленные масштабированные координаты
      const x = pos._scaledX || (pos.x * scaleX)
      const y = pos._scaledY || (pos.y * scaleY)
      
      // Фильтруем координаты, которые выходят за границы canvas
      if (x < 0 || x > width || y < 0 || y > height) return
      
      const gridX = Math.floor(x / gridSize)
      const gridY = Math.floor(y / gridSize)
      const key = `${gridX},${gridY}`
      densityMap[key] = (densityMap[key] || 0) + 1
    })

    // Находим максимальную плотность (используем reduce для безопасности)
    const densityValues = Object.values(densityMap)
    const maxDensity = densityValues.length > 0 
      ? densityValues.reduce((max, val) => Math.max(max, val), 0)
      : 1

    // Рисуем heatmap с градиентом
    Object.entries(densityMap).forEach(([key, density]) => {
      const [gridX, gridY] = key.split(',').map(Number)
      const x = gridX * gridSize + gridSize / 2
      const y = gridY * gridSize + gridSize / 2
      const intensity = Math.min(density / maxDensity, 1)

      // Градиент от синего (низкая) через зеленый к красному (высокая)
      let red, green, blue, alpha
      if (intensity < 0.5) {
        // Синий -> Зеленый
        const t = intensity * 2
        red = 0
        green = Math.floor(255 * t)
        blue = Math.floor(255 * (1 - t))
        alpha = 0.4 + t * 0.3
      } else {
        // Зеленый -> Красный
        const t = (intensity - 0.5) * 2
        red = Math.floor(255 * t)
        green = Math.floor(255 * (1 - t))
        blue = 0
        alpha = 0.7 + t * 0.3
      }

      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`
      ctx.beginPath()
      const radius = 8 + intensity * 20
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()

      // Добавляем обводку для лучшей видимости
      ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.8)`
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Рисуем отдельные точки для детализации (только часть для производительности)
    const sampleSize = Math.min(positionsToProcess.length, 1000)
    const step = Math.max(1, Math.floor(positionsToProcess.length / sampleSize))
    for (let i = 0; i < positionsToProcess.length; i += step) {
      const pos = positionsToProcess[i]
      const x = pos._scaledX || (pos.x * scaleX)
      const y = pos._scaledY || (pos.y * scaleY)
      
      // Фильтруем точки за границами
      if (x < 0 || x > width || y < 0 || y > height) continue
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '0 сек'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    if (mins > 0) {
      return `${mins} мин ${secs} сек`
    }
    return `${secs} сек`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Статистика пользователей</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-white hover:text-red-400 transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-400 text-lg">{error}</p>
              </div>
            ) : statistics ? (
              <div className="space-y-8">
                {/* Среднее время */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-xl p-6 border border-white/10"
                  >
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">За день</h3>
                    <p className="text-3xl font-bold text-primary-400">
                      {formatTime(statistics.avg_time_day)}
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 rounded-xl p-6 border border-white/10"
                  >
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">За неделю</h3>
                    <p className="text-3xl font-bold text-primary-400">
                      {formatTime(statistics.avg_time_week)}
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 rounded-xl p-6 border border-white/10"
                  >
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">За месяц</h3>
                    <p className="text-3xl font-bold text-primary-400">
                      {formatTime(statistics.avg_time_month)}
                    </p>
                  </motion.div>
                </div>

                {/* Хитмап */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 rounded-xl p-6 border border-white/10"
                >
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Хитмап позиций курсора
                  </h3>
                  <p className="text-slate-300 mb-4">
                    Визуализация наиболее популярных областей на странице ({statistics.all_cursor_positions?.length || 0} точек)
                  </p>
                  <div className="relative bg-slate-800 rounded-lg overflow-hidden" style={{ minHeight: '500px', height: '60vh' }}>
                    {/* Canvas с фоном страницы и хитмапом */}
                    <canvas
                      ref={setHeatmapCanvas}
                      className="w-full h-full"
                    />
                    <div className="absolute bottom-4 right-4 bg-black/70 rounded-lg p-3 text-white text-sm z-20">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <span>Низкая активность</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-500"></div>
                          <span>Высокая активность</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default BehaviorStatisticsModal

