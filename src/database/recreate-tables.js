import { dbAsync } from './db.js';

/**
 * Функция для полного пересоздания всех таблиц в базе данных
 */
async function recreateTables() {
  try {
    console.log('Начинаем пересоздание таблиц...');
    
    // Отключаем проверку внешних ключей для удаления таблиц
    await dbAsync.run('SET FOREIGN_KEY_CHECKS = 0');
    
    // Удаляем все таблицы, связанные с играми
    console.log('Удаляем существующие таблицы...');
    await dbAsync.run('DROP TABLE IF EXISTS game_files');
    await dbAsync.run('DROP TABLE IF EXISTS game_tags');
    await dbAsync.run('DROP TABLE IF EXISTS game_screenshots');
    await dbAsync.run('DROP TABLE IF EXISTS game_clicks');
    await dbAsync.run('DROP TABLE IF EXISTS user_games');
    await dbAsync.run('DROP TABLE IF EXISTS games');
    
    // Включаем проверку внешних ключей
    await dbAsync.run('SET FOREIGN_KEY_CHECKS = 1');
    
    // Создаем таблицу games
    console.log('Создаем таблицу games...');
    await dbAsync.run(`
      CREATE TABLE games (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        platform VARCHAR(100),
        multiplayer VARCHAR(50),
        genre VARCHAR(100),
        ageRating VARCHAR(50),
        releaseDate VARCHAR(50),
        image VARCHAR(255),
        userId INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Создаем таблицу game_tags
    console.log('Создаем таблицу game_tags...');
    await dbAsync.run(`
      CREATE TABLE game_tags (
        id INT PRIMARY KEY AUTO_INCREMENT,
        game_id INT NOT NULL,
        tag VARCHAR(100) NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Создаем таблицу game_screenshots
    console.log('Создаем таблицу game_screenshots...');
    await dbAsync.run(`
      CREATE TABLE game_screenshots (
        id INT PRIMARY KEY AUTO_INCREMENT,
        game_id INT NOT NULL,
        screenshot_url VARCHAR(255) NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Создаем таблицу game_clicks
    console.log('Создаем таблицу game_clicks...');
    await dbAsync.run(`
      CREATE TABLE game_clicks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        game_id INT NOT NULL,
        click_count INT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Создаем таблицу game_files
    console.log('Создаем таблицу game_files...');
    await dbAsync.run(`
      CREATE TABLE game_files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        game_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Создаем таблицу user_games (если она используется)
    console.log('Создаем таблицу user_games...');
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS user_games (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        game_id INT NOT NULL,
        game_name VARCHAR(255) NOT NULL,
        game_image VARCHAR(255),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('Все таблицы успешно созданы!');
    return true;
  } catch (error) {
    console.error('Ошибка при пересоздании таблиц:', error);
    throw error;
  }
}

// Запускаем функцию пересоздания таблиц
recreateTables()
  .then(() => {
    console.log('Пересоздание таблиц завершено успешно.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Ошибка при пересоздании таблиц:', error);
    process.exit(1);
  }); 