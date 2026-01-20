import { motion } from 'framer-motion'

const ServiceSelect = ({
  label,
  name,
  value,
  onChange,
  services = [],
  isLoading = false,
  required = false,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <label
        htmlFor={name}
        className="block text-base font-medium text-slate-200 mb-3"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {isLoading ? (
        <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="text-slate-400">Загрузка услуг...</span>
          </div>
        </div>
      ) : (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm appearance-none cursor-pointer text-base"
        >
          <option value="" className="bg-slate-800 text-white">
            Выберите услугу
          </option>
          {services.map((service) => (
            <option
              key={service.id}
              value={service.id}
              className="bg-slate-800 text-white"
            >
              {service.services}
              {service.budget_range && ` - ${service.budget_range}`}
            </option>
          ))}
        </select>
      )}
      {services.length > 0 && value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10"
        >
          {(() => {
            const selectedService = services.find((s) => s.id === parseInt(value))
            return selectedService?.budget_range ? (
              <div className="text-sm text-slate-300">
                <p className="font-medium mb-1">Диапазон бюджета:</p>
                <p>{selectedService.budget_range}</p>
              </div>
            ) : null
          })()}
        </motion.div>
      )}
    </motion.div>
  )
}

export default ServiceSelect

