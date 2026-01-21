"""
Основное приложение FastAPI для работы с заявками клиентов.
Приложение приватное и доступно только внутри контура машины.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
from routes import applications, behavior_metrics, admin_settings, auth, admin_panel

# Импортируем все модели для корректного создания таблиц и связей
from models import applications as applications_model
from models import behavior_metrics as behavior_metrics_model
from models import admin_settings as admin_settings_model
from models import admin as admin_model

# Создаем все таблицы в базе данных
Base.metadata.create_all(bind=engine)

# Создаем экземпляр FastAPI приложения
app = FastAPI(
    title="Autello Backend API",
    description="Приватный API для работы с заявками клиентов",
    version="1.0.0"
)

# Настройка CORS - только для внутреннего использования
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене можно ограничить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты
app.include_router(applications.router)
app.include_router(behavior_metrics.router)
app.include_router(admin_settings.router)
app.include_router(auth.router)
app.include_router(admin_panel.router)


@app.get("/")
def root():
    """Корневой эндпоинт."""
    return {
        "message": "Autello Backend API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Проверка здоровья приложения."""
    return {"status": "healthy"}

