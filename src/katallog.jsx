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
  const [isTagOpen1, setIsTagOpen1] = useState(false);
  const [isTagOpen2, setIsTagOpen2] = useState(false);
  const [isTagOpen3, setIsTagOpen3] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('Все жанры');
  const [selectedTag1, setSelectedTag1] = useState('Все теги');
  const [selectedTag2, setSelectedTag2] = useState('Все теги');
  const [selectedTag3, setSelectedTag3] = useState('Все теги');
  const [rating, setRating] = useState(0);
  
  // Примеры игр для демонстрации
  const gamesList = [
    {
      id: 1,
      title: "Cyberpunk 2077",
      description: "Ролевая игра с открытым миром в стиле киберпанк от создателей серии The Witcher.",
      image: "https://upload.wikimedia.org/wikipedia/ru/b/bb/%D0%9E%D0%B1%D0%BB%D0%BE%D0%B6%D0%BA%D0%B0_%D0%BA%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80%D0%BD%D0%BE%D0%B9_%D0%B8%D0%B3%D1%80%D1%8B_Cyberpunk_2077.jpg",
      rating: 4,
      genre: "Ролевые игры (RPG)"
    },
    {
      id: 2,
      title: "Elden Ring",
      description: "Экшен-RPG с открытым миром, созданная FromSoftware и Джорджем Мартином.",
      image: "https://upload.wikimedia.org/wikipedia/ru/thumb/4/4d/Elden_ring_cover.jpg/274px-Elden_ring_cover.jpg",
      rating: 5,
      genre: "Ролевые игры (RPG)"
    },
    {
      id: 3,
      title: "Counter-Strike 2",
      description: "Популярный многопользовательский шутер от первого лица от Valve.",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
      rating: 4,
      genre: "Шутеры от первого лица (FPS)"
    },
    {
      id: 4,
      title: "Minecraft",
      description: "Песочница с элементами выживания и возможностью строить всё что угодно.",
      image: "https://upload.wikimedia.org/wikipedia/ru/4/49/Minecraft_cover.png",
      rating: 5,
      genre: "Песочница"
    },
    {
      id: 5,
      title: "The Witcher 3",
      description: "Ролевая игра с открытым миром, основанная на серии книг Анджея Сапковского.",
      image: "https://upload.wikimedia.org/wikipedia/ru/9/9c/Witcher_3_cover.jpg",
      rating: 5,
      genre: "Ролевые игры (RPG)"
    },
    {
      id: 6,
      title: "Grand Theft Auto V",
      description: "Экшен-игра с открытым миром от Rockstar Games, действие которой происходит в вымышленном городе Лос-Сантос.",
      image: "https://upload.wikimedia.org/wikipedia/ru/c/c8/GTAV_Official_Cover_Art.jpg",
      rating: 5,
      genre: "Экшен"
    }
  ];
  
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
  
  // Функция для обработки клика по карточке игры
  const handleGameClick = (gameId) => {
    console.log(`Переход на страницу игры с ID: ${gameId}`);
    // Здесь будет логика перехода на страницу игры
  };
  
  // Функция для отображения звездочек рейтинга
  const renderRatingStars = (rating) => {
    let stars = '';
    for (let i = 0; i < rating; i++) {
      stars += '★';
    }
    for (let i = rating; i < 5; i++) {
      stars += '☆';
    }
    return stars;
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
            <button className='accept' onClick={() => {
              // Здесь можно добавить логику применения фильтров
              console.log("Применяем фильтры:", {
                жанр: selectedGenre,
                тег1: selectedTag1,
                тег2: selectedTag2,
                тег3: selectedTag3,
                рейтинг: rating
              });
            }}>Применить</button>
          </div>
        </div>
        
        <div className="katalog-page">
          <div className="katalog-content">
            {gamesList.map(game => (
              <div key={game.id} className="game-card" onClick={() => handleGameClick(game.id)}>
                <div className="game-card-genre">{game.genre}</div>
                <img src={game.image} alt={game.title} className="game-card-image" onError={(e) => {
                  e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300x200?text=Изображение+не+найдено";
                  }}
                />
                <div className="game-card-content">
                  <h3 className="game-card-title">{game.title}</h3>
                  <p className="game-card-description">{game.description}</p>
                  <div className="game-card-rating">
                    <span className="game-card-rating-stars">{renderRatingStars(game.rating)}</span>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>{game.rating}/5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default Katalog
