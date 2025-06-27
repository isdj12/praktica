import './App.css'
import Button from './component/button.jsx'
import { button } from './src.js'
import Poisk from './component/poisk.jsx'
import Profile from './component/profile.jsx'
import original from './assets/original.png'
import strellka from './assets/strellka.svg'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPopularGames } from './api.js'

// URL для Node.js API
const NODE_API_URL = 'http://localhost:3002/api';

function App() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Функция для авторизации пользователя
  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  // Функция для выхода из аккаунта
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('user');
  };
  
  // Проверяем, есть ли сохраненный пользователь при загрузке и загружаем популярные игры
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
    
    // Загрузка популярных игр
    const loadPopularGames = async () => {
      try {
        setLoading(true);
        const popularGames = await fetchPopularGames();
        setGames(popularGames || []);
      } catch (err) {
        console.error('Ошибка при загрузке популярных игр:', err);
        setError('Не удалось загрузить популярные игры');
        setGames([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadPopularGames();
  }, []);
  
  // Группируем игры по 4 на страницу
  const gamesPerPage = 4;
  const totalPages = Math.ceil(games.length / gamesPerPage);
  
  // Получаем игры для текущей страницы
  const getCurrentPageGames = () => {
    const startIndex = currentPage * gamesPerPage;
    return games.slice(startIndex, startIndex + gamesPerPage);
  };
  
  const handlePageChange = (newPage) => {
    if (isTransitioning) return; // Предотвращаем множественные клики во время анимации
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 300);
  };
  
  const handleNextClick = () => {
    const newPage = (currentPage + 1) % totalPages;
    handlePageChange(newPage);
  };

  const handlePrevClick = () => {
    const newPage = (currentPage - 1 + totalPages) % totalPages;
    handlePageChange(newPage);
  };

  // Функция для перехода на страницу игры и увеличения счетчика кликов
  const handleGameClick = (gameId) => {
    // Отправляем информацию о клике на сервер
    fetch(`${NODE_API_URL}/games/${gameId}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Клик зарегистрирован:', data);
      // Переходим на страницу игры только после успешной регистрации клика
      navigate(`/game?id=${gameId}`);
    })
    .catch(error => {
      console.error('Ошибка при регистрации клика:', error);
      // В случае ошибки все равно переходим на страницу игры
      navigate(`/game?id=${gameId}`);
    });
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
      <div className="replacement-block">
        <h2 className="popular-games-title">Популярные игры</h2>
        {loading ? (
          <div className="loading-games">Загрузка популярных игр...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : games.length === 0 ? (
          <div className="no-games-message">Популярные игры отсутствуют. Добавьте игры в каталог.</div>
        ) : (
          <div className={`games-grid ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
            {getCurrentPageGames().map((game) => (
              <div key={game.id} className="game-card-container" onClick={() => handleGameClick(game.id)}>
                <div className="game-indicator">
                  <div className="game-title-bar">
                    {game.name || game.title}
                    {game.clicks && <span className="game-clicks">👁 {game.clicks}</span>}
                  </div>
                  <div className='game-indicator-foto'>
                    <img 
                      src={game.image} 
                      alt={game.name || game.title} 
                      className='foto single-foto'
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/no-image.svg";
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="nav-arrow nav-arrow-left" onClick={handlePrevClick} disabled={isTransitioning} aria-label="Предыдущая страница">
          <img src={strellka} alt="Назад" className="arrow-icon arrow-left" />
        </button>
        <button className="nav-arrow nav-arrow-right" onClick={handleNextClick} disabled={isTransitioning} aria-label="Следующая страница">
          <img src={strellka} alt="Вперед" className="arrow-icon arrow-right" />
        </button>
        <div className="pagination">
          {Array.from({ length: totalPages }).map((_, index) => (
            <span key={index} className={`pagination-dot ${index === currentPage ? 'active' : ''}`} onClick={() => handlePageChange(index)}></span>
          ))}
        </div>
      </div>
    </>
  )
}

export default App
