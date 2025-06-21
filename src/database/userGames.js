import { dbAsync } from './db.js';

/**
 * Добавление игры в профиль пользователя
 * @param {number} userId - ID пользователя
 * @param {number} gameId - ID игры
 * @param {string} gameName - Название игры
 * @param {string} gameImage - URL изображения игры
 * @returns {Promise<object>} - Добавленная игра
 */
export async function addGameToUserProfile(userId, gameId, gameName, gameImage) {
  try {
    // Проверяем, существует ли уже такая игра у пользователя
    const existingGame = await dbAsync.get(
      'SELECT id FROM user_games WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    );
    
    if (existingGame) {
      throw new Error('Эта игра уже добавлена в ваш профиль');
    }
    
    const result = await dbAsync.run(
      'INSERT INTO user_games (user_id, game_id, game_name, game_image) VALUES (?, ?, ?, ?)',
      [userId, gameId, gameName, gameImage]
    );
    
    if (result.changes > 0) {
      return getGameFromUserProfile(result.lastID);
    }
    return null;
  } catch (error) {
    console.error('Ошибка при добавлении игры в профиль:', error);
    throw error;
  }
}

/**
 * Получение игры из профиля пользователя по ID записи
 * @param {number} id - ID записи в таблице user_games
 * @returns {Promise<object|null>} - Найденная игра или null
 */
export async function getGameFromUserProfile(id) {
  try {
    return await dbAsync.get(
      'SELECT id, user_id, game_id, game_name, game_image, added_at FROM user_games WHERE id = ?',
      [id]
    );
  } catch (error) {
    console.error('Ошибка при получении игры из профиля:', error);
    throw error;
  }
}

/**
 * Получение всех игр пользователя
 * @param {number} userId - ID пользователя
 * @returns {Promise<array>} - Массив игр пользователя
 */
export async function getUserGames(userId) {
  try {
    return await dbAsync.all(
      'SELECT id, user_id, game_id, game_name, game_image, added_at FROM user_games WHERE user_id = ? ORDER BY added_at DESC',
      [userId]
    );
  } catch (error) {
    console.error('Ошибка при получении игр пользователя:', error);
    throw error;
  }
}

/**
 * Удаление игры из профиля пользователя
 * @param {number} userId - ID пользователя
 * @param {number} gameId - ID игры
 * @returns {Promise<boolean>} - Успешность операции
 */
export async function removeGameFromUserProfile(userId, gameId) {
  try {
    const result = await dbAsync.run(
      'DELETE FROM user_games WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    );
    
    return result.changes > 0;
  } catch (error) {
    console.error('Ошибка при удалении игры из профиля:', error);
    throw error;
  }
}

/**
 * Проверка наличия игры в профиле пользователя
 * @param {number} userId - ID пользователя
 * @param {number} gameId - ID игры
 * @returns {Promise<boolean>} - true, если игра есть в профиле
 */
export async function isGameInUserProfile(userId, gameId) {
  try {
    const game = await dbAsync.get(
      'SELECT id FROM user_games WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    );
    
    return !!game;
  } catch (error) {
    console.error('Ошибка при проверке наличия игры в профиле:', error);
    throw error;
  }
} 