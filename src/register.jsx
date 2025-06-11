import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './App.css'
import Button from './component/button.jsx'
import { button } from './src.js'
import Poisk from './component/poisk.jsx'
import original from './assets/original.png'
import backgroundImage from './assets/Screenshot_7.png'
import './register.css'

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [login, setLogin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Простая валидация для демонстрации
    if (email.trim() === "" || password.trim() === "" || login.trim() === "") {
      setError("Пожалуйста, заполните все поля");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      // Отправляем запрос к API для регистрации
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: login,
          email: email,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при регистрации');
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
          <h2>Регистрация</h2>
          {error && <div className="error-message">{error}</div>}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email:</label>
              <input type="email" placeholder="Введите email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Придумайте логин:</label>
              <input type="text" placeholder="Введите логин" value={login} onChange={(e) => setLogin(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Пароль:</label>
              <input type="password" placeholder="Введите пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Повторите пароль:</label>
              <input type="password" placeholder="Повторите пароль" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <div className="form-buttons">
              <button type="submit" className="button register-button" disabled={isLoading}>
                {isLoading ? 'Регистрация...' : 'регистрация'}
              </button>
              <div className="login-link">
                <Link to="/login">Уже есть аккаунт? Войти</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default Register;