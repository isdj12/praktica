import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Загружаем переменные окружения
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbAsync;

// Инициализация подключения к MySQL
async function initDatabaseConnection() {
  try {
    // Подключаемся к MySQL
    console.log('Подключение к MySQL...');
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'gameuser',
      password: process.env.MYSQL_PASSWORD || 'gameuser',
      database: process.env.MYSQL_DATABASE || 'game_catalog',
      timezone: '+00:00',
      charset: 'utf8mb4'
    }).catch(error => {
      console.error('Ошибка подключения к MySQL:', error.message);
      throw error;
    });

    // Создаем базу данных, если она не существует
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || 'game_catalog'}`);
    
    // Используем созданную базу данных
    await connection.query(`USE ${process.env.MYSQL_DATABASE || 'game_catalog'}`);
    
    console.log('Подключение к MySQL успешно установлено');
    
    // Расширяем connection для совместимости с предыдущим кодом
    connection.run = async (query, params) => {
      const [result] = await connection.query(query, params);
      return { lastID: result.insertId, changes: result.affectedRows };
    };
    
    connection.get = async (query, params) => {
      const [rows] = await connection.query(query, params);
      return rows[0];
    };
    
    connection.all = async (query, params) => {
      const [rows] = await connection.query(query, params);
      return rows;
    };
    
    connection.exec = async (query) => {
      await connection.query(query);
    };
    
    dbAsync = connection;
    return connection;
  } catch (error) {
    console.error('Критическая ошибка при подключении к MySQL:', error.message);
    console.error('Убедитесь, что MySQL сервер запущен и доступен.');
    console.error('Проверьте настройки подключения в файле .env:');
    console.error(`- Хост: ${process.env.MYSQL_HOST || 'localhost'}`);
    console.error(`- Порт: ${process.env.MYSQL_PORT || '3306'}`);
    console.error(`- Пользователь: ${process.env.MYSQL_USER || 'gameuser'}`);
    throw new Error(`Не удалось подключиться к MySQL: ${error.message}`);
  }
}

// Инициализируем соединение с базой данных
try {
  dbAsync = await initDatabaseConnection();
} catch (error) {
  console.error('Критическая ошибка при подключении к базе данных:', error);
  process.exit(1);
}

// Создаем таблицы, если они не существуют
async function initDatabase() {
  try {
    // Таблица пользователей
    await dbAsync.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Таблица игр
    await dbAsync.exec(`
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

    // Таблица игр пользователей
    await dbAsync.exec(`
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

    // Таблица для хранения файлов игр
    await dbAsync.exec(`
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

    // Таблица для тегов игр
    await dbAsync.exec(`
      CREATE TABLE IF NOT EXISTS game_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        tag VARCHAR(100) NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Таблица для скриншотов игр
    await dbAsync.exec(`
      CREATE TABLE IF NOT EXISTS game_screenshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        screenshot_url VARCHAR(255) NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Таблица для отслеживания кликов
    await dbAsync.exec(`
      CREATE TABLE IF NOT EXISTS game_clicks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        click_count INT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('База данных MySQL инициализирована успешно');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    throw new Error(`Не удалось инициализировать базу данных MySQL: ${error.message}`);
  }
}

// Инициализируем базу данных
await initDatabase().catch(error => {
  console.error('Ошибка при создании таблиц:', error);
  process.exit(1);
});

// Добавляем обработку разрыва соединения
process.on('SIGINT', async () => {
  try {
    if (dbAsync) {
      console.log('Закрываем соединение с базой данных...');
      await dbAsync.end();
      console.log('Соединение с базой данных закрыто.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при закрытии соединения с базой данных:', error);
    process.exit(1);
  }
});

export { dbAsync }; 