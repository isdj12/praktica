// Экспорт всех основных модулей для удобного импорта
import server from './server.js';
import { dbAsync } from './database/db.js';

export {
  server,
  dbAsync
};

export default server; 