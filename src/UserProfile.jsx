import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import './App.css';
import Button from './component/button.jsx';
import { button } from './src.js';
import Poisk from './component/poisk.jsx';
import original from './assets/original.png';
import './UserProfile.css';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("ПРОФИЛЬ");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Получаем данные пользователя из localStorage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Проверяем токен и получаем актуальные данные профиля
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:3000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Если токен недействителен, удаляем его и перенаправляем на страницу входа
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
          }
          throw new Error('Не удалось загрузить профиль');
        }
        
        const data = await response.json();
        
        // Если в localStorage есть данные пользователя, используем их, иначе используем данные из API
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(data.user);
        }
        
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
    
    // Добавляем класс к body при монтировании
    document.body.classList.add('user-profile-page');
    
    // Удаляем класс при размонтировании
    return () => {
      document.body.classList.remove('user-profile-page');
    };
  }, [navigate]);

  const handleLogout = () => {
    // Удаляем данные пользователя и токен из localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Перенаправляем на главную страницу
    navigate('/');
    // Перезагружаем страницу
    window.location.reload();
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error-message">Ошибка: {error}</div>;
  }

  if (!user) {
    return <div className="loading">Пользователь не найден</div>;
  }

  return (
    <>
      <div className="user-profile">
        <div className="header-container">
          <img src={original} alt="logo" className='logo' />
          <div className="button-container">
            <Button text={button[0].text} href={button[0].href} />
            <Button text={button[1].text} href={button[1].href} className="right-button" />
            <Button text={button[2].text} href={button[2].href} className="right-button" />
          </div>
          <div className="search-wrapper">
            <Poisk />
            <div className="home-link">
              <Link to="/">На главную</Link>
            </div>
          </div>
        </div>
        <hr className='line'></hr>
        
        <div id="content" className="content content-full-width">
          <div className="profile">
            <div className="profile-header">
              <div className="ph-cover"></div>
              <div className="ph-content">
                <div className="ph-img">
                  <img src="https://bootdey.com/img/Content/avatar/avatar3.png" alt="Аватар пользователя" />
                </div>
                <div className="ph-info">
                  <h4 className="m-t-10 m-b-5">{user.username || user.login}</h4>
                  <p className="m-b-10">{user.email ? user.email : 'Пользователь'}</p>
                  <button className="btn btn-sm btn-info mb-2" onClick={handleLogout}>Выйти из аккаунта</button>
                </div>
              </div>
              <div className="ph-tab nav nav-tabs">
                <button className={`nav-link_ ${activeTab === "ПРОФИЛЬ" ? "active show" : ""}`} onClick={() => handleTabClick("ПРОФИЛЬ")}>
                  ПРОФИЛЬ
                </button>
                <button className={`nav-link_ ${activeTab === "ДРУЗЬЯ" ? "active show" : ""}`} onClick={() => handleTabClick("ДРУЗЬЯ")}>
                  ДРУЗЬЯ
                </button>
                <button className={`nav-link_ ${activeTab === "ФОТО" ? "active show" : ""}`} onClick={() => handleTabClick("ФОТО")}>
                  ФОТО
                </button>
                <button className={`nav-link_ ${activeTab === "ВИДЕО" ? "active show" : ""}`} onClick={() => handleTabClick("ВИДЕО")}>
                  ВИДЕО
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserProfile; 