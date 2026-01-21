"""
Скрипт для создания таблицы admins в базе данных.
Выполните этот скрипт, если таблица не создалась автоматически при запуске backend.
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

def create_admins_table():
    """Создает таблицу admins в базе данных."""
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        
        with engine.connect() as conn:
            # Создаем таблицу
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS admins (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # Создаем индексы
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
            """))
            
            conn.commit()
            print("✅ Таблица admins успешно создана!")
            return True
    except Exception as e:
        print(f"❌ Ошибка при создании таблицы: {e}")
        return False

if __name__ == "__main__":
    print("Создание таблицы admins...")
    create_admins_table()

