// ChatList.jsx
import React, { useState } from "react";
import './ChatList.css'
import ChatItem from "./ChatItem";
import { Users, MessageCircle, Satellite } from "lucide-react";

const ChatList = ({ users, chats, onUserSelect, onChatSelect, currentUser, loading, networkOnline }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [activeTab, setActiveTab] = useState('chats');

    const handleUserClick = (user) => {
        setSelectedId(user.id);
        onUserSelect(user);
    };

    const handleChatClick = (chat) => {
        setSelectedId(chat.id);
        onChatSelect(chat);
    };

    return(
        <div className="chat-list">
            <div className="chat-header">
                <div className="header-content">
                    <div className="header-title">
                        <div className="title-icon">
                            <div className="icon-glow"></div>
                            <div className="icon-circle">
                                <Satellite className="icon" />
                            </div>
                        </div>
                        <div className="title-text">
                            <h1>QUANTUM COMM</h1>
                            <div className={`connection-status ${networkOnline ? 'online' : 'offline'}`}>
                                <div className="status-dot"></div>
                                <span className="status-text">{networkOnline ? 'ONLINE' : 'OFFLINE'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="chat-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chats')}
                    >
                        <MessageCircle className="tab-icon" />
                        КАНАЛЫ ({chats.length})
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users className="tab-icon" />
                        ЭКИПАЖ ({users.length})
                    </button>
                </div>
            </div>

            <div className="chat-list-items">
                {loading ? (
                    <div className="loading-list">
                        <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <p className="loading-text">[SCANNING] Поиск каналов связи...</p>
                    </div>
                ) : activeTab === 'chats' ? (
                    chats.length === 0 ? (
                        <div className="empty-list">
                            <MessageCircle className="empty-icon" />
                            <p className="empty-text">[NO_CHANNELS] Каналы не найдены</p>
                            {!networkOnline && <p className="offline-hint">Проверьте соединение с сетью</p>}
                        </div>
                    ) : (
                        chats.map(chat => (
                            <ChatItem
                                key={chat.id}
                                chat={chat}
                                isSelected={selectedId === chat.id}
                                onClick={() => handleChatClick(chat)}
                                currentUser={currentUser}
                                networkOnline={networkOnline}
                            />
                        ))
                    )
                ) : (
                    users.length === 0 ? (
                        <div className="empty-list">
                            <Users className="empty-icon" />
                            <p className="empty-text">[NO_SIGNAL] Экипаж не найден</p>
                            {!networkOnline && <p className="offline-hint">Проверьте соединение с сетью</p>}
                        </div>
                    ) : (
                        users.map(user => (
                            <ChatItem
                                key={user.id}
                                user={user}
                                isSelected={selectedId === user.id}
                                onClick={() => handleUserClick(user)}
                                currentUser={currentUser}
                                networkOnline={networkOnline}
                            />
                        ))
                    )
                )}
            </div>
        </div>
    );
};

export default ChatList;