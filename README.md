# Autéllo Barskiy - Docker Compose Setup

## Описание

Docker Compose конфигурация для проекта Autéllo Barskiy с изолированными сервисами и локальным Docker Registry. Проект включает Backend (FastAPI), Frontend (React + Vite), PostgreSQL, pgAdmin, Nginx и Docker Registry.

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
│   └── routes/             # API маршруты
├── frontend/               # Frontend приложение (React + Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── src/                # Исходный код
│   └── dist/               # Собранные файлы
├── nginx/                  # Конфигурация Nginx
│   ├── nginx.conf
│   ├── ssl/                # SSL сертификаты (создайте при необходимости)
│   └── conf.d/
│       └── default.conf
└── registry/               # Конфигурация Docker Registry
    ├── auth/
    │   └── htpasswd        # Файл аутентификации (создается скриптом)
    ├── setup-auth.sh       # Скрипт создания аутентификации
    └── setup-certs.sh      # Скрипт создания сертификатов
```

## Сервисы

- **Nginx** - прокси-сервер, единственная точка входа (порты 80, 443)
- **PostgreSQL** - база данных (доступна только через внутреннюю сеть)
- **pgAdmin** - веб-интерфейс для управления БД (доступен через Nginx по `/pgadmin/` или напрямую на порту 5050)
- **Backend** - серверная часть на FastAPI (порт 8000, доступен через Nginx по `/api/`)
- **Frontend** - клиентская часть на React + Vite (работает на хост-машине на порту 3000, проксируется через Nginx)
- **Watchtower** - автоматическое обновление контейнеров
- **Docker Registry** - локальный реестр образов (порт 5000)

## Быстрый старт

### 1. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# PostgreSQL настройки
POSTGRES_PASSWORD=your_strong_password_here

# pgAdmin настройки
PGADMIN_EMAIL=admin@autello.com
PGADMIN_PASSWORD=your_strong_password_here

# Docker Registry Secret (опционально, сгенерируйте: openssl rand -hex 32)
REGISTRY_HTTP_SECRET=your_secret_here
```

### 2. Настройка Docker Registry

#### Создание аутентификации:

```bash
cd registry
chmod +x setup-auth.sh
./setup-auth.sh <username> <password>
```

Пример:
```bash
./setup-auth.sh admin mypassword123
```

#### Создание сертификатов (опционально, для TLS):

```bash
chmod +x setup-certs.sh
./setup-certs.sh
```

После создания сертификатов раскомментируйте строки с `REGISTRY_HTTP_TLS_*` и volume для certs в `docker-compose.yml` в секции `registry`.

**ВНИМАНИЕ:** Для продакшена используйте сертификаты от доверенного CA!

**Примечание:** Registry может работать и без TLS (для разработки). В этом случае используйте `--insecure-registry` на клиентских машинах.

**Важно:** После создания файла `htpasswd` убедитесь, что он находится в `registry/auth/htpasswd` и контейнер registry имеет к нему доступ через volume.

### 3. Настройка Frontend

Frontend работает на хост-машине через Vite dev-сервер. Установите зависимости и запустите:

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:3000` и автоматически проксируется через Nginx на `http://localhost/`.

**Примечание:** Для продакшена соберите Frontend (`npm run build`) и настройте Nginx для раздачи статических файлов из `frontend/dist/`.

### 4. Запуск сервисов

```bash
docker compose up -d
```

### 5. Проверка работы

- **Frontend через Nginx:** http://localhost/
- **Backend API через Nginx:** http://localhost/api/
- **Backend напрямую (для тестирования /docs):** http://localhost:8000
- **Backend Swagger документация:** http://localhost:8000/docs
- **Nginx Health Check:** http://localhost/health
- **pgAdmin через Nginx:** http://localhost/pgadmin/
- **pgAdmin напрямую:** http://localhost:5050
- **Docker Registry:** http://localhost:5000 (или https://localhost:5000 если TLS включен)

## Использование Docker Registry

### Локальный доступ (с той же машины):

```bash
# Вход в реестр
docker login localhost:5000 -u <username> -p <password>

# Тегирование образа
docker tag your-image:tag localhost:5000/your-image:tag

# Отправка образа
docker push localhost:5000/your-image:tag
```

### Удаленный доступ (с другой машины):

