import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Путь к исходному изображению (используем существующее изображение из проекта)
const sourcePath = path.join(__dirname, 'src/assets/original.png');

// Создаем директории
const gameImagesDir = path.join(__dirname, 'public/uploads/games');
const screenshotsDir = path.join(__dirname, 'public/uploads/screenshots');

if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

if (!fs.existsSync(path.join(__dirname, 'public/uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'public/uploads'));
}

if (!fs.existsSync(gameImagesDir)) {
  fs.mkdirSync(gameImagesDir);
}

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Список игр и их изображений
const games = [
  {
    name: 'shovel_knight',
    screenshots: ['shovel_knight_1', 'shovel_knight_2']
  },
  {
    name: 'cuphead',
    screenshots: ['cuphead_1', 'cuphead_2']
  },
  {
    name: 'oneshot',
    screenshots: ['oneshot_1', 'oneshot_2']
  },
  {
    name: 'undertale',
    screenshots: ['undertale_1', 'undertale_2']
  }
];

// Проверяем, существует ли исходное изображение
if (!fs.existsSync(sourcePath)) {
  console.error('Исходное изображение не найдено:', sourcePath);
  process.exit(1);
}

// Копируем изображение для каждой игры
for (const game of games) {
  // Копируем основное изображение игры
  const gamePath = path.join(gameImagesDir, `${game.name}.jpg`);
  fs.copyFileSync(sourcePath, gamePath);
  console.log(`Создано изображение для игры ${game.name}: ${gamePath}`);
  
  // Копируем скриншоты
  for (const screenshot of game.screenshots) {
    const screenshotPath = path.join(screenshotsDir, `${screenshot}.jpg`);
    fs.copyFileSync(sourcePath, screenshotPath);
    console.log(`Создан скриншот ${screenshot}: ${screenshotPath}`);
  }
}

console.log('Все изображения успешно созданы!'); 