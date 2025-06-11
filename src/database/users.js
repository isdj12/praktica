import { dbAsync } from './db.js';

/**
 * Регистрация нового пользователя
 * @param {string} username - имя пользователя
 * @param {string} email - электронная почта
 * @param {string} password - пароль (должен быть захеширован перед вызовом этой функции)
 * @returns {Promise<object>} - созданный пользователь
 */
export async function registerUser(username, email, password) {
  try {
    const result = await dbAsync.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    
    if (result.changes > 0) {
      return getUserById(result.lastID);
    }
    return null;
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    throw error;
  }
}

/**
 * Получение пользователя по ID
 * @param {number} id - ID пользователя
 * @returns {Promise<object|null>} - найденный пользователь или null
 */
export async function getUserById(id) {
  try {
    return await dbAsync.get(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id]
    );
  } catch (error) {
    console.error('Ошибка при получении пользователя по ID:', error);
    throw error;
  }
}

/**
 * Получение пользователя по имени пользователя
 * @param {string} username - имя пользователя
 * @returns {Promise<object|null>} - найденный пользователь или null
 */
export async function getUserByUsername(username) {
  try {
    return await dbAsync.get(
      'SELECT id, username, email, created_at FROM users WHERE username = ?',
      [username]
    );
  } catch (error) {
    console.error('Ошибка при получении пользователя по имени:', error);
    throw error;
  }
}

/**
 * Получение пользователя с паролем для аутентификации
 * @param {string} username - имя пользователя
 * @returns {Promise<object|null>} - найденный пользователь с паролем или null
 */
export async function getUserForAuth(username) {
  try {
    return await dbAsync.get(
      'SELECT id, username, email, password FROM users WHERE username = ?',
      [username]
    );
  } catch (error) {
    console.error('Ошибка при получении пользователя для аутентификации:', error);
    throw error;
  }
}

/**
 * Получение всех пользователей
 * @returns {Promise<array>} - массив пользователей
 */
export async function getAllUsers() {
  try {
    return await dbAsync.all(
      'SELECT id, username, email, created_at FROM users'
    );
  } catch (error) {
    console.error('Ошибка при получении всех пользователей:', error);
    throw error;
  }
}

/**
 * Обновление данных пользователя
 * @param {number} id - ID пользователя
 * @param {object} userData - объект с обновляемыми полями
 * @returns {Promise<boolean>} - успешность операции
 */
export async function updateUser(id, userData) {
  try {
    const { username, email, password } = userData;
    let query = 'UPDATE users SET ';
    const params = [];
    
    if (username) {
      query += 'username = ?, ';
      params.push(username);
    }
    
    if (email) {
      query += 'email = ?, ';
      params.push(email);
    }
    
    if (password) {
      query += 'password = ?, ';
      params.push(password);
    }
    
    // Удаляем последнюю запятую и пробел
    query = query.slice(0, -2);
    
    query += ' WHERE id = ?';
    params.push(id);
    
    const result = await dbAsync.run(query, params);
    
    return result.changes > 0;
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    throw error;
  }
}

/**
 * Удаление пользователя
 * @param {number} id - ID пользователя
 * @returns {Promise<boolean>} - успешность операции
 */
export async function deleteUser(id) {
  try {
    const result = await dbAsync.run('DELETE FROM users WHERE id = ?', [id]);
    
    return result.changes > 0;
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    throw error;
  }
} 