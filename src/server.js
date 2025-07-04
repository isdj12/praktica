import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { register, login, verifyToken } from './database/auth.js';
import { addGameToUserProfile, getUserGames, removeGameFromUserProfile, isGameInUserProfile } from './database/userGames.js';
import { addGame, getAllGames, getGameById, getPopularGames, incrementGameClicks, deleteGame, addGameFile, getGameFile } from './database/games.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbAsync } from './database/db.js';
import ensureUploadDirs from './ensure-upload-dirs.js';

// Загружаем переменные окружения
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Определяем пути к директориям для загрузки файлов
const uploadsDir = path.join(__dirname, '../public/uploads');
const gameImagesDir = path.join(uploadsDir, 'games');
const screenshotsDir = path.join(uploadsDir, 'screenshots');
const gameFilesDir = path.join(uploadsDir, 'gamefiles');

// Проверяем и создаем директории для загрузки файлов
ensureUploadDirs();

// Настройка хранилища для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Определяем директорию в зависимости от типа файла
    if (file.fieldname === 'image') {
      cb(null, gameImagesDir);
    } else if (file.fieldname.startsWith('screenshot')) {
      cb(null, screenshotsDir);
    } else if (file.fieldname === 'gameFile') {
      cb(null, gameFilesDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB лимит (увеличен для ZIP файлов)
  fileFilter: function (req, file, cb) {
    // Проверяем тип файла
    if (file.fieldname === 'image' || file.fieldname.startsWith('screenshot')) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Недопустимый тип файла. Разрешены только изображения.'));
      }
    } else if (file.fieldname === 'gameFile') {
      // Проверяем, что это ZIP файл по расширению
      if (!file.originalname.toLowerCase().endsWith('.zip')) {
        return cb(new Error('Недопустимый тип файла. Разрешены только ZIP архивы.'));
      }
    }
    cb(null, true);
  }
});

// Настройка CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Обслуживание статических файлов из папки dist (собранное приложение)
app.use(express.static(path.join(__dirname, '../dist')));

// В продакшене добавляем обслуживание статических файлов из билда React
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../dist');
  app.use(express.static(buildPath));
}

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

// Middleware для проверки прав администратора
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Требуются права администратора' });
  }
};

// Обработчик ошибок для асинхронных функций
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Ошибка в запросе:', error);
    res.status(500).json({ 
      message: 'Внутренняя ошибка сервера',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  });
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

// Получение профиля пользователя по имени пользователя (публичный доступ)
app.get('/api/users/:username', asyncHandler(async (req, res) => {
  try {
    const username = req.params.username;
    
    // Получаем базовую информацию о пользователе
    const user = await dbAsync.get(
      'SELECT id, username, email, created_at FROM users WHERE username = ?',
      [username]
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Получаем игры пользователя
    const games = await dbAsync.all(
      'SELECT ug.id, ug.game_id, ug.game_name, ug.game_image, ug.added_at ' +
      'FROM user_games ug ' +
      'WHERE ug.user_id = ? ' +
      'ORDER BY ug.added_at DESC',
      [user.id]
    );
    
    // Возвращаем публичную информацию о пользователе
    res.json({
      username: user.username,
      createdAt: user.created_at,
      games: games
    });
  } catch (error) {
    console.error('Ошибка при получении профиля пользователя:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Получение списка игр пользователя
app.get('/api/profile/games', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    let games = await getUserGames(userId);
    
    // Дополняем информацию о каждой игре данными из каталога
    const enhancedGames = [];
    for (const game of games) {
      try {
        // Получаем дополнительную информацию о игре из каталога
        const gameDetails = await getGameById(game.game_id);
        if (gameDetails) {
          // Добавляем userId и другие данные из каталога
          game.userId = gameDetails.userId;
          game.catalogId = gameDetails.id; // добавляем явный ID из каталога
          game.authorId = gameDetails.userId; // добавляем ID автора для лучшей ясности
        }
        console.log(`Обогащена игра ${game.game_id}: userId=${game.userId}, catalogId=${game.catalogId}`);
        enhancedGames.push(game);
      } catch (error) {
        console.error(`Ошибка при получении деталей игры ${game.game_id}:`, error);
        enhancedGames.push(game); // Добавляем игру без дополнительной информации
      }
    }
    
    res.json(enhancedGames);
  } catch (error) {
    console.error('Ошибка при получении игр пользователя:', error);
    res.status(500).json({ message: error.message });
  }
});

// Добавление игры в профиль пользователя
app.post('/api/profile/games', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId, gameName, gameImage } = req.body;
    
    if (!gameId || !gameName) {
      return res.status(400).json({ message: 'ID и название игры обязательны' });
    }
    
    const game = await addGameToUserProfile(userId, gameId, gameName, gameImage);
    res.status(201).json(game);
  } catch (error) {
    console.error('Ошибка при добавлении игры в профиль:', error);
    
    if (error.message.includes('Эта игра уже добавлена')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message });
  }
});

