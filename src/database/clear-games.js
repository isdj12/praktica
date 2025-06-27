import { dbAsync } from './db.js';

/**
 * Функция для удаления всех игр из каталога
 */
async function clearGames() {
  try {
    console.log('Начинаем удаление всех игр из каталога...');
    
    // Отключаем проверку внешних ключей для удаления таблиц
    await dbAsync.run('SET FOREIGN_KEY_CHECKS = 0');
    
    // Очищаем все таблицы, связанные с играми
    console.log('Очищаем таблицу game_files...');
    await dbAsync.run('DELETE FROM game_files');
    
    console.log('Очищаем таблицу game_tags...');
    await dbAsync.run('DELETE FROM game_tags');
    
    console.log('Очищаем таблицу game_screenshots...');
    await dbAsync.run('DELETE FROM game_screenshots');
    
    console.log('Очищаем таблицу game_clicks...');
    await dbAsync.run('DELETE FROM game_clicks');
    
    console.log('Очищаем таблицу user_games...');
    await dbAsync.run('DELETE FROM user_games');
    
    console.log('Очищаем таблицу games...');
    await dbAsync.run('DELETE FROM games');
    
    // Включаем проверку внешних ключей
    await dbAsync.run('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Все игры успешно удалены из каталога!');
    return true;
  } catch (error) {
    console.error('Ошибка при удалении игр из каталога:', error);
    throw error;
  }
}

// Запускаем функцию удаления игр
clearGames()
  .then(() => {
    console.log('Удаление игр завершено успешно.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Ошибка при удалении игр:', error);
    process.exit(1);
  }); 