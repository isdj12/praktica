import './App.css'
import './game.css'
import Button from './component/button.jsx'
import { button } from './src.js'
import Poisk from './component/poisk.jsx'
import Profile from './component/profile.jsx'
import original from './assets/original.png'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  addGameToProfile, 
  isGameInProfile, 
  fetchGameById, 
  addGameToBookmarks, 
  isGameInBookmarks 
} from './api.js'

function Game() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = searchParams.get('id');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInProfile, setIsInProfile] = useState(false);
  const [isInBookmarks, setIsInBookmarks] = useState(false);
  const [addingToProfile, setAddingToProfile] = useState(false);
  const [addingToBookmarks, setAddingToBookmarks] = useState(false);
  const [addGameMessage, setAddGameMessage] = useState(null);
  const [bookmarkMessage, setBookmarkMessage] = useState(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  
  // Функция для выхода из аккаунта
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };
  
  // Проверяем, есть ли сохраненный пользователь при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Загружаем данные игры
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        
        if (!gameId) {
          navigate('/');
          return;
        }
        
        const gameData = await fetchGameById(gameId);
        
        if (!gameData) {
          navigate('/');
          return;
        }
        
        setGame(gameData);
        setSelectedScreenshot(gameData.image);
      } catch (error) {
        console.error('Ошибка при загрузке игры:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadGame();
  }, [gameId, navigate]);
  
  // Проверяем, добавлена ли игра в профиль пользователя
  useEffect(() => {
    if (isLoggedIn && game && game.id) {
      const checkGameInProfile = async () => {
        try {
          const result = await isGameInProfile(game.id);
          setIsInProfile(result);
        } catch (error) {
          console.error('Ошибка при проверке наличия игры в профиле:', error);
        }
      };
      
      checkGameInProfile();
    }
  }, [isLoggedIn, game]);

  // Проверяем, добавлена ли игра в закладки пользователя
  useEffect(() => {
    if (isLoggedIn && game && game.id) {
      const checkGameInBookmarks = async () => {
        try {
          const result = await isGameInBookmarks(game.id);
          setIsInBookmarks(result);
        } catch (error) {
          console.error('Ошибка при проверке наличия игры в закладках:', error);
        }
      };
      
      checkGameInBookmarks();
    }
  }, [isLoggedIn, game]);

  // Функция для отображения звездного рейтинга
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push("★"); // Полная звезда
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push("✫"); // Половина звезды
      } else {
        stars.push("☆"); // Пустая звезда
      }
    }
    
    return stars.join("");
  };
  
  // Функция для добавления игры в профиль
  const handleAddToProfile = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    if (!game) return;
    
    try {
      setAddingToProfile(true);
      setAddGameMessage(null);
      
      await addGameToProfile(game.id, game.name, game.image);
      
      setIsInProfile(true);
      setAddGameMessage({ type: 'success', text: 'Игра успешно добавлена в ваш профиль!' });
    } catch (error) {
      console.error('Ошибка при добавлении игры в профиль:', error);
      setAddGameMessage({ type: 'error', text: error.message || 'Произошла ошибка при добавлении игры в профиль' });
    } finally {
      setAddingToProfile(false);
      
      // Скрыть сообщение через 3 секунды
      setTimeout(() => {
        setAddGameMessage(null);
      }, 3000);
    }
  };

  // Функция для добавления игры в закладки
  const handleAddToBookmarks = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    if (!game) return;
    
    try {
      setAddingToBookmarks(true);
      setBookmarkMessage(null);
      
      await addGameToBookmarks(game.id);
      
      setIsInBookmarks(true);
      setBookmarkMessage({ type: 'success', text: 'Игра успешно добавлена в ваши закладки!' });
    } catch (error) {
      console.error('Ошибка при добавлении игры в закладки:', error);
      setBookmarkMessage({ type: 'error', text: error.message || 'Произошла ошибка при добавлении игры в закладки' });
    } finally {
      setAddingToBookmarks(false);
      
      // Скрыть сообщение через 3 секунды
      setTimeout(() => {
        setBookmarkMessage(null);
      }, 3000);
    }
  };

  return (
    <>
      <div className="header-container">
        <img src={original} alt="logo" className='logo' onClick={() => navigate('/')} style={{cursor: 'pointer'}} />
        <div className="button-container">
          <Button text={button[0].text} href={button[0].href} />
          <Button text={button[1].text} href={button[1].href} className="right-button" />
          <Button text={button[2].text} href={button[2].href} className="right-button" isRandomGame={button[2].isRandomGame} />
        </div>
        <div className="search-wrapper">
          <Poisk />
          <Profile isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />
        </div>
      </div>
      <hr className='line'></hr>
      
      <div className="game-details-container">
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : game ? (
          <div className="game-layout">
            <div className="game-header">
              <h1>{game.name}</h1>
              <div className="game-meta">
                <span className="game-genre">{game.genre}</span>
                <span className="game-platform">{game.platform}</span>
                {game.releaseDate && (
                  <span className="game-release-date">Дата выпуска: {new Date(game.releaseDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            
            <div className="game-content">
              <div className="game-media-section">
                <div className="game-main-image">
                  <img 
                    src={selectedScreenshot || game.image} 
                    alt={game.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/600x400?text=Изображение+не+найдено";
                    }}
                  />
                </div>
                
                {game.screenshots && game.screenshots.length > 0 && (
                  <div className="game-thumbnails">
                    <div 
                      className={`thumbnail ${!selectedScreenshot || selectedScreenshot === game.image ? 'active' : ''}`}
                      onClick={() => setSelectedScreenshot(game.image)}
                    >
                      <img 
                        src={game.image} 
                        alt="Главное изображение" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/100x60?text=Фото";
                        }}
                      />
                    </div>
                    {game.screenshots.map((screenshot, index) => (
                      <div 
                        key={index} 
                        className={`thumbnail ${selectedScreenshot === screenshot ? 'active' : ''}`}
                        onClick={() => setSelectedScreenshot(screenshot)}
                      >
                        <img 
                          src={screenshot} 
                          alt={`Скриншот ${index + 1}`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/100x60?text=Скриншот";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="game-actions">
                  {isInProfile ? (
                    <button className="btn success" disabled>
                      Игра в вашем профиле
                    </button>
                  ) : (
                    <button 
                      className="btn prim" 
                      onClick={handleAddToProfile}
                      disabled={addingToProfile}
                      style={{ display: 'none' }}
                    >
                      {addingToProfile ? 'Добавление...' : 'Добавить в профиль'}
                    </button>
                  )}
                  
                  {addGameMessage && (
                    <div className={`message ${addGameMessage.type}`}>
                      {addGameMessage.text}
                    </div>
                  )}
                  
                  {isInBookmarks ? (
                    <button className="btn bookmark-added" disabled>
                      В закладках
                    </button>
                  ) : (
                    <button 
                      className="btn bookmark" 
                      onClick={handleAddToBookmarks}
                      disabled={addingToBookmarks}
                    >
                      {addingToBookmarks ? 'Добавление...' : 'Добавить в закладки'}
                    </button>
                  )}
                  
                  {bookmarkMessage && (
                    <div className={`message ${bookmarkMessage.type}`}>
                      {bookmarkMessage.text}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="game-info">
                <div className="game-description">
                  <h2>Описание</h2>
                  <p>{game.description}</p>
                </div>
                
                <div className="game-details-section">
                  <div className="game-details">
                    <div className="game-detail-item">
                      <span className="game-detail-label">Жанр:</span>
                      <span className="game-detail-value">{game.genre}</span>
                    </div>
                    <div className="game-detail-item">
                      <span className="game-detail-label">Платформа:</span>
                      <span className="game-detail-value">{game.platform}</span>
                    </div>
                    <div className="game-detail-item">
                      <span className="game-detail-label">Мультиплеер:</span>
                      <span className="game-detail-value">{game.multiplayer || 'Нет'}</span>
                    </div>
                    {game.ageRating && (
                      <div className="game-detail-item">
                        <span className="game-detail-label">Возрастной рейтинг:</span>
                        <span className="game-detail-value">{game.ageRating}</span>
                      </div>
                    )}
                    {game.releaseDate && (
                      <div className="game-detail-item">
                        <span className="game-detail-label">Дата выпуска:</span>
                        <span className="game-detail-value">{new Date(game.releaseDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {game.author && (
                      <div className="game-detail-item">
                        <span className="game-detail-label">Автор:</span>
                        <span className="game-detail-value">{game.author}</span>
                      </div>
                    )}
                  </div>
                  
                  {game.tags && game.tags.length > 0 && (
                    <div className="game-tags">
                      <h3>Теги</h3>
                      <div className="tags-list">
                        {game.tags.map((tag, index) => (
                          <span key={index} className="game-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="error-message">Игра не найдена</div>
        )}
      </div>
    </>
  )
}

export default Game