// Удаление игры из профиля пользователя
app.delete('/api/profile/games/:gameId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const gameId = req.params.gameId;
    
    console.log(`Запрос на удаление игры из профиля. userId: ${userId}, gameId/recordId: ${gameId}`);
    
    // Проверяем, является ли переданный ID записью в таблице user_games
    let success = false;
    
    // Сначала пробуем удалить по ID записи в таблице user_games
    try {
      const result = await dbAsync.run(
        'DELETE FROM user_games WHERE id = ? AND user_id = ?',
        [gameId, userId]
      );
      success = result.changes > 0;
      console.log(`Попытка удаления по ID записи: ${success ? 'успешно' : 'не найдено'}`);
    } catch (err) {
      console.error('Ошибка при удалении по ID записи:', err);
    }
    
    // Если не удалось удалить по ID записи, пробуем удалить по game_id
    if (!success) {
      try {
        const result = await dbAsync.run(
          'DELETE FROM user_games WHERE game_id = ? AND user_id = ?',
          [gameId, userId]
        );
        success = result.changes > 0;
        console.log(`Попытка удаления по game_id: ${success ? 'успешно' : 'не найдено'}`);
      } catch (err) {
        console.error('Ошибка при удалении по game_id:', err);
      }
    }
    
    if (success) {
      res.status(200).json({ message: 'Игра успешно удалена из профиля' });
    } else {
      res.status(404).json({ message: 'Игра не найдена в профиле' });
    }
  } catch (error) {
    console.error('Ошибка при удалении игры из профиля:', error);
    res.status(500).json({ message: error.message });
  }
});

// Проверка наличия игры в профиле пользователя
app.get('/api/profile/games/:gameId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const gameId = req.params.gameId;
    
    const isInProfile = await isGameInUserProfile(userId, gameId);
    res.json({ isInProfile });
  } catch (error) {
    console.error('Ошибка при проверке наличия игры в профиле:', error);
    res.status(500).json({ message: error.message });
  }
});

// Добавление новой игры в каталог
app.post('/api/games', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'screenshots', maxCount: 5 },
  { name: 'gameFile', maxCount: 1 }
]), asyncHandler(async (req, res) => {
  try {
    console.log('=== НАЧАЛО ОБРАБОТКИ ДОБАВЛЕНИЯ ИГРЫ ===');
    console.log('Получен запрос на добавление игры:');
    console.log('Тело запроса:', req.body);
    console.log('Файлы:', req.files);
    
    // Проверяем наличие обязательных полей
    if (!req.body.name || !req.body.description || !req.body.platform || !req.body.genre) {
      console.log('ОШИБКА: Не все обязательные поля заполнены');
      return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
    }

    if (!req.files || !req.files.image) {
      console.log('ОШИБКА: Отсутствует изображение игры');
      return res.status(400).json({ message: 'Необходимо загрузить изображение игры' });
    }

    // Формируем данные для новой игры
    const gameData = {
      name: req.body.name,
      description: req.body.description,
      platform: req.body.platform,
      multiplayer: req.body.multiplayer || 'Нет',
      genre: req.body.genre,
      ageRating: req.body.ageRating || 'Не указан',
      releaseDate: req.body.releaseDate || null,
      image: `/uploads/games/${req.files.image[0].filename}`,
      userId: req.user.id, // ID пользователя, добавившего игру
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '), // MySQL формат даты
      tags: [],
      screenshots: []
    };

    // Обработка тегов
    console.log('Обработка тегов...');
    if (req.body.tag1) gameData.tags.push(req.body.tag1);
    if (req.body.tag2) gameData.tags.push(req.body.tag2);
    if (req.body.tag3) gameData.tags.push(req.body.tag3);

    // Обработка скриншотов
    console.log('Обработка скриншотов...');
    if (req.files.screenshots && req.files.screenshots.length > 0) {
      gameData.screenshots = req.files.screenshots.map(file => `/uploads/screenshots/${file.filename}`);
    }

    // Сохраняем игру в базе данных
    console.log('Сохраняем игру в БД:', gameData);
    try {
      const newGame = await addGame(gameData);
      console.log('Игра успешно добавлена в БД:', newGame);
      
      // Добавляем игру в профиль пользователя
      try {
        await addGameToUserProfile(
          req.user.id,
          newGame.id,
          newGame.name,
          newGame.image
        );
        console.log('Игра добавлена в профиль пользователя');
      } catch (profileError) {
        console.error('Ошибка при добавлении игры в профиль:', profileError);
        // Продолжаем выполнение, даже если не удалось добавить в профиль
      }
      
      // Если загружен файл игры, сохраняем его
      if (req.files.gameFile && req.files.gameFile.length > 0) {
        try {
          const gameFile = req.files.gameFile[0];
          const { originalname, filename, size } = gameFile;
          
          // Путь относительно публичной директории
          const relativePath = `/uploads/gamefiles/${filename}`;
          
          // Сохраняем информацию о файле в базе данных
          await addGameFile(newGame.id, originalname, relativePath, size);
          console.log('Файл игры успешно сохранен');
        } catch (fileError) {
          console.error('Ошибка при сохранении файла игры:', fileError);
          // Продолжаем выполнение, даже если не удалось сохранить файл
        }
      }
      
      console.log('=== УСПЕШНОЕ ЗАВЕРШЕНИЕ ДОБАВЛЕНИЯ ИГРЫ ===');
      res.status(201).json(newGame);
    } catch (dbError) {
      console.error('Ошибка при сохранении игры в БД:', dbError);
      res.status(500).json({ message: `Ошибка при сохранении игры: ${dbError.message}` });
    }
  } catch (error) {
    console.error('=== ОШИБКА ПРИ ДОБАВЛЕНИИ ИГРЫ ===', error);
    res.status(500).json({ message: error.message });
  }
}));

// Получение списка всех игр
app.get('/api/games', asyncHandler(async (req, res) => {
  const games = await getAllGames();
  res.json(games);
}));

// Получение списка популярных игр
app.get('/api/games/popular', asyncHandler(async (req, res) => {
  const popularGames = await getPopularGames();
  res.json(popularGames);
}));

// Обновление счетчика кликов для игры
app.post('/api/games/:id/click', asyncHandler(async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const clickCount = await incrementGameClicks(gameId);
    res.json({ gameId, clicks: clickCount });
  } catch (error) {
    console.error('Ошибка при обновлении счетчика кликов:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Получение информации об одной игре по ID
app.get('/api/games/:id', asyncHandler(async (req, res) => {
  try {
    const gameId = req.params.id;
    const game = await getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Игра не найдена' });
    }
    
    // Увеличиваем счетчик просмотров
    await incrementGameClicks(gameId);
    
    res.json(game);
  } catch (error) {
    console.error(`Ошибка при получении игры с ID ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
}));

// Загрузка файла игры
app.post('/api/games/:id/upload', authMiddleware, upload.single('gameFile'), asyncHandler(async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Проверяем наличие файла
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }
    
    // Получаем информацию об игре
    const game = await getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Игра не найдена' });
    }
    
    // Проверяем, является ли пользователь автором игры или администратором
    if (game.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'У вас нет прав для загрузки файла к этой игре' });
    }
    
    const { originalname, filename, path: filePath, size } = req.file;
    
    // Путь относительно публичной директории
    const relativePath = `/uploads/gamefiles/${filename}`;
    
    // Добавляем информацию о файле в базу данных
    const gameFile = await addGameFile(gameId, originalname, relativePath, size);
    
    res.status(201).json({ 
      message: 'Файл игры успешно загружен',
      gameFile 
    });
  } catch (error) {
    console.error('Ошибка при загрузке файла игры:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Скачивание файла игры
app.get('/api/games/:id/download', asyncHandler(async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    
    // Получаем информацию о файле игры
    const gameFile = await getGameFile(gameId);
    
    if (!gameFile) {
      return res.status(404).json({ message: 'Файл игры не найден' });
    }
    
    // Полный путь к файлу на сервере
    const fullPath = path.join(__dirname, '../public', gameFile.file_path);
    
    // Проверяем существование файла
    try {
      await fs.promises.access(fullPath);
    } catch (error) {
      return res.status(404).json({ message: 'Файл не найден на сервере' });
    }
    
    // Устанавливаем заголовки для скачивания
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(gameFile.filename)}"`);
    res.setHeader('Content-Type', 'application/zip');
    
    // Отправляем файл
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Ошибка при скачивании файла игры:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Удаление игры из каталога (только для автора игры или администратора)
app.delete('/api/games/:id', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Получаем информацию об игре
    const game = await getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Игра не найдена' });
    }
    
    // Проверяем, является ли пользователь автором игры или администратором
    if (game.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'У вас нет прав для удаления этой игры' });
    }
    
    // Удаляем игру из базы данных
    const success = await deleteGame(gameId);
    
    if (success) {
      // Удаляем связанные файлы
      if (game.image && !game.image.startsWith('http')) {
        try {
          await fs.promises.unlink(path.join(__dirname, '../public', game.image));
        } catch (error) {
          console.error('Ошибка при удалении изображения:', error);
        }
      }
      
      if (game.screenshots && Array.isArray(game.screenshots)) {
        for (const screenshot of game.screenshots) {
          if (!screenshot.startsWith('http')) {
            try {
              await fs.promises.unlink(path.join(__dirname, '../public', screenshot));
            } catch (error) {
              console.error('Ошибка при удалении скриншота:', error);
            }
          }
        }
      }
      
      res.status(200).json({ message: 'Игра успешно удалена' });
    } else {
      res.status(404).json({ message: 'Игра не найдена или не может быть удалена' });
    }
  } catch (error) {
    console.error('Ошибка при удалении игры:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Обработчик для корневого URL и всех остальных URL (кроме API)
app.get(['/', '/*'], (req, res, next) => {
  // Если запрос начинается с /api, то это API запрос
  if (req.path.startsWith('/api')) {
    return next();
  }
  // Иначе отдаем index.html для клиентской маршрутизации
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Режим: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Клиент: ${process.env.CLIENT_URL}`);
  } else {
    console.log('Клиент: http://localhost:5173');
  }
});

export default app; 