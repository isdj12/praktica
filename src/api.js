// api.js - Функции для взаимодействия с Flask API

// Определяем базовый URL API в зависимости от окружения
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:3002/api';

// Локальное хранилище для закладок, пока нет серверного API
const LOCAL_BOOKMARKS_KEY = 'user_bookmarks';

/**
 * Общая функция для выполнения fetch-запросов с обработкой ошибок
 */
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `Ошибка API: ${response.statusText || 'Внутренняя ошибка сервера'}`;
      
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Если не удалось распарсить JSON, используем текст ответа
        if (text && text.trim()) {
          errorMessage = text;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error(`Ошибка при запросе к ${url}:`, error);
    // Проверяем, является ли ошибка проблемой сети
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Нет соединения с сервером. Пожалуйста, проверьте подключение к интернету и повторите попытку.');
    }
    throw error;
  }
}

// Получить список всех игр и обновить пути к изображениям
export async function fetchGames() {
  try {
    return await fetchAPI(`${API_BASE_URL}/games`);
  } catch (error) {
    console.error('Ошибка при получении списка игр:', error);
    return [];
  }
}

// Получить список популярных игр на основе количества кликов
export async function fetchPopularGames() {
  try {
    return await fetchAPI(`${API_BASE_URL}/games/popular`);
  } catch (error) {
    console.error('Ошибка при получении списка популярных игр:', error);
    // Если API для популярных игр не реализовано, возвращаем пустой массив
    return [];
  }
}

// Получить информацию об одной игре по ID
export async function fetchGameById(gameId) {
  try {
    return await fetchAPI(`${API_BASE_URL}/games/${gameId}`);
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
    
    return await fetchAPI(`${API_BASE_URL}/profile/games`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Ошибка при получении игр пользователя:', error);
    return [];
  }
}

// Добавить игру в профиль пользователя
export async function addGameToProfile(gameId, gameName, gameImage) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
  }
  
  return await fetchAPI(`${API_BASE_URL}/profile/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ gameId, gameName, gameImage })
  });
}

// Удалить игру из профиля пользователя
export async function removeGameFromProfile(gameId) {
  console.log(`=== НАЧАЛО УДАЛЕНИЯ ИГРЫ ИЗ ПРОФИЛЯ ===`);
  console.log(`Получен ID игры: ${gameId} (тип: ${typeof gameId})`);
  
  try {
    // Проверка и преобразование ID
    if (!gameId) {
      throw new Error('Не указан ID игры для удаления из профиля');
    }
    
    // Гарантируем, что ID - число
    const id = parseInt(gameId);
    console.log(`Преобразованный ID игры: ${id}`);
    
    if (isNaN(id)) {
      throw new Error(`Некорректный ID игры: ${gameId}`);
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
    }
    
    // Отправляем запрос на удаление по game_id
    console.log(`Отправляем запрос DELETE на ${API_BASE_URL}/profile/games/${id}`);
    
    // Простой fetch запрос
    const response = await fetch(`${API_BASE_URL}/profile/games/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Получен ответ: ${response.status} ${response.statusText}`);
    
    // Обработка ошибок
    if (!response.ok) {
      let errorText = await response.text();
      console.error(`Ошибка ответа: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Требуется авторизация');
      } else if (response.status === 404) {
        throw new Error('Игра не найдена в профиле');
      } else {
        throw new Error(`Ошибка при удалении игры из профиля: ${response.status}`);
      }
    }
    
    console.log(`Игра успешно удалена из профиля`);
    return { success: true };
  } catch (error) {
    console.error(`ОШИБКА при удалении игры из профиля: ${error.message}`);
    throw error;
  } finally {
    console.log(`=== ЗАВЕРШЕНИЕ УДАЛЕНИЯ ИГРЫ ИЗ ПРОФИЛЯ ===`);
  }
}

// Проверить, добавлена ли игра в профиль пользователя
export async function isGameInProfile(gameId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    const data = await fetchAPI(`${API_BASE_URL}/profile/games/${gameId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return data.isInProfile;
  } catch (error) {
    console.error('Ошибка при проверке наличия игры в профиле:', error);
    return false;
  }
}

// Добавить новую игру в каталог
export const addGameToCatalog = async (gameData, token) => {
  try {
    console.log('=== НАЧАЛО ЗАПРОСА НА ДОБАВЛЕНИЕ ИГРЫ ===');
    
    if (!token) {
      console.error('Ошибка: Отсутствует токен авторизации');
      throw new Error('Требуется авторизация');
    }
    
    if (!gameData) {
      console.error('Ошибка: Отсутствуют данные игры');
      throw new Error('Отсутствуют данные игры');
    }

    // Проверяем, что gameData - это FormData
    if (!(gameData instanceof FormData)) {
      console.error('Ошибка: Неверный формат данных');
      throw new Error('Неверный формат данных для загрузки');
    }
    
    console.log('API URL:', `${API_BASE_URL}/games`);
    console.log('Метод:', 'POST');
    console.log('Токен авторизации:', token.substring(0, 10) + '...');
    
    // Отладка содержимого FormData
    console.log('Содержимое FormData:');
    for (let pair of gameData.entries()) {
      if (pair[0] === 'image' || pair[0] === 'screenshots' || pair[0] === 'gameFile') {
        console.log(pair[0], ':', pair[1].name);
      } else {
        console.log(pair[0], ':', pair[1]);
      }
    }
    
    // Отправляем FormData как есть, без дополнительной обработки
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: gameData
    });

    console.log('Статус ответа:', response.status);
    
    if (!response.ok) {
      // Пытаемся получить текст ошибки
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('Текст ошибки:', errorText);
      } catch (e) {
        console.error('Не удалось получить текст ошибки');
      }
      
      // Обработка типичных ошибок сервера
      if (response.status === 413) {
        throw new Error('Файлы слишком большие. Максимальный размер - 1МБ');
      } else if (response.status === 415) {
        throw new Error('Неподдерживаемый формат файлов. Используйте JPEG или PNG');
      } else if (response.status === 400) {
        const errorData = await response.json().catch(() => ({ message: errorText || 'Ошибка валидации данных' }));
        if (errorData.error && errorData.error.includes('Unexpected field')) {
          throw new Error('Ошибка загрузки файлов: неверное имя поля');
        }
        throw new Error(errorData.message || 'Ошибка валидации данных');
      } else if (response.status === 401) {
        throw new Error('Необходима авторизация');
      } else if (response.status === 403) {
        throw new Error('Недостаточно прав для выполнения операции');
      } else {
        throw new Error(`Ошибка при добавлении игры: ${errorText || response.statusText}`);
      }
    }

    const result = await response.json();
    console.log('Успешный ответ:', result);
    console.log('=== КОНЕЦ ЗАПРОСА НА ДОБАВЛЕНИЕ ИГРЫ ===');
    return result;
  } catch (error) {
    console.error('=== ОШИБКА ЗАПРОСА НА ДОБАВЛЕНИЕ ИГРЫ ===', error);
    throw error;
  }
};

// Функция для получения расширения файла
function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase() || 'jpg';
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
      return await fetchAPI(`${API_BASE_URL}/profile/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
    try {
      return await fetchAPI(`${API_BASE_URL}/profile/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gameId })
      });
    } catch (error) {
      // Если API не доступно, используем локальное хранилище
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
    try {
      return await fetchAPI(`${API_BASE_URL}/profile/bookmarks/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      // Если API не доступно, используем локальное хранилище
      const savedBookmarks = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
      if (savedBookmarks) {
        const bookmarks = JSON.parse(savedBookmarks);
        const updatedBookmarks = bookmarks.filter(bookmark => bookmark.game_id !== parseInt(gameId));
        localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(updatedBookmarks));
      }
      
      return { success: true };
    }
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
      const data = await fetchAPI(`${API_BASE_URL}/profile/bookmarks/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return data.isInBookmarks;
    } catch (error) {
      // Если API не доступно, проверяем в локальном хранилище
      const savedBookmarks = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
      if (savedBookmarks) {
        const bookmarks = JSON.parse(savedBookmarks);
        return bookmarks.some(bookmark => bookmark.game_id === parseInt(gameId));
      }
      return false;
    }
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
 * @param {number|string} gameId - ID игры
 * @returns {Promise<object>} - Результат операции
 */
export async function deleteGameFromCatalog(gameId) {
  console.log(`=== НАЧАЛО УДАЛЕНИЯ ИГРЫ ИЗ КАТАЛОГА ===`);
  console.log(`Получен ID: ${gameId} (тип: ${typeof gameId})`);
  
  try {
    // Проверка и преобразование ID
    if (!gameId) {
      throw new Error('Не указан ID игры для удаления');
    }
    
    // Гарантируем, что ID - число
    const id = parseInt(gameId);
    console.log(`Преобразованный ID игры: ${id}`);
    
    if (isNaN(id)) {
      throw new Error(`Некорректный ID игры: ${gameId}`);
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Токен не найден. Пожалуйста, войдите в систему.');
    }
    
    // Отправляем запрос на удаление игры
    console.log(`Отправляем запрос DELETE на ${API_BASE_URL}/games/${id}`);
    
    const response = await fetch(`${API_BASE_URL}/games/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Получен ответ: ${response.status} ${response.statusText}`);
    
    // Обработка ошибок
    if (!response.ok) {
      let errorText = await response.text();
      console.error(`Ошибка ответа: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Требуется авторизация');
      } else if (response.status === 403) {
        throw new Error('У вас нет прав для удаления этой игры');
      } else if (response.status === 404) {
        throw new Error('Игра не найдена');
      } else {
        throw new Error(`Ошибка при удалении игры: ${response.status}`);
      }
    }
    
    console.log(`Игра успешно удалена из каталога`);
    return { success: true };
  } catch (error) {
    console.error(`ОШИБКА при удалении игры из каталога: ${error.message}`);
    throw error;
  } finally {
    console.log(`=== ЗАВЕРШЕНИЕ УДАЛЕНИЯ ИГРЫ ИЗ КАТАЛОГА ===`);
  }
}

/**
 * Загрузка файла игры (ZIP-архива)
 * @param {number|string} gameId - ID игры
 * @param {File} file - Файл для загрузки (ZIP)
 * @returns {Promise<object>} - Результат операции
 */
export async function uploadGameFile(gameId, file) {
  try {
    // Проверки
    if (!gameId) {
      throw new Error('Не указан ID игры');
    }
    
    if (!file) {
      throw new Error('Файл не выбран');
    }
    
    // Проверяем формат файла
    if (!file.name.toLowerCase().endsWith('.zip')) {
      throw new Error('Можно загружать только ZIP-архивы');
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Требуется авторизация');
    }
    
    // Создаем FormData для отправки файла
    const formData = new FormData();
    formData.append('gameFile', file);
    
    // Отправляем запрос
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      // Обработка ошибок
      if (response.status === 401) {
        throw new Error('Требуется авторизация');
      } else if (response.status === 403) {
        throw new Error('У вас нет прав для загрузки файла к этой игре');
      } else if (response.status === 404) {
        throw new Error('Игра не найдена');
      } else if (response.status === 413) {
        throw new Error('Файл слишком большой. Максимальный размер - 50МБ');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при загрузке файла');
      }
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Ошибка при загрузке файла игры:', error);
    throw error;
  }
}

/**
 * Получение URL для скачивания файла игры
 * @param {number|string} gameId - ID игры
 * @returns {string} - URL для скачивания
 */
export function getGameFileDownloadUrl(gameId) {
  if (!gameId) {
    throw new Error('Не указан ID игры');
  }
  
  return `${API_BASE_URL}/games/${gameId}/download`;
}

/**
 * Получение профиля пользователя по имени пользователя
 * @param {string} username - Имя пользователя
 * @returns {Promise<object>} - Данные профиля пользователя
 */
export async function fetchUserProfileByUsername(username) {
  try {
    if (!username) {
      throw new Error('Имя пользователя не указано');
    }
    
    return await fetchAPI(`${API_BASE_URL}/users/${username}`);
  } catch (error) {
    console.error('Ошибка при получении профиля пользователя:', error);
    throw error;
  }
} 