import { useState } from 'react'
import * as icons from "svg-by-dreamsoftware/icons-react-dist";
import './UserProfile.css'

function UserProfile({ currentUser }) {
  return (
    <div className='Profile-box'>
      <div className='Profile-background'>

      </div>
      <div className='Profile-info'>
        <div className='Profile-main-content'>
          <div className='Profile-avatar'>
            {currentUser?.user_avatar ? (
              <img src={currentUser.user_avatar} alt="Avatar" />
            ) : (
              <div className="default-avatar">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className='Profile-info-text'>
            <h1>{currentUser?.name || 'Пользователь'}</h1>
            <p>{currentUser?.email || 'email@example.com'}</p>
            <span className="username">@{currentUser?.username || 'username'}</span>
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