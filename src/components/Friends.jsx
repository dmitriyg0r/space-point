import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  UserPlus, 
  UserMinus, 
  MessageCircle, 
  Zap,
  Radio,
  Users,
  Satellite
} from 'lucide-react';
import './Friends.css';

const Friends = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (currentUser) {
            loadFriends();
            loadIncomingRequests();
            loadOutgoingRequests();
        }
    }, [currentUser]);

    const loadFriends = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:3001/api/friends', {
                headers: { 'x-user-id': currentUser.id }
            });
            setFriends(response.data.friends);
        } catch (err) {
            setError('Ошибка загрузки друзей');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadIncomingRequests = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/friends/requests/incoming', {
                headers: { 'x-user-id': currentUser.id }
            });
            setIncomingRequests(response.data.requests);
        } catch (err) {
            console.error('Ошибка загрузки входящих запросов:', err);
        }
    };

    const loadOutgoingRequests = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/friends/requests/outgoing', {
                headers: { 'x-user-id': currentUser.id }
            });
            setOutgoingRequests(response.data.requests);
        } catch (err) {
            console.error('Ошибка загрузки исходящих запросов:', err);
        }
    };

    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await axios.get(`http://localhost:3001/api/friends/search?query=${encodeURIComponent(query)}`, {
                headers: { 'x-user-id': currentUser.id }
            });
            setSearchResults(response.data.users);
        } catch (err) {
            console.error('Ошибка поиска пользователей:', err);
        }
    };

    const sendFriendRequest = async (friendId) => {
        try {
            await axios.post(`http://localhost:3001/api/friends/${friendId}/request`, {}, {
                headers: { 'x-user-id': currentUser.id }
            });
            loadOutgoingRequests();
            searchUsers(searchQuery);
        } catch (err) {
            console.error('Ошибка отправки запроса в друзья:', err);
        }
    };

    const acceptFriendRequest = async (friendId) => {
        try {
            await axios.post(`http://localhost:3001/api/friends/${friendId}/accept`, {}, {
                headers: { 'x-user-id': currentUser.id }
            });
            loadIncomingRequests();
            loadFriends();
        } catch (err) {
            console.error('Ошибка принятия запроса:', err);
        }
    };

    const rejectFriendRequest = async (friendId) => {
        try {
            await axios.post(`http://localhost:3001/api/friends/${friendId}/reject`, {}, {
                headers: { 'x-user-id': currentUser.id }
            });
            loadIncomingRequests();
        } catch (err) {
            console.error('Ошибка отклонения запроса:', err);
        }
    };

    const removeFriend = async (friendId) => {
        try {
            await axios.delete(`http://localhost:3001/api/friends/${friendId}`, {
                headers: { 'x-user-id': currentUser.id }
            });
            loadFriends();
        } catch (err) {
            console.error('Ошибка удаления из друзей:', err);
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchUsers(query);
    };

    const getFriendshipStatus = (user) => {
        if (user.friendship_status === 'accepted') return 'friend';
        if (user.friendship_status === 'pending') return 'pending';
        return 'none';
    };

    // Функция для получения текущих данных в зависимости от активной вкладки
    const getCurrentData = () => {
        switch (activeTab) {
            case 'friends':
                return friends;
            case 'search':
                return searchResults;
            case 'requests':
                return [...incomingRequests, ...outgoingRequests];
            default:
                return [];
        }
    };

    const getOnlineCount = () => {
        return friends.filter(friend => friend.is_online).length;
    };

    const getTotalCount = () => {
        switch (activeTab) {
            case 'friends':
                return friends.length;
            case 'requests':
                return incomingRequests.length + outgoingRequests.length;
            case 'search':
                return searchResults.length;
            default:
                return 0;
        }
    };

    // Рендер карточки пользователя в новом стиле
    const renderUserCard = (user, showActions = true, isRequest = false, isIncoming = false) => (
        <div key={user.id} className="crew-card">
            {/* Holographic effect */}
            <div className="card-top-glow"></div>
            
            <div className="card-content">
                {/* Header with Avatar and Status */}
                <div className="member-header">
                    <div className="avatar-container">
                        <div className="avatar-glow"></div>
                        <div className="avatar-frame">
                            <img 
                                src={user.user_avatar || user.avatar || '/default-avatar.png'} 
                                alt={user.name} 
                                className="avatar-image" 
                            />
                        </div>
                        {user.is_online && (
                            <div className="online-indicator"></div>
                        )}
                    </div>

                    <div className="member-info">
                        <div className="name-row">
                            <h3 className="member-name">{user.name}</h3>
                            {user.isVerified && (
                                <div className="verified-badge">
                                    <Zap className="verified-icon" />
                                </div>
                            )}
                        </div>
                        <div className="username-row">
                            <span className="member-username">@{user.username}</span>
                        </div>
                        <div className="role-row">
                            <Radio className="role-icon" />
                            <span className="member-role">
                                {isRequest ? (isIncoming ? 'Входящий запрос' : 'Исходящий запрос') : 'Участник'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <p className="member-bio">
                    {user.bio || user.profile_info || 'Активный участник экипажа'}
                </p>

                {/* Stats */}
                <div className="member-stats">
                    <div className="followers-stat">
                        <Users className="stat-icon" />
                        <span className="stat-value">
                            {user.followers ? user.followers.toLocaleString() : '0'}
                        </span>
                    </div>
                    {user.is_online && (
                        <div className="online-stat">
                            <div className="online-dot"></div>
                            <span className="online-text">АКТИВЕН</span>
                        </div>
                    )}
                    {isRequest && (
                        <div className="request-time">
                            {new Date(user.created_at).toLocaleDateString('ru-RU')}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="member-actions">
                    {!isRequest && (
                        <button className="msg-button">
                            <MessageCircle className="button-icon" />
                            MSG
                        </button>
                    )}
                    
                    {showActions && (
                        <>
                            {isRequest && isIncoming ? (
                                <>
                                    <button 
                                        className="btn-success"
                                        onClick={() => acceptFriendRequest(user.user_id || user.id)}
                                    >
                                        Принять
                                    </button>
                                    <button 
                                        className="btn-danger"
                                        onClick={() => rejectFriendRequest(user.user_id || user.id)}
                                    >
                                        Отклонить
                                    </button>
                                </>
                            ) : isRequest ? (
                                <span className="status-pending">Ожидает ответа</span>
                            ) : getFriendshipStatus(user) === 'none' ? (
                                <button 
                                    className="follow-btn not-following"
                                    onClick={() => sendFriendRequest(user.id)}
                                >
                                    <UserPlus className="button-icon" />
                                    СЛЕДИТЬ
                                </button>
                            ) : getFriendshipStatus(user) === 'pending' ? (
                                <span className="status-pending">Запрос отправлен</span>
                            ) : (
                                <button 
                                    className="follow-btn following"
                                    onClick={() => removeFriend(user.id)}
                                >
                                    <UserMinus className="button-icon" />
                                    ОТПИСКА
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Bottom glow */}
            <div className="card-bottom-glow"></div>
        </div>
    );

    if (loading) {
        return (
            <div className="crew-page">
                <div className="crew-container">
                    <div className="loading-crew">Загрузка экипажа...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="crew-page">
            {/* Floating particles */}
            <div className="floating-particles">
                {[...Array(25)].map((_, i) => (
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

            {/* Content Container */}
            <div className="crew-container">
                {/* Header */}
                <div className="crew-header-section">
                    <div className="header-background">
                        <div className="header-scan-line"></div>
                        
                        <div className="header-content">
                            <div className="header-top">
                                <div className="header-title-section">
                                    <div className="title-icon">
                                        <div className="icon-glow"></div>
                                        <div className="icon-circle">
                                            <Users className="icon" />
                                        </div>
                                    </div>
                                    <div className="title-text">
                                        <h1 className="crew-title">ЭКИПАЖ</h1>
                                        <div className="crew-stats">
                                            <div className="online-stat">
                                                <div className="stat-dot"></div>
                                                <span className="stat-text">{getOnlineCount()} ONLINE</span>
                                            </div>
                                            <span className="stat-separator">•</span>
                                            <span className="total-stat">{getTotalCount()} TOTAL</span>
                                        </div>
                                    </div>
                                </div>

                                <Satellite className="header-satellite" />
                            </div>

                            {/* Search and Tabs */}
                            <div className="search-filters">
                                <div className="search-container">
                                    <Search className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="[SCAN] Поиск по экипажу..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="search-input"
                                    />
                                </div>

                                <div className="filter-buttons">
                                    <button
                                        onClick={() => setActiveTab('friends')}
                                        className={`filter-button ${activeTab === 'friends' ? 'active' : ''}`}
                                    >
                                        ДРУЗЬЯ ({friends.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('requests')}
                                        className={`filter-button ${activeTab === 'requests' ? 'active' : ''}`}
                                    >
                                        ЗАПРОСЫ ({incomingRequests.length + outgoingRequests.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('search')}
                                        className={`filter-button ${activeTab === 'search' ? 'active' : ''}`}
                                    >
                                        <Zap className="filter-icon" />
                                        ПОИСК
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="crew-grid">
                    {activeTab === 'friends' && (
                        <>
                            {friends.length === 0 ? (
                                <div className="no-results">
                                    <Radio className="no-results-icon" />
                                    <p className="no-results-text">[NO_SIGNAL] Друзей не найдено</p>
                                    <p className="no-results-subtext">Начните добавлять друзей через поиск</p>
                                </div>
                            ) : (
                                friends.map(friend => renderUserCard(friend, false))
                            )}
                        </>
                    )}

                    {activeTab === 'requests' && (
                        <>
                            {incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
                                <div className="no-results">
                                    <Radio className="no-results-icon" />
                                    <p className="no-results-text">[NO_SIGNAL] Запросов не найдено</p>
                                    <p className="no-results-subtext">Здесь появятся входящие и исходящие запросы</p>
                                </div>
                            ) : (
                                <>
                                    {incomingRequests.length > 0 && (
                                        <div className="requests-section">
                                            <h3 className="requests-title">Входящие запросы</h3>
                                            {incomingRequests.map(request => 
                                                renderUserCard(request, true, true, true)
                                            )}
                                        </div>
                                    )}
                                    {outgoingRequests.length > 0 && (
                                        <div className="requests-section">
                                            <h3 className="requests-title">Исходящие запросы</h3>
                                            {outgoingRequests.map(request => 
                                                renderUserCard(request, true, true, false)
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {activeTab === 'search' && (
                        <>
                            {searchResults.length === 0 && searchQuery.length >= 2 ? (
                                <div className="no-results">
                                    <Radio className="no-results-icon" />
                                    <p className="no-results-text">[NO_SIGNAL] Пользователи не найдены</p>
                                    <p className="no-results-subtext">Попробуйте изменить параметры поиска</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="no-results">
                                    <Radio className="no-results-icon" />
                                    <p className="no-results-text">[SCAN_READY] Введите запрос для поиска</p>
                                    <p className="no-results-subtext">Минимум 2 символа для начала поиска</p>
                                </div>
                            ) : (
                                searchResults.map(user => renderUserCard(user, true))
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Friends;