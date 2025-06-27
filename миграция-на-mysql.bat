@echo off
echo Миграция данных из SQLite в MySQL
echo ================================
echo.

echo Добавляем путь к MySQL в переменную PATH...
set PATH=%PATH%;C:\Program Files\MySQL\MySQL Server 8.0\bin

echo Проверка подключения к MySQL...
mysql -u gameuser -pgameuser -h localhost -e "SELECT 'Успешное подключение к MySQL!' as info;" 2>nul
if %errorlevel% equ 0 (
    echo Подключение к MySQL успешно установлено.
    echo.
    echo Проверка базы данных game_catalog...
    mysql -u gameuser -pgameuser -h localhost -e "CREATE DATABASE IF NOT EXISTS game_catalog;" 2>nul
    echo База данных game_catalog создана или уже существует.
    echo.
    echo Запуск миграции данных...
    npm run migrate-to-mysql
    
    if %errorlevel% equ 0 (
        echo.
        echo Миграция успешно завершена. Устанавливаем MySQL как базу данных по умолчанию...
        echo DB_TYPE=mysql > .env.tmp
        findstr /v "DB_TYPE=" .env >> .env.tmp
        move /y .env.tmp .env > nul
        echo.
        echo Готово! Теперь вы можете запустить приложение с MySQL.
        echo Для запуска используйте команду: npm start
        echo Или запустите файл запуск-приложения.bat
    ) else (
        echo.
        echo Миграция не удалась. Приложение будет использовать SQLite.
        echo DB_TYPE=sqlite > .env.tmp
        findstr /v "DB_TYPE=" .env >> .env.tmp
        move /y .env.tmp .env > nul
    )
) else (
    echo Не удалось подключиться к MySQL.
    echo.
    echo Перед миграцией необходимо:
    echo 1. Установить MySQL
    echo 2. Запустить MySQL сервер
    echo 3. Создать пользователя gameuser с паролем gameuser
    echo.
    echo Подробные инструкции находятся в файле ИНСТРУКЦИЯ-MYSQL.md
) 