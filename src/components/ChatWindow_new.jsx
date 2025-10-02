import { useState, useEffect, useRef, useCallback } from 'react';
import './ChatWindow.css';
import axios from 'axios';
import { Send, Satellite, Zap, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { SERVER_URL } from '../config.js';

const ChatWindow = ({ user, chat, currentUser, isPrivateChat, networkOnline, socket }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [retryCount, setRetryCount] = useState(0);
    // socketRef заменен на переданный socket prop
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
            
            if (response.ok) {
                const data = await response.json();
                console.log('Server health check: OK');
                console.log('Server response:', data.message);
                return true;
            } else {
                console.log('Server health check: Failed');
                return false;
            }
        } catch (error) {
            console.log('Server health check: Failed');
            return false;
        }
    };

    // Получение или создание чата
    useEffect(() => {
        if (!currentUser || (!user && !chat)) return;

        const getOrCreateChat = async () => {
            try {
                let response;
                if (isPrivateChat && user) {
                    // Приватный чат с пользователем
                    response = await axios.get(`${SERVER_URL}/api/chat/private/${user.id}`, {
                        headers: { 'x-user-id': currentUser.id }
                    });
                } else if (chat) {
                    // Групповой чат
                    setChatId(chat.id);
                    return;
                }

                if (response?.data?.success) {
                    setChatId(response.data.chat.id);
                }
            } catch (error) {
                console.error('Error getting/creating chat:', error);
                setError('Ошибка при создании чата');
            }
        };

        getOrCreateChat();
    }, [user, chat, currentUser, isPrivateChat]);

    // Проверка состояния переданного socket
    const checkSocketStatus = useCallback(() => {
        if (!socket) {
            console.log('❌ No socket provided to ChatWindow');
            setConnectionStatus('error');
            setError('WebSocket не инициализирован');
            return;
        }

        if (socket.connected) {
            console.log('✅ Using existing socket connection, ID:', socket.id);
            setConnectionStatus('connected');
            setError(null);
        } else {
            console.log('⚠️ Socket exists but not connected');
            setConnectionStatus('disconnected');
        }
    }, [socket]);

    // Инициализация с переданным socket
    useEffect(() => {
        if (socket && currentUser && networkOnline) {
            console.log('Checking socket status for user:', currentUser.id);
            checkSocketStatus();
        }
    }, [socket, currentUser, networkOnline, checkSocketStatus]);

    // Загрузка сообщений
    useEffect(() => {
        if (!chatId || !currentUser) return;

        const fetchMessages = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${SERVER_URL}/api/chat/${chatId}/messages`, {
                    headers: { 'x-user-id': currentUser.id }
                });

                if (response.data.success) {
                    setMessages(response.data.messages || []);
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
                setError('Ошибка при загрузке сообщений');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [chatId, currentUser]);

    // Подключение к комнате чата и обработчики событий
    useEffect(() => {
        if (!socket || !chatId) return;

        console.log('🏠 Joining chat room:', chatId);
        console.log('👤 User joining:', currentUser?.id, currentUser?.name);
        console.log('🔌 Socket connected:', socket.connected);
        console.log('🆔 Socket ID:', socket.id);
        socket.emit('chat:join', chatId);

        const handleNewMessage = (payload) => {
            console.log('📨 Received new message:', payload);
            console.log('🔍 Message chat_id:', payload.chat_id, 'type:', typeof payload.chat_id);
            console.log('🔍 Current chatId:', chatId, 'type:', typeof chatId);
            
            if (Number(payload.chat_id) !== Number(chatId)) {
                console.log('❌ Message not for current chat, ignoring');
                console.log('🔍 Payload chat_id type:', typeof payload.chat_id, 'value:', payload.chat_id);
                console.log('🔍 Current chatId type:', typeof chatId, 'value:', chatId);
                return;
            }

            setMessages(prev => {
                const messageExists = prev.some(msg => msg.id === payload.id);
                if (messageExists) {
                    console.log('📨 Message already exists, skipping');
                    return prev;
                }
                console.log('📨 Adding new message to state');
                return [...prev, payload];
            });
        };

        const handleTyping = ({ chatId: id, userId, isTyping: typing }) => {
            if (Number(id) !== Number(chatId) || userId === String(currentUser.id)) return;
            setIsTyping(typing);
            
            if (typing) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
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
            console.log('🚪 Leaving chat room:', chatId);
            socket.off('message:new', handleNewMessage);
            socket.off('typing', handleTyping);
            socket.off('message:read');
            clearTimeout(typingTimeoutRef.current);
        };
    }, [chatId, currentUser, socket]);

    // Автоскролл при новых сообщениях
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!messageText || !chatId || !currentUser) return;

        console.log('📤 Sending message:', messageText);
        console.log('📤 Chat ID:', chatId);
        console.log('📤 User ID:', currentUser.id);

        try {
            const response = await axios.post(`${SERVER_URL}/api/chat/${chatId}/messages`, {
                text: messageText
            }, {
                headers: { 'x-user-id': currentUser.id }
            });

            console.log('Message sent successfully:', response.data);

            if (response.data.message) {
                setMessages(prev => {
                    const messageExists = prev.some(msg => msg.id === response.data.message.id);
                    if (messageExists) return prev;
                    return [...prev, response.data.message];
                });
            }

            setNewMessage('');
            setError(null);
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Ошибка при отправке сообщения');
        }
    };

    const handleTypingStart = () => {
        if (!socket || !chatId) return;
        socket.emit('typing:start', { chatId, userId: currentUser.id });
    };

    const handleTypingStop = () => {
        if (!socket || !chatId) return;
        socket.emit('typing:stop', { chatId, userId: currentUser.id });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
            handleTypingStop();
        }
    };

    const messageText = newMessage.trim();

    const getConnectionIcon = () => {
        switch (connectionStatus) {
            case 'connected': return <Wifi className="connection-icon connected" />;
            case 'connecting': return <Satellite className="connection-icon connecting" />;
            case 'error': return <AlertCircle className="connection-icon error" />;
            default: return <WifiOff className="connection-icon disconnected" />;
        }
    };

    const getConnectionText = () => {
        switch (connectionStatus) {
            case 'connected': return 'QUANTUM_LINK_ACTIVE';
            case 'connecting': return 'ESTABLISHING_LINK...';
            case 'error': return 'LINK_ERROR';
            default: return 'LINK_OFFLINE';
        }
    };

    const chatTitle = isPrivateChat ? user?.name || 'Пользователь' : chat?.name || 'Чат';
    const isOnline = isPrivateChat ? user?.is_online : true;

    return (
        <div className="chat-window">
            <div className="chat-header">
                <div className="header-background"></div>
                <div className="header-content">
                    <div className="chat-info">
                        <div className="chat-avatar">
                            {isPrivateChat ? (
                                user?.user_avatar ? (
                                    <img src={user.user_avatar} alt={user.name} />
                                ) : (
                                    <div className="avatar-placeholder">{user?.name?.[0]?.toUpperCase()}</div>
                                )
                            ) : (
                                <div className="group-avatar">#</div>
                            )}
                        </div>
                        <div className="chat-details">
                            <h3 className="chat-title">{chatTitle}</h3>
                            <div className="chat-status">
                                {isPrivateChat && (
                                    <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                                        {isOnline ? 'В сети' : 'Не в сети'}
                                    </span>
                                )}
                                {isTyping && <span className="typing-indicator">печатает...</span>}
                            </div>
                        </div>
                    </div>
                    <div className="connection-status">
                        {getConnectionIcon()}
                        <span className="connection-text">{getConnectionText()}</span>
                    </div>
                </div>
            </div>

            <div className="messages-container">
                {loading ? (
                    <div className="loading-messages">
                        <div className="loading-spinner"></div>
                        <span>Загрузка сообщений...</span>
                    </div>
                ) : error ? (
                    <div className="error-messages">
                        <AlertCircle className="error-icon" />
                        <span>{error}</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-messages">
                        <Zap className="empty-icon" />
                        <span>Начните общение</span>
                    </div>
                ) : (
                    <div className="messages-list">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.user_id === currentUser.id ? 'message-own' : 'message-other'}`}
                            >
                                <div className="message-content">
                                    <div className="message-text">{message.text}</div>
                                    <div className="message-meta">
                                        <span className="message-time">
                                            {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                        {message.user_id === currentUser.id && (
                                            <span className={`message-status ${message.is_read_by_peer ? 'read' : 'sent'}`}>
                                                {message.is_read_by_peer ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="chat-window-input">
                <div className="input-container">
                    <textarea
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            if (e.target.value.trim()) {
                                handleTypingStart();
                            } else {
                                handleTypingStop();
                            }
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder="Введите сообщение..."
                        className="message-input"
                        rows="1"
                        disabled={connectionStatus !== 'connected'}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!messageText || connectionStatus !== 'connected'}
                        className="send-button"
                    >
                        <Send className="send-icon" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
