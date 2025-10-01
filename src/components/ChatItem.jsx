import { useState } from 'react'
import * as icons from "svg-by-dreamsoftware/icons-react-dist";
import './ChatItem.css'

const ChatItem = ({user, chat, onClick, isSelected, currentUser}) => {
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
            return chat.title || 'Безымянный чат';
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
            return 'Нажмите чтобы начать общение';
        }
        if (chat) {
            return chat.last_message || 'Нет сообщений';
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

    return (
        <div className={`chat-item ${isSelected ? 'chat-item-selected' : ''}`} onClick={onClick}>
            <div className='chat-item-avatar'>
                <img src={getAvatar()} alt={getDisplayName()} />
                {isOnline() && <span className='chat-item-online-dot'></span>}
            </div>
            <div className='chat-item-content'>
                <div className='chat-item-header'>
                    <h3 className='chat-item-name'>{getDisplayName()}</h3>
                    <span className='chat-item-time'>{getLastMessageTime()}</span>
                </div>
                <div className='chat-item-message'>
                    <p>{getLastMessage()}</p>
                </div>
            </div>
        </div>
    );
};

export default ChatItem;