1. **Если используете TLS:**
   - Скопируйте `registry/certs/domain.crt` на клиентскую машину
   - Добавьте сертификат в систему доверенных:
     - **Linux:** `sudo cp domain.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates`
     - **macOS:** `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain domain.crt`
     - **Windows:** Импортируйте через `certmgr.msc`

2. **Если НЕ используете TLS (только для разработки):**
   - Настройте Docker daemon: добавьте в `/etc/docker/daemon.json`:
     ```json
     {
       "insecure-registries": ["<server-ip>:5000"]
     }
     ```
   - Перезапустите Docker: `sudo systemctl restart docker`

3. **Вход и использование:**
   ```bash
   docker login <server-ip>:5000 -u <username> -p <password>
   docker tag your-image:tag <server-ip>:5000/your-image:tag
   docker push <server-ip>:5000/your-image:tag
   ```

## Подключение к PostgreSQL через pgAdmin

1. Откройте pgAdmin: http://localhost/pgadmin/ или http://localhost:5050
2. Войдите в pgAdmin (учетные данные из `.env` файла):
   - **Email:** указан в `PGADMIN_EMAIL`
   - **Password:** указан в `PGADMIN_PASSWORD`
3. Добавьте новый сервер:
   - **Name:** любое (например, "Autello PostgreSQL")
   - **Host name/address:** `postgres` (имя контейнера)
   - **Port:** `5432`
   - **Maintenance database:** `autello_db`
   - **Username:** `autello_user`
   - **Password:** из `POSTGRES_PASSWORD` в `.env`
   - ☑️ **Save password**

**Важно:** Используйте хост `postgres`, а не `localhost`, так как pgAdmin работает внутри Docker-сети.

## Backend API

Backend построен на FastAPI и предоставляет REST API для работы с заявками, метриками поведения пользователей и административными настройками.

### Основные эндпоинты:

- **Заявки (Leads):** `/api/leads/` - CRUD операции для заявок клиентов
- **Поведение пользователей:** `/api/user-behavior/` - метрики поведения на странице
- **Административные настройки:** `/api/admin-config/` - динамические настройки интерфейса
- **Документация:** http://localhost:8000/docs - Swagger UI

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
- PostgreSQL доступна только через внутреннюю сеть
- Backend доступен через Nginx по пути `/api/` (порт 8000 открыт временно для тестирования `/docs`)
- Frontend проксируется через Nginx
- Docker Registry защищен аутентификацией и HTTP Secret
- pgAdmin доступен через Nginx по пути `/pgadmin/` или напрямую на порту 5050
- Используйте сильные пароли в `.env` файле
- Для продакшена настройте TLS сертификаты от доверенного CA для Nginx и Registry
- Используйте валидный email для pgAdmin (не `.local` домен)
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
Он не обновляет сам себя и registry (благодаря меткам).

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
│  └────┬─────┘      └──────────┘      └──────────┘     │
│       │                                                 │
│       ├──────────────────┐                             │
│       │                  │                             │
│  ┌────▼─────┐      ┌─────▼─────┐                      │
│  │ pgAdmin │      │  Registry │                       │
│  │  :5050  │      │   :5000   │                       │
│  └─────────┘      └───────────┘                       │
│                                                          │
│  ┌──────────┐                                          │
│  │Watchtower│                                          │
│  └──────────┘                                          │
└─────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Backend не запускается

1. Проверьте логи: `docker compose logs backend`
2. Убедитесь, что PostgreSQL запущена и здорова: `docker compose ps`
3. Проверьте переменные окружения в `.env`

### Frontend не доступен

1. Убедитесь, что Frontend запущен на хост-машине: `npm run dev` в папке `frontend`
2. Проверьте, что Nginx проксирует на правильный адрес (по умолчанию `172.17.0.1:3000`)
3. Проверьте логи Nginx: `docker compose logs nginx`

### Проблемы с Docker Registry

1. Убедитесь, что файл `registry/auth/htpasswd` создан
2. Проверьте права доступа к файлу
3. Проверьте логи: `docker compose logs registry`

### Проблемы с подключением к PostgreSQL

1. Используйте имя контейнера `postgres`, а не `localhost`
2. Проверьте переменные окружения в `.env`
3. Убедитесь, что контейнер запущен: `docker compose ps`
