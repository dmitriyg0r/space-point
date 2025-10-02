// Chat.jsx
import { useEffect, useState, useCallback, useRef } from "react";
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
    const [retryCount, setRetryCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showStatusBar, setShowStatusBar] = useState(false);
    const [statusBarTimeout, setStatusBarTimeout] = useState(null);
    const retryTimeoutRef = useRef(null);

    // Отслеживание состояния сети
    useEffect(() => {
        const handleOnline = () => {
            const wasOffline = !isOnline;
            setIsOnline(true);
            setError(null);
            
            // Показываем статус-бар только при восстановлении соединения
            if (wasOffline) {
                setShowStatusBar(true);
                
                // Очищаем предыдущий таймаут
                if (statusBarTimeout) {
                    clearTimeout(statusBarTimeout);
                }
                
                // Скрываем статус-бар через 3 секунды
                const timeout = setTimeout(() => {
                    setShowStatusBar(false);
                }, 3000);
                setStatusBarTimeout(timeout);
            }
            
            if (currentUser && retryCount > 0) {
                fetchData();
            }
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            setError('Нет соединения с сетью');
            setShowStatusBar(true);
            
            // Очищаем таймаут при потере соединения
            if (statusBarTimeout) {
                clearTimeout(statusBarTimeout);
                setStatusBarTimeout(null);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (statusBarTimeout) {
                clearTimeout(statusBarTimeout);
            }
        };
    }, [currentUser, retryCount, isOnline, statusBarTimeout]);

    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setCurrentUser(user);
            } catch (err) {
                console.error('Ошибка при парсинге пользователя:', err);
                localStorage.removeItem('currentUser');
            }
        }
    }, []);

    // Функция загрузки данных с повторными попытками
    const fetchData = useCallback(async () => {
        if (!currentUser || !isOnline) return;

        try {
            setLoading(true);
            setError(null);
            
            const [chatsResponse, usersResponse] = await Promise.all([
                axios.get('http://localhost:3001/api/chat/chats', {
                    headers: { 'x-user-id': currentUser.id },
                    timeout: 10000
                }),
                axios.get('http://localhost:3001/api/chat/users', {
                    headers: { 'x-user-id': currentUser.id },
                    timeout: 10000
                })
            ]);

            setChats(chatsResponse.data.chats || []);
            setUsers(usersResponse.data.users || []);
            setRetryCount(0);

        } catch (err) {
            console.error('Ошибка при загрузке данных:', err);
            
            if (err.code === 'ECONNABORTED') {
                setError('Превышено время ожидания соединения');
            } else if (err.response?.status >= 500) {
                setError('Ошибка сервера. Повторная попытка...');
            } else if (err.response?.status === 401) {
                setError('Ошибка авторизации');
                localStorage.removeItem('currentUser');
                setCurrentUser(null);
                return;
            } else {
                setError('Ошибка при загрузке данных');
            }

            // Автоматическая повторная попытка
            if (retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000; // Экспоненциальная задержка
                retryTimeoutRef.current = setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, delay);
            }
        } finally {
            setLoading(false);
        }
    }, [currentUser, isOnline, retryCount]);

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [fetchData]);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setSelectedChat(null);
    };

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        setSelectedUser(null);
    };

    const handleRetry = () => {
        setRetryCount(0);
        setError(null);
        if (currentUser) {
            fetchData();
        } else {
            window.location.reload();
        }
    };

    if (loading && !currentUser) {
        return (
            <div className="chat-page">
                <div className="chat-loading">
                    <div className="loading-spinner">
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                    </div>
                    <div className="loading-text">[INITIALIZING] Инициализация системы связи...</div>
                </div>
            </div>
        )
    }

    if (!currentUser) {
        return (
            <div className="chat-page">
                <div className="chat-error">
                    <div className="error-icon">[AUTH_ERROR]</div>
                    <h3>Требуется авторизация</h3>
                    <p>Для доступа к системе связи необходимо войти в систему</p>
                    <button onClick={() => window.location.href = '/register'}>ВОЙТИ В СИСТЕМУ</button>
                </div>
            </div>
        )
    }

    if (error && !isOnline) {
        return (
            <div className="chat-page">
                <div className="chat-error">
                    <div className="error-icon">[NETWORK_ERROR]</div>
                    <h3>Нет соединения</h3>
                    <p>Проверьте подключение к сети и повторите попытку</p>
                    <div className="connection-status offline">
                        <div className="status-indicator"></div>
                        <span>ОФФЛАЙН</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error && retryCount >= 3) {
        return (
            <div className="chat-page">
                <div className="chat-error">
                    <div className="error-icon">[COMM_ERROR]</div>
                    <h3>{error}</h3>
                    <p>Не удалось установить соединение после нескольких попыток</p>
                    <button onClick={handleRetry}>ПОВТОРИТЬ СКАНИРОВАНИЕ</button>
                </div>
            </div>
        )
    }

    return (
        <div className="chat-page">

            {/* Connection status indicator */}
            {showStatusBar && (
                <div className={`connection-status-bar ${isOnline ? 'online' : 'offline'}`}>
                    <div className="status-indicator"></div>
                    <span>{isOnline ? 'КВАНТОВАЯ СВЯЗЬ ВОССТАНОВЛЕНА' : 'СОЕДИНЕНИЕ ПОТЕРЯНО'}</span>
                    {loading && <div className="loading-pulse"></div>}
                </div>
            )}

            <ChatList 
                users={users} 
                chats={chats}
                onUserSelect={handleUserSelect}
                onChatSelect={handleChatSelect}
                currentUser={currentUser}
                loading={loading}
                networkOnline={isOnline}
            />
            
            {selectedUser ? (
                <ChatWindow 
                    user={selectedUser} 
                    currentUser={currentUser}
                    isPrivateChat={true}
                    networkOnline={isOnline}
                />
            ) : selectedChat ? (
                <ChatWindow 
                    chat={selectedChat} 
                    currentUser={currentUser}
                    isPrivateChat={false}
                    networkOnline={isOnline}
                />
            ) : (
                <div className="chat-placeholder">
                    <div className="placeholder-content">
                        <div className="placeholder-icon">[QUANTUM_COMM]</div>
                        <h3>ВЫБЕРИТЕ КАНАЛ ДЛЯ НАЧАЛА СВЯЗИ</h3>
                        <p>Система квантовой коммуникации готова к работе</p>
                        {loading && (
                            <div className="placeholder-loading">
                                <div className="loading-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span>Загрузка каналов связи...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;