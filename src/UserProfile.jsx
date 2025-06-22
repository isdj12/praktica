import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  deleteGameFromCatalog
} from './api.js';
import AddGameModal from './component/AddGameModal.jsx';

function UserProfile() {
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
  const navigate = useNavigate();

  useEffect(() => {
    // Получаем данные пользователя из localStorage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Проверяем токен и получаем актуальные данные профиля
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:3000/api/profile', {
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
        
        const text = await response.text();
        let data;
        
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Ошибка парсинга JSON:', e);
          console.error('Полученный текст:', text.substring(0, 200) + '...');
          throw new Error('Сервер вернул некорректный формат данных');
        }
        
        // Если в localStorage есть данные пользователя, используем их, иначе используем данные из API
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(data.user);
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
  }, [navigate]);
  
  // Загружаем игры пользователя
  useEffect(() => {
    if (user && activeTab === "ПРОФИЛЬ") {
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
  }, [user, activeTab]);

  // Загружаем закладки пользователя
  useEffect(() => {
    if (user && activeTab === "ЗАКЛАДКИ") {
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
  }, [user, activeTab]);

  const handleLogout = () => {
    // Удаляем данные пользователя и токен из localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Перенаправляем на главную страницу
    navigate('/');
    // Перезагружаем страницу
    window.location.reload();
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };
  
  // Функция для удаления игры из профиля
  const handleRemoveGame = async (gameId) => {
    try {
      // Сначала проверяем, является ли пользователь автором игры
      const game = userGames.find(game => game.game_id === parseInt(gameId));
      
      if (!game) {
        throw new Error('Игра не найдена');
      }
      
      // Получаем данные о текущем пользователе
      const userData = JSON.parse(localStorage.getItem('user'));
      
      // Проверяем, является ли пользователь автором игры
      const isAuthor = game.user_id === userData.id;
      
      // Спрашиваем пользователя, хочет ли он удалить игру полностью из базы данных
      if (isAuthor && window.confirm('Вы являетесь автором этой игры. Хотите полностью удалить её из каталога?')) {
        // Удаляем игру из каталога (и автоматически из профиля)
        await deleteGameFromCatalog(gameId);
        // Обновляем список игр
        setUserGames(prevGames => prevGames.filter(game => game.game_id !== parseInt(gameId)));
        alert('Игра успешно удалена из каталога');
      } else {
        // Просто удаляем игру из профиля пользователя
        await removeGameFromProfile(gameId);
        // Обновляем список игр
        setUserGames(prevGames => prevGames.filter(game => game.game_id !== parseInt(gameId)));
      }
    } catch (error) {
      console.error('Ошибка при удалении игры:', error);
      alert(error.message || 'Произошла ошибка при удалении игры');
    }
  };

  // Функция для удаления игры из закладок
  const handleRemoveBookmark = async (gameId) => {
    try {
      await removeGameFromBookmarks(gameId);
      // Обновляем список закладок
      setUserBookmarks(prevBookmarks => prevBookmarks.filter(bookmark => bookmark.game_id !== parseInt(gameId)));
    } catch (error) {
      console.error('Ошибка при удалении игры из закладок:', error);
      alert(error.message || 'Произошла ошибка при удалении закладки');
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
  
  // Обработчик добавления новой игры
  const handleAddGame = async (gameData) => {
    try {
      setAddingGame(true);
      
      // Добавляем игру в каталог и автоматически в профиль пользователя
      const newGame = await addGameToCatalog(gameData);
      
      // Обновляем список игр пользователя
      const updatedGames = await fetchUserGames();
      setUserGames(updatedGames);
      
      // Закрываем модальное окно
      closeAddGameModal();
      
      // Показываем сообщение об успешном добавлении
      alert('Игра успешно добавлена в каталог и ваш профиль!');
      
    } catch (error) {
      console.error('Ошибка при добавлении игры:', error);
      alert(error.message || 'Произошла ошибка при добавлении игры');
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
                  <img src="https://bootdey.com/img/Content/avatar/avatar3.png" alt="Аватар пользователя" />
                </div>
                <div className="ph-info">
                  <h4 className="m-t-10 m-b-5">{user.username || user.login}</h4>
                  <p className="m-b-10">{user.email ? user.email : 'Пользователь'}</p>
                  <button className="btn sm prim m-b m-r" onClick={openAddGameModal}>Добавить игру</button>
                  <button className="btn sm info m-b" onClick={handleLogout}>Выйти из аккаунта</button>
                </div>
              </div>
              <div className="ph-tab nav nav-tabs">
                <button className={`nav-link_ ${activeTab === "ПРОФИЛЬ" ? "active show" : ""}`} onClick={() => handleTabClick("ПРОФИЛЬ")}>
                  ПРОФИЛЬ
                </button>
                <button className={`nav-link_ ${activeTab === "ЗАКЛАДКИ" ? "active show" : ""}`} onClick={() => handleTabClick("ЗАКЛАДКИ")}>
                  ЗАКЛАДКИ
                </button>
              </div>
            </div>
            
            {/* Содержимое вкладки "ПРОФИЛЬ" */}
            {activeTab === "ПРОФИЛЬ" && (
              <div className="profile-tab-content">
                <div className="user-games-section">
                  <h2>Мои игры</h2>
                  
                  {loadingGames ? (
                    <div className="loading-games">Загрузка игр...</div>
                  ) : userGames.length === 0 ? (
                    <div className="no-games-message">
                      <p>У вас пока нет добавленных игр в профиль.</p>
                      <button className="btn prim" onClick={() => navigate('/')}>
                        Перейти в каталог игр
                      </button>
                    </div>
                  ) : (
                    <div className="user-games-grid">
                      {userGames.map(game => (
                        <div key={game.id} className="user-game-card">
                          <div className="user-game-image">
                            <img src={game.game_image} alt={game.game_name} />
                          </div>
                          <div className="user-game-info">
                            <h3>{game.game_name}</h3>
                            <p>Добавлено: {new Date(game.added_at).toLocaleDateString()}</p>
                            <div className="user-game-actions">
                              <button 
                                className="btn sm info"
                                onClick={() => navigate(`/game?id=${game.game_id}`)}
                              >
                                Открыть
                              </button>
                              <button 
                                className="btn sm dang"
                                onClick={() => handleRemoveGame(game.game_id)}
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Содержимое вкладки "ЗАКЛАДКИ" */}
            {activeTab === "ЗАКЛАДКИ" && (
              <div className="profile-tab-content">
                <div className="user-bookmarks-section">
                  <h2>Мои закладки</h2>
                  
                  {loadingBookmarks ? (
                    <div className="loading-games">Загрузка закладок...</div>
                  ) : userBookmarks.length === 0 ? (
                    <div className="no-games-message">
                      <p>У вас пока нет добавленных игр в закладки.</p>
                      <p>Добавляйте игры других пользователей в закладки, чтобы быстро находить их позже.</p>
                      <button className="btn prim" onClick={() => navigate('/katalog')}>
                        Перейти в каталог игр
                      </button>
                    </div>
                  ) : (
                    <div className="bookmarks-grid">
                      {userBookmarks.map(bookmark => (
                        <div key={bookmark.id} className="bookmark-card">
                          <div className="bookmark-image-container">
                            <img 
                              src={bookmark.game_image} 
                              alt={bookmark.game_name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/300x150?text=Нет+фото";
                              }}
                            />
                            <div className="bookmark-genre">
                              {bookmark.game_genre || 'Не указан'}
                            </div>
                            <div className="bookmark-overlay">
                              <div className="bookmark-date">
                                {formatDate(bookmark.added_at)}
                              </div>
                              <div className="bookmark-author">
                                Автор: {bookmark.author_name || "Неизвестно"}
                              </div>
                            </div>
                          </div>
                          <div className="bookmark-content">
                            <h3 className="bookmark-title">{bookmark.game_name}</h3>
                            <div className="bookmark-actions">
                              <button 
                                className="bookmark-btn open"
                                onClick={() => navigate(`/game?id=${bookmark.game_id}`)}
                              >
                                ОТКРЫТЬ
                              </button>
                              <button 
                                className="bookmark-btn remove"
                                onClick={() => handleRemoveBookmark(bookmark.game_id)}
                              >
                                УДАЛИТЬ
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Модальное окно добавления игры */}
      <AddGameModal 
        isOpen={isAddGameModalOpen} 
        onClose={closeAddGameModal} 
        onAddGame={handleAddGame} 
      />
    </>
  );
}

export default UserProfile; 