import { dbAsync } from './db.js';

/**
 * Функция для полного удаления всех игр из каталога и очистки популярных игр
 */
async function clearAllGames() {
  try {
    console.log('Начинаем полную очистку базы данных игр...');
    
    // Отключаем проверку внешних ключей для удаления данных
    await dbAsync.run('SET FOREIGN_KEY_CHECKS = 0');
    
    // Очищаем все таблицы, связанные с играми
    console.log('Очищаем таблицу game_files...');
    await dbAsync.run('TRUNCATE TABLE game_files');
    
    console.log('Очищаем таблицу game_tags...');
    await dbAsync.run('TRUNCATE TABLE game_tags');
    
    console.log('Очищаем таблицу game_screenshots...');
    await dbAsync.run('TRUNCATE TABLE game_screenshots');
    
    console.log('Очищаем таблицу game_clicks...');
    await dbAsync.run('TRUNCATE TABLE game_clicks');
    
    console.log('Очищаем таблицу user_games...');
    await dbAsync.run('TRUNCATE TABLE user_games');
    
    console.log('Очищаем таблицу games...');
    await dbAsync.run('TRUNCATE TABLE games');
    
    // Сбрасываем автоинкремент
    console.log('Сбрасываем автоинкремент для таблицы games...');
    await dbAsync.run('ALTER TABLE games AUTO_INCREMENT = 1');
    
    // Включаем проверку внешних ключей
    await dbAsync.run('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Все таблицы успешно очищены!');
    return true;
  } catch (error) {
    console.error('Ошибка при очистке базы данных игр:', error);
    throw error;
  }
}

// Запускаем функцию очистки
clearAllGames()
  .then(() => {
    console.log('Очистка базы данных игр завершена успешно.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Ошибка при очистке базы данных игр:', error);
    process.exit(1);
  }); 