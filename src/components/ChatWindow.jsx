import { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';

const ChatWindow = ({ user, chat, currentUser, isPrivateChat }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Получение или создание чата
    useEffect(() => {
        const getOrCreateChat = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                let response;

                if (isPrivateChat && user) {
                    // Создаем или получаем приватный чат
                    response = await axios.get(`http://localhost:3001/api/chat/private/${user.id}`, {
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

    // Инициализация Socket.IO
    useEffect(() => {
        if (!currentUser) return;

        const socket = socketRef.current || socketIOClient('http://localhost:3001', {
            transports: ['websocket'],
            auth: { userId: currentUser.id }
        });
        socketRef.current = socket;

        return () => {
            // не закрываем сокет при смене чата, только при размонтировании компонента
        };
    }, [currentUser]);

    // Загрузка сообщений
    useEffect(() => {
        const fetchMessages = async () => {
            if (!chatId || !currentUser) return;

            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:3001/api/chat/${chatId}/messages`, {
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

    // Присоединение к комнате чата и обработчики сокета
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !chatId) return;

        socket.emit('chat:join', chatId);

        const handleNewMessage = (payload) => {
            if (payload.chat_id !== chatId) return;
            setMessages(prev => [...prev, payload]);
        };

        const handleTyping = ({ chatId: id, userId, isTyping: typing }) => {
            if (id !== chatId || userId === String(currentUser.id)) return;
            setIsTyping(typing);
            if (typing) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
            }
        };

        socket.on('message:new', handleNewMessage);
        socket.on('typing', handleTyping);
        socket.on('message:read', ({ chatId: id, messageId }) => {
            if (id !== chatId) return;
            // помечаем исходящие сообщения как прочитанные до messageId
            setMessages(prev => prev.map(m => ({
                ...m,
                is_read_by_peer: m.user_id === currentUser.id ? (m.id <= messageId) : m.is_read_by_peer
            })));
        });

        return () => {
            socket.emit('chat:leave', chatId);
            socket.off('message:new', handleNewMessage);
            socket.off('typing', handleTyping);
            socket.off('message:read');
        };
    }, [chatId, currentUser]);

    // Отправка нового сообщения
    const sendMessage = async () => {
        if (!newMessage.trim() || !chatId || !currentUser) return;

        try {
            const response = await axios.post(`http://localhost:3001/api/chat/${chatId}/messages`, {
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

    // Эмит статуса набора текста
    const handleInputChange = (e) => {
        const value = e.target.value;
        setNewMessage(value);
        if (!socketRef.current || !chatId) return;
        socketRef.current.emit('typing:start', { chatId });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current.emit('typing:stop', { chatId });
        }, 800);
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
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                    disabled={loading}
                />
                <button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
                    Отправить
                </button>
                {isTyping && (
                    <div className="typing-indicator">Печатает...</div>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;