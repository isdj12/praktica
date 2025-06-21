import './App.css'
import Button from './component/button.jsx'
import { button } from './src.js'
import Poisk from './component/poisk.jsx'
import Profile from './component/profile.jsx'
import original from './assets/original.png'
import { useState, useEffect } from 'react'
import './katalog.css'
import { filter, genres, tegs } from './database/FILTER.js'
import { fetchGames } from './api.js'
import { Link } from 'react-router-dom'

function Katalog() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isTagOpen1, setIsTagOpen1] = useState(false);
  const [isTagOpen2, setIsTagOpen2] = useState(false);
  const [isTagOpen3, setIsTagOpen3] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('Все жанры');
  const [selectedTag1, setSelectedTag1] = useState('Все теги');
  const [selectedTag2, setSelectedTag2] = useState('Все теги');
  const [selectedTag3, setSelectedTag3] = useState('Все теги');
  const [rating, setRating] = useState(0);
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Загрузка игр из API
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const gamesData = await fetchGames();
        console.log('Загруженные игры:', gamesData);
        setGames(gamesData);
        setFilteredGames(gamesData); // Изначально показываем все игры
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке игр:', err);
        setError('Не удалось загрузить игры. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    loadGames();
  }, []);
  
  // Проверяем, есть ли сохраненный пользователь при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);
  
  // Функция для выхода из аккаунта
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Функция для выбора жанра
  const selectGenre = (genre) => {
    setSelectedGenre(genre);
    setIsGenreOpen(false);
  };

  // Функция для выбора тега 1
  const selectTag1 = (tag) => {
    setSelectedTag1(tag);
    setIsTagOpen1(false);
  };

  // Функция для выбора тега 2
  const selectTag2 = (tag) => {
    setSelectedTag2(tag);
    setIsTagOpen2(false);
  };

  // Функция для выбора тега 3
  const selectTag3 = (tag) => {
    setSelectedTag3(tag);
    setIsTagOpen3(false);
  };

  // Функция для установки рейтинга
  const handleRatingChange = (value) => {
    setRating(value);
  };
  
  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Не указана';
    }
  };
  
  // Функция для применения фильтров
  const applyFilters = () => {
    const filtered = games.filter(game => {
      // Фильтрация по жанру
      if (selectedGenre !== 'Все жанры' && game.genre !== selectedGenre) {
        return false;
      }
      
      // Фильтрация по тегам
      const gameTags = game.tags || [];
      if (selectedTag1 !== 'Все теги' && !gameTags.includes(selectedTag1)) {
        return false;
      }
      if (selectedTag2 !== 'Все теги' && !gameTags.includes(selectedTag2)) {
        return false;
      }
      if (selectedTag3 !== 'Все теги' && !gameTags.includes(selectedTag3)) {
        return false;
      }
      
      // Фильтрация по рейтингу
      if (rating > 0 && (!game.rating || game.rating < rating)) {
        return false;
      }
      
      return true;
    });
    
    setFilteredGames(filtered);
    console.log("Применены фильтры:", {
      жанр: selectedGenre,
      тег1: selectedTag1,
      тег2: selectedTag2,
      тег3: selectedTag3,
      рейтинг: rating
    });
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
      
      <div className="katalog-container">
        <div className='filter'>
          <h3>Фильтры</h3>
          
          <div className="filter-group">
            <label>Жанр:</label>
            <div className="dropdown">
              <div className="dropdown-header" onClick={() => setIsGenreOpen(!isGenreOpen)}>
                <span>{selectedGenre}</span>
                <span className="dropdown-arrow">{isGenreOpen ? '▲' : '▼'}</span>
              </div>
              
              {isGenreOpen && (
                <ul className="dropdown-list">
                  {genres.map((genre, index) => (
                    <li key={index} onClick={() => selectGenre(genre)} className={selectedGenre === genre ? 'selected' : ''}>
                      {genre}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="filter-group">
            <label>Тэг 1:</label>
            <div className="dropdown">
              <div className="dropdown-header" onClick={() => setIsTagOpen1(!isTagOpen1)}>
                <span>{selectedTag1}</span>
                <span className="dropdown-arrow">{isTagOpen1 ? '▲' : '▼'}</span>
              </div>
              
              {isTagOpen1 && (
                <ul className="dropdown-list">
                  {tegs.map((tag, index) => (
                    <li key={index} onClick={() => selectTag1(tag)} className={selectedTag1 === tag ? 'selected' : ''}>
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="filter-group">
            <label>Тэг 2:</label>
            <div className="dropdown">
              <div className="dropdown-header" onClick={() => setIsTagOpen2(!isTagOpen2)}>
                <span>{selectedTag2}</span>
                <span className="dropdown-arrow">{isTagOpen2 ? '▲' : '▼'}</span>
              </div>
              
              {isTagOpen2 && (
                <ul className="dropdown-list">
                  {tegs.map((tag, index) => (
                    <li key={index} onClick={() => selectTag2(tag)} className={selectedTag2 === tag ? 'selected' : ''}>
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="filter-group">
            <label>Тэг 3:</label>
            <div className="dropdown">
              <div className="dropdown-header" onClick={() => setIsTagOpen3(!isTagOpen3)}>
                <span>{selectedTag3}</span>
                <span className="dropdown-arrow">{isTagOpen3 ? '▲' : '▼'}</span>
              </div>
              
              {isTagOpen3 && (
                <ul className="dropdown-list">
                  {tegs.map((tag, index) => (
                    <li key={index} onClick={() => selectTag3(tag)} className={selectedTag3 === tag ? 'selected' : ''}>
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>    
          
          <div className="rating-container">
            <div className="rating-title">Рейтинг:</div>
            <div className="star-rating">
              <input type="radio" id="star5" name="rating" value="5" checked={rating === 5} onChange={() => handleRatingChange(5)}/>
              <label htmlFor="star5" title="5 звезд"></label>
              <input type="radio" id="star4" name="rating" value="4" checked={rating === 4} onChange={() => handleRatingChange(4)}/>
              <label htmlFor="star4" title="4 звезды"></label>
              <input type="radio" id="star3" name="rating" value="3" checked={rating === 3} onChange={() => handleRatingChange(3)}/>
              <label htmlFor="star3" title="3 звезды"></label>
              <input type="radio" id="star2" name="rating" value="2" checked={rating === 2} onChange={() => handleRatingChange(2)}/>
              <label htmlFor="star2" title="2 звезды"></label>
              <input type="radio" id="star1" name="rating" value="1" checked={rating === 1} onChange={() => handleRatingChange(1)}/>
              <label htmlFor="star1" title="1 звезда"></label>
            </div>
            <button className='accept' onClick={applyFilters}>Применить</button>
            <button className='reset' onClick={() => {
              setSelectedGenre('Все жанры');
              setSelectedTag1('Все теги');
              setSelectedTag2('Все теги');
              setSelectedTag3('Все теги');
              setRating(0);
              setFilteredGames(games);
            }}>Сбросить</button>
          </div>
        </div>
        
        <div className="katalog-page">
          <div className="katalog-content">
            {loading ? (
              <div className="loading-message">Загрузка игр...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : filteredGames.length === 0 ? (
              <div className="no-games-message">
                {games.length === 0 ? 
                  'В каталоге пока нет игр. Добавьте первую игру через свой профиль!' : 
                  'Нет игр, соответствующих выбранным фильтрам.'}
              </div>
            ) : (
              filteredGames.map(game => (
                <div key={game.id} className="game-card">
                  <Link to={`/game?id=${game.id}`} className="game-card-link">
                    <div className="game-card-image-container">
                      <div className="game-card-genre">{game.genre}</div>
                      <img 
                        src={game.image} 
                        alt={game.name} 
                        className="game-card-image" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/300x150?text=Нет+фото";
                        }}
                      />
                    </div>
                    <div className="game-card-content">
                      <h3 className="game-card-title">{game.name}</h3>
                      
                      <div className="game-card-details">
                        <div className="game-card-detail">
                          <span className="detail-label">Платформа:</span>
                          <span className="detail-value">{game.platform || 'Не указана'}</span>
                        </div>
                        <div className="game-card-detail">
                          <span className="detail-label">Дата:</span>
                          <span className="detail-value">{formatDate(game.releaseDate)}</span>
                        </div>
                      </div>
                      
                      <p className="game-card-description">
                        {game.description && game.description.length > 45 
                          ? `${game.description.substring(0, 45)}...` 
                          : game.description || 'Описание отсутствует'}
                      </p>
                      <div className="game-card-tags">
                        {game.tags && game.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="game-card-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Katalog 