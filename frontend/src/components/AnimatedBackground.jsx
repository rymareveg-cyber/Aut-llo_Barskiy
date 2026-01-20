import { motion } from 'framer-motion'

const AnimatedBackground = () => {
  // Автомобильные формы: колеса, кузов, логотипы
  const shapes = [
    { type: 'wheel', size: 120, x: '10%', y: '20%', delay: 0 },
    { type: 'car', size: 150, x: '80%', y: '15%', delay: 2 },
    { type: 'wheel', size: 100, x: '15%', y: '70%', delay: 4 },
    { type: 'logo', size: 80, x: '85%', y: '60%', delay: 1 },
    { type: 'car', size: 130, x: '50%', y: '80%', delay: 3 },
    { type: 'wheel', size: 90, x: '70%', y: '30%', delay: 5 },
    { type: 'logo', size: 70, x: '30%', y: '40%', delay: 1.5 },
    { type: 'car', size: 110, x: '5%', y: '50%', delay: 2.5 },
  ]

  const renderShape = (shape) => {
    const baseStyle = {
      position: 'absolute',
      left: shape.x,
      top: shape.y,
      opacity: 0.15,
      filter: 'blur(1px)',
    }

    switch (shape.type) {
      case 'wheel':
        return (
          <motion.div
            className="absolute rounded-full border-4 border-primary-500"
            style={{
              ...baseStyle,
              width: shape.size,
              height: shape.size,
            }}
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: {
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              },
              scale: {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1/3 h-1/3 rounded-full bg-primary-400 opacity-50"></div>
            </div>
          </motion.div>
        )

      case 'car':
        return (
          <motion.div
            className="absolute"
            style={{
              ...baseStyle,
              width: shape.size,
              height: shape.size * 0.6,
            }}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -30, 20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: shape.delay,
            }}
          >
            <svg viewBox="0 0 200 120" className="w-full h-full">
              <rect
                x="20"
                y="40"
                width="160"
                height="60"
                rx="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary-500"
              />
              <rect
                x="40"
                y="20"
                width="80"
                height="40"
                rx="5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary-400"
              />
              <circle
                cx="50"
                cy="100"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary-500"
              />
              <circle
                cx="150"
                cy="100"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary-500"
              />
            </svg>
          </motion.div>
        )

      case 'logo':
        return (
          <motion.div
            className="absolute"
            style={{
              ...baseStyle,
              width: shape.size,
              height: shape.size,
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: {
                duration: 30,
                repeat: Infinity,
                ease: 'linear',
              },
              scale: {
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: shape.delay,
              },
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary-500"
              />
              <path
                d="M 30 50 L 50 30 L 70 50 L 50 70 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary-400"
              />
            </svg>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {shapes.map((shape, index) => (
          <div key={`shape-${shape.type}-${index}-${shape.x}-${shape.y}`}>
            {renderShape(shape)}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/30"></div>
    </div>
  )
}

export default AnimatedBackground

