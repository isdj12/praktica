import express from 'express';
import cors from 'cors';
import { register, login, verifyToken } from './database/auth.js';
import { addGameToUserProfile, getUserGames, removeGameFromUserProfile, isGameInUserProfile } from './database/userGames.js';
import { addGame, getAllGames, getGameById } from './database/games.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Создаем директории для загрузки файлов, если они не существуют
const uploadsDir = path.join(__dirname, '../public/uploads');
const gameImagesDir = path.join(uploadsDir, 'games');
const screenshotsDir = path.join(uploadsDir, 'screenshots');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(gameImagesDir)) {
  fs.mkdirSync(gameImagesDir, { recursive: true });
}
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Настройка хранилища для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Определяем директорию в зависимости от типа файла
    if (file.fieldname === 'image') {
      cb(null, gameImagesDir);
    } else if (file.fieldname.startsWith('screenshot')) {
      cb(null, screenshotsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB лимит
  fileFilter: function (req, file, cb) {
    // Проверяем тип файла
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения могут быть загружены!'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

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

// Получение списка игр пользователя
app.get('/api/profile/games', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const games = await getUserGames(userId);
    res.json(games);
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
    
    const success = await removeGameFromUserProfile(userId, gameId);
    
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
  { name: 'screenshot0', maxCount: 1 },
  { name: 'screenshot1', maxCount: 1 },
  { name: 'screenshot2', maxCount: 1 },
  { name: 'screenshot3', maxCount: 1 },
  { name: 'screenshot4', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Получен запрос на добавление игры:', req.body);
    console.log('Файлы:', req.files);
    
    // Проверяем наличие обязательных полей
    if (!req.body.name || !req.body.description || !req.body.platform || !req.body.genre || !req.files || !req.files.image) {
      return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
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
      createdAt: new Date().toISOString()
    };

    // Собираем теги
    const tags = [];
    if (req.body.tag1) tags.push(req.body.tag1);
    if (req.body.tag2) tags.push(req.body.tag2);
    if (req.body.tag3) tags.push(req.body.tag3);
    gameData.tags = tags;

    // Собираем скриншоты
    const screenshots = [];
    if (req.files) {
      for (let i = 0; i < 5; i++) {
        const screenshotField = `screenshot${i}`;
        if (req.files[screenshotField]) {
          screenshots.push(`/uploads/screenshots/${req.files[screenshotField][0].filename}`);
        }
      }
    }
    gameData.screenshots = screenshots;

    try {
      // Сохраняем игру в локальной базе данных
      console.log('Сохраняем игру в БД:', gameData);
      const newGame = await addGame(gameData);
      
      // Добавляем игру в профиль пользователя
      await addGameToUserProfile(
        req.user.id,
        newGame.id,
        newGame.name,
        newGame.image
      );
      
      res.status(201).json(newGame);
    } catch (dbError) {
      console.error('Ошибка при сохранении игры в БД:', dbError);
      throw new Error(`Ошибка при сохранении игры: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Ошибка при добавлении игры в каталог:', error);
    res.status(500).json({ message: error.message });
  }
});

// Получение списка всех игр
app.get('/api/games', async (req, res) => {
  try {
    const games = await getAllGames();
    res.json(games);
  } catch (error) {
    console.error('Ошибка при получении списка игр:', error);
    res.status(500).json({ message: error.message });
  }
});

// Получение информации об одной игре по ID
app.get('/api/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    const game = await getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Игра не найдена' });
    }
    
    res.json(game);
  } catch (error) {
    console.error(`Ошибка при получении игры с ID ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

export default app; 