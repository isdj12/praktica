@echo off
echo ===================================
echo Запуск приложения "Каталог игр"
echo ===================================
echo.

REM Проверка наличия Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не установлен!
    echo Пожалуйста, установите Node.js с сайта https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Проверка наличия npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] npm не установлен!
    echo Пожалуйста, установите npm вместе с Node.js
    echo.
    pause
    exit /b 1
)

REM Проверка наличия MySQL
mysql --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [ПРЕДУПРЕЖДЕНИЕ] MySQL не найден в системном пути.
    echo Если MySQL установлен, но не добавлен в PATH, добавьте его вручную.
    echo Например: PATH=%%PATH%%;C:\Program Files\MySQL\MySQL Server 8.0\bin
    echo.
    echo Если MySQL не установлен, запустите скрипт установки-mysql.bat
    echo.
    choice /C YN /M "Продолжить запуск приложения без проверки MySQL?"
    if errorlevel 2 (
        echo Выход из скрипта.
        pause
        exit /b 1
    )
)

REM Проверка наличия установленных модулей
if not exist node_modules (
    echo Установка зависимостей Node.js...
    call npm install
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось установить зависимости!
        pause
        exit /b 1
    )
)

REM Запуск приложения
echo Запуск сервера на порту 3002...
echo.
echo Для доступа к приложению откройте в браузере: http://localhost:3002
echo Для остановки сервера нажмите Ctrl+C
echo.
npm run dev

pause 