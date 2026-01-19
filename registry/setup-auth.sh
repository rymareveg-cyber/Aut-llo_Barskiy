#!/bin/bash

# Скрипт для настройки аутентификации Docker Registry
# Использование: ./setup-auth.sh <username> <password>

if [ $# -ne 2 ]; then
    echo "Использование: $0 <username> <password>"
    echo "Пример: $0 admin mypassword123"
    exit 1
fi

USERNAME=$1
PASSWORD=$2

# Проверяем наличие docker
if ! command -v docker &> /dev/null; then
    echo "Ошибка: Docker не установлен"
    exit 1
fi

# Создаем директорию для auth, если её нет
mkdir -p auth

# Создаем htpasswd файл используя docker
echo "Создание файла аутентификации..."
docker run --rm \
    --entrypoint htpasswd \
    httpd:2 \
    -Bbn "$USERNAME" "$PASSWORD" > auth/htpasswd

echo "Файл auth/htpasswd успешно создан!"
echo "Пользователь: $USERNAME"
echo ""
echo "Теперь вы можете использовать:"
echo "  docker login localhost:5000 -u $USERNAME -p $PASSWORD"
echo ""
echo "Для использования с удаленной машины:"
echo "  docker login <server-ip>:5000 -u $USERNAME -p $PASSWORD"

