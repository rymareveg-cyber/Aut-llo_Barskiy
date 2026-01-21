-- Миграция таблицы applications для добавления полей анализа температуры льда
-- Выполните этот скрипт, если таблица applications уже существует

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS business_niche VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS task_volume VARCHAR(50),
ADD COLUMN IF NOT EXISTS role VARCHAR(255),
ADD COLUMN IF NOT EXISTS deadline VARCHAR(255),
ADD COLUMN IF NOT EXISTS budget NUMERIC(15, 2);

-- Комментарии к полям
COMMENT ON COLUMN applications.business_niche IS 'Ниша бизнеса клиента';
COMMENT ON COLUMN applications.company_size IS 'Размер компании (startup, small, medium, large, enterprise)';
COMMENT ON COLUMN applications.task_volume IS 'Объем задачи (small, medium, large, enterprise)';
COMMENT ON COLUMN applications.role IS 'Роль заполняющего заявку';
COMMENT ON COLUMN applications.deadline IS 'Сроки выполнения (urgent, 1-2 weeks, 1 month, flexible)';
COMMENT ON COLUMN applications.budget IS 'Бюджет проекта в рублях';

