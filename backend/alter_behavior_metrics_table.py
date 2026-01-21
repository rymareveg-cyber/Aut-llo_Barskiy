"""
Скрипт для изменения таблицы behavior_metrics - убираем ограничения на application_id.
Выполните этот скрипт, чтобы сделать таблицу пригодной для анонимных метрик.
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Получаем параметры подключения
POSTGRES_USER = os.getenv("POSTGRES_USER", "autello_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "change_me_in_production")
POSTGRES_DB = os.getenv("POSTGRES_DB", "autello_db")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

# Формируем URL подключения
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

def alter_behavior_metrics_table():
    """Изменяет таблицу behavior_metrics для поддержки анонимных метрик."""
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        
        with engine.connect() as conn:
            # Начинаем транзакцию
            trans = conn.begin()
            
            try:
                # 1. Удаляем foreign key constraint (если существует)
                print("Удаление foreign key constraint...")
                conn.execute(text("""
                    DO $$ 
                    BEGIN
                        IF EXISTS (
                            SELECT 1 
                            FROM information_schema.table_constraints 
                            WHERE constraint_name = 'behavior_metrics_application_id_fkey'
                            AND table_name = 'behavior_metrics'
                        ) THEN
                            ALTER TABLE behavior_metrics 
                            DROP CONSTRAINT behavior_metrics_application_id_fkey;
                        END IF;
                    END $$;
                """))
                
                # 2. Удаляем unique constraint (если существует)
                print("Удаление unique constraint...")
                conn.execute(text("""
                    DO $$ 
                    BEGIN
                        IF EXISTS (
                            SELECT 1 
                            FROM information_schema.table_constraints 
                            WHERE constraint_name = 'behavior_metrics_application_id_key'
                            AND table_name = 'behavior_metrics'
                        ) THEN
                            ALTER TABLE behavior_metrics 
                            DROP CONSTRAINT behavior_metrics_application_id_key;
                        END IF;
                    END $$;
                """))
                
                # 3. Изменяем колонку application_id - убираем NOT NULL, делаем nullable
                print("Изменение колонки application_id...")
                conn.execute(text("""
                    ALTER TABLE behavior_metrics 
                    ALTER COLUMN application_id DROP NOT NULL;
                """))
                
                # 4. Устанавливаем значение по умолчанию 0 для существующих NULL значений
                print("Установка значений по умолчанию...")
                conn.execute(text("""
                    UPDATE behavior_metrics 
                    SET application_id = 0 
                    WHERE application_id IS NULL;
                """))
                
                # 5. Устанавливаем значение по умолчанию для колонки
                conn.execute(text("""
                    ALTER TABLE behavior_metrics 
                    ALTER COLUMN application_id SET DEFAULT 0;
                """))
                
                # Коммитим транзакцию
                trans.commit()
                print("✅ Таблица behavior_metrics успешно изменена!")
                print("   - Удален foreign key constraint")
                print("   - Удален unique constraint")
                print("   - application_id теперь nullable с default 0")
                return True
            except Exception as e:
                trans.rollback()
                raise e
                
    except Exception as e:
        print(f"❌ Ошибка при изменении таблицы: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Изменение таблицы behavior_metrics для анонимных метрик...")
    print("=" * 60)
    alter_behavior_metrics_table()

