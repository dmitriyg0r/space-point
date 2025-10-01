// ChatWindow.jsx
import { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';
import { Send, Satellite, Zap } from 'lucide-react';

const ChatWindow = ({ user, chat, currentUser, isPrivateChat }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Получение или создание чата
    useEffect(() => {
        const getOrCreateChat = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                let response;

                if (isPrivateChat && user) {
                    response = await axios.get(`http://localhost:3001/api/chat/private/${user.id}`, {
                        headers: {
                            'x-user-id': currentUser.id
                        }
                    });
                } else if (chat) {
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
            return chat.title || 'Квантовый канал';
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

    const getStatusText = () => {
        if (isOnline()) {
            return '● ОНЛАЙН';
        }
        return '○ ОФФЛАЙН';
    };

    return (
        <div className="chat-window">
            {/* Header */}
            <div className="chat-window-header">
                <div className="header-background">
                    <div className="header-scan-line"></div>
                    <div className="header-content">
                        <div className="chat-window-user">
                            <div className="user-avatar">
                                <div className="avatar-glow"></div>
                                <div className="avatar-frame">
                                    <img src={getAvatar()} alt={getDisplayName()} />
                                </div>
                                {isOnline() && <div className="online-indicator"></div>}
                            </div>
                            <div className="user-info">
                                <h3>{getDisplayName()}</h3>
                                <div className="user-status">
                                    <span className={`status-text ${isOnline() ? 'online' : 'offline'}`}>
                                        {getStatusText()}
                                    </span>
                                    {isOnline() && (
                                        <div className="typing-indicator-small">
                                            {isTyping ? 'ПЕЧАТАЕТ...' : 'ГОТОВ К СВЯЗИ'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="connection-info">
                            <Satellite className="connection-icon" />
                            <span className="connection-text">КВАНТОВАЯ СВЯЗЬ</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-window-messages">
                {loading ? (
                    <div className="messages-loading">
                        <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <p>[DECRYPTING] Загрузка сообщений...</p>
                    </div>
                ) : (
                    <>
                        {messages.map(message => (
                            <div key={message.id} className={`message ${message.user_id === currentUser?.id ? 'message-own' : 'message-other'}`}>
                                <div className="message-content">
                                    <p>{message.text}</p>
                                    <span className="message-time">
                                        {formatMessageTime(message.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="chat-window-input">
                <div className="input-container">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="ВВЕДИТЕ СООБЩЕНИЕ..."
                        disabled={loading}
                        className="message-input"
                    />
                    <button 
                        onClick={sendMessage} 
                        disabled={loading || !newMessage.trim()}
                        className="send-button"
                    >
                        <Send className="send-icon" />
                        TRANSMIT
                    </button>
                </div>
                {isTyping && (
                    <div className="typing-indicator">
                        <div className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span>СОБЫТИЕ НАБОРА ТЕКСТА...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;