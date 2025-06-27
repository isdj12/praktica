import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import './App.css';
import Button from './component/button.jsx';
import { button } from './src.js';
import Poisk from './component/poisk.jsx';
import original from './assets/original.png';
import './UserProfile.css';
import { 
  fetchUserGames, 
  removeGameFromProfile, 
  addGameToCatalog, 
  fetchUserBookmarks,
  removeGameFromBookmarks,
  deleteGameFromCatalog,
  fetchUserProfileByUsername
} from './api.js';
import AddGameModal from './component/AddGameModal.jsx';

// Определяем базовый URL API в зависимости от окружения
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.REACT_APP_API_URL || window.location.origin + '/api')
  : 'http://localhost:3002/api';

// Заглушка для отсутствующих изображений
const FALLBACK_IMAGE = "/images/no-image.svg";

function UserProfile() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("ПРОФИЛЬ");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGames, setUserGames] = useState([]);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false);
  const [addingGame, setAddingGame] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState({ show: false, message: '', isError: false });
  const [isCurrentUser, setIsCurrentUser] = useState(true);
  const navigate = useNavigate();
  
  // Получаем username из URL-параметров
  const usernameParam = searchParams.get('username');

  useEffect(() => {
    // Получаем данные пользователя из localStorage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Если указан username в URL и он отличается от текущего пользователя
        if (usernameParam) {
          // Проверяем, не совпадает ли с текущим пользователем
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          if (currentUser && currentUser.username === usernameParam) {
            setUser(currentUser);
            setIsCurrentUser(true);
          } else {
            // Загружаем профиль другого пользователя
            try {
              const profileData = await fetchUserProfileByUsername(usernameParam);
              setUser({
                username: profileData.username,
                createdAt: profileData.createdAt
              });
              setUserGames(profileData.games || []);
              setIsCurrentUser(false);
            } catch (err) {
              console.error('Ошибка при загрузке профиля пользователя:', err);
              setError('Пользователь не найден или произошла ошибка при загрузке профиля');
            }
          }
        } else if (token) {
          // Если нет username в URL, но есть токен - загружаем свой профиль
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          setIsCurrentUser(true);
          
          // Проверяем токен через API
          try {
            const response = await fetch(`${process.env.NODE_ENV === 'production' 
              ? '/api'
              : 'http://localhost:3002/api'}/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) {
              if (response.status === 401) {
                // Если токен недействителен, удаляем его и перенаправляем на страницу входа
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
              }
              throw new Error('Не удалось загрузить профиль');
            }
          } catch (err) {
            console.error('Ошибка при проверке токена:', err);
          }
        } else {
          // Если нет ни username, ни токена - перенаправляем на страницу входа
          navigate('/login');
          return;
        }
        
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
    
    // Добавляем класс к body при монтировании
    document.body.classList.add('user-profile-page');
    
    // Удаляем класс при размонтировании
    return () => {
      document.body.classList.remove('user-profile-page');
    };
  }, [navigate, usernameParam]);
  
  // Загружаем игры пользователя только если это текущий пользователь
  useEffect(() => {
    if (user && isCurrentUser && activeTab === "ПРОФИЛЬ") {
      const loadUserGames = async () => {
        try {
          setLoadingGames(true);
          const games = await fetchUserGames();
          setUserGames(games);
        } catch (error) {
          console.error('Ошибка при загрузке игр пользователя:', error);
        } finally {
          setLoadingGames(false);
        }
      };
      
      loadUserGames();
    }
  }, [user, activeTab, isCurrentUser]);

  // Загружаем закладки пользователя только если это текущий пользователь
  useEffect(() => {
    if (user && isCurrentUser && activeTab === "ЗАКЛАДКИ") {
      const loadUserBookmarks = async () => {
        try {
          setLoadingBookmarks(true);
          const bookmarks = await fetchUserBookmarks();
          setUserBookmarks(bookmarks);
        } catch (error) {
          console.error('Ошибка при загрузке закладок пользователя:', error);
        } finally {
          setLoadingBookmarks(false);
        }
      };
      
      loadUserBookmarks();
    }
  }, [user, activeTab, isCurrentUser]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };
  
  // Функция для обработки ошибок при загрузке изображений
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_IMAGE;
  };
  
  // Функция для удаления игры из профиля и каталога
  const handleRemoveGame = async (gameId, game) => {
    console.log(`=== НАЧАЛО УДАЛЕНИЯ ИГРЫ ===`);
    console.log(`Игра для удаления:`, game);
    
    try {
      // Показываем сообщение о процессе удаления
      setDeleteStatus({ 
        show: true, 
        message: 'Удаление игры...', 
        isError: false 
      });
      
      // Определяем ID для каталога и профиля
      const catalogId = game.catalogId || game.game_id;
      // Важно: для удаления из профиля используем ID записи в таблице user_games
      const profileId = game.id;
      
      console.log(`ID записи в профиле: ${profileId}, ID игры: ${game.game_id}, ID в каталоге: ${catalogId}`);
      
      // Проверяем права на удаление из каталога
      const canDeleteFromCatalog = user && (
        user.role === 'admin' || 
        (game.userId && game.userId === user.id) || 
        (game.authorId && game.authorId === user.id)
      );
      
      console.log(`Пользователь может удалить игру из каталога: ${canDeleteFromCatalog}`);
      
      try {
        // Сначала удаляем из профиля
        console.log(`Удаляем игру из профиля с ID записи: ${profileId}`);
        
        // Используем game_id для удаления из профиля, так как это ID в таблице user_games
        await removeGameFromProfile(game.game_id);
        console.log(`Игра успешно удалена из профиля`);
        
        // Если есть права, удаляем также из каталога
        if (canDeleteFromCatalog) {
          try {
            console.log(`Удаляем игру из каталога с ID: ${catalogId}`);
            await deleteGameFromCatalog(catalogId);
            console.log(`Игра успешно удалена из каталога`);
          } catch (catalogError) {
            console.error(`Ошибка при удалении из каталога: ${catalogError.message}`);
            // Ошибка при удалении из каталога не критична, продолжаем
          }
        }
      } catch (error) {
        console.error(`Ошибка при удалении из профиля: ${error.message}`);
        
        // Если не удалось удалить из профиля, но есть права на удаление из каталога,
        // пытаемся удалить из каталога
        if (canDeleteFromCatalog) {
          console.log(`Пытаемся удалить игру из каталога с ID: ${catalogId}`);
          await deleteGameFromCatalog(catalogId);
          console.log(`Игра успешно удалена из каталога`);
        } else {
          // Если ни одно удаление не удалось, пробрасываем ошибку дальше
          throw error;
        }
      }
      
      // Обновляем локальный список игр независимо от результата
      setUserGames(prevGames => {
        const newGames = prevGames.filter(g => g.game_id !== parseInt(game.game_id));
        console.log(`Обновлен список игр: было ${prevGames.length}, стало ${newGames.length}`);
        return newGames;
      });
      
      // Показываем сообщение об успешном удалении
      setDeleteStatus({ 
        show: true, 
        message: canDeleteFromCatalog 
          ? 'Игра успешно удалена из профиля и каталога' 
          : 'Игра успешно удалена из профиля', 
        isError: false 
      });
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setDeleteStatus({ show: false, message: '', isError: false });
      }, 3000);
    } catch (err) {
      console.error('Ошибка при удалении игры:', err);
      
      // Показываем сообщение об ошибке
      setDeleteStatus({ 
        show: true, 
        message: `Ошибка при удалении игры: ${err.message || 'Неизвестная ошибка'}`, 
        isError: true 
      });
      
      // Скрываем сообщение через 5 секунды
      setTimeout(() => {
        setDeleteStatus({ show: false, message: '', isError: false });
      }, 5000);
    } finally {
      console.log(`=== ЗАВЕРШЕНИЕ УДАЛЕНИЯ ИГРЫ ===`);
    }
  };

  // Функция для удаления игры из закладок
  const handleRemoveBookmark = async (gameId) => {
    try {
      // Показываем сообщение о процессе удаления
      setDeleteStatus({ 
        show: true, 
        message: 'Удаление игры из закладок...', 
        isError: false 
      });
      
      // Удаляем игру из закладок через API
      await removeGameFromBookmarks(gameId);
      
      // Обновляем список закладок
      setUserBookmarks(prevBookmarks => prevBookmarks.filter(bookmark => bookmark.game_id !== parseInt(gameId)));
      
      // Показываем сообщение об успешном удалении
      setDeleteStatus({ 
        show: true, 
        message: 'Игра успешно удалена из закладок', 
        isError: false 
      });
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setDeleteStatus({ show: false, message: '', isError: false });
      }, 3000);
    } catch (error) {
      console.error('Ошибка при удалении игры из закладок:', error);
      
      // Показываем сообщение об ошибке
      setDeleteStatus({ 
        show: true, 
        message: `Ошибка при удалении игры из закладок: ${error.message || 'Неизвестная ошибка'}`, 
        isError: true 
      });
      
      // Скрываем сообщение через 5 секунд
      setTimeout(() => {
        setDeleteStatus({ show: false, message: '', isError: false });
      }, 5000);
    }
  };
  
  // Открыть модальное окно добавления игры
  const openAddGameModal = () => {
    setIsAddGameModalOpen(true);
  };
  
  // Закрыть модальное окно добавления игры
  const closeAddGameModal = () => {
    setIsAddGameModalOpen(false);
  };
  
  // Функция добавления новой игры
  const handleAddGame = async (gameData) => {
    try {
      setAddingGame(true);
      setError(null); // Сбрасываем предыдущую ошибку
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Необходима авторизация');
      }
      
      console.log('Отправка данных игры на сервер...');
      
      // Вызываем API с передачей токена
      const result = await addGameToCatalog(gameData, token);
      
      console.log('Игра успешно добавлена:', result);
      
      // Обновляем список игр пользователя
      const updatedGames = await fetchUserGames();
      setUserGames(updatedGames);
      
      // Закрываем модальное окно
      closeAddGameModal();
      
      // Показываем уведомление об успехе
      setDeleteStatus({ 
        show: true, 
        message: 'Игра успешно добавлена в каталог!', 
        isError: false 
      });
      
      // Скрываем уведомление через 3 секунды
      setTimeout(() => {
        setDeleteStatus({ show: false, message: '', isError: false });
      }, 3000);
      
      return result;
    } catch (error) {
      console.error('Ошибка при добавлении игры:', error);
      
      // Показываем уведомление об ошибке
      setDeleteStatus({ 
        show: true, 
        message: `Ошибка: ${error.message || 'Произошла ошибка при добавлении игры'}`, 
        isError: true 
      });
      
      // Скрываем уведомление через 5 секунд
      setTimeout(() => {
        setDeleteStatus({ show: false, message: '', isError: false });
      }, 5000);
      
      throw error;
    } finally {
      setAddingGame(false);
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (error) {
      return 'Дата неизвестна';
    }
  };

  // Обработчик удаления игры из каталога (только для администраторов и авторов)
  const handleDeleteGameFromCatalog = async (gameId) => {
    // Гарантируем, что ID игры - число
    const catalogId = parseInt(gameId);
    
    console.log(`Попытка удаления игры из каталога. ID игры: ${catalogId}, тип: ${typeof catalogId}`);
    
    if (!window.confirm('Вы уверены, что хотите удалить эту игру из каталога? Это действие нельзя отменить.')) {
      console.log('Пользователь отменил удаление игры');
      return;
    }
    
    try {
      // Показываем сообщение о процессе удаления
      setDeleteStatus({ 
        show: true, 
        message: 'Удаление игры из каталога...', 
        isError: false 
      });
      
      console.log(`Вызов API для удаления игры с ID ${catalogId} из каталога`);
      
      // Удаляем игру из каталога через API
      await deleteGameFromCatalog(catalogId);
      
      console.log(`Игра с ID ${catalogId} успешно удалена из каталога`);
      
      // Удаляем игру из локального списка
      setUserGames(prevGames => {
        console.log(`Обновление списка игр после удаления. Текущее количество: ${prevGames.length}`);
        const newGames = prevGames.filter(game => game.game_id !== parseInt(gameId));
        console.log(`Новое количество игр: ${newGames.length}`);
        return newGames;
      });
      
      // Показываем сообщение об успешном удалении
      setDeleteStatus({ 
        show: true, 
        message: 'Игра успешно удалена из каталога', 
        isError: false 
      });
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setDeleteStatus({ show: false, message: '', isError: false });
      }, 3000);
    } catch (err) {
      console.error('Ошибка при удалении игры из каталога:', err);
      
      // Показываем сообщение об ошибке
      setDeleteStatus({ 
        show: true, 
        message: `Ошибка при удалении игры из каталога: ${err.message || 'Неизвестная ошибка'}`, 
        isError: true 
      });
      
      // Скрываем сообщение через 5 секунд
      setTimeout(() => {
        setDeleteStatus({ show: false, message: '', isError: false });
      }, 5000);
    }
  };

  // Отрендерить содержимое профиля
  const renderProfileContent = () => {
    if (loadingGames) {
      return <div className="loading-games">Загрузка игр...</div>;
    }
    
    if (userGames.length === 0) {
      return (
        <div className="no-games">
          <p>В профиле пока нет игр</p>
        </div>
      );
    }
    
    return (
      <div className="profile-games">
        <div className="profile-games-grid">
          {userGames.map((game) => (
            <div key={game.id} className="profile-game-card">
              <div className="profile-game-image" onClick={() => navigate(`/game?id=${game.game_id}`)}>
                <img 
                  src={game.game_image} 
                  alt={game.game_name} 
                  onError={handleImageError}
                />
              </div>
              <div className="profile-game-info">
                <h3 onClick={() => navigate(`/game?id=${game.game_id}`)}>{game.game_name}</h3>
                <div className="profile-game-meta">
                  <span>Добавлено: {formatDate(game.added_at)}</span>
                </div>
                {isCurrentUser && (
                  <div className="profile-game-actions">
                    <button 
                      className="btn xs danger" 
                      onClick={() => handleRemoveGame(game.game_id, game)}
                    >
                      Удалить из профиля
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Отрендерить содержимое закладок
  const renderBookmarksContent = () => {
    if (loadingBookmarks) {
      return <div className="loading-games">Загрузка закладок...</div>;
    }
    
    if (userBookmarks.length === 0) {
      return (
        <div className="no-games">
          <p>В закладках пока нет игр</p>
        </div>
      );
    }
    
    return (
      <div className="profile-games">
        <div className="profile-games-grid">
          {userBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="profile-game-card">
              <div className="profile-game-image" onClick={() => navigate(`/game?id=${bookmark.game_id}`)}>
                <img 
                  src={bookmark.game_image} 
                  alt={bookmark.game_name} 
                  onError={handleImageError}
                />
              </div>
              <div className="profile-game-info">
                <h3 onClick={() => navigate(`/game?id=${bookmark.game_id}`)}>{bookmark.game_name}</h3>
                <div className="profile-game-meta">
                  <span>{bookmark.game_genre}</span>
                  {bookmark.added_at && <span>Добавлено: {formatDate(bookmark.added_at)}</span>}
                </div>
                <div className="profile-game-actions">
                  <button 
                    className="btn xs danger" 
                    onClick={() => handleRemoveBookmark(bookmark.game_id)}
                  >
                    Удалить из закладок
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error-message">Ошибка: {error}</div>;
  }

  if (!user) {
    return <div className="loading">Пользователь не найден</div>;
  }

  return (
    <>
      <div className="user-profile">
        <div className="header-container">
          <img src={original} alt="logo" className='logo' onClick={() => navigate('/')} style={{cursor: 'pointer'}} />
          <div className="button-container">
            <Button text={button[0].text} href={button[0].href} />
            <Button text={button[1].text} href={button[1].href} className="right-button" />
            <Button text={button[2].text} href={button[2].href} className="right-button" isRandomGame={button[2].isRandomGame} />
          </div>
          <div className="search-wrapper">
            <Poisk />
            <div className="home-link">
            </div>
          </div>
        </div>
        <hr className='line'></hr>
        
        <div id="content" className="content content-full-width">
          <div className="profile">
            <div className="profile-header">
              <div className="ph-cover"></div>
              <div className="ph-content">
                <div className="ph-img">
                  <img 
                    src="https://bootdey.com/img/Content/avatar/avatar3.png" 
                    alt="Аватар пользователя" 
                    onError={handleImageError}
                  />
                </div>
                <div className="ph-info">
                  <h4 className="m-t-10 m-b-5">{user.username}</h4>
                  <p className="m-b-10">{isCurrentUser ? (user.email ? user.email : 'Пользователь') : 'Профиль пользователя'}</p>
                  {isCurrentUser && (
                    <>
                      <button className="btn sm prim m-b m-r" onClick={openAddGameModal}>Добавить игру</button>
                      <button className="btn sm info m-b" onClick={handleLogout}>Выйти из аккаунта</button>
                    </>
                  )}
                </div>
              </div>
              <div className="ph-tab nav nav-tabs">
                <button className={`nav-link_ ${activeTab === "ПРОФИЛЬ" ? "active show" : ""}`} onClick={() => handleTabClick("ПРОФИЛЬ")}>
                  ПРОФИЛЬ
                </button>
                {isCurrentUser && (
                  <button className={`nav-link_ ${activeTab === "ЗАКЛАДКИ" ? "active show" : ""}`} onClick={() => handleTabClick("ЗАКЛАДКИ")}>
                    ЗАКЛАДКИ
                  </button>
                )}
              </div>
            </div>
            <div className="profile-body">
              <div className="tab-content p-0">
                <div className={`tab-pane fade ${activeTab === "ПРОФИЛЬ" ? "active show" : ""}`}>
                  {renderProfileContent()}
                </div>
                {isCurrentUser && (
                  <div className={`tab-pane fade ${activeTab === "ЗАКЛАДКИ" ? "active show" : ""}`}>
                    {renderBookmarksContent()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {deleteStatus.show && (
        <div className={`status-message ${deleteStatus.isError ? 'error' : 'success'}`}>
          {deleteStatus.message}
        </div>
      )}
      
      {isAddGameModalOpen && (
        <AddGameModal 
          isOpen={true}
          onClose={closeAddGameModal} 
          onAddGame={handleAddGame}
          isLoading={addingGame}
        />
      )}
    </>
  );
}

export default UserProfile; 