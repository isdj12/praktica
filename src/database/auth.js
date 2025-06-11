import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserForAuth, registerUser } from './users.js';

// Секретный ключ для JWT (в реальном приложении должен быть в переменных окружения)
const JWT_SECRET = 'your-secret-key-should-be-in-env-file';

/**
 * Регистрация нового пользователя с хешированием пароля
 * @param {string} username - имя пользователя
 * @param {string} email - электронная почта
 * @param {string} password - пароль (будет захеширован)
 * @returns {object} - объект с данными пользователя и токеном
 */
export async function register(username, email, password) {
  try {
    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Регистрация пользователя
    const user = await registerUser(username, email, hashedPassword);
    
    if (!user) {
      throw new Error('Не удалось зарегистрировать пользователя');
    }
    
    // Создание JWT токена
    const token = generateToken(user);
    
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },
      token
    };
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    throw error;
  }
}

/**
 * Аутентификация пользователя
 * @param {string} username - имя пользователя
 * @param {string} password - пароль
 * @returns {object} - объект с данными пользователя и токеном
 */
export async function login(username, password) {
  try {
    // Получение пользователя с паролем
    const user = await getUserForAuth(username);
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      throw new Error('Неверный пароль');
    }
    
    // Создание JWT токена
    const token = generateToken(user);
    
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    };
  } catch (error) {
    console.error('Ошибка при входе в систему:', error);
    throw error;
  }
}

/**
 * Генерация JWT токена
 * @param {object} user - пользователь
 * @returns {string} - JWT токен
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Проверка JWT токена
 * @param {string} token - JWT токен
 * @returns {object} - данные пользователя из токена
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    throw error;
  }
} 