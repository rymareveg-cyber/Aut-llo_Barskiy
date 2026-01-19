#!/bin/bash

# Скрипт для создания самоподписанных сертификатов для Docker Registry
# ВНИМАНИЕ: Для продакшена используйте сертификаты от доверенного CA

echo "Создание самоподписанных сертификатов для Docker Registry..."

# Создаем директорию для сертификатов
mkdir -p certs

# Генерируем приватный ключ
openssl genrsa -out certs/domain.key 4096

# Генерируем самоподписанный сертификат
openssl req -new -x509 -days 365 -key certs/domain.key -out certs/domain.crt \
    -subj "/C=RU/ST=State/L=City/O=Autello/CN=localhost" \
    -addext "subjectAltName=IP:127.0.0.1,DNS:localhost"

echo "Сертификаты созданы:"
echo "  - certs/domain.key (приватный ключ)"
echo "  - certs/domain.crt (сертификат)"
echo ""
echo "ВНИМАНИЕ: Это самоподписанные сертификаты!"
echo "Для использования на удаленной машине:"
echo "  1. Скопируйте certs/domain.crt на клиентскую машину"
echo "  2. Добавьте сертификат в систему доверенных:"
echo "     - Linux: sudo cp domain.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"
echo "     - macOS: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain domain.crt"
echo "     - Windows: Импортируйте через certmgr.msc"
echo ""
echo "Или используйте --insecure-registry для разработки (не рекомендуется для продакшена)"

