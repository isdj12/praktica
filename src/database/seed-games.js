import { dbAsync } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { addGame } from './games.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Демонстрационные игры
const demoGames = [
  {
    name: 'The Witcher 3: Wild Hunt',
    description: 'Эпическая ролевая игра с открытым миром, основанная на серии романов Анджея Сапковского.',
    platform: 'PC, PlayStation, Xbox, Nintendo Switch',
    multiplayer: 'Нет',
    genre: 'RPG',
    ageRating: '18+',
    releaseDate: '2015-05-19',
    image: '/images/witcher3.jpg',
    tags: ['RPG', 'Открытый мир', 'Фэнтези', 'Одиночная игра'],
    screenshots: [
      '/screenshots/witcher3_1.jpg',
      '/screenshots/witcher3_2.jpg',
      '/screenshots/witcher3_3.jpg'
    ]
  },
  {
    name: 'Minecraft',
    description: 'Песочница, в которой игроки могут строить и исследовать виртуальные миры из блоков.',
    platform: 'PC, PlayStation, Xbox, Nintendo Switch, Mobile',
    multiplayer: 'Да',
    genre: 'Песочница',
    ageRating: '7+',
    releaseDate: '2011-11-18',
    image: '/images/minecraft.jpg',
    tags: ['Песочница', 'Выживание', 'Строительство', 'Мультиплеер'],
    screenshots: [
      '/screenshots/minecraft_1.jpg',
      '/screenshots/minecraft_2.jpg'
    ]
  },
  {
    name: 'Cyberpunk 2077',
    description: 'Ролевая игра в открытом мире, действие которой происходит в футуристическом городе Найт-Сити.',
    platform: 'PC, PlayStation, Xbox',
    multiplayer: 'Нет',
    genre: 'RPG',
    ageRating: '18+',
    releaseDate: '2020-12-10',
    image: '/images/cyberpunk2077.jpg',
    tags: ['RPG', 'Открытый мир', 'Киберпанк', 'Научная фантастика'],
    screenshots: [
      '/screenshots/cyberpunk_1.jpg',
      '/screenshots/cyberpunk_2.jpg'
    ]
  },
  {
    name: 'Among Us',
    description: 'Многопользовательская игра, в которой члены экипажа космического корабля должны найти предателя среди них.',
    platform: 'PC, Mobile, Nintendo Switch',
    multiplayer: 'Да',
    genre: 'Социальная дедукция',
    ageRating: '10+',
    releaseDate: '2018-06-15',
    image: '/images/amongus.jpg',
    tags: ['Мультиплеер', 'Социальная дедукция', 'Космос'],
    screenshots: [
      '/screenshots/amongus_1.jpg'
    ]
  },
  {
    name: 'Elden Ring',
    description: 'Ролевая игра с открытым миром, созданная в сотрудничестве с Джорджем Р. Р. Мартином.',
    platform: 'PC, PlayStation, Xbox',
    multiplayer: 'Да',
    genre: 'Action RPG',
    ageRating: '16+',
    releaseDate: '2022-02-25',
    image: '/images/eldenring.jpg',
    tags: ['RPG', 'Открытый мир', 'Фэнтези', 'Сложная'],
    screenshots: [
      '/screenshots/eldenring_1.jpg',
      '/screenshots/eldenring_2.jpg'
    ]
  }
];

/**
 * Добавляет демонстрационные игры в базу данных
 */
async function seedGames() {
  try {
    console.log('Начинаем добавление демонстрационных игр...');
    
    // Принудительно добавляем демо-игры
    console.log('Добавляем демонстрационные игры...');
    
    for (const game of demoGames) {
      try {
        console.log(`Добавление игры: ${game.name}`);
        
        // Добавляем игру в базу данных
        const newGame = await addGame({
          ...game,
          userId: 1, // ID администратора или системного пользователя
          createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
        
        // Инициализируем счетчик кликов
        await dbAsync.run(
          'INSERT INTO game_clicks (game_id, click_count) VALUES (?, ?)',
          [newGame.id, Math.floor(Math.random() * 100)] // Случайное число кликов
        );
      } catch (error) {
        console.error(`Ошибка при добавлении игры ${game.name}:`, error);
      }
    }
    
    console.log('Демонстрационные игры успешно добавлены!');
  } catch (error) {
    console.error('Ошибка при добавлении демонстрационных игр:', error);
    throw error;
  }
}

// Запускаем функцию добавления демонстрационных игр
seedGames().then(() => {
  console.log('Скрипт завершен.');
  process.exit(0);
}).catch(error => {
  console.error('Ошибка при выполнении скрипта:', error);
  process.exit(1);
}); 