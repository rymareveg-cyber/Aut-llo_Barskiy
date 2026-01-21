"""
Скрипт для миграции таблицы applications.
Добавляет новые поля для анализа температуры льда.
"""
from sqlalchemy import text
from core.database import engine

def migrate_applications_table():
    """Выполняет миграцию таблицы applications."""
    migration_sql = """
    -- Добавляем новые поля, если их еще нет
    DO $$ 
    BEGIN
        -- business_niche
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='applications' AND column_name='business_niche'
        ) THEN
            ALTER TABLE applications ADD COLUMN business_niche VARCHAR(255);
        END IF;
        
        -- company_size
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='applications' AND column_name='company_size'
        ) THEN
            ALTER TABLE applications ADD COLUMN company_size VARCHAR(50);
        END IF;
        
        -- task_volume
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='applications' AND column_name='task_volume'
        ) THEN
            ALTER TABLE applications ADD COLUMN task_volume VARCHAR(50);
        END IF;
        
        -- role
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='applications' AND column_name='role'
        ) THEN
            ALTER TABLE applications ADD COLUMN role VARCHAR(255);
        END IF;
        
        -- deadline
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='applications' AND column_name='deadline'
        ) THEN
            ALTER TABLE applications ADD COLUMN deadline VARCHAR(255);
        END IF;
        
        -- budget
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='applications' AND column_name='budget'
        ) THEN
            ALTER TABLE applications ADD COLUMN budget NUMERIC(15, 2);
        END IF;
    END $$;
    """
    
    try:
        print("Выполнение миграции таблицы applications...")
        with engine.connect() as connection:
            connection.execute(text(migration_sql))
            connection.commit()
        print("✅ Миграция успешно выполнена!")
        print("\nДобавлены следующие поля:")
        print("  - business_niche (VARCHAR(255))")
        print("  - company_size (VARCHAR(50))")
        print("  - task_volume (VARCHAR(50))")
        print("  - role (VARCHAR(255))")
        print("  - deadline (VARCHAR(255))")
        print("  - budget (NUMERIC(15, 2))")
    except Exception as e:
        print(f"❌ Ошибка при выполнении миграции: {e}")
        raise


if __name__ == "__main__":
    migrate_applications_table()

