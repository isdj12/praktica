import { dbAsync } from './db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Путь к файлу с данными игр
const GAMES_FILE = path.join(__dirname, 'games.json');

/**
 * Загрузка данных игр из файла
 * @returns {Promise<Array>} Массив объектов игр
 */
async function loadGames() {
  try {
    const data = await fs.readFile(GAMES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Если файл не существует или поврежден, возвращаем пустой массив
    if (error.code === 'ENOENT') {
      console.warn('Файл с играми не найден, создаем новый.');
      await saveGames([]);
      return [];
    }
    console.error('Ошибка при загрузке данных игр:', error);
    throw new Error(`Не удалось загрузить данные игр: ${error.message}`);
  }
}

/**
 * Сохранение данных игр в файл
 * @param {Array} games Массив объектов игр
 * @returns {Promise<void>}
 */
async function saveGames(games) {
  try {
    await fs.writeFile(GAMES_FILE, JSON.stringify(games, null, 2), 'utf8');
  } catch (error) {
    console.error('Ошибка при сохранении данных игр:', error);
    throw new Error(`Не удалось сохранить данные игр: ${error.message}`);
  }
}

/**
 * Добавление новой игры в каталог
 * @param {object} gameData - Данные игры
 * @returns {Promise<object>} - Добавленная игра
 */
export async function addGame(gameData) {
  try {
    console.log('Начинаем добавление игры в БД...');
    
    // Проверяем формат даты createdAt
    let createdAt = gameData.createdAt;
    if (typeof createdAt === 'string' && createdAt.includes('T')) {
      // Преобразуем ISO формат в MySQL формат
      createdAt = createdAt.slice(0, 19).replace('T', ' ');
      console.log('Преобразованная дата:', createdAt);
    }
    
    // Вставляем данные игры в таблицу games
    const insertGameQuery = `
      INSERT INTO games (
        name, description, platform, multiplayer, 
        genre, ageRating, releaseDate, image, 
        userId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const gameValues = [
      gameData.name,
      gameData.description,
      gameData.platform,
      gameData.multiplayer,
      gameData.genre,
      gameData.ageRating,
      gameData.releaseDate,
      gameData.image,
      gameData.userId,
      createdAt
    ];
    
    console.log('SQL запрос для добавления игры:', insertGameQuery);
    console.log('Значения для запроса:', gameValues);
    
    const result = await dbAsync.run(insertGameQuery, gameValues);
    const gameId = result.lastID;
    console.log(`Игра добавлена с ID: ${gameId}`);
    
    // Инициализируем счетчик кликов для новой игры
    await dbAsync.run(
      'INSERT INTO game_clicks (game_id, click_count) VALUES (?, ?)',
      [gameId, 0]
    );
    console.log('Счетчик кликов инициализирован');
    
    // Добавляем теги
    if (gameData.tags && gameData.tags.length > 0) {
      console.log(`Добавляем ${gameData.tags.length} тегов`);
      for (const tag of gameData.tags) {
        await dbAsync.run(
          'INSERT INTO game_tags (game_id, tag) VALUES (?, ?)',
          [gameId, tag]
        );
      }
      console.log('Теги добавлены');
    }
    
    // Добавляем скриншоты
    if (gameData.screenshots && gameData.screenshots.length > 0) {
      console.log(`Добавляем ${gameData.screenshots.length} скриншотов`);
      for (const screenshot of gameData.screenshots) {
        await dbAsync.run(
          'INSERT INTO game_screenshots (game_id, screenshot_url) VALUES (?, ?)',
          [gameId, screenshot]
        );
      }
      console.log('Скриншоты добавлены');
    }
    
    // Получаем добавленную игру
    const game = await getGameById(gameId);
    console.log('Получены данные добавленной игры:', game);
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
    
    // Получаем количество кликов
    const clickData = await dbAsync.get(
      'SELECT click_count FROM game_clicks WHERE game_id = ?',
      [id]
    );
    
    // Получаем информацию о файле игры
    let gameFile = null;
    try {
      gameFile = await getGameFile(id);
    } catch (error) {
      console.error(`Ошибка при получении файла для игры с ID ${id}:`, error);
      // Игнорируем ошибку, чтобы не прерывать загрузку данных игры
    }
    
    // Получаем информацию об авторе игры
    let authorName = null;
    if (game.userId) {
      const authorData = await dbAsync.get(
        'SELECT username FROM users WHERE id = ?',
        [game.userId]
      );
      
      if (authorData) {
        authorName = authorData.username;
      }
    }
    
    return {
      ...game,
      tags: tags.map(t => t.tag),
      screenshots: screenshots.map(s => s.screenshot_url),
      clicks: clickData ? clickData.click_count : 0,
      gameFile,
      author: authorName
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
    // Получаем все игры из базы данных
    const games = await dbAsync.all('SELECT * FROM games');
    
    // Для каждой игры получаем теги, скриншоты и клики
    const result = [];
    for (const game of games) {
      // Получаем теги игры
      const tags = await dbAsync.all(
        'SELECT tag FROM game_tags WHERE game_id = ?',
        [game.id]
      );
      
      // Получаем скриншоты игры
      const screenshots = await dbAsync.all(
        'SELECT screenshot_url FROM game_screenshots WHERE game_id = ?',
        [game.id]
      );
      
      // Получаем количество кликов
      const clickData = await dbAsync.get(
        'SELECT click_count FROM game_clicks WHERE game_id = ?',
        [game.id]
      );
      
      // Получаем информацию об авторе игры
      let authorName = null;
      if (game.userId) {
        const authorData = await dbAsync.get(
          'SELECT username FROM users WHERE id = ?',
          [game.userId]
        );
        
        if (authorData) {
          authorName = authorData.username;
        }
      }
      
      result.push({
        ...game,
        tags: tags.map(t => t.tag),
        screenshots: screenshots.map(s => s.screenshot_url),
        clicks: clickData ? clickData.click_count : 0,
        author: authorName
      });
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка при получении списка игр:', error);
    throw error;
  }
}

/**
 * Получение списка популярных игр по количеству кликов
 * @returns {Promise<array>} - Массив игр, отсортированный по кликам
 */
export async function getPopularGames() {
  try {
    // Получаем все игры с их кликами
    const games = await getAllGames();
    
    // Сортируем по количеству кликов (от большего к меньшему)
    return games.sort((a, b) => b.clicks - a.clicks);
  } catch (error) {
    console.error('Ошибка при получении популярных игр:', error);
    throw error;
  }
}

/**
 * Увеличение счетчика кликов для игры
 * @param {number} gameId - ID игры
 * @returns {Promise<number>} - Новое количество кликов
 */
export async function incrementGameClicks(gameId) {
  try {
    // Проверяем, существует ли запись для этой игры
    const clickData = await dbAsync.get(
      'SELECT * FROM game_clicks WHERE game_id = ?',
      [gameId]
    );
    
    if (clickData) {
      // Если запись существует, увеличиваем счетчик
      await dbAsync.run(
        'UPDATE game_clicks SET click_count = click_count + 1, last_updated = CURRENT_TIMESTAMP WHERE game_id = ?',
        [gameId]
      );
    } else {
      // Если записи нет, создаем новую
      await dbAsync.run(
        'INSERT INTO game_clicks (game_id, click_count) VALUES (?, ?)',
        [gameId, 1]
      );
    }
    
    // Получаем обновленное значение счетчика
    const updatedClickData = await dbAsync.get(
      'SELECT click_count FROM game_clicks WHERE game_id = ?',
      [gameId]
    );
    
    return updatedClickData ? updatedClickData.click_count : 1;
  } catch (error) {
    console.error(`Ошибка при увеличении счетчика кликов для игры с ID ${gameId}:`, error);
    throw error;
  }
}

/**
 * Удаление игры из каталога и всех связанных записей
 * @param {number} gameId - ID игры для удаления
 * @returns {Promise<boolean>} - Успешность операции
 */
export async function deleteGame(gameId) {
  try {
    // Начинаем транзакцию для обеспечения целостности данных
    await dbAsync.run('START TRANSACTION');
    
    try {
      // Удаляем связанные записи из таблицы game_tags
      await dbAsync.run('DELETE FROM game_tags WHERE game_id = ?', [gameId]);
      
      // Удаляем связанные записи из таблицы game_screenshots
      await dbAsync.run('DELETE FROM game_screenshots WHERE game_id = ?', [gameId]);
      
      // Удаляем связанные записи из таблицы game_clicks
      await dbAsync.run('DELETE FROM game_clicks WHERE game_id = ?', [gameId]);
      
      // Удаляем связанные записи из таблицы game_files
      await dbAsync.run('DELETE FROM game_files WHERE game_id = ?', [gameId]);
      
      // Удаляем связанные записи из таблицы user_games
      await dbAsync.run('DELETE FROM user_games WHERE game_id = ?', [gameId]);
      
      // Удаляем саму игру из таблицы games
      const result = await dbAsync.run('DELETE FROM games WHERE id = ?', [gameId]);
      
      // Завершаем транзакцию
      await dbAsync.run('COMMIT');
      
      return result.changes > 0;
    } catch (error) {
      // В случае ошибки отменяем транзакцию
      await dbAsync.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error(`Ошибка при удалении игры с ID ${gameId}:`, error);
    throw error;
  }
}

/**
 * Добавление файла игры в базу данных
 * @param {number} gameId - ID игры
 * @param {string} filename - Оригинальное имя файла
 * @param {string} filePath - Путь к сохраненному файлу
 * @param {number} fileSize - Размер файла в байтах
 * @returns {Promise<object>} - Информация о добавленном файле
 */
export async function addGameFile(gameId, filename, filePath, fileSize) {
  try {
    // Создаем таблицу game_files, если она не существует
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS game_files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        game_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Проверяем, существует ли уже файл для этой игры
    const existingFile = await getGameFile(gameId);
    
    // Если файл уже существует, удаляем его
    if (existingFile) {
      await dbAsync.run('DELETE FROM game_files WHERE game_id = ?', [gameId]);
    }
    
    // Добавляем новый файл
    const result = await dbAsync.run(
      'INSERT INTO game_files (game_id, filename, file_path, file_size) VALUES (?, ?, ?, ?)',
      [gameId, filename, filePath, fileSize]
    );
    
    return {
      id: result.lastID,
      gameId,
      filename,
      filePath,
      fileSize,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Ошибка при добавлении файла для игры с ID ${gameId}:`, error);
    throw error;
  }
}

/**
 * Получение файла игры
 * @param {number} gameId - ID игры
 * @returns {Promise<object|null>} - Информация о файле или null, если файл не найден
 */
export async function getGameFile(gameId) {
  try {
    // Проверяем, существует ли таблица
    try {
      await dbAsync.get('SELECT 1 FROM game_files LIMIT 1');
    } catch (error) {
      // Если таблица не существует, возвращаем null
      return null;
    }
    
    // Получаем файл по ID игры
    const gameFile = await dbAsync.get(
      'SELECT * FROM game_files WHERE game_id = ?',
      [gameId]
    );
    
    return gameFile;
  } catch (error) {
    console.error(`Ошибка при получении файла для игры с ID ${gameId}:`, error);
    throw error;
  }
} 