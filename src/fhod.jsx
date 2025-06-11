import './App.css'
import Button from './component/button.jsx'
import { button } from './src.js'
import Poisk from './component/poisk.jsx'
import Profile from './component/profile.jsx'
import GameList from './component/GameList.jsx'
import original from './assets/original.png'
import { useNavigate } from 'react-router-dom'

function Fhod() {
    const navigate = useNavigate();

    const goBack = () => {
        navigate('/');
    };

    return (
      <>
        <div className="header-container">
          <img src={original} alt="logo" className='logo' onClick={goBack} style={{cursor: 'pointer'}} title="Вернуться на главную" />
          <div className="button-container">
            <Button text={button[0].text} href={button[0].href} />
            <Button text={button[1].text} href={button[1].href} className="right-button" />
            <Button text={button[2].text} href={button[2].href} className="right-button" />
          </div>
          <div className="search-wrapper">
            <Poisk />
            <div className="profile-square" onClick={goBack} title="Вернуться на главную">
              <span className="profile-text">Home</span>
            </div>
          </div>
        </div>
        <hr className='line'></hr>
      </>
    )
  }
export default Fhod; 