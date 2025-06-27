import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Пути к директориям для загрузки файлов
const uploadDirs = [
  path.join(__dirname, '../public/uploads'),
  path.join(__dirname, '../public/uploads/games'),
  path.join(__dirname, '../public/uploads/screenshots'),
  path.join(__dirname, '../public/uploads/gamefiles')
];

/**
 * Проверяет и создает директории для загрузки файлов
 */
function ensureUploadDirs() {
  console.log('Проверка директорий для загрузки файлов...');
  
  uploadDirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        console.log(`Создаем директорию: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Директория создана: ${dir}`);
      } else {
        console.log(`Директория уже существует: ${dir}`);
      }
    } catch (error) {
      console.error(`Ошибка при создании директории ${dir}:`, error);
    }
  });
  
  console.log('Проверка директорий завершена.');
}

// Экспортируем функцию для использования в других файлах
export default ensureUploadDirs;

// Если файл запущен напрямую, выполняем функцию
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureUploadDirs();
} 