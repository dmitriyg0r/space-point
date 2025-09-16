import { useState } from 'react'
import * as icons from "svg-by-dreamsoftware/icons-react-dist";
import './ChatItem.css'

const ChatItem = ({user, onClick, isSelected}) => {
    return (
        <div className={`chat-item ${isSelected ? 'chat-item-selected' : ''}`} onclick={onClick}>
            <div className='chat-item-avatar'>
                <img src={user.avatar} alt={user.name} />
                {user.isOnline && <span className='chat-item-online-dot'></span>}
            </div>
            <div className='chat-item-content'>
                <div className='chat-item-header'>
                    <h3 className='chat-item-name'>{user.name}</h3>
                    <span className='shat-item-time'>{user.timestemp}</span>
                </div>
                <div className='chat-item-message'>
                    <p>{user.lastMessage}</p>
                    {user.unreadCount > 0 && (
                        <span className='chat-item-badge'>{user.unreadCount}</span>
                    )}
                </div>
            </div>

        </div>
    );
};

export default ChatItem;