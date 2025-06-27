@echo off
echo Скрипт для загрузки и установки MySQL
echo ====================================
echo.

echo Проверка, установлен ли MySQL...
mysql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo MySQL уже установлен! 
    echo Версия MySQL:
    mysql --version
    echo.
    echo Проверяем наличие пользователя gameuser...
    
    mysql -u root -p -e "SELECT User FROM mysql.user WHERE User='gameuser';" >nul 2>&1
    if %errorlevel% equ 0 (
        echo Пользователь gameuser уже существует.
    ) else (
        echo Создаем пользователя gameuser...
        echo.
        echo Введите пароль пользователя root для MySQL:
        mysql -u root -p -e "CREATE USER 'gameuser'@'localhost' IDENTIFIED BY 'gamepassword'; GRANT ALL PRIVILEGES ON game_catalog.* TO 'gameuser'@'localhost'; FLUSH PRIVILEGES;"
        
        if %errorlevel% equ 0 (
            echo Пользователь gameuser успешно создан!
        ) else (
            echo Не удалось создать пользователя. Пожалуйста, выполните этот шаг вручную.
        )
    )
    
    echo.
    echo Теперь вы можете запустить миграцию данных с помощью файла миграция-на-mysql.bat
    goto :eof
)

echo MySQL не установлен.
echo.
echo Это скрипт запустит браузер для загрузки MySQL Installer.
echo.
echo Инструкции по установке:
echo 1. Скачайте MySQL Installer (выберите Community Edition)
echo 2. Запустите установщик и следуйте инструкциям на экране
echo 3. При выборе компонентов выберите MySQL Server и MySQL Workbench
echo 4. Установите пароль root и запомните его
echo 5. Завершите установку
echo 6. После установки запустите этот скрипт еще раз для создания пользователя
echo.
echo Нажмите любую клавишу для открытия страницы загрузки MySQL...
pause >nul

start https://dev.mysql.com/downloads/installer/

echo.
echo После завершения установки запустите этот скрипт снова для создания пользователя gameuser. 