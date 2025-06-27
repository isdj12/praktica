@echo off
setlocal enabledelayedexpansion

echo ===================================
echo = Проверка подключения к MySQL... =
echo ===================================

:: Проверяем доступность MySQL
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo MySQL не установлен или не запущен.
    echo Приложение будет запущено с использованием SQLite.
    
    :: Устанавливаем SQLite в .env
    powershell -Command "(Get-Content .env) -replace 'DB_TYPE=mysql', 'DB_TYPE=sqlite' | Set-Content .env"
    
    goto start_app
)

:: Проверяем подключение к MySQL
echo Проверка соединения с MySQL...
mysql -u gameuser -pgameuser -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo Не удалось подключиться к MySQL. Проверьте, что сервер запущен и пользователь gameuser создан.
    echo Приложение будет запущено с использованием SQLite.
    
    :: Устанавливаем SQLite в .env
    powershell -Command "(Get-Content .env) -replace 'DB_TYPE=mysql', 'DB_TYPE=sqlite' | Set-Content .env"
    
    goto start_app
)

echo MySQL доступен и работает.
echo Приложение будет запущено с использованием MySQL.

:: Устанавливаем MySQL в .env
powershell -Command "(Get-Content .env) -replace 'DB_TYPE=sqlite', 'DB_TYPE=mysql' | Set-Content .env"
 r
:start_app
echo.
echo ==============================
echo = Запуск приложения...      =
echo ==============================

:: Запускаем приложение
npm start

echo.
echo Приложение завершило работу.
echo Для повторного запуска выполните этот скрипт снова.

endlocal 