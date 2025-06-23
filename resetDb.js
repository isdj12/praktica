import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'database.sqlite');

async function resetDatabase() {
  try {
    // Открываем соединение с базой данных
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Соединение с базой данных установлено');
    
    // Очищаем все таблицы
    await db.run('DELETE FROM game_tags');
    await db.run('DELETE FROM game_screenshots');
    await db.run('DELETE FROM game_clicks');
    await db.run('DELETE FROM user_games');
    await db.run('DELETE FROM games');
    await db.run('DELETE FROM users');
    
    console.log('Все таблицы очищены');
    
    // Создаем нового пользователя-администратора
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = await db.run(
      'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@example.com', hashedPassword, new Date().toISOString()]
    );
    
    console.log('Создан пользователь-администратор с ID:', adminUser.lastID);
    
    // Добавляем новые игры
    const games = [
      {
        name: 'Shovel Knight',
        description: 'Shovel Knight — это 2D-платформер в стиле ретро с элементами экшена и приключений. Игрок управляет Рыцарем Лопаты, который путешествует по королевству, чтобы победить злую Зачарованную и спасти свою давнюю спутницу Щит-рыцаря.',
        platform: 'PC, Nintendo Switch, PlayStation, Xbox',
        multiplayer: 'Нет',
        genre: 'Платформер',
        ageRating: 'E (для всех)',
        releaseDate: '2014-06-26',
        image: '/uploads/games/shovel_knight.jpg',
        tags: ['Платформер', 'Ретро', 'Инди', 'Пиксельная графика'],
        screenshots: ['/uploads/screenshots/shovel_knight_1.jpg', '/uploads/screenshots/shovel_knight_2.jpg']
      },
      {
        name: 'Cuphead',
        description: 'Cuphead — это сложный run and gun платформер с уникальным визуальным стилем, вдохновленным мультфильмами 1930-х годов. Игроки управляют Капхедом и его братом Магменом, которые должны сразиться с различными боссами, чтобы вернуть свои души дьяволу.',
        platform: 'PC, Nintendo Switch, PlayStation, Xbox',
        multiplayer: 'Локальный',
        genre: 'Экшен',
        ageRating: 'E10+ (от 10 лет)',
        releaseDate: '2017-09-29',
        image: '/uploads/games/cuphead.jpg',
        tags: ['Экшен', 'Сложная', 'Мультяшная графика', 'Инди'],
        screenshots: ['/uploads/screenshots/cuphead_1.jpg', '/uploads/screenshots/cuphead_2.jpg']
      },
      {
        name: 'OneShot',
        description: 'OneShot — это сюрреалистическая приключенческая игра-головоломка, в которой игрок помогает ребенку-кошке по имени Нико спасти умирающий мир. Игра известна своими метаповествовательными элементами и взаимодействием с игроком за пределами игрового окна.',
        platform: 'PC',
        multiplayer: 'Нет',
        genre: 'Головоломка',
        ageRating: 'E (для всех)',
        releaseDate: '2016-12-08',
        image: '/uploads/games/oneshot.jpg',
        tags: ['Головоломка', 'Атмосферная', 'Инди', 'Пиксельная графика'],
        screenshots: ['/uploads/screenshots/oneshot_1.jpg', '/uploads/screenshots/oneshot_2.jpg']
      },
      {
        name: 'Undertale',
        description: 'Undertale — это ролевая игра, где игрок управляет ребенком, упавшим в подземный мир, населенный монстрами. Уникальная особенность игры — возможность решать конфликты без насилия, через систему диалогов и взаимодействий.',
        platform: 'PC, Nintendo Switch, PlayStation, Xbox',
        multiplayer: 'Нет',
        genre: 'RPG',
        ageRating: 'E10+ (от 10 лет)',
        releaseDate: '2015-09-15',
        image: '/uploads/games/undertale.jpg',
        tags: ['RPG', 'Инди', 'Пиксельная графика', 'Сюжетная'],
        screenshots: ['/uploads/screenshots/undertale_1.jpg', '/uploads/screenshots/undertale_2.jpg']
      }
    ];
    
    // Создаем директории для изображений, если они не существуют
    const uploadsDir = path.join(__dirname, 'public/uploads');
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
    
    // Добавляем игры в базу данных
    for (const game of games) {
      // Добавляем игру
      const result = await db.run(
        `INSERT INTO games (name, description, platform, multiplayer, genre, ageRating, releaseDate, image, userId, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          game.name,
          game.description,
          game.platform,
          game.multiplayer,
          game.genre,
          game.ageRating,
          game.releaseDate,
          game.image,
          adminUser.lastID,
          new Date().toISOString()
        ]
      );
      
      const gameId = result.lastID;
      
      // Добавляем теги
      for (const tag of game.tags) {
        await db.run(
          'INSERT INTO game_tags (game_id, tag) VALUES (?, ?)',
          [gameId, tag]
        );
      }
      
      // Добавляем скриншоты
      for (const screenshot of game.screenshots) {
        await db.run(
          'INSERT INTO game_screenshots (game_id, screenshot_url) VALUES (?, ?)',
          [gameId, screenshot]
        );
      }
      
      // Инициализируем счетчик кликов
      await db.run(
        'INSERT INTO game_clicks (game_id, click_count) VALUES (?, ?)',
        [gameId, 0]
      );
      
      console.log(`Добавлена игра: ${game.name} с ID: ${gameId}`);
    }
    
    console.log('База данных успешно сброшена и заполнена новыми данными');
    
    // Закрываем соединение с базой данных
    await db.close();
    
  } catch (error) {
    console.error('Ошибка при сбросе базы данных:', error);
  }
}

// Запускаем функцию сброса базы данных
resetDatabase(); 