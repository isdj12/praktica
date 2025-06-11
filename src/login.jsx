import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './App.css'
import Button from './component/button.jsx'
import { button } from './src.js'
import Poisk from './component/poisk.jsx'
import original from './assets/original.png'
import backgroundImage from './assets/Screenshot_7.png'
import './login.css'

function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Простая проверка для демонстрации
    if (login.trim() === "" || password.trim() === "") {
      setError("Пожалуйста, заполните все поля");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      // Отправляем запрос к API для входа
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: login,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при входе');
      }
      
      // Сохраняем токен и данные пользователя в localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Перенаправляем на главную страницу
      navigate('/');
      
      // Перезагружаем страницу, чтобы App.jsx подхватил данные из localStorage
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigate('/register');
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
          <div className="home-link">
            <Link to="/">На главную</Link>
          </div>
        </div>
      </div>
      <hr className='line'></hr>
      <div className="login-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="login-container">
          <h2>Вход</h2>
          {error && <div className="error-message">{error}</div>}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Логин:</label>
              <input 
                type="text" 
                placeholder="Введите логин" 
                value={login} 
                onChange={(e) => setLogin(e.target.value)} 
                required
              />
            </div>
            <div className="form-group">
              <label>Пароль:</label>
              <input 
                type="password" 
                placeholder="Введите пароль" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="button login-button" disabled={isLoading}>
                {isLoading ? 'Вход...' : 'войти'}
              </button>
              <Button text="зарегистрироваться" className="register-button" onClick={handleRegister} />
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default Login;
