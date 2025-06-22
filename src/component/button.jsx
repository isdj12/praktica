import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRandomGame } from '../api.js';
import './button.css';

export default function Button({ text = "Кнопка", className = "", href = "", onClick, isRandomGame }) {
    const navigate = useNavigate();
    
    const handleClick = (e) => {
        if (onClick) {
            onClick(e);
            return;
        }
        
        if (isRandomGame) {
            e.preventDefault();
            handleRandomGame();
            return;
        }
    };
    
    const handleRandomGame = async () => {
        try {
            // Get a random game using the API function
            const randomGame = await getRandomGame();
            
            // Check if a game was found
            if (randomGame) {
                // Navigate to the random game
                navigate(`/game?id=${randomGame.id}`);
            } else {
                // If no games, navigate to catalog
                navigate('/katalog');
                alert('Игры не найдены. Перенаправляем в каталог.');
            }
        } catch (error) {
            console.error('Error fetching random game:', error);
            navigate('/katalog');
            alert('Произошла ошибка. Перенаправляем в каталог.');
        }
    };
    
    // Проверяем, является ли ссылка внешней (начинается с http или https)
    const isExternalLink = href && (href.startsWith('http://') || href.startsWith('https://'));
    
    if (href) {
        // Если это кнопка случайной игры
        if (isRandomGame) {
            return (
                <button className={`button ${className}`} onClick={handleRandomGame}>
                    {text}
                </button>
            );
        }
        
        // Для внешних ссылок используем обычный тег <a>
        if (isExternalLink) {
            return (
                <a href={href} className={`button ${className}`} target="_blank" rel="noopener noreferrer">
                    {text}
                </a>
            );
        }
        
        // Для внутренних ссылок используем компонент Link из React Router
        return (
            <Link to={href} className={`button ${className}`}>
                {text}
            </Link>
        );
    }
    
    return (
        <button type="button" className={`button ${className}`} onClick={handleClick}>
            {text}
        </button>
    );
}