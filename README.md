# Autéllo Barskiy - Docker Compose Setup

## Описание

Docker Compose конфигурация для проекта Autéllo Barskiy с изолированными сервисами. Проект включает Backend (FastAPI), Frontend (React + Vite), PostgreSQL и Nginx как единую точку входа.

## Структура проекта

```
Autéllo_Barskiy/
├── docker-compose.yml      # Основная конфигурация Docker Compose
├── .env                    # Переменные окружения (создайте самостоятельно)
├── README.md               # Документация
├── backend/                # Backend приложение (FastAPI)
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
│   ├── core/               # Базовая конфигурация
│   ├── models/             # Модели данных
│   └── routes/              # API маршруты
├── frontend/               # Frontend приложение (React + Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── src/                # Исходный код
│   └── dist/               # Собранные файлы
└── nginx/                  # Конфигурация Nginx
    ├── nginx.conf
    ├── ssl/                # SSL сертификаты (создайте при необходимости)
    └── conf.d/
        └── default.conf
```

## Сервисы

- **Nginx** - прокси-сервер, единственная точка входа (порты 80, 443)
- **PostgreSQL** - база данных (доступна только через внутреннюю сеть)
- **Backend** - серверная часть на FastAPI (доступен только через Nginx по `/api/`)
- **Frontend** - клиентская часть на React + Vite (работает на хост-машине на порту 3000, проксируется через Nginx)
- **Watchtower** - автоматическое обновление контейнеров

## Быстрый старт

### 1. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# PostgreSQL настройки
POSTGRES_PASSWORD=your_strong_password_here
```

### 2. Настройка Frontend

Frontend работает на хост-машине через Vite dev-сервер. Установите зависимости и запустите:

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:3000` и автоматически проксируется через Nginx на `http://localhost/`.

**Примечание:** Для продакшена соберите Frontend (`npm run build`) и настройте Nginx для раздачи статических файлов из `frontend/dist/`.

### 3. Запуск сервисов

```bash
docker compose up -d
```

### 4. Проверка работы

- **Frontend через Nginx:** http://localhost/
- **Backend API через Nginx:** http://localhost/api/
- **Backend Swagger документация:** http://localhost/api/docs
- **Nginx Health Check:** http://localhost/health

## Backend API

Backend построен на FastAPI и предоставляет REST API для работы с заявками, метриками поведения пользователей и административными настройками.

### Основные эндпоинты:

- **Заявки (Leads):** `/api/leads/` - CRUD операции для заявок клиентов
- **Поведение пользователей:** `/api/user-behavior/` - метрики поведения на странице
- **Административные настройки:** `/api/admin-config/` - динамические настройки интерфейса
- **Аутентификация:** `/api/auth/` - регистрация и авторизация администраторов
- **Документация:** http://localhost/api/docs - Swagger UI

Подробная документация API доступна в `backend/README.md`.

### Переменные окружения Backend:

Backend использует переменные из `docker-compose.yml`:
- `POSTGRES_USER` - пользователь БД (по умолчанию: `autello_user`)
- `POSTGRES_PASSWORD` - пароль БД (из `.env`)
- `POSTGRES_DB` - имя БД (по умолчанию: `autello_db`)
- `POSTGRES_HOST` - хост БД (по умолчанию: `postgres`)
- `POSTGRES_PORT` - порт БД (по умолчанию: `5432`)

## Frontend

Frontend построен на React 18 с использованием Vite, Tailwind CSS и Framer Motion.

### Разработка:

```bash
cd frontend
npm install
npm run dev
```

Frontend доступен на `http://localhost:3000` и автоматически проксируется через Nginx.

### Сборка для продакшена:

```bash
cd frontend
npm run build
```

Собранные файлы будут в `frontend/dist/`. Для раздачи статических файлов через Nginx обновите конфигурацию `nginx/conf.d/default.conf`.

Подробная документация доступна в `frontend/README.md`.

## Безопасность

- Все сервисы изолированы в отдельной сети `autello_network`
- PostgreSQL доступна только через внутреннюю сеть Docker
- **Backend API закрыт от внешнего доступа** - порт 8000 доступен только внутри Docker network
- Backend доступен только через Nginx по пути `/api/`
- Frontend проксируется через Nginx
- Используйте сильные пароли в `.env` файле
- Для продакшена настройте TLS сертификаты от доверенного CA для Nginx
- Настройте SSL сертификаты в `nginx/ssl/` для HTTPS (порт 443)

## Управление

```bash
# Запуск
docker compose up -d

# Остановка
docker compose down

# Просмотр логов
docker compose logs -f [service_name]

# Перезапуск сервиса
docker compose restart [service_name]

# Обновление конфигурации
docker compose up -d --force-recreate

# Пересборка Backend образа
docker compose build backend
docker compose up -d backend
```

## Watchtower

Watchtower автоматически обновляет контейнеры каждые 3600 секунд (1 час).

Для отключения автообновления конкретного сервиса добавьте метку:
```yaml
labels:
  - "com.centurylinklabs.watchtower.enable=false"
```

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Хост-машина                          │
│  ┌──────────────┐                                       │
│  │  Frontend    │  :3000 (Vite dev-server)             │
│  │  (React)     │                                       │
│  └──────┬───────┘                                       │
└─────────┼───────────────────────────────────────────────┘
          │
          │ HTTP
          ▼
┌─────────────────────────────────────────────────────────┐
│              Docker Network (autello_network)            │
│                                                          │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐     │
│  │  Nginx   │──────│ Backend  │──────│PostgreSQL│     │
│  │  :80/443 │      │  :8000   │      │  :5432   │     │
│  │          │      │ (expose) │      │ (internal)│    │
│  └──────────┘      └──────────┘      └──────────┘     │
│       │                                                 │
│       │                                                 │
│  ┌────▼─────┐                                          │
│  │Watchtower│                                          │
│  └──────────┘                                          │
└─────────────────────────────────────────────────────────┘
```

**Важно:**
- Backend порт 8000 **не открыт** для внешнего доступа
- Все запросы к API проходят через Nginx по пути `/api/`
- PostgreSQL доступна только внутри Docker network

## Troubleshooting

### Backend не запускается

1. Проверьте логи: `docker compose logs backend`
2. Убедитесь, что PostgreSQL запущена и здорова: `docker compose ps`
3. Проверьте переменные окружения в `.env`

### Frontend не доступен

1. Убедитесь, что Frontend запущен на хост-машине: `npm run dev` в папке `frontend`
2. Проверьте, что Nginx проксирует на правильный адрес (по умолчанию `172.17.0.1:3000`)
3. Проверьте логи Nginx: `docker compose logs nginx`

### API не отвечает через Nginx

1. Проверьте, что Backend контейнер запущен: `docker compose ps backend`
2. Проверьте логи Backend: `docker compose logs backend`
3. Проверьте логи Nginx: `docker compose logs nginx`
4. Убедитесь, что запросы идут на `/api/`, а не напрямую на порт 8000

### Проблемы с подключением к PostgreSQL

1. Используйте имя контейнера `postgres`, а не `localhost` (для подключения из других контейнеров)
2. Проверьте переменные окружения в `.env`
3. Убедитесь, что контейнер запущен: `docker compose ps`

## Лицензия

Этот проект является частным и предназначен для внутреннего использования.
