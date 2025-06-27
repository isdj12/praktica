import dotenv from 'dotenv';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Загружаем переменные окружения
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Путь к файлу SQLite
const SQLITE_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

// Настройки подключения к MySQL
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'game_catalog',
  timezone: '+00:00',
  charset: 'utf8mb4'
};

// Функция для обработки ошибок
function handleError(error, message) {
  console.error(`${message}:`, error);
  process.exit(1);
}

// Основная функция миграции
async function migrateToMySQL() {
  let sqliteDb = null;
  let mysqlConnection = null;

  try {
    console.log('Начинаем миграцию данных из SQLite в MySQL...');

    // Проверка доступности файла SQLite
    if (!fs.existsSync(SQLITE_PATH)) {
      console.error(`Ошибка: файл базы данных SQLite не найден по пути ${SQLITE_PATH}`);
      console.log('Проверьте значение DB_PATH в файле .env');
      process.exit(1);
    }

    // Подключаемся к SQLite
    console.log(`Подключаемся к SQLite базе данных: ${SQLITE_PATH}`);
    try {
      sqliteDb = await open({
        filename: SQLITE_PATH,
        driver: sqlite3.Database
      });
      console.log('Подключение к SQLite успешно установлено');
    } catch (error) {
      console.error('Ошибка подключения к SQLite:', error.message);
      process.exit(1);
    }

    // Проверяем, есть ли в SQLite данные для миграции
    const tablesExist = await checkSQLiteTables(sqliteDb);
    if (!tablesExist) {
      console.log('В SQLite не найдены необходимые таблицы с данными для миграции');
      console.log('Миграция не требуется или база данных пуста');
      process.exit(0);
    }

    // Подключаемся к MySQL
    console.log('Подключаемся к MySQL серверу...');
    try {
      mysqlConnection = await mysql.createConnection({
        host: mysqlConfig.host,
        port: mysqlConfig.port,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        connectTimeout: 10000 // 10 секунд таймаут
      });
      console.log('Подключение к MySQL успешно установлено');
    } catch (error) {
      console.error('Ошибка подключения к MySQL. Проверьте настройки подключения и доступность сервера:');
      console.error(`- Хост: ${mysqlConfig.host}`);
      console.error(`- Порт: ${mysqlConfig.port}`);
      console.error(`- Пользователь: ${mysqlConfig.user}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.error('\nСервер MySQL не запущен или недоступен по указанному адресу.');
        console.error('Убедитесь, что MySQL сервер запущен и доступен.');
        
        if (mysqlConfig.host === 'localhost' || mysqlConfig.host === '127.0.0.1') {
          console.error('\nЕсли вы используете Docker:');
          console.error('1. Убедитесь, что Docker запущен');
          console.error('2. Запустите контейнер: docker-compose up -d');
          console.error('3. Проверьте, что контейнер запущен: docker ps');
        }
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('\nОтказано в доступе. Проверьте правильность имени пользователя и пароля.');
      } else {
        console.error('\nОшибка:', error.message);
      }
      
      process.exit(1);
    }

    // Создаем базу данных, если она не существует
    console.log(`Создаем базу данных ${mysqlConfig.database}, если она не существует...`);
    await mysqlConnection.query(`CREATE DATABASE IF NOT EXISTS ${mysqlConfig.database}`);
    
    // Переключаемся на созданную базу данных
    await mysqlConnection.query(`USE ${mysqlConfig.database}`);

    // Создаем все необходимые таблицы в MySQL
    console.log('Создаем таблицы в MySQL...');
    
    // Создаем таблицу пользователей
    await mysqlConnection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Создаем таблицу игр
    await mysqlConnection.query(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        platform VARCHAR(255),
        multiplayer VARCHAR(100),
        genre VARCHAR(100),
        ageRating VARCHAR(50),
        releaseDate VARCHAR(100),
        image VARCHAR(255),
        userId INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Создаем таблицу тегов игр
    await mysqlConnection.query(`
      CREATE TABLE IF NOT EXISTS game_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        tag VARCHAR(100) NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Создаем таблицу скриншотов игр
    await mysqlConnection.query(`
      CREATE TABLE IF NOT EXISTS game_screenshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        screenshot_url VARCHAR(255) NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Создаем таблицу кликов игр
    await mysqlConnection.query(`
      CREATE TABLE IF NOT EXISTS game_clicks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        click_count INT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Создаем таблицу игр пользователей
    await mysqlConnection.query(`
      CREATE TABLE IF NOT EXISTS user_games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        game_id INT NOT NULL,
        game_name VARCHAR(255) NOT NULL,
        game_image VARCHAR(255),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, game_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Создаем таблицу файлов игр
    await mysqlConnection.query(`
      CREATE TABLE IF NOT EXISTS game_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Миграция пользователей
    console.log('Мигрируем пользователей...');
    try {
      // Получаем пользователей из SQLite
      const users = await sqliteDb.all('SELECT * FROM users');
      console.log(`Найдено ${users.length} пользователей для миграции.`);
      
      // Вставляем пользователей в MySQL
      if (users.length > 0) {
        for (const user of users) {
          await mysqlConnection.query(
            'INSERT INTO users (id, username, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, user.username, user.email, user.password, user.role, user.created_at]
          );
        }
        console.log('Миграция пользователей завершена успешно.');
      } else {
        console.log('Нет пользователей для миграции.');
      }
    } catch (error) {
      console.warn('Ошибка при миграции пользователей:', error.message);
      console.warn('Продолжаем миграцию...');
    }

    // Миграция игр
    console.log('Мигрируем игры...');
    try {
      // Получаем игры из SQLite
      const games = await sqliteDb.all('SELECT * FROM games');
      console.log(`Найдено ${games.length} игр для миграции.`);
      
      // Вставляем игры в MySQL
      if (games.length > 0) {
        for (const game of games) {
          await mysqlConnection.query(
            'INSERT INTO games (id, name, description, platform, multiplayer, genre, ageRating, releaseDate, image, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [game.id, game.name, game.description, game.platform, game.multiplayer, game.genre, game.ageRating, game.releaseDate, game.image, game.userId, game.createdAt]
          );
        }
        console.log('Миграция игр завершена успешно.');
      } else {
        console.log('Нет игр для миграции.');
      }
    } catch (error) {
      console.warn('Ошибка при миграции игр:', error.message);
      console.warn('Продолжаем миграцию...');
    }

    // Миграция тегов игр
    console.log('Мигрируем теги игр...');
    try {
      // Получаем теги из SQLite
      const tags = await sqliteDb.all('SELECT * FROM game_tags');
      console.log(`Найдено ${tags.length} тегов игр для миграции.`);
      
      // Вставляем теги в MySQL
      for (const tag of tags) {
        await mysqlConnection.query(
          'INSERT INTO game_tags (id, game_id, tag) VALUES (?, ?, ?)',
          [tag.id, tag.game_id, tag.tag]
        );
      }
      console.log('Миграция тегов игр завершена успешно.');
    } catch (error) {
      console.warn('Ошибка при миграции тегов игр:', error.message);
      console.warn('Продолжаем миграцию...');
    }

    // Миграция скриншотов игр
    console.log('Мигрируем скриншоты игр...');
    try {
      // Получаем скриншоты из SQLite
      const screenshots = await sqliteDb.all('SELECT * FROM game_screenshots');
      console.log(`Найдено ${screenshots.length} скриншотов игр для миграции.`);
      
      // Вставляем скриншоты в MySQL
      for (const screenshot of screenshots) {
        await mysqlConnection.query(
          'INSERT INTO game_screenshots (id, game_id, screenshot_url) VALUES (?, ?, ?)',
          [screenshot.id, screenshot.game_id, screenshot.screenshot_url]
        );
      }
      console.log('Миграция скриншотов игр завершена успешно.');
    } catch (error) {
      console.warn('Ошибка при миграции скриншотов игр:', error.message);
      console.warn('Продолжаем миграцию...');
    }

    // Миграция кликов игр
    console.log('Мигрируем статистику кликов игр...');
    try {
      // Получаем клики из SQLite
      const clicks = await sqliteDb.all('SELECT * FROM game_clicks');
      console.log(`Найдено ${clicks.length} записей о кликах игр для миграции.`);
      
      // Вставляем клики в MySQL
      for (const click of clicks) {
        await mysqlConnection.query(
          'INSERT INTO game_clicks (id, game_id, click_count, last_updated) VALUES (?, ?, ?, ?)',
          [click.id, click.game_id, click.click_count, click.last_updated]
        );
      }
      console.log('Миграция статистики кликов игр завершена успешно.');
    } catch (error) {
      console.warn('Ошибка при миграции статистики кликов игр:', error.message);
      console.warn('Продолжаем миграцию...');
    }

    // Миграция игр пользователей
    console.log('Мигрируем игры пользователей...');
    try {
      // Получаем игры пользователей из SQLite
      const userGames = await sqliteDb.all('SELECT * FROM user_games');
      console.log(`Найдено ${userGames.length} игр пользователей для миграции.`);
      
      // Вставляем игры пользователей в MySQL
      for (const userGame of userGames) {
        await mysqlConnection.query(
          'INSERT INTO user_games (id, user_id, game_id, game_name, game_image, added_at) VALUES (?, ?, ?, ?, ?, ?)',
          [userGame.id, userGame.user_id, userGame.game_id, userGame.game_name, userGame.game_image, userGame.added_at]
        );
      }
      console.log('Миграция игр пользователей завершена успешно.');
    } catch (error) {
      console.warn('Ошибка при миграции игр пользователей:', error.message);
      console.warn('Продолжаем миграцию...');
    }

    // Миграция файлов игр
    console.log('Мигрируем файлы игр...');
    try {
      // Получаем файлы игр из SQLite
      const gameFiles = await sqliteDb.all('SELECT * FROM game_files');
      console.log(`Найдено ${gameFiles.length} файлов игр для миграции.`);
      
      // Вставляем файлы игр в MySQL
      for (const gameFile of gameFiles) {
        await mysqlConnection.query(
          'INSERT INTO game_files (id, game_id, filename, file_path, file_size, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)',
          [gameFile.id, gameFile.game_id, gameFile.filename, gameFile.file_path, gameFile.file_size, gameFile.uploaded_at]
        );
      }
      console.log('Миграция файлов игр завершена успешно.');
    } catch (error) {
      console.warn('Ошибка при миграции файлов игр:', error.message);
      console.warn('Продолжаем миграцию...');
    }

    console.log('\n✅ Миграция данных из SQLite в MySQL завершена успешно!');
    console.log('\nТеперь вы можете переключить приложение на использование MySQL, установив DB_TYPE=mysql в файле .env');
    console.log('Для этого выполните следующие шаги:');
    console.log('1. Откройте файл .env');
    console.log('2. Измените строку DB_TYPE=sqlite на DB_TYPE=mysql');
    console.log('3. Перезапустите приложение: npm start');

  } catch (error) {
    handleError(error, 'Произошла ошибка при миграции данных');
  } finally {
    // Закрываем соединения
    if (sqliteDb) {
      try {
        await sqliteDb.close();
      } catch (error) {
        console.error('Ошибка при закрытии соединения с SQLite:', error);
      }
    }
    
    if (mysqlConnection) {
      try {
        await mysqlConnection.end();
      } catch (error) {
        console.error('Ошибка при закрытии соединения с MySQL:', error);
      }
    }
  }
}

// Функция для проверки наличия таблиц в SQLite
async function checkSQLiteTables(db) {
  try {
    // Проверяем наличие таблицы users
    const userTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    
    // Если есть хотя бы одна таблица, считаем что есть данные для миграции
    return !!userTable;
  } catch (error) {
    console.error('Ошибка при проверке таблиц SQLite:', error);
    return false;
  }
}

// Запускаем миграцию
migrateToMySQL(); 