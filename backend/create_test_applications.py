"""
Скрипт для создания тестовых заявок с разной температурой льда.
Создает 10 заявок: 4 горячих (hot), 3 теплых (medium), 3 холодных (cold).
"""
import sys
import os
# Добавляем путь к корню проекта
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from core.database import SessionLocal
# Импортируем все модели для корректной работы relationships
from models import admin_settings as admin_settings_model
from models.applications import Application, ApplicationCreate, ApplicationCRUD
from models.temperature_analysis import calculate_temperature_score

# Тестовые данные для создания заявок
test_applications = [
    # 4 ГОРЯЧИХ ЗАЯВКИ (hot) - разные критерии
    {
        "first_name": "Александр",
        "last_name": "Петров",
        "phone": "+7 (999) 123-45-67",
        "email": "alex.petrov@fintech.ru",
        "business_niche": "финтех",
        "company_size": "enterprise",
        "task_volume": "large",
        "role": "CEO",
        "deadline": "urgent",
        "budget": 2500000.00,
        "comments": "Срочно нужна разработка платформы для криптовалютных операций. Готовы начать немедленно."
    },
    {
        "first_name": "Мария",
        "last_name": "Соколова",
        "phone": "+7 (999) 234-56-78",
        "email": "maria.sokolova@healthcare.com",
        "business_niche": "медицина",
        "company_size": "large",
        "task_volume": "enterprise",
        "role": "Генеральный директор",
        "deadline": "1-2 недели",
        "budget": 1800000.00,
        "comments": "Разработка системы управления клиникой. Крупная сеть медицинских центров."
    },
    {
        "first_name": "Дмитрий",
        "last_name": "Иванов",
        "phone": "+7 (999) 345-67-89",
        "email": "dmitry.ivanov@energy.ru",
        "business_niche": "энергетика",
        "company_size": "enterprise",
        "task_volume": "large",
        "role": "CTO",
        "deadline": "asap",
        "budget": 3200000.00,
        "comments": "Внедрение системы автоматизации на нефтеперерабатывающем заводе. Срочно."
    },
    {
        "first_name": "Елена",
        "last_name": "Кузнецова",
        "phone": "+7 (999) 456-78-90",
        "email": "elena.kuznetsova@realestate.ru",
        "business_niche": "недвижимость",
        "company_size": "large",
        "task_volume": "enterprise",
        "role": "Основатель",
        "deadline": "urgent",
        "budget": 1500000.00,
        "comments": "Разработка платформы для управления недвижимостью. Крупная девелоперская компания."
    },
    
    # 3 ТЕПЛЫХ ЗАЯВКИ (medium)
    {
        "first_name": "Иван",
        "last_name": "Смирнов",
        "phone": "+7 (999) 567-89-01",
        "email": "ivan.smirnov@retail.ru",
        "business_niche": "e-commerce",
        "company_size": "medium",
        "task_volume": "medium",
        "role": "Менеджер",
        "deadline": "1 месяц",
        "budget": 350000.00,
        "comments": "Нужен интернет-магазин для продажи товаров. Средний бизнес."
    },
    {
        "first_name": "Ольга",
        "last_name": "Новикова",
        "phone": "+7 (999) 678-90-12",
        "email": "olga.novikova@manufacturing.com",
        "business_niche": "производство",
        "company_size": "medium",
        "task_volume": "medium",
        "role": "Руководитель отдела",
        "deadline": "1-2 недели",
        "budget": 450000.00,
        "comments": "Автоматизация производственных процессов. Среднее предприятие."
    },
    {
        "first_name": "Сергей",
        "last_name": "Волков",
        "phone": "+7 (999) 789-01-23",
        "email": "sergey.volkov@consulting.ru",
        "business_niche": "консалтинг",
        "company_size": "small",
        "task_volume": "large",
        "role": "CFO",
        "deadline": "flexible",
        "budget": 280000.00,
        "comments": "Разработка системы для консалтинговой компании. Гибкие сроки."
    },
    
    # 3 ХОЛОДНЫХ ЗАЯВКИ (cold)
    {
        "first_name": "Анна",
        "last_name": "Морозова",
        "phone": "+7 (999) 890-12-34",
        "email": "anna.morozova@startup.io",
        "business_niche": "стартап",
        "company_size": "startup",
        "task_volume": "small",
        "role": "Маркетолог",
        "deadline": "flexible",
        "budget": 50000.00,
        "comments": "Нужен простой сайт для стартапа. Очень ограниченный бюджет."
    },
    {
        "first_name": "Павел",
        "last_name": "Лебедев",
        "phone": "+7 (999) 901-23-45",
        "email": "pavel.lebedev@smallbiz.ru",
        "business_niche": "услуги",
        "company_size": "small",
        "task_volume": "small",
        "role": "Владелец",
        "deadline": "гибкие",
        "budget": 80000.00,
        "comments": "Небольшой сайт для парикмахерской. Бюджет ограничен."
    },
    {
        "first_name": "Татьяна",
        "last_name": "Федорова",
        "phone": "+7 (999) 012-34-56",
        "email": "tatiana.fedorova@local.ru",
        "business_niche": "местный бизнес",
        "company_size": "startup",
        "task_volume": "small",
        "role": "Менеджер",
        "deadline": "flexible",
        "budget": 30000.00,
        "comments": "Простая визитка для небольшого бизнеса. Минимальный бюджет."
    }
]


def create_test_applications():
    """Создает тестовые заявки в базе данных."""
    db: Session = SessionLocal()
    
    try:
        print("Создание тестовых заявок...")
        created_count = 0
        
        for app_data in test_applications:
            # Проверяем температуру перед созданием
            score, temperature, department = calculate_temperature_score(
                business_niche=app_data.get("business_niche"),
                company_size=app_data.get("company_size"),
                task_volume=app_data.get("task_volume"),
                role=app_data.get("role"),
                deadline=app_data.get("deadline"),
                budget=app_data.get("budget")
            )
            
            print(f"\nСоздание заявки: {app_data['first_name']} {app_data['last_name']}")
            print(f"  Температура: {temperature} (балл: {score})")
            print(f"  Отдел: {department}")
            
            # Создаем заявку
            application_create = ApplicationCreate(**app_data)
            application = ApplicationCRUD.create(db=db, application_data=application_create)
            created_count += 1
            
            print(f"  ✓ Заявка создана с ID: {application.id}")
        
        print(f"\n✅ Успешно создано {created_count} тестовых заявок!")
        
        # Подсчитываем статистику
        # Получаем все заявки без сортировки
        all_apps = db.query(Application).all()
        hot_count = 0
        medium_count = 0
        cold_count = 0
        
        for app in all_apps:
            _, temp, _ = calculate_temperature_score(
                business_niche=app.business_niche,
                company_size=app.company_size,
                task_volume=app.task_volume,
                role=app.role,
                deadline=app.deadline,
                budget=float(app.budget) if app.budget else None
            )
            if temp == "hot":
                hot_count += 1
            elif temp == "medium":
                medium_count += 1
            else:
                cold_count += 1
        
        print(f"\n📊 Статистика:")
        print(f"  🔥 Горячих: {hot_count}")
        print(f"  🌡️ Теплых: {medium_count}")
        print(f"  ❄️ Холодных: {cold_count}")
        print(f"  Всего: {len(all_apps)}")
        
    except Exception as e:
        print(f"❌ Ошибка при создании заявок: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_test_applications()

