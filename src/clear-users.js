import { dbAsync } from './database/db.js';

async function clearAllUsers() {
  try {
    console.log('Начинаю очистку таблицы пользователей...');
    
    const result = await dbAsync.run('DELETE FROM users');
    
    console.log(`Успешно удалено ${result.changes} пользователей из базы данных.`);
    console.log('Таблица пользователей очищена.');
    
    // Сбрасываем автоинкремент
    await dbAsync.run('DELETE FROM sqlite_sequence WHERE name = "users"');
    console.log('Счетчик ID сброшен.');
    
  } catch (error) {
    console.error('Ошибка при очистке таблицы пользователей:', error);
  } finally {
    process.exit(0);
  }
}

// Запускаем функцию очистки
clearAllUsers(); 