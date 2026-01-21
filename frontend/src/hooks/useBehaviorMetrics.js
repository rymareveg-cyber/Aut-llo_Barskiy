import { useEffect, useRef } from 'react'
import axios from 'axios'

// Используем относительный путь /api для работы через Nginx прокси
const API_BASE_URL = '/api'

export const useBehaviorMetrics = () => {
  const startTimeRef = useRef(Date.now())
  const scrollDepthRef = useRef(0)
  const buttonsClickedRef = useRef({}) // Объект для подсчета кликов по кнопкам: { "текст кнопки": количество }
  const cursorPositionsRef = useRef([]) // Массив позиций курсора каждую секунду
  const pageViewsRef = useRef(1)
  const applicationIdRef = useRef(0) // По умолчанию 0, как указано в требованиях

  useEffect(() => {
    // Отслеживание времени на странице (в секундах)
    const updateTimeOnPage = () => {
      const timeOnPage = (Date.now() - startTimeRef.current) / 1000 // в секундах
      return timeOnPage
    }

    // Отслеживание глубины прокрутки
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollDepth = scrollTop / (documentHeight - windowHeight)
      scrollDepthRef.current = Math.max(scrollDepthRef.current, scrollDepth)
    }

    // Отслеживание кликов по кнопкам - подсчитываем количество кликов по каждой кнопке
    const handleButtonClick = (e) => {
      const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button')
      if (button) {
        const buttonText = button.textContent?.trim() || button.getAttribute('aria-label') || 'Неизвестная кнопка'
        // Увеличиваем счетчик кликов для этой кнопки
        buttonsClickedRef.current[buttonText] = (buttonsClickedRef.current[buttonText] || 0) + 1
      }
    }

    // Отслеживание позиций курсора
    const lastMousePosition = { x: 0, y: 0 }
    const handleMouseMove = (e) => {
      lastMousePosition.x = e.clientX
      lastMousePosition.y = e.clientY
    }
    
    // Отправка метрик каждую секунду
    const sendMetrics = async () => {
      const timeOnPage = updateTimeOnPage()
      
      // Формируем данные о кликах кнопок в формате JSON
      const buttonsClickedData = JSON.stringify(buttonsClickedRef.current)
      
      // Формируем данные о позициях курсора (все накопленные позиции)
      const cursorPositionsData = JSON.stringify(cursorPositionsRef.current)
      
      const metricsData = {
        application_id: 0, // Всегда 0, как указано в требованиях
        time_on_page: timeOnPage,
        buttons_clicked: buttonsClickedData,
        cursor_positions: cursorPositionsData,
        return_frequency: 0, // Всегда 0, как указано в требованиях
        page_views: pageViewsRef.current,
        scroll_depth: scrollDepthRef.current,
      }

      try {
        const url = `${API_BASE_URL}/behavior-metrics/`
        console.log('Sending metrics to:', url, 'API_BASE_URL:', API_BASE_URL)
        await axios.post(url, metricsData)
      } catch (error) {
        console.error('Failed to send behavior metrics:', error)
        console.error('Request URL was:', error.config?.url || 'unknown')
      }
    }

    // Интервал для отслеживания позиции курсора каждую секунду
    let cursorTrackingInterval
    const startCursorTracking = () => {
      window.addEventListener('mousemove', handleMouseMove)
      cursorTrackingInterval = setInterval(() => {
        // Сохраняем позицию курсора каждую секунду
        cursorPositionsRef.current.push({
          x: lastMousePosition.x,
          y: lastMousePosition.y,
          timestamp: Date.now(),
        })
      }, 1000) // Каждую секунду
    }

    // Интервал для отправки метрик каждую секунду
    let metricsSendInterval
    const startMetricsSending = () => {
      metricsSendInterval = setInterval(() => {
        sendMetrics()
      }, 1000) // Отправляем каждую секунду
    }

    // Проверка возврата на страницу
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pageViewsRef.current += 1
      }
    }

    // Запускаем отслеживание
    window.addEventListener('scroll', handleScroll)
    document.addEventListener('click', handleButtonClick)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    startCursorTracking()
    startMetricsSending()

    // Отправка финальных метрик при уходе со страницы
    const handleBeforeUnload = async () => {
      await sendMetrics()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('click', handleButtonClick)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('mousemove', handleMouseMove)
      if (cursorTrackingInterval) {
        clearInterval(cursorTrackingInterval)
      }
      if (metricsSendInterval) {
        clearInterval(metricsSendInterval)
      }
      // Отправляем финальные метрики при размонтировании
      sendMetrics()
    }
  }, [])

  const startTracking = () => {
    startTimeRef.current = Date.now()
    pageViewsRef.current = 1
    buttonsClickedRef.current = {}
    cursorPositionsRef.current = []
  }

  const setApplicationId = (id) => {
    // Примечание: application_id всегда остается 0 согласно требованиям
    // Но оставляем метод для совместимости
    applicationIdRef.current = id
  }

  return {
    startTracking,
    setApplicationId,
  }
}

