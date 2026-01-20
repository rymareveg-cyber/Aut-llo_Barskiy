# Autello Backend API

FastAPI приложение для работы с заявками клиентов (лидами), метриками поведения пользователей и административными настройками.

## Структура проекта

```
backend/
├── core/              # Базовая конфигурация
│   ├── __init__.py
│   └── database.py    # Подключение к PostgreSQL
├── models/            # Модели данных с CRUD операциями
│   ├── __init__.py
│   ├── lead.py        # Модель заявок клиентов
│   ├── user_behavior.py  # Модель поведения пользователей
│   └── admin_config.py   # Модель административных настроек
├── routes/            # API маршруты
│   ├── __init__.py
│   ├── leads.py
│   ├── user_behavior.py
│   └── admin_config.py
├── main.py            # Основное приложение
├── requirements.txt   # Зависимости Python
└── Dockerfile         # Docker образ

```

## Модели данных

### 1. Lead (Заявки клиентов)
Хранит информацию о клиентах и их заявках:
- Контактные данные (имя, фамилия, отчество)
- Информация о бизнесе (ниша, размер компании, объем задачи, роль)
- Бюджет и способ связи
- Комментарии

### 2. UserBehavior (Поведение пользователей)
Хранит метрики поведения на странице:
- Время на странице
- Клики по кнопкам
- Позиции курсора
- Частота возвратов
- Глубина прокрутки

Связь с Lead: один-к-одному (через lead_id)

### 3. AdminConfig (Административные настройки)
Хранит настройки для динамического формирования интерфейса:
- Список услуг
- Диапазоны бюджета
- Другие конфигурационные данные

## API Endpoints

### Заявки (Leads)
- `POST /leads/` - Создать новую заявку
- `GET /leads/` - Получить список заявок (с пагинацией)
- `GET /leads/{lead_id}` - Получить заявку по ID
- `PUT /leads/{lead_id}` - Обновить заявку
- `DELETE /leads/{lead_id}` - Удалить заявку

### Поведение пользователей (User Behavior)
- `POST /user-behavior/` - Создать запись о поведении
- `GET /user-behavior/` - Получить все записи
- `GET /user-behavior/{behavior_id}` - Получить по ID
- `GET /user-behavior/lead/{lead_id}` - Получить по lead_id
- `PUT /user-behavior/{behavior_id}` - Обновить запись
- `PUT /user-behavior/lead/{lead_id}` - Обновить по lead_id
- `DELETE /user-behavior/{behavior_id}` - Удалить запись

### Административные настройки (Admin Config)
- `POST /admin-config/` - Создать настройку
- `GET /admin-config/` - Получить все настройки
- `GET /admin-config/{config_id}` - Получить по ID
- `GET /admin-config/key/{config_key}` - Получить по ключу
- `PUT /admin-config/{config_id}` - Обновить настройку
- `PUT /admin-config/key/{config_key}` - Обновить по ключу
- `DELETE /admin-config/{config_id}` - Удалить настройку
- `DELETE /admin-config/key/{config_key}` - Удалить по ключу

### Системные
- `GET /` - Корневой эндпоинт
- `GET /health` - Проверка здоровья приложения
- `GET /docs` - Swagger документация (автоматически генерируется)

## Переменные окружения

Создайте файл `.env` в корне папки backend:

```env
POSTGRES_USER=autello_user
POSTGRES_PASSWORD=change_me_in_production
POSTGRES_DB=autello_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
```

## Запуск

### Локально (для разработки)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker

Backend автоматически запускается через docker-compose в корне проекта.

Приложение доступно по адресу: `http://localhost:8000`
Swagger документация: `http://localhost:8000/docs`

## Особенности

- Все данные хранятся локально в PostgreSQL
- Backend доступен только внутри Docker сети (через nginx proxy)
- Автоматическое создание таблиц при запуске
- Полный набор CRUD операций для всех моделей
- Валидация данных через Pydantic

