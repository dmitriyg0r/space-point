import { useState } from 'react'
import * as icons from "svg-by-dreamsoftware/icons-react-dist";
import './UserProfile.css'

function UserProfile() {


  return (
    <div className='Profile-box'>
      <div className='Profile-background'>

      </div>
      <div className='Profile-info'>
        <div className='Profile-main-content'>
          <div className='Profile-avatar'>

          </div>
          <div className='Profile-info-text'>
            <h1>Kamen Braguca</h1>
            <p>kamen.braguca@gmail.com</p>
          </div>
        </div>
          <div className='Profile-settings-menu'>
           <div className='settings-list'>
            <div className='settings-list-item'>Настройки профиля</div>
            <div className='settings-list-item'>Оформление</div>
            <div className='settings-list-item'>Язык</div> 
          </div>
        </div>

      </div>

    </div>

  )
}

export default UserProfile