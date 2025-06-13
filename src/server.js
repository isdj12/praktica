import express from 'express';
import cors from 'cors';
import { register, login, verifyToken } from './database/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware для проверки токена
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }
    
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Неверный токен' });
  }
};

// Маршруты
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }
    
    // Проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Некорректный формат email' });
    }
    
    // Проверка сложности пароля
    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен содержать не менее 6 символов' });
    }
    
    const result = await register(username, email, password);
    res.status(201).json(result);
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    
    // Обработка ошибок SQLite
    if (error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('users.username')) {
        return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
      }
      if (error.message.includes('users.email')) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }
      return res.status(400).json({ message: 'Пользователь с такими данными уже существует' });
    }
    
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }
    
    const result = await login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// Защищенный маршрут для проверки аутентификации
app.get('/api/profile', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

export default app; 