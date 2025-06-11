import { useState, useEffect } from 'react';
import { fetchGames } from '../api';
import '../App.css';
import original from '../assets/original.png'; // Импортируем запасное изображение

function GameList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadGames() {
      try {
        setLoading(true);
        const gamesData = await fetchGames();
        setGames(gamesData);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить игры. Пожалуйста, убедитесь, что сервер запущен.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  // Обработчик ошибок для изображений
  const handleImageError = (e) => {
    e.target.src = original; // Используем original.png как запасное изображение
  };

  if (loading) {
    return <div className="loading">Загрузка игр...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="games-container">
      <h2 className="games-title">Инди игры</h2>
      <div className="games-list">
        {games.length === 0 ? (
          <p>Игры не найдены</p>
        ) : (
          games.map(game => (
            <div key={game.id} className="game-card">
              <div className="game-image-container">
                <img 
                  src={game.image} 
                  alt={game.title} 
                  className="game-image" 
                  onError={handleImageError}
                />
              </div>
              <div className="game-info">
                <h3 className="game-title">{game.title}</h3>
                <p className="game-description">{game.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GameList; 