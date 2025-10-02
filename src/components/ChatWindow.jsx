// ChatWindow.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import './ChatWindow.css';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';
import { Send, Satellite, Zap, AlertCircle, Wifi, WifiOff } from 'lucide-react';

const ChatWindow = ({ user, chat, currentUser, isPrivateChat, networkOnline }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [retryCount, setRetryCount] = useState(0);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

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

    // Инициализация Socket.IO с обработкой переподключения
    const initializeSocket = useCallback(() => {
        if (!currentUser || !networkOnline) return;

        try {
            const socket = socketIOClient('http://localhost:3001', {
                transports: ['websocket'],
                auth: { userId: currentUser.id },
                timeout: 10000,
                forceNew: false
            });

            socket.on('connect', () => {
                console.log('WebSocket connected successfully');
                setConnectionStatus('connected');
                setError(null);
                setRetryCount(0);
            });

            socket.on('disconnect', (reason) => {
                console.log('WebSocket disconnected:', reason);
                setConnectionStatus('disconnected');
                if (reason === 'io server disconnect') {
                    // Сервер принудительно отключил соединение
                    socket.connect();
                }
            });

            socket.on('connect_error', (error) => {
                console.log('WebSocket connection error:', error);
                setConnectionStatus('error');
                setError('Ошибка подключения к серверу');
                
                // Автоматическое переподключение с экспоненциальной задержкой
                if (retryCount < 5) {
                    const delay = Math.pow(2, retryCount) * 1000;
                    reconnectTimeoutRef.current = setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        socket.connect();
                    }, delay);
                }
            });

            socketRef.current = socket;
            return socket;
        } catch (error) {
            setError('Не удалось инициализировать соединение');
            setConnectionStatus('error');
        }
    }, [currentUser, networkOnline, retryCount]);

    useEffect(() => {
        if (currentUser && networkOnline) {
            initializeSocket();
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [initializeSocket]);

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

        console.log('Joining chat room:', chatId);
        socket.emit('chat:join', chatId);

        const handleNewMessage = (payload) => {
            console.log('Received new message via WebSocket:', payload);
            
            // Проверяем корректность данных
            if (!payload || !payload.id || !payload.text) {
                console.log('Invalid message payload, ignoring');
                return;
            }
            
            if (payload.chat_id !== chatId) {
                console.log('Message not for current chat, ignoring');
                return;
            }
            
            setMessages(prev => {
                // Проверяем, нет ли уже такого сообщения (избегаем дублирования)
                const messageExists = prev.some(msg => msg.id === payload.id);
                if (messageExists) {
                    console.log('Message already exists, skipping');
                    return prev;
                }
                console.log('Adding new message to state');
                return [...prev, payload];
            });
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

    // Отправка нового сообщения с обработкой ошибок
    const sendMessage = async () => {
        if (!newMessage.trim() || !chatId || !currentUser || !networkOnline) {
            console.log('Cannot send message: missing requirements', {
                hasMessage: !!newMessage.trim(),
                hasChatId: !!chatId,
                hasCurrentUser: !!currentUser,
                networkOnline
            });
            return;
        }

        const messageText = newMessage.trim();
        setNewMessage(''); // Очищаем поле ввода сразу

        try {
            const response = await axios.post(`http://localhost:3001/api/chat/${chatId}/messages`, {
                text: messageText
            }, {
                headers: {
                    'x-user-id': currentUser.id
                },
                timeout: 10000
            });

            console.log('Message sent successfully:', response.data);

            // Всегда добавляем сообщение локально сразу для мгновенного отображения
            if (response.data.message) {
                setMessages(prev => {
                    // Проверяем, нет ли уже такого сообщения (избегаем дублирования)
                    const messageExists = prev.some(msg => msg.id === response.data.message.id);
                    if (messageExists) {
                        return prev;
                    }
                    return [...prev, response.data.message];
                });
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Не удалось отправить сообщение');
            setNewMessage(messageText); // Возвращаем текст в поле ввода
            
            // Автоматически убираем ошибку через 3 секунды
            setTimeout(() => setError(null), 3000);
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

    const getConnectionIcon = () => {
        switch (connectionStatus) {
            case 'connected':
                return <Wifi className="connection-icon" />;
            case 'connecting':
                return <Satellite className="connection-icon rotating" />;
            case 'disconnected':
            case 'error':
                return <WifiOff className="connection-icon" />;
            default:
                return <Satellite className="connection-icon" />;
        }
    };

    const getConnectionText = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'КВАНТОВАЯ СВЯЗЬ АКТИВНА';
            case 'connecting':
                return 'ПОДКЛЮЧЕНИЕ...';
            case 'disconnected':
                return 'СОЕДИНЕНИЕ ПОТЕРЯНО';
            case 'error':
                return 'ОШИБКА СОЕДИНЕНИЯ';
            default:
                return 'КВАНТОВАЯ СВЯЗЬ';
        }
    };

    return (
        <div className="chat-window">
            {/* Error notification */}
            {error && (
                <div className="error-notification">
                    <AlertCircle className="error-icon" />
                    <span>{error}</span>
                </div>
            )}

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
                        <div className={`connection-info ${connectionStatus}`}>
                            {getConnectionIcon()}
                            <span className="connection-text">{getConnectionText()}</span>
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
                        placeholder={networkOnline ? "ВВЕДИТЕ СООБЩЕНИЕ..." : "СОЕДИНЕНИЕ ПОТЕРЯНО..."}
                        disabled={loading || !networkOnline || connectionStatus !== 'connected'}
                        className={`message-input ${!networkOnline ? 'disabled' : ''}`}
                    />
                    <button 
                        onClick={sendMessage} 
                        disabled={loading || !newMessage.trim() || !networkOnline || connectionStatus !== 'connected'}
                        className={`send-button ${(!networkOnline || connectionStatus !== 'connected') ? 'disabled' : ''}`}
                    >
                        <Send className="send-icon" />
                        TRANSMIT
                    </button>
                </div>
                
                {/* Connection status indicator */}
                {!networkOnline && (
                    <div className="connection-warning">
                        <WifiOff className="warning-icon" />
                        <span>Нет соединения с сетью</span>
                    </div>
                )}
                
                {networkOnline && connectionStatus !== 'connected' && (
                    <div className="connection-warning">
                        <AlertCircle className="warning-icon" />
                        <span>Переподключение к серверу...</span>
                    </div>
                )}
                
                {isTyping && networkOnline && connectionStatus === 'connected' && (
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