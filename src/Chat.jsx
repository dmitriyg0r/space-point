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
        // Получаем текущего пользователя из localStorage
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
                
                // Получаем чаты пользователя
                const chatsResponse = await axios.get('http://localhost:3001/api/chat/chats', {
                    headers: {
                        'x-user-id': currentUser.id
                    }
                });
                setChats(chatsResponse.data.chats);

                // Получаем всех пользователей
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
            <div className="chat-loading">
                <h3>Загрузка чатов...</h3>
            </div>
        )
    }

    if (error) {
        return (
            <div className="chat-error">
                <h3>{error}</h3>
                <button onClick={() => window.location.reload()}>Попробовать снова</button>
            </div>
        )
    }
    return (
        <>
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
                <div className="chat-page-placeholder">
                    <h3>Выберите чат чтобы начать общение</h3>
                </div>
            )}
        </>
    );
};


export default Chat;