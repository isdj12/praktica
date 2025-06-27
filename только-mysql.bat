@echo off
echo ============================================
echo = Переход на исключительное использование MySQL =
echo ============================================
echo.

echo Добавляем путь к MySQL в переменную PATH...
set PATH=%PATH%;C:\Program Files\MySQL\MySQL Server 8.0\bin

echo Проверяем наличие MySQL...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] MySQL не установлен или не доступен.
    echo Пожалуйста, установите MySQL перед запуском этого скрипта.
    echo.
    echo Для установки MySQL:
    echo 1. Запустите установка-mysql.bat
    echo 2. Следуйте инструкциям по установке MySQL
    echo 3. После установки запустите этот скрипт снова
    exit /b 1
)

echo MySQL найден! Проверяем подключение...
mysql -u gameuser -pgameuser -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удается подключиться к MySQL с учетными данными gameuser.
    echo Убедитесь, что пользователь gameuser создан с паролем gameuser.
    echo.
    echo Для создания пользователя выполните:
    echo 1. Войдите в MySQL как root: mysql -u root -p
    echo 2. Создайте пользователя: CREATE USER 'gameuser'@'localhost' IDENTIFIED BY 'gameuser';
    echo 3. Предоставьте права: GRANT ALL PRIVILEGES ON *.* TO 'gameuser'@'localhost'; FLUSH PRIVILEGES;
    exit /b 1
)

echo Проверяем наличие базы данных...
mysql -u gameuser -pgameuser -e "CREATE DATABASE IF NOT EXISTS game_catalog;" >nul 2>&1
echo База данных game_catalog создана или уже существует.

echo Миграция данных из SQLite в MySQL (если требуется)...
if exist database.sqlite (
    echo Найдена база данных SQLite. Мигрируем данные...
    npm run migrate-to-mysql
    if %errorlevel% neq 0 (
        echo [ПРЕДУПРЕЖДЕНИЕ] Миграция данных не удалась, но мы продолжим настройку.
    ) else (
        echo Миграция данных успешна!
    )
) else (
    echo База данных SQLite не найдена. Пропускаем миграцию.
)

echo Настраиваем .env для использования только MySQL...
echo DB_TYPE=mysql > .env.tmp
findstr /v "DB_TYPE=" .env >> .env.tmp
move /y .env.tmp .env > nul

echo Удаляем зависимости SQLite из package.json...
powershell -Command "(Get-Content package.json) -replace '\"sqlite\": \"\^[0-9.]+\",' -replace '\"sqlite3\": \"\^[0-9.]+\",' | Set-Content package.json"

echo Удаляем скрипты SQLite из package.json...
powershell -Command "(Get-Content package.json) -replace '\"use-sqlite\": \"node switch-database.js sqlite\",' -replace '\"db-help\": \".*migrate-to-mysql.*\"', '\"db-help\": \"echo \\\"Команды для работы с базой данных: npm run use-mysql - Проверить подключение к MySQL\\\"\"' | Set-Content package.json"

echo Заменяем файл подключения к базе данных на версию только для MySQL...
echo Создаем резервную копию оригинального файла db.js...
copy src\database\db.js src\database\db.js.bak > nul
echo Копируем новый файл db.js...
copy src\database\db-mysql-only.js src\database\db.js > nul

echo Модифицируем файл server.js для использования только MySQL...
powershell -Command "(Get-Content src\server.js) -replace 'const dbType = process\.env\.DB_TYPE \|\| ''sqlite'';', 'const dbType = ''mysql'';' -replace 'const dbTypeFormatted = dbType === ''mysql'' \? ''MySQL'' : ''SQLite'';', 'const dbTypeFormatted = ''MySQL'';' | Set-Content src\server.js"

echo Модифицируем файлы для использования только MySQL...
echo @echo off > запуск-приложения-mysql.bat
echo echo ================================== >> запуск-приложения-mysql.bat
echo echo = Запуск приложения с MySQL        = >> запуск-приложения-mysql.bat
echo echo ================================== >> запуск-приложения-mysql.bat
echo echo. >> запуск-приложения-mysql.bat
echo echo Добавляем путь к MySQL в переменную PATH... >> запуск-приложения-mysql.bat
echo set PATH=%%PATH%%;C:\Program Files\MySQL\MySQL Server 8.0\bin >> запуск-приложения-mysql.bat
echo echo Проверка подключения к MySQL... >> запуск-приложения-mysql.bat
echo mysql -u gameuser -pgameuser -e "SELECT 1;" ^>nul 2^>^&1 >> запуск-приложения-mysql.bat
echo if %%errorlevel%% neq 0 ( >> запуск-приложения-mysql.bat
echo     echo [ОШИБКА] Не удается подключиться к MySQL! Проверьте, что: >> запуск-приложения-mysql.bat
echo     echo 1. MySQL сервер запущен >> запуск-приложения-mysql.bat
echo     echo 2. Пользователь gameuser существует >> запуск-приложения-mysql.bat
echo     echo 3. Пароль для gameuser установлен как 'gameuser' >> запуск-приложения-mysql.bat
echo     echo. >> запуск-приложения-mysql.bat
echo     exit /b 1 >> запуск-приложения-mysql.bat
echo ) >> запуск-приложения-mysql.bat
echo echo Подключение к MySQL успешно установлено! >> запуск-приложения-mysql.bat
echo echo. >> запуск-приложения-mysql.bat
echo echo Запуск приложения... >> запуск-приложения-mysql.bat
echo npm start >> запуск-приложения-mysql.bat

echo Удаляем файлы, связанные с SQLite...
if exist database.sqlite (
    echo Создаем резервную копию database.sqlite...
    copy database.sqlite database.sqlite.bak > nul
    echo Удаляем database.sqlite...
    del database.sqlite
)

if exist migrate-to-mysql.js (
    echo Создаем резервную копию migrate-to-mysql.js...
    copy migrate-to-mysql.js migrate-to-mysql.js.bak > nul
    echo Удаляем migrate-to-mysql.js...
    del migrate-to-mysql.js
)

if exist switch-database.js (
    echo Создаем резервную копию switch-database.js...
    copy switch-database.js switch-database.js.bak > nul
    echo Удаляем switch-database.js...
    del switch-database.js
)

if exist миграция-на-mysql.bat (
    echo Создаем резервную копию миграция-на-mysql.bat...
    copy миграция-на-mysql.bat миграция-на-mysql.bat.bak > nul
    echo Удаляем миграция-на-mysql.bat...
    del миграция-на-mysql.bat
)

if exist запуск-приложения.bat (
    del запуск-приложения.bat
)

rename запуск-приложения-mysql.bat запуск-приложения.bat

echo Обновляем модули...
echo Удаляем node_modules...
rd /s /q node_modules

echo Удаляем package-lock.json...
if exist package-lock.json (
    del package-lock.json
)

echo Устанавливаем зависимости заново...
npm install

echo Удаляем ненужные файлы резервных копий...
if exist src\database\db-mysql-only.js (
    del src\database\db-mysql-only.js
)

echo.
echo =====================================================
echo = Переход на исключительное использование MySQL завершен! =
echo =====================================================
echo.
echo Теперь ваше приложение настроено для работы только с MySQL.
echo SQLite полностью удален из проекта.
echo.
echo Для запуска приложения используйте:
echo - npm start
echo - или запустите запуск-приложения.bat
echo.
pause 