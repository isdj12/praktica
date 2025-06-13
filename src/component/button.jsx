import React from 'react';
import './button.css';

export default function Button({ text = "Кнопка", className = "", href = "", onClick }) {
    const handleClick = (e) => {
        if (onClick) {
            onClick(e);
            return;
        }
        
        if (href) {
            window.location.href = href;
        }
    };
    
    if (href) {
        return (
            <a href={href} className={`button ${className}`} onClick={handleClick}>
                {text}
            </a>
        );
    }
    
    return (
        <button type="button" className={`button ${className}`} onClick={handleClick}>
            {text}
        </button>
    );
}