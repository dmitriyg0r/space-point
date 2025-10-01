import { useState, useEffect } from 'react';
import './ChatWindow.css';
import axios from 'axios';

const ChatWindow = ({ user, chat, currentUser, isPrivateChat }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(null);

    // Получение или создание чата
    useEffect(() => {
        const getOrCreateChat = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                let response;

                if (isPrivateChat && user) {
                    // Создаем или получаем приватный чат
                    response = await axios.get(`http://localhost:5000/api/chat/private/${user.id}`, {
                        headers: {
                            'x-user-id': currentUser.id
                        }
                    });
                } else if (chat) {
                    // Используем существующий чат
                    response = { data: { success: true, chat: chat } };
                }

                if (response?.data?.success) {
                    setChatId(response.data.chat.id);
                }
            } catch (err) {
                console.error('Error getting chat:', err);
            } finally {
                setLoading(false);
            }
        };

        getOrCreateChat();
    }, [user, chat, currentUser, isPrivateChat]);

    // Загрузка сообщений
    useEffect(() => {
        const fetchMessages = async () => {
            if (!chatId || !currentUser) return;

            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:5000/api/chat/${chatId}/messages`, {
                    headers: {
                        'x-user-id': currentUser.id
                    }
                });
                setMessages(response.data.messages || []);
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [chatId, currentUser]);

    // Отправка нового сообщения
    const sendMessage = async () => {
        if (!newMessage.trim() || !chatId || !currentUser) return;

        try {
            const response = await axios.post(`http://localhost:5000/api/chat/${chatId}/messages`, {
                text: newMessage.trim()
            }, {
                headers: {
                    'x-user-id': currentUser.id
                }
            });

            // Добавляем новое сообщение в список
            setMessages(prev => [...prev, response.data.message]);
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
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

    const isOnline = () => {
        if (user) {
            return user.is_online;
        }
        return false;
    };

    const formatMessageTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className="chat-window">
            <div className="chat-window-header">
                <div className="chat-window-user">
                    <img src={getAvatar()} alt={getDisplayName()} />
                    <div>
                        <h3>{getDisplayName()}</h3>
                        <span className="user-status">
                            {isOnline() ? 'online' : 'offline'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="chat-window-messages">
                {loading ? (
                    <div className="messages-loading">Загрузка сообщений...</div>
                ) : (
                    messages.map(message => (
                        <div key={message.id} className={`message ${message.user_id === currentUser?.id ? 'message-own' : 'message-other'}`}>
                            <div className="message-content">
                                <p>{message.text}</p>
                                <span className="message-time">
                                    {formatMessageTime(message.created_at)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="chat-window-input">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                    disabled={loading}
                />
                <button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
                    Отправить
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;