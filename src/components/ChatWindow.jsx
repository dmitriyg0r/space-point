// ChatWindow.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import './ChatWindow.css';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';
import { Send, Satellite, Zap, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { SERVER_URL } from '../config.js';

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

    // Проверка доступности сервера
    const checkServerAvailability = async () => {
        try {
            console.log('Checking server availability...');
            const response = await fetch(`${SERVER_URL}/api/test`, { 
                method: 'GET',
                timeout: 5000 
            });
            console.log('Server health check:', response.ok ? 'OK' : 'Failed');
            if (response.ok) {
                const data = await response.json();
                console.log('Server response:', data.message);
            }
            return response.ok;
        } catch (error) {
            console.log('Server health check failed:', error.message);
            return false;
        }
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
                    response = await axios.get(`${SERVER_URL}/api/chat/private/${user.id}`, {
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
    const initializeSocket = useCallback(async () => {
        if (!currentUser || !networkOnline) {
            console.log('Cannot initialize socket: missing requirements', {
                hasCurrentUser: !!currentUser,
                networkOnline
            });
            return;
        }

        // Проверяем доступность сервера перед подключением
        const serverAvailable = await checkServerAvailability();
        if (!serverAvailable) {
            setError('Сервер недоступен. Убедитесь, что сервер запущен: npm start в папке server');
            setConnectionStatus('error');
            return;
        }

        try {
            console.log('Initializing WebSocket connection...');
            const socket = socketIOClient(SERVER_URL, {
                transports: ['websocket', 'polling'], // Добавляем fallback на polling
                auth: { userId: currentUser.id },
                timeout: 10000,
                forceNew: false,
                autoConnect: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                withCredentials: false // Для CORS
            });

            socket.on('connect', () => {
                console.log('WebSocket connected successfully via:', socket.io.engine.transport.name);
                console.log('Socket ID:', socket.id);
                setConnectionStatus('connected');
                setError(null);
                setRetryCount(0);
            });

            // Примечание: обработка статуса пользователей теперь в App.jsx

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
                console.log('Error details:', error.message, error.description, error.context);
                setConnectionStatus('error');
                setError('Ошибка подключения к серверу');
                
                // Автоматическое переподключение с экспоненциальной задержкой
                if (retryCount < 5) {
                    const delay = Math.pow(2, retryCount) * 1000;
                    console.log(`Retrying connection in ${delay}ms (attempt ${retryCount + 1}/5)`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        socket.connect();
                    }, delay);
                }
            });

            // Отслеживание смены транспорта
            socket.io.on('upgrade', () => {
                console.log('Transport upgraded to:', socket.io.engine.transport.name);
            });

            socket.io.on('upgradeError', (error) => {
                console.log('Transport upgrade error:', error);
            });

            socketRef.current = socket;
            return socket;
        } catch (error) {
            console.log('Socket initialization error:', error);
            setError('Не удалось инициализировать соединение');
            setConnectionStatus('error');
            
            // Попробуем подключиться только через polling как fallback
            try {
                console.log('Trying fallback connection with polling only...');
                const fallbackSocket = socketIOClient(SERVER_URL, {
                    transports: ['polling'], // Только polling
                    auth: { userId: currentUser.id },
                    timeout: 15000,
                    forceNew: true
                });
                
                fallbackSocket.on('connect', () => {
                    console.log('Fallback connection successful via polling');
                    setConnectionStatus('connected');
                    setError(null);
                    setRetryCount(0);
                });
                
                socketRef.current = fallbackSocket;
            } catch (fallbackError) {
                console.log('Fallback connection also failed:', fallbackError);
            }
        }
    }, [currentUser, networkOnline, retryCount]);

    useEffect(() => {
        if (currentUser && networkOnline && !socketRef.current) {
            console.log('Initializing socket for user:', currentUser.id);
            initializeSocket();
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                console.log('Cleaning up socket connection');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [currentUser, networkOnline]); // Убираем initializeSocket из зависимостей

    // Загрузка сообщений
    useEffect(() => {
        const fetchMessages = async () => {
            if (!chatId || !currentUser) return;

            try {
                setLoading(true);
                const response = await axios.get(`${SERVER_URL}/api/chat/${chatId}/messages`, {
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

        console.log('🏠 Joining chat room:', chatId);
        console.log('👤 User joining:', currentUser?.id, currentUser?.name);
        console.log('🔌 Socket connected:', socket.connected);
        console.log('🆔 Socket ID:', socket.id);
        
        socket.emit('chat:join', chatId);

        const handleNewMessage = (payload) => {
            console.log('🔔 Received new message via WebSocket:', payload);
            console.log('📍 Current chat ID:', chatId, 'Message chat ID:', payload.chat_id);
            console.log('👤 Current user ID:', currentUser?.id, 'Message user ID:', payload.user_id);
            
            // Проверяем корректность данных
            if (!payload || !payload.id || !payload.text) {
                console.log('❌ Invalid message payload, ignoring');
                return;
            }
            
            if (Number(payload.chat_id) !== Number(chatId)) {
                console.log('❌ Message not for current chat, ignoring');
                console.log('🔍 Payload chat_id type:', typeof payload.chat_id, 'value:', payload.chat_id);
                console.log('🔍 Current chatId type:', typeof chatId, 'value:', chatId);
                return;
            }
            
            setMessages(prev => {
                console.log('📝 Current messages count:', prev.length);
                // Проверяем, нет ли уже такого сообщения (избегаем дублирования)
                const messageExists = prev.some(msg => msg.id === payload.id);
                if (messageExists) {
                    console.log('⚠️ Message already exists, skipping');
                    return prev;
                }
                console.log('✅ Adding new message to state');
                const newMessages = [...prev, payload];
                console.log('📝 New messages count:', newMessages.length);
                return newMessages;
            });
        };

        const handleTyping = ({ chatId: id, userId, isTyping: typing }) => {
            if (Number(id) !== Number(chatId) || userId === String(currentUser.id)) return;
            setIsTyping(typing);
            if (typing) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
            }
        };

        socket.on('message:new', handleNewMessage);
        socket.on('typing', handleTyping);
        socket.on('message:read', ({ chatId: id, messageId }) => {
            if (Number(id) !== Number(chatId)) return;
            setMessages(prev => prev.map(m => ({
                ...m,
                is_read_by_peer: m.user_id === currentUser.id ? (m.id <= messageId) : m.is_read_by_peer
            })));
        });

        return () => {
            console.log('Cleaning up chat room listeners for:', chatId);
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
            const response = await axios.post(`${SERVER_URL}/api/chat/${chatId}/messages`, {
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