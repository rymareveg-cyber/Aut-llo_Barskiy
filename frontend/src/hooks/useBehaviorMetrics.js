import { useEffect, useRef } from 'react'
import axios from 'axios'

// Используем относительный путь /api для работы через Nginx прокси
const API_BASE_URL = '/api'

export const useBehaviorMetrics = () => {
  const startTimeRef = useRef(Date.now())
  const scrollDepthRef = useRef(0)
  const buttonsClickedRef = useRef([])
  const cursorPositionsRef = useRef([])
  const pageViewsRef = useRef(1)
  const applicationIdRef = useRef(null)

  useEffect(() => {
    // Отслеживание времени на странице
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

    // Отслеживание кликов по кнопкам
    const handleButtonClick = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        const buttonText = e.target.textContent || e.target.closest('button')?.textContent
        buttonsClickedRef.current.push({
          text: buttonText,
          timestamp: Date.now(),
        })
      }
    }

    // Отслеживание позиций курсора
    const lastMousePosition = { x: 0, y: 0 }
    const handleMouseMove = (e) => {
      lastMousePosition.x = e.clientX
      lastMousePosition.y = e.clientY
    }
    
    let cursorTrackingInterval
    const startCursorTracking = () => {
      window.addEventListener('mousemove', handleMouseMove)
      cursorTrackingInterval = setInterval(() => {
        cursorPositionsRef.current.push({
          x: lastMousePosition.x,
          y: lastMousePosition.y,
          timestamp: Date.now(),
        })
        // Ограничиваем размер массива
        if (cursorPositionsRef.current.length > 100) {
          cursorPositionsRef.current = cursorPositionsRef.current.slice(-50)
        }
      }, 1000) // Каждую секунду
    }

    // Проверка возврата на страницу
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pageViewsRef.current += 1
      }
    }

    window.addEventListener('scroll', handleScroll)
    document.addEventListener('click', handleButtonClick)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    startCursorTracking()

    // Отправка метрик при уходе со страницы
    const handleBeforeUnload = async () => {
      const timeOnPage = updateTimeOnPage()
      
      const metricsData = {
        application_id: applicationIdRef.current || 0, // Будет обновлено после создания заявки
        time_on_page: timeOnPage,
        buttons_clicked: JSON.stringify(buttonsClickedRef.current),
        cursor_positions: JSON.stringify(cursorPositionsRef.current.slice(-20)), // Последние 20 позиций
        return_frequency: pageViewsRef.current - 1,
        page_views: pageViewsRef.current,
        scroll_depth: scrollDepthRef.current,
      }

      // Отправляем метрики только если есть application_id
      if (applicationIdRef.current) {
        try {
          await axios.post(`${API_BASE_URL}/behavior-metrics`, metricsData)
        } catch (error) {
          console.error('Failed to send behavior metrics:', error)
        }
      }
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
      handleBeforeUnload()
    }
  }, [])

  const startTracking = () => {
    startTimeRef.current = Date.now()
    pageViewsRef.current = 1
  }

  const setApplicationId = (id) => {
    applicationIdRef.current = id
  }

  return {
    startTracking,
    setApplicationId,
  }
}

