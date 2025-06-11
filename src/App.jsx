import './App.css'
import Button from './component/button.jsx'
import { button } from './src.js'
import Poisk from './component/poisk.jsx'
import Profile from './component/profile.jsx'
import original from './assets/original.png'
import strellka from './assets/strellka.svg'
import { useState, useEffect } from 'react'

function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
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
  
  // Проверяем, есть ли сохраненный пользователь при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);
  
  // Создаем массив с играми
  const games = [
    { id: 1, title: "ИГРА 1", image: original },
    { id: 2, title: "ИГРА 2", image: original },
    { id: 3, title: "ИГРА 3", image: original },
    { id: 4, title: "ИГРА 4", image: original },
    { id: 5, title: "ИГРА 5", image: original },
    { id: 6, title: "ИГРА 6", image: original },
    { id: 7, title: "ИГРА 7", image: original },
    { id: 8, title: "ИГРА 8", image: original },
    { id: 9, title: "ИГРА 9", image: original },
    { id: 10, title: "ИГРА 10", image: original },
    { id: 11, title: "ИГРА 11", image: original },
    { id: 12, title: "ИГРА 12", image: original },
  ];
  
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
      <div className="replacement-block">
        <div className={`games-grid ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
          {getCurrentPageGames().map((game) => (
            <div key={game.id} className="game-card-container">
              <div className="game-indicator">
                <div className="game-title-bar">{game.title}</div>
                <div className='game-indicator-foto'>
                  <img src={game.image} alt={game.title} className='foto single-foto' />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="nav-arrow nav-arrow-left" onClick={handlePrevClick} disabled={isTransitioning} aria-label="Предыдущая страница">
          <img src={strellka} alt="Назад" className="arrow-icon arrow-left" />
        </button>
        <button className="nav-arrow nav-arrow-right" onClick={handleNextClick} disabled={isTransitioning} aria-label="Следующая страница">
          <img src={strellka} alt="Вперед" className="arrow-icon arrow-right" />
        </button>
        <div className="pagination">
          {Array.from({ length: totalPages }).map((_, index) => (
            <span 
              key={index} 
              className={`pagination-dot ${index === currentPage ? 'active' : ''}`}
              onClick={() => handlePageChange(index)}
            ></span>
          ))}
        </div>
      </div>
    </>
  )
}

export default App
