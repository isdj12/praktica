import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Fhod from './fhod.jsx'
import Login from './login.jsx'
import Register from './register.jsx'
import UserProfile from './UserProfile.jsx'
import Katalog from './katalog.jsx'
import Game from './game.jsx'

// Создаем Layout компонент, который будет содержать общие элементы
const Layout = () => {
  return (
    <>
      {/* Здесь можно разместить общие элементы, такие как шапка или меню */}
      <Outlet /> {/* Здесь будет отображаться контент текущего маршрута */}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<App />} />
          <Route path="/fhod" element={<Fhod />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/katalog" element={<Katalog />} />
          <Route path="/game" element={<Game />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
