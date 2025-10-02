// ChatItem.jsx
import { useState } from 'react'
import './ChatItem.css'

const ChatItem = ({user, chat, onClick, isSelected, currentUser, networkOnline}) => {
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        }
    };

    const getDisplayName = () => {
        if (user) {
            return user.name || user.username;
        }
        if (chat) {
            return chat.title || 'Новый канал';
        }
        return 'Неизвестно';
    };

    const getAvatar = () => {
        if (user) {
            return user.user_avatar || '/default-avatar.png';
        }
        if (chat) {
            return chat.avatar_url || '/default-chat.png';
        }
        return '/default-avatar.png';
    };

    const getLastMessage = () => {
        if (user) {
            return 'Начать квантовую связь';
        }
        if (chat) {
            return chat.last_message || 'Канал готов к работе';
        }
        return '';
    };

    const getLastMessageTime = () => {
        if (user) {
            return '';
        }
        if (chat) {
            return formatTime(chat.last_message_time);
        }
        return '';
    };

    const isOnline = () => {
        if (user) {
            return user.is_online;
        }
        return false;
    };

    const getRole = () => {
        if (user) {
            return user.role || 'Экипаж';
        }
        if (chat) {
            return chat.type === 'private' ? 'Приватный' : 'Групповой';
        }
        return '';
    };

    return (
        <div className={`chat-item ${isSelected ? 'chat-item-selected' : ''} ${!networkOnline ? 'offline' : ''}`} onClick={onClick}>
            <div className='chat-item-avatar'>
                <div className="avatar-glow"></div>
                <div className="avatar-frame">
                    <img src={getAvatar()} alt={getDisplayName()} />
                </div>
                {isOnline() && <span className='chat-item-online-dot'></span>}
            </div>
            
            <div className='chat-item-content'>
                <div className='chat-item-header'>
                    <h3 className='chat-item-name'>{getDisplayName()}</h3>
                    <span className='chat-item-time'>{getLastMessageTime()}</span>
                </div>
                
                <div className='chat-item-info'>
                    <span className='chat-item-role'>{getRole()}</span>
                </div>
                
                <div className='chat-item-message'>
                    <p>{getLastMessage()}</p>
                </div>
            </div>

            {/* Selection glow effect */}
            {isSelected && <div className="selection-glow"></div>}
        </div>
    );
};

export default ChatItem;