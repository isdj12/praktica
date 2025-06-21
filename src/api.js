// api.js - Функции для взаимодействия с Flask API

// Базовый URL для API
const API_URL = 'http://127.0.0.1:5000/api';
// Базовый URL для Flask сервера
const BASE_URL = 'http://127.0.0.1:5000';
// URL для Node.js API
const NODE_API_URL = 'http://localhost:3000/api';

// Получить список всех игр и обновить пути к изображениям
export async function fetchGames() {
  try {
    console.log('Fetching games from:', `${NODE_API_URL}/games`);
    const response = await fetch(`${NODE_API_URL}/games`);
    
    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Received games:', data);
    return data;
  } catch (error) {
    console.error('Ошибка при получении списка игр:', error);
    return [];
  }
}

// Получить информацию об одной игре по ID
export async function fetchGameById(gameId) {
  try {
    const response = await fetch(`${NODE_API_URL}/games/${gameId}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Ошибка при получении игры с ID ${gameId}:`, error);
    return null;
  }
}

// Получить список игр пользователя
export async function fetchUserGames() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
    }
    
    const response = await fetch(`${NODE_API_URL}/profile/games`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении игр пользователя:', error);
    return [];
  }
}

// Добавить игру в профиль пользователя
export async function addGameToProfile(gameId, gameName, gameImage) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
    }
    
    const response = await fetch(`${NODE_API_URL}/profile/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ gameId, gameName, gameImage })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Ошибка API: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при добавлении игры в профиль:', error);
    throw error;
  }
}

// Удалить игру из профиля пользователя
export async function removeGameFromProfile(gameId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
    }
    
    const response = await fetch(`${NODE_API_URL}/profile/games/${gameId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Ошибка API: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при удалении игры из профиля:', error);
    throw error;
  }
}

// Проверить, добавлена ли игра в профиль пользователя
export async function isGameInProfile(gameId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    const response = await fetch(`${NODE_API_URL}/profile/games/${gameId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.isInProfile;
  } catch (error) {
    console.error('Ошибка при проверке наличия игры в профиле:', error);
    return false;
  }
}

// Добавить новую игру в каталог
export async function addGameToCatalog(gameData) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
    }
    
    console.log('Отправка данных игры на сервер:', gameData);
    
    const response = await fetch(`${NODE_API_URL}/games`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: gameData // FormData для отправки файлов
    });
    
    if (!response.ok) {
      let errorMessage = `Ошибка API: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Не удалось прочитать ответ с ошибкой:', e);
      }
      throw new Error(errorMessage);
    }
    
    const newGame = await response.json();
    console.log('Успешно добавлена игра:', newGame);
    
    return newGame;
  } catch (error) {
    console.error('Ошибка при добавлении игры в каталог:', error);
    throw error;
  }
} 