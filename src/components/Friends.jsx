import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

    const renderUserCard = (user, showActions = true) => (
        <div key={user.id} className="user-card">
            <div className="user-avatar">
                <img src={user.user_avatar || '/default-avatar.png'} alt={user.name} />
                {user.is_online && <span className="online-dot"></span>}
            </div>
            <div className="user-info">
                <h4>{user.name}</h4>
                <p>@{user.username}</p>
                {user.is_online ? (
                    <span className="status online">В сети</span>
                ) : (
                    <span className="status offline">Не в сети</span>
                )}
            </div>
            {showActions && (
                <div className="user-actions">
                    {getFriendshipStatus(user) === 'none' && (
                        <button 
                            className="btn-primary"
                            onClick={() => sendFriendRequest(user.id)}
                        >
                            Добавить в друзья
                        </button>
                    )}
                    {getFriendshipStatus(user) === 'pending' && (
                        <span className="status-pending">Запрос отправлен</span>
                    )}
                    {getFriendshipStatus(user) === 'friend' && (
                        <button 
                            className="btn-danger"
                            onClick={() => removeFriend(user.id)}
                        >
                            Удалить из друзей
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const renderRequestCard = (request, isIncoming = false) => (
        <div key={request.id} className="request-card">
            <div className="user-avatar">
                <img src={request.user_avatar || '/default-avatar.png'} alt={request.name} />
            </div>
            <div className="user-info">
                <h4>{request.name}</h4>
                <p>@{request.username}</p>
                <span className="request-time">
                    {new Date(request.created_at).toLocaleDateString('ru-RU')}
                </span>
            </div>
            <div className="request-actions">
                {isIncoming ? (
                    <>
                        <button 
                            className="btn-success"
                            onClick={() => acceptFriendRequest(request.user_id)}
                        >
                            Принять
                        </button>
                        <button 
                            className="btn-danger"
                            onClick={() => rejectFriendRequest(request.user_id)}
                        >
                            Отклонить
                        </button>
                    </>
                ) : (
                    <span className="status-pending">Ожидает ответа</span>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="friends-loading">
                <h3>Загрузка...</h3>
            </div>
        );
    }

    return (
        <div className="friends-container">
            <div className="friends-header">
                <h2>Друзья</h2>
                <div className="friends-tabs">
                    <button 
                        className={activeTab === 'friends' ? 'active' : ''}
                        onClick={() => setActiveTab('friends')}
                    >
                        Друзья ({friends.length})
                    </button>
                    <button 
                        className={activeTab === 'requests' ? 'active' : ''}
                        onClick={() => setActiveTab('requests')}
                    >
                        Запросы ({incomingRequests.length})
                    </button>
                    <button 
                        className={activeTab === 'search' ? 'active' : ''}
                        onClick={() => setActiveTab('search')}
                    >
                        Поиск
                    </button>
                </div>
            </div>

            <div className="friends-content">
                {activeTab === 'friends' && (
                    <div className="friends-list">
                        {friends.length === 0 ? (
                            <p className="empty-state">У вас пока нет друзей</p>
                        ) : (
                            friends.map(friend => renderUserCard(friend, false))
                        )}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="requests-section">
                        <div className="incoming-requests">
                            <h3>Входящие запросы ({incomingRequests.length})</h3>
                            {incomingRequests.length === 0 ? (
                                <p className="empty-state">Нет входящих запросов</p>
                            ) : (
                                incomingRequests.map(request => renderRequestCard(request, true))
                            )}
                        </div>

                        <div className="outgoing-requests">
                            <h3>Исходящие запросы ({outgoingRequests.length})</h3>
                            {outgoingRequests.length === 0 ? (
                                <p className="empty-state">Нет исходящих запросов</p>
                            ) : (
                                outgoingRequests.map(request => renderRequestCard(request, false))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="search-section">
                        <div className="search-input">
                            <input
                                type="text"
                                placeholder="Поиск пользователей..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <div className="search-results">
                            {searchResults.length === 0 && searchQuery.length >= 2 ? (
                                <p className="empty-state">Пользователи не найдены</p>
                            ) : (
                                searchResults.map(user => renderUserCard(user))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Friends;
