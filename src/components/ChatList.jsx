import React, { useState } from "react";
import './ChatList.css'
import ChatItem from "./ChatItem";

const ChatList = ({ users, chats, onUserSelect, onChatSelect, currentUser}) => {
    const [selectedId, setSelectedId] = useState(null);
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' или 'users'

    const handleUserClick = (user) => {
        setSelectedId(user.id);
        onUserSelect(user);
    };

    const handleChatClick = (chat) => {
        setSelectedId(chat.id);
        onChatSelect(chat);
    };

    return(
        <div className="Chat-list">
            <div className="chat-serch">
                <h3>QUANTUM COMM</h3>
                <div className="chat-tabs">
                    <button 
                        className={activeTab === 'chats' ? 'active' : ''}
                        onClick={() => setActiveTab('chats')}
                    >
                        Чаты
                    </button>
                    <button 
                        className={activeTab === 'users' ? 'active' : ''}
                        onClick={() => setActiveTab('users')}
                    >
                        Пользователи
                    </button>
                </div>
            </div>

            <div className="chat-list-items">
                {activeTab === 'chats' ? (
                    chats.map(chat => (
                        <ChatItem
                            key={chat.id}
                            chat={chat}
                            isSelected={selectedId === chat.id}
                            onClick={() => handleChatClick(chat)}
                            currentUser={currentUser}
                        />
                    ))
                ) : (
                    users.map(user => (
                        <ChatItem
                            key={user.id}
                            user={user}
                            isSelected={selectedId === user.id}
                            onClick={() => handleUserClick(user)}
                            currentUser={currentUser}
                        />
                    ))
                )}
            </div>
        </div>
    );
};



export default ChatList;