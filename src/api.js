// api.js - Функции для взаимодействия с Flask API

// Базовый URL для API
const API_URL = 'http://127.0.0.1:5000/api';
// Базовый URL для Flask сервера
const BASE_URL = 'http://127.0.0.1:5000';
// URL для Node.js API
const NODE_API_URL = 'http://localhost:3000/api';

// Локальное хранилище для закладок, пока нет серверного API
const LOCAL_BOOKMARKS_KEY = 'user_bookmarks';

// Получить список всех игр и обновить пути к изображениям
export async function fetchGames() {
  try {
    console.log('Fetching games from:', `${NODE_API_URL}/games`);
    const response = await fetch(`${NODE_API_URL}/games`);
    
    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.statusText}`);
    }
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
      console.error('Полученный текст:', text.substring(0, 200) + '...');
      throw new Error('Сервер вернул некорректный формат данных');
    }
    
    console.log('Received games:', data);
    return data;
  } catch (error) {
    console.error('Ошибка при получении списка игр:', error);
    return [];
  }
}

// Получить список популярных игр на основе количества кликов
export async function fetchPopularGames() {
  try {
    console.log('Fetching popular games from:', `${NODE_API_URL}/games/popular`);
    const response = await fetch(`${NODE_API_URL}/games/popular`);
    
    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.statusText}`);
    }
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
      console.error('Полученный текст:', text.substring(0, 200) + '...');
      throw new Error('Сервер вернул некорректный формат данных');
    }
    
    console.log('Received popular games:', data);
    return data;
  } catch (error) {
    console.error('Ошибка при получении списка популярных игр:', error);
    // Если API для популярных игр не реализовано, возвращаем пустой массив
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
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
      console.error('Полученный текст:', text.substring(0, 200) + '...');
      throw new Error('Сервер вернул некорректный формат данных');
    }
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
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
      console.error('Полученный текст:', text.substring(0, 200) + '...');
      throw new Error('Сервер вернул некорректный формат данных');
    }
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
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
        throw new Error(errorData.message || `Ошибка API: ${response.statusText}`);
      } catch (e) {
        console.error('Ошибка парсинга JSON:', e);
        throw new Error(`Ошибка API: ${response.statusText}`);
      }
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
      return { success: true };
    }
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
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
        throw new Error(errorData.message || `Ошибка API: ${response.statusText}`);
      } catch (e) {
        console.error('Ошибка парсинга JSON:', e);
        throw new Error(`Ошибка API: ${response.statusText}`);
      }
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
      return { success: true };
    }
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
    
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data.isInProfile;
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
      return false;
    }
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
      const text = await response.text();
      let errorMessage = `Ошибка API: ${response.statusText}`;
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Не удалось прочитать ответ с ошибкой:', e);
      }
      throw new Error(errorMessage);
    }
    
    const text = await response.text();
    let newGame;
    try {
      newGame = JSON.parse(text);
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
      console.error('Полученный текст:', text.substring(0, 200) + '...');
      throw new Error('Сервер вернул некорректный формат данных');
    }
    
    console.log('Успешно добавлена игра:', newGame);
    
    return newGame;
  } catch (error) {
    console.error('Ошибка при добавлении игры в каталог:', error);
    throw error;
  }
}

// Получить список закладок пользователя
export async function fetchUserBookmarks() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
    }
    
    // Пробуем получить закладки с сервера
    try {
      const response = await fetch(`${NODE_API_URL}/profile/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Ошибка парсинга JSON:', e);
          // Если не удалось распарсить JSON, используем локальное хранилище
        }
      }
    } catch (error) {
      console.warn('API для закладок не реализовано на сервере, используем локальное хранилище');
    }
    
    // Если API не доступно, используем локальное хранилище
    const savedBookmarks = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
    return savedBookmarks ? JSON.parse(savedBookmarks) : [];
    
  } catch (error) {
    console.error('Ошибка при получении закладок пользователя:', error);
    return [];
  }
}

// Добавить игру в закладки пользователя
export async function addGameToBookmarks(gameId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
    }
    
    // Пробуем добавить закладку через API
    let serverSuccess = false;
    try {
      const response = await fetch(`${NODE_API_URL}/profile/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gameId })
      });
      
      if (response.ok) {
        serverSuccess = true;
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Ошибка парсинга JSON:', e);
        }
      }
    } catch (error) {
      console.warn('API для закладок не реализовано на сервере, используем локальное хранилище');
    }
    
    // Если API не доступно, используем локальное хранилище
    if (!serverSuccess) {
      // Получаем данные игры
      const gameData = await fetchGameById(gameId);
      if (!gameData) {
        throw new Error('Не удалось получить информацию об игре');
      }
      
      // Получаем текущие закладки
      const savedBookmarks = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
      const bookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : [];
      
      // Проверяем, не добавлена ли уже эта игра
      if (!bookmarks.some(bookmark => bookmark.game_id === gameId)) {
        // Создаем объект закладки
        const newBookmark = {
          id: Date.now(), // Уникальный ID на основе времени
          game_id: gameId,
          game_name: gameData.name,
          game_image: gameData.image,
          game_genre: gameData.genre || 'Не указан',
          author_name: gameData.author || 'Неизвестно',
          added_at: new Date().toISOString()
        };
        
        // Добавляем в массив и сохраняем
        bookmarks.push(newBookmark);
        localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(bookmarks));
      }
      
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка при добавлении игры в закладки:', error);
    throw error;
  }
}

// Удалить игру из закладок пользователя
export async function removeGameFromBookmarks(gameId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
    }
    
    // Пробуем удалить закладку через API
    let serverSuccess = false;
    try {
      const response = await fetch(`${NODE_API_URL}/profile/bookmarks/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        serverSuccess = true;
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Ошибка парсинга JSON:', e);
        }
      }
    } catch (error) {
      console.warn('API для закладок не реализовано на сервере, используем локальное хранилище');
    }
    
    // Если API не доступно, используем локальное хранилище
    if (!serverSuccess) {
      const savedBookmarks = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
      if (savedBookmarks) {
        const bookmarks = JSON.parse(savedBookmarks);
        const updatedBookmarks = bookmarks.filter(bookmark => bookmark.game_id !== parseInt(gameId));
        localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(updatedBookmarks));
      }
      
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка при удалении игры из закладок:', error);
    throw error;
  }
}

// Проверить, добавлена ли игра в закладки пользователя
export async function isGameInBookmarks(gameId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    // Пробуем проверить через API
    try {
      const response = await fetch(`${NODE_API_URL}/profile/bookmarks/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          return data.isInBookmarks;
        } catch (e) {
          console.error('Ошибка парсинга JSON:', e);
        }
      }
    } catch (error) {
      console.warn('API для закладок не реализовано на сервере, используем локальное хранилище');
    }
    
    // Если API не доступно, проверяем в локальном хранилище
    const savedBookmarks = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
    if (savedBookmarks) {
      const bookmarks = JSON.parse(savedBookmarks);
      return bookmarks.some(bookmark => bookmark.game_id === parseInt(gameId));
    }
    
    return false;
  } catch (error) {
    console.error('Ошибка при проверке наличия игры в закладках:', error);
    return false;
  }
}

/**
 * Получение случайной игры из каталога
 * @returns {Promise<object|null>} - Случайная игра или null
 */
export async function getRandomGame() {
  try {
    // Получаем все игры
    const games = await fetchGames();
    
    // Проверяем, есть ли игры
    if (!games || games.length === 0) {
      return null;
    }
    
    // Выбираем случайную игру
    const randomIndex = Math.floor(Math.random() * games.length);
    return games[randomIndex];
  } catch (error) {
    console.error('Ошибка при получении случайной игры:', error);
    return null;
  }
}

/**
 * Удаление игры из каталога
 * @param {number} gameId - ID игры
 * @returns {Promise<object>} - Результат операции
 */
export async function deleteGameFromCatalog(gameId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
    }
    
    const response = await fetch(`${NODE_API_URL}/games/${gameId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
        throw new Error(errorData.message || `Ошибка API: ${response.statusText}`);
      } catch (e) {
        console.error('Ошибка парсинга JSON:', e);
        throw new Error(`Ошибка API: ${response.statusText}`);
      }
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
      return { success: true, message: 'Игра успешно удалена' };
    }
  } catch (error) {
    console.error('Ошибка при удалении игры из каталога:', error);
    throw error;
  }
} 