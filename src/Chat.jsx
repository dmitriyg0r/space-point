// Chat.jsx
import { useEffect, useState } from "react";
import './Chat.css'
import '@fontsource/jura';
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import axios from "axios";

const Chat = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedChat, setSelectedChat] = useState(null);
    const [users, setUsers] = useState([]);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
        }
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                
                const chatsResponse = await axios.get('http://localhost:3001/api/chat/chats', {
                    headers: {
                        'x-user-id': currentUser.id
                    }
                });
                setChats(chatsResponse.data.chats);

                const usersResponse = await axios.get('http://localhost:3001/api/chat/users', {
                    headers: {
                        'x-user-id': currentUser.id
                    }
                });
                setUsers(usersResponse.data.users);

            } catch (err) {
                setError('Ошибка при загрузке данных');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setSelectedChat(null);
    };

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        setSelectedUser(null);
    };

    if (loading) {
        return (
            <div className="chat-page">
                <div className="chat-loading">
                    <div className="loading-text">[SCANNING] Загрузка коммуникаций...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="chat-page">
                <div className="chat-error">
                    <div className="error-icon">[ERROR]</div>
                    <h3>{error}</h3>
                    <button onClick={() => window.location.reload()}>ПОВТОРИТЬ СКАНИРОВАНИЕ</button>
                </div>
            </div>
        )
    }

    return (
        <div className="chat-page">
            {/* Floating particles */}
            <div className="floating-particles">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 4}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            <ChatList 
                users={users} 
                chats={chats}
                onUserSelect={handleUserSelect}
                onChatSelect={handleChatSelect}
                currentUser={currentUser}
            />
            
            {selectedUser ? (
                <ChatWindow 
                    user={selectedUser} 
                    currentUser={currentUser}
                    isPrivateChat={true}
                />
            ) : selectedChat ? (
                <ChatWindow 
                    chat={selectedChat} 
                    currentUser={currentUser}
                    isPrivateChat={false}
                />
            ) : (
                <div className="chat-placeholder">
                    <div className="placeholder-icon">[QUANTUM_COMM]</div>
                    <h3>ВЫБЕРИТЕ КАНАЛ ДЛЯ НАЧАЛА СВЯЗИ</h3>
                    <p>Система квантовой коммуникации готова к работе</p>
                </div>
            )}
        </div>
    );
};

export default Chat;