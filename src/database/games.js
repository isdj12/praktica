import { dbAsync } from './db.js';

/**
 * Добавление новой игры в каталог
 * @param {object} gameData - Данные игры
 * @returns {Promise<object>} - Добавленная игра
 */
export async function addGame(gameData) {
  try {
    // Проверяем, существует ли таблица games с нужной структурой
    try {
      // Пробуем получить информацию о структуре таблицы
      const tableInfo = await dbAsync.all("PRAGMA table_info(games)");
      console.log("Структура таблицы games:", tableInfo);
      
      // Проверяем, есть ли нужные столбцы
      const hasNameColumn = tableInfo.some(column => column.name === 'name');
      
      // Если нужной структуры нет, удаляем таблицу и создаем заново
      if (!hasNameColumn) {
        console.log("Таблица games существует, но не имеет нужной структуры. Пересоздаем таблицу...");
        await dbAsync.run("DROP TABLE IF EXISTS game_tags");
        await dbAsync.run("DROP TABLE IF EXISTS game_screenshots");
        await dbAsync.run("DROP TABLE IF EXISTS games");
      }
    } catch (error) {
      console.error("Ошибка при проверке структуры таблицы:", error);
      // В случае ошибки, пробуем пересоздать таблицу
      await dbAsync.run("DROP TABLE IF EXISTS game_tags");
      await dbAsync.run("DROP TABLE IF EXISTS game_screenshots");
      await dbAsync.run("DROP TABLE IF EXISTS games");
    }
    
    // Создаем таблицу games, если она не существует
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        platform TEXT,
        multiplayer TEXT,
        genre TEXT,
        ageRating TEXT,
        releaseDate TEXT,
        image TEXT,
        userId INTEGER,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    
    // Создаем таблицу game_tags, если она не существует
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS game_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        tag TEXT NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      )
    `);
    
    // Создаем таблицу game_screenshots, если она не существует
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS game_screenshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        screenshot_url TEXT NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      )
    `);
    
    // Вставляем данные игры в таблицу games
    const result = await dbAsync.run(
      `INSERT INTO games (name, description, platform, multiplayer, genre, ageRating, releaseDate, image, userId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        gameData.name,
        gameData.description,
        gameData.platform,
        gameData.multiplayer,
        gameData.genre,
        gameData.ageRating,
        gameData.releaseDate,
        gameData.image,
        gameData.userId,
        gameData.createdAt
      ]
    );
    
    const gameId = result.lastID;
    
    // Добавляем теги
    if (gameData.tags && gameData.tags.length > 0) {
      for (const tag of gameData.tags) {
        await dbAsync.run(
          'INSERT INTO game_tags (game_id, tag) VALUES (?, ?)',
          [gameId, tag]
        );
      }
    }
    
    // Добавляем скриншоты
    if (gameData.screenshots && gameData.screenshots.length > 0) {
      for (const screenshot of gameData.screenshots) {
        await dbAsync.run(
          'INSERT INTO game_screenshots (game_id, screenshot_url) VALUES (?, ?)',
          [gameId, screenshot]
        );
      }
    }
    
    // Получаем добавленную игру
    const game = await getGameById(gameId);
    return game;
  } catch (error) {
    console.error('Ошибка при добавлении игры в каталог:', error);
    throw error;
  }
}

/**
 * Получение игры по ID
 * @param {number} id - ID игры
 * @returns {Promise<object|null>} - Найденная игра или null
 */
export async function getGameById(id) {
  try {
    // Получаем данные игры
    const game = await dbAsync.get(
      'SELECT * FROM games WHERE id = ?',
      [id]
    );
    
    if (!game) {
      return null;
    }
    
    // Получаем теги игры
    const tags = await dbAsync.all(
      'SELECT tag FROM game_tags WHERE game_id = ?',
      [id]
    );
    
    // Получаем скриншоты игры
    const screenshots = await dbAsync.all(
      'SELECT screenshot_url FROM game_screenshots WHERE game_id = ?',
      [id]
    );
    
    return {
      ...game,
      tags: tags.map(t => t.tag),
      screenshots: screenshots.map(s => s.screenshot_url)
    };
  } catch (error) {
    console.error(`Ошибка при получении игры с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Получение списка всех игр
 * @returns {Promise<array>} - Массив игр
 */
export async function getAllGames() {
  try {
    // Получаем список всех игр
    const games = await dbAsync.all('SELECT * FROM games ORDER BY createdAt DESC');
    
    // Для каждой игры получаем теги и скриншоты
    const gamesWithDetails = await Promise.all(games.map(async (game) => {
      const tags = await dbAsync.all(
        'SELECT tag FROM game_tags WHERE game_id = ?',
        [game.id]
      );
      
      const screenshots = await dbAsync.all(
        'SELECT screenshot_url FROM game_screenshots WHERE game_id = ?',
        [game.id]
      );
      
      return {
        ...game,
        tags: tags.map(t => t.tag),
        screenshots: screenshots.map(s => s.screenshot_url)
      };
    }));
    
    return gamesWithDetails;
  } catch (error) {
    console.error('Ошибка при получении списка игр:', error);
    throw error;
  }
} 