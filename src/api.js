// api.js - Функции для взаимодействия с Flask API

// Базовый URL для API
const API_URL = 'http://127.0.0.1:5000/api';
// Базовый URL для Flask сервера
const BASE_URL = 'http://127.0.0.1:5000';

// Получить список всех игр и обновить пути к изображениям
export async function fetchGames() {
  try {
    console.log('Fetching games from:', `${API_URL}/games`);
    const response = await fetch(`${API_URL}/games`);
    
    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Обновляем пути к изображениям
    const processedData = data.map(game => ({
      ...game,
      // Если путь не начинается с http, добавляем базовый URL
      image: game.image.startsWith('http') ? game.image : `${BASE_URL}${game.image}`
    }));
    
    console.log('Received games:', processedData);
    return processedData;
  } catch (error) {
    console.error('Ошибка при получении списка игр:', error);
    return [];
  }
}

// Получить информацию об одной игре по ID
export async function fetchGameById(gameId) {
  try {
    const response = await fetch(`${API_URL}/games/${gameId}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.statusText}`);
    }
    
    const game = await response.json();
    
    // Обновляем путь к изображению
    return {
      ...game,
      image: game.image.startsWith('http') ? game.image : `${BASE_URL}${game.image}`
    };
  } catch (error) {
    console.error(`Ошибка при получении игры с ID ${gameId}:`, error);
    return null;
  }
} 