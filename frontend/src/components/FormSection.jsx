import { motion } from 'framer-motion'

const FormSection = ({ title, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <h2 className="text-2xl font-display font-semibold text-white mb-6 pb-3 border-b border-white/10">
        {title}
      </h2>
      {children}
    </motion.div>
  )
}

export default FormSection

