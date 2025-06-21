import './App.css'
import './game.css'
import Button from './component/button.jsx'
import { button } from './src.js'
import Poisk from './component/poisk.jsx'
import Profile from './component/profile.jsx'
import original from './assets/original.png'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { addGameToProfile, isGameInProfile } from './api.js'

function Game() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = searchParams.get('id');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInProfile, setIsInProfile] = useState(false);
  const [addingToProfile, setAddingToProfile] = useState(false);
  const [addGameMessage, setAddGameMessage] = useState(null);
  
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
  
  // Создаем фиктивный массив с играми (в реальном приложении данные должны приходить с сервера)
  const games = [
    { id: 1, title: "ИГРА 1", image: original, description: "Описание игры 1. Это увлекательная игра, которая понравится всем любителям жанра.", genre: "Приключения", rating: 4.5 },
    { id: 2, title: "ИГРА 2", image: original, description: "Описание игры 2. Эта игра отличается отличной графикой и захватывающим сюжетом.", genre: "Экшен", rating: 4.7 },
    { id: 3, title: "ИГРА 3", image: original, description: "Описание игры 3. Погрузитесь в фантастический мир и сразитесь с сильнейшими противниками.", genre: "РПГ", rating: 4.2 },
    { id: 4, title: "ИГРА 4", image: original, description: "Описание игры 4. Стратегия, которая заставит вас задуматься и применить все ваши навыки.", genre: "Стратегия", rating: 4.0 },
    { id: 5, title: "ИГРА 5", image: original, description: "Описание игры 5. Гоночная игра с реалистичной физикой и множеством трасс.", genre: "Гонки", rating: 4.3 },
    { id: 6, title: "ИГРА 6", image: original, description: "Описание игры 6. Спортивный симулятор с официальными лицензиями и командами.", genre: "Спорт", rating: 4.6 },
    { id: 7, title: "ИГРА 7", image: original, description: "Описание игры 7. Головоломка, которая проверит ваш интеллект и логическое мышление.", genre: "Головоломка", rating: 3.9 },
    { id: 8, title: "ИГРА 8", image: original, description: "Описание игры 8. Хоррор, от которого мурашки по коже и учащенное сердцебиение.", genre: "Хоррор", rating: 4.4 },
    { id: 9, title: "ИГРА 9", image: original, description: "Описание игры 9. Симулятор, который позволит вам почувствовать себя в другой профессии.", genre: "Симулятор", rating: 4.1 },
    { id: 10, title: "ИГРА 10", image: original, description: "Описание игры 10. Сетевой шутер с разнообразным оружием и картами.", genre: "Шутер", rating: 4.8 },
    { id: 11, title: "ИГРА 11", image: original, description: "Описание игры 11. Песочница, где вы можете создавать и разрушать всё, что угодно.", genre: "Песочница", rating: 4.5 },
    { id: 12, title: "ИГРА 12", image: original, description: "Описание игры 12. Платформер с интересными уровнями и механиками.", genre: "Платформер", rating: 4.3 },
  ];

  // Загружаем данные игры
  useEffect(() => {
    setLoading(true);
    
    // Имитация загрузки данных
    setTimeout(() => {
      if (gameId) {
        const foundGame = games.find(g => g.id === parseInt(gameId));
        if (foundGame) {
          setGame(foundGame);
        } else {
          // Если игра не найдена, перенаправляем на главную
          navigate('/');
        }
      } else {
        // Если id не указан, показываем первую игру
        setGame(games[0]);
      }
      setLoading(false);
    }, 500);
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
      
      await addGameToProfile(game.id, game.title, game.image);
      
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

  return (
    <>
      <div className="header-container">
        <img src={original} alt="logo" className='logo' />
        <div className="button-container">
          <Button text={button[0].text} href={button[0].href} />
          <Button text={button[1].text} href={button[1].href} className="right-button" />
          <Button text={button[2].text} href={button[2].href} className="right-button" />
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
          <>
            <div className="developer-profile">
              <h2>Game Studio {game.id}</h2>
              <img 
                src={original} 
                alt={`Game Studio ${game.id}`} 
                className="developer-avatar" 
              />
              <div className="developer-info">
                <div className="developer-info-item">
                  <span className="developer-info-label">Студия основана:</span>
                  <span className="developer-info-value">2020</span>
                </div>
                <div className="developer-info-item">
                  <span className="developer-info-label">Страна:</span>
                  <span className="developer-info-value">Россия</span>
                </div>
                <div className="developer-info-item">
                  <span className="developer-info-label">Сотрудников:</span>
                  <span className="developer-info-value">{game.id * 5}</span>
                </div>
                <div className="developer-info-item">
                  <span className="developer-info-label">Офисы:</span>
                  <span className="developer-info-value">Москва, Санкт-Петербург</span>
                </div>
                <div className="developer-info-item">
                  <span className="developer-info-label">Выпущено игр:</span>
                  <span className="developer-info-value">{game.id + 7}</span>
                </div>
              </div>
              <div className="developer-games">
                <h3>Другие игры студии</h3>
                <div className="developer-game-items">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <div key={num} className="developer-game-item">
                      <img 
                        src={original} 
                        alt={`Другая игра ${num}`} 
                        className="developer-game-image" 
                      />
                      <span className="developer-game-title">Проект {num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="game-content">
              <div className="game-details">
                <h1>{game.title}</h1>
                <div className="game-info">
                  <div className="game-image-container">
                    <img src={game.image} alt={game.title} className="game-image" />
                    <div className="game-genre">{game.genre}</div>
                    
                    {/* Кнопка добавления в профиль */}
                    {isLoggedIn && (
                      <div className="add-to-profile-container">
                        <button 
                          className={`add-to-profile-btn ${isInProfile ? 'in-profile' : ''}`}
                          onClick={handleAddToProfile}
                          disabled={addingToProfile || isInProfile}
                        >
                          {addingToProfile ? 'Добавление...' : isInProfile ? 'В профиле' : 'Добавить в профиль'}
                        </button>
                        
                        {addGameMessage && (
                          <div className={`add-game-message ${addGameMessage.type}`}>
                            {addGameMessage.text}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="game-gallery">
                      <h3>Скриншоты игры</h3>
                      <div className="gallery-images">
                        <img src={game.image} alt={`Скриншот 1 - ${game.title}`} className="gallery-image" />
                        <img src={game.image} alt={`Скриншот 2 - ${game.title}`} className="gallery-image" />
                        <img src={game.image} alt={`Скриншот 3 - ${game.title}`} className="gallery-image" />
                        <img src={game.image} alt={`Скриншот 4 - ${game.title}`} className="gallery-image" />
                        <img src={game.image} alt={`Скриншот 5 - ${game.title}`} className="gallery-image" />
                      </div>
                    </div>
                  </div>
                  <div className="game-data">
                    <div className="game-rating">
                      <span className="stars">{renderStars(game.rating)}</span>
                      <span className="rating-value">{game.rating}/5</span>
                    </div>
                    <p className="game-description">{game.description}</p>
                    <div className="game-specs">
                      <h3>Характеристики игры</h3>
                      <div className="specs-grid">
                        <div className="spec-item">
                          <span className="spec-label">Жанр:</span>
                          <span className="spec-value">{game.genre}</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Разработчик:</span>
                          <span className="spec-value">Game Studio {game.id}</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Дата выпуска:</span>
                          <span className="spec-value">01.{game.id}.2023</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Платформа:</span>
                          <span className="spec-value">PC, PlayStation, Xbox</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Возрастной рейтинг:</span>
                          <span className="spec-value">12+</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Мультиплеер:</span>
                          <span className="spec-value">{game.id % 2 === 0 ? 'Да' : 'Нет'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="game-reviews">
                      <h3>Отзывы игроков</h3>
                      <div className="review-item">
                        <div className="review-header">
                          <span className="review-author">Игрок_{game.id * 2}</span>
                          <span className="review-stars">{renderStars(4.5)}</span>
                        </div>
                        <p className="review-text">Очень понравилась игра! Рекомендую всем любителям жанра {game.genre}.</p>
                      </div>
                      <div className="review-item">
                        <div className="review-header">
                          <span className="review-author">Геймер_{game.id * 3}</span>
                          <span className="review-stars">{renderStars(5)}</span>
                        </div>
                        <p className="review-text">Лучшая игра, в которую я играл в этом году! Графика на высоте, сюжет затягивает.</p>
                      </div>
                    </div>
                    <div className="game-buttons">
                      <button className="play-button">Играть</button>
                      <button className="add-to-favorites-button">Добавить в избранное</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="error-message">Игра не найдена</div>
        )}
      </div>
    </>
  )
}

export default Game
