import React, { useState } from "react";
import './ChatWindow.css'


const ChatWindow = ({ user }) => {
  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-window-user">
          <img src={user.avatar} alt={user.name} />
          <div>
            <h3>{user.name}</h3>
            {user.isOnline && <span>Online</span>}
          </div>
        </div>
      </div>
      
      <div className="chat-window-messages">
        {/* Здесь будут сообщения */}
      </div>
      
      <div className="chat-window-input">
        <input type="text" placeholder="Введите сообщение..." />
        <button>Отправить</button>
      </div>
    </div>
  );
};

export default ChatWindow;