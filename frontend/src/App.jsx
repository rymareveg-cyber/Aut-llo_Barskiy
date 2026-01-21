import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AnimatedBackground from './components/AnimatedBackground'
import ApplicationForm from './components/ApplicationForm'
import Login from './components/Login'
import Register from './components/Register'
import AdminPanel from './components/AdminPanel'
import { useBehaviorMetrics } from './hooks/useBehaviorMetrics'
import { isAuthenticated } from './utils/auth'
import { useEffect } from 'react'

// Компонент для админ-панели - показывает вход, если не авторизован
const AdminRoute = () => {
  if (!isAuthenticated()) {
    return <Login />
  }
  return <AdminPanel />
}

// Компонент для главной страницы (форма заявки)
const HomePage = () => {
  const { startTracking, setApplicationId } = useBehaviorMetrics()

  useEffect(() => {
    startTracking()
  }, [startTracking])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <ApplicationForm onApplicationCreated={setApplicationId} />
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Главная страница с формой заявки */}
        <Route path="/" element={<HomePage />} />
        
        {/* Админ-панель - автоматически показывает страницу входа, если не авторизован */}
        <Route path="/admin" element={<AdminRoute />} />
        
        {/* Страница входа (для прямого доступа) */}
        <Route path="/admin/login" element={<Login />} />
        
        {/* Страница регистрации */}
        <Route path="/admin/register" element={<Register />} />
        
        {/* Редирект на главную для неизвестных маршрутов */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
