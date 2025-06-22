import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Определяем путь к базе данных в зависимости от окружения
const DB_PATH = process.env.NODE_ENV === 'production'
  ? process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite')
  : path.join(__dirname, '../../database.sqlite');

// Убедимся, что директория для базы данных существует
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Открываем соединение с базой данных
export const dbAsync = await open({
  filename: DB_PATH,
  driver: sqlite3.Database
});

// Создаем таблицы, если они не существуют
async function initDatabase() {
  try {
    // Таблица пользователей
    await dbAsync.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица игр пользователей
    await dbAsync.exec(`
      CREATE TABLE IF NOT EXISTS user_games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_id INTEGER NOT NULL,
        game_name TEXT NOT NULL,
        game_image TEXT,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, game_id)
      )
    `);

    console.log('База данных инициализирована успешно');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  }
}

// Инициализируем базу данных
await initDatabase();

// Включаем поддержку внешних ключей
await dbAsync.exec('PRAGMA foreign_keys = ON');

// Оптимизация для продакшена
if (process.env.NODE_ENV === 'production') {
  // Настраиваем кэширование и другие оптимизации
  await dbAsync.exec('PRAGMA journal_mode = WAL');
  await dbAsync.exec('PRAGMA synchronous = NORMAL');
  await dbAsync.exec('PRAGMA cache_size = 10000');
  await dbAsync.exec('PRAGMA temp_store = MEMORY');
}

export default dbAsync; 