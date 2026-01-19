# Autéllo Barskiy - Docker Compose Setup

## Описание

Docker Compose конфигурация для проекта Autéllo Barskiy с изолированными сервисами и локальным Docker Registry.

## Структура проекта

```
Autéllo_Barskiy/
├── docker-compose.yml      # Основная конфигурация Docker Compose
├── .env                    # Переменные окружения (создайте самостоятельно)
├── README.md               # Документация
├── nginx/                  # Конфигурация Nginx
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
└── registry/               # Конфигурация Docker Registry
    ├── auth/
    │   └── htpasswd        # Файл аутентификации (создается скриптом)
    └── setup-auth.sh       # Скрипт создания аутентификации
```

## Сервисы

- **Nginx** - прокси-сервер, единственная точка входа (порты 80, 443)
- **PostgreSQL** - база данных (доступна только через внутреннюю сеть)
- **pgAdmin** - веб-интерфейс для управления БД (доступен через Nginx по `/pgadmin/` или напрямую на порту 5050)
- **Backend** - серверная часть (закомментирован, настройте после создания образа)
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
./setup-auth.sh <username> <password>
```

Пример:
```bash
./setup-auth.sh admin mypassword123
```

#### Создание сертификатов (опционально, для TLS):

```bash
./setup-certs.sh
```

После создания сертификатов раскомментируйте строки с `REGISTRY_HTTP_TLS_*` и volume для certs в `docker-compose.yml` в секции `registry`.

**ВНИМАНИЕ:** Для продакшена используйте сертификаты от доверенного CA!

**Примечание:** Registry может работать и без TLS (для разработки). В этом случае используйте `--insecure-registry` на клиентских машинах.

**Важно:** После создания файла `htpasswd` убедитесь, что он находится в `registry/auth/htpasswd` и контейнер registry имеет к нему доступ через volume.

### 3. Запуск сервисов

```bash
docker compose up -d
```

### 4. Проверка работы

- Nginx: http://localhost/health
- pgAdmin через Nginx: http://localhost/pgadmin/
- pgAdmin напрямую: http://localhost:5050
- Docker Registry: http://localhost:5000 (или https://localhost:5000 если TLS включен)

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

## Настройка Backend

После создания образа Backend:

1. Раскомментируйте секцию `backend` в `docker-compose.yml`
2. Убедитесь, что образ доступен в registry: `localhost:5000/autello-backend:latest`
3. Настройте переменные окружения в секции `backend`
4. Обновите конфигурацию Nginx в `nginx/conf.d/default.conf` для проксирования `/api`

## Безопасность

- Все сервисы изолированы в отдельной сети `autello_network`
- PostgreSQL доступна только через внутреннюю сеть
- Backend доступен только через Nginx (после настройки)
- Docker Registry защищен аутентификацией и HTTP Secret
- pgAdmin доступен через Nginx по пути `/pgadmin/` или напрямую на порту 5050
- Используйте сильные пароли в `.env` файле
- Для продакшена настройте TLS сертификаты от доверенного CA
- Используйте валидный email для pgAdmin (не `.local` домен)

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
```

## Watchtower

Watchtower автоматически обновляет контейнеры каждые 3600 секунд (1 час).
Он не обновляет сам себя и registry (благодаря меткам).

Для отключения автообновления конкретного сервиса добавьте метку:
```yaml
labels:
  - "com.centurylinklabs.watchtower.enable=false"
```

