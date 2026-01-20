import { useEffect } from 'react'
import AnimatedBackground from './components/AnimatedBackground'
import ApplicationForm from './components/ApplicationForm'
import { useBehaviorMetrics } from './hooks/useBehaviorMetrics'

function App() {
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

export default App

