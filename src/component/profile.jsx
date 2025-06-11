import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';

export default function Profile({ isLoggedIn, user, onLogout }) {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleClick = () => {
        if (isLoggedIn) {
            setShowDropdown(!showDropdown);
        } else {
            navigate('/login');
        }
    };

    const handleProfileClick = () => {
        navigate('/profile');
        setShowDropdown(false);
    };

    const handleLogoutClick = () => {
        onLogout();
        setShowDropdown(false);
    };

    return (
        <div className="profile-container">
            <div 
                className={`profile-square ${isLoggedIn ? 'logged-in' : ''}`} 
                onClick={handleClick}
            >
                {isLoggedIn ? (
                    <span className="profile-initial">
                        {user.login ? user.login.charAt(0).toUpperCase() : 'U'}
                    </span>
                ) : (
                    <span className="profile-text">
                        Войти
                    </span>
                )}
            </div>
            
            {isLoggedIn && showDropdown && (
                <div className="profile-dropdown">
                    <div className="dropdown-username">{user.login}</div>
                    <div className="dropdown-item" onClick={handleProfileClick}>Мой профиль</div>
                    <div className="dropdown-item" onClick={handleLogoutClick}>Выйти</div>
                </div>
            )}
        </div>
    );
} 