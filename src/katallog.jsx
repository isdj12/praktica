import './App.css'
import Button from './component/button.jsx'
import { button } from './src.js'
import Poisk from './component/poisk.jsx'
import Profile from './component/profile.jsx'
import original from './assets/original.png'
import { useState, useEffect } from 'react'
import './katalog.css'
import { filter, genres, tegs } from './database/FILTER.js'

function Katalog() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('Все жанры');
  const [selectedTag, setSelectedTag] = useState('Все теги');
  const [rating, setRating] = useState(0);
  
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

  // Функция для выбора тега
  const selectTag = (tag) => {
    setSelectedTag(tag);
    setIsTagOpen(false);
  };

  // Функция для установки рейтинга
  const handleRatingChange = (value) => {
    setRating(value);
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
            <label>Тэги:</label>
            <div className="dropdown">
              <div className="dropdown-header" onClick={() => setIsTagOpen(!isTagOpen)}>
                <span>{selectedTag}</span>
                <span className="dropdown-arrow">{isTagOpen ? '▲' : '▼'}</span>
              </div>
              
              {isTagOpen && (
                <ul className="dropdown-list">
                  {tegs.map((tag, index) => (
                    <li key={index} onClick={() => selectTag(tag)} className={selectedTag === tag ? 'selected' : ''}>
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
          </div>
          
        </div>
        
        <div className="katalog-page">
          <h1>Каталог игр</h1>
          <div className="katalog-content">
            <p>Здесь будет содержимое каталога игр</p>
            <p>Выбранный жанр: {selectedGenre}</p>
            <p>Выбранный тег: {selectedTag}</p>
            <p>Минимальный рейтинг: {rating > 0 ? `${rating} ${rating === 1 ? 'звезда' : rating < 5 ? 'звезды' : 'звезд'}` : 'не выбран'}</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Katalog
