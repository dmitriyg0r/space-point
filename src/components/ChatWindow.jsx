import { useState, useEffect } from 'react';
import './ChatWindow.css';
import axios from 'axios';

const ChatWindow = ({ user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Загрузка сообщений при выборе пользователя
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/chat/messages');
                setMessages(response.data.messages);
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [user]);

    // Отправка нового сообщения
    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await axios.post('http://localhost:5000/api/chat/messages', {
                user_id: user.id,
                message: newMessage.trim()
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

    return (
        <div className="chat-window">
            <div className="chat-window-header">
                <div className="chat-window-user">
                    <img src={user.avatar} alt={user.name} />
                    <div>
                        <h3>{user.name}</h3>
                        <span className="user-status">
                            {user.isOnline ? 'online' : 'offline'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="chat-window-messages">
                {loading ? (
                    <div className="messages-loading">Загрузка сообщений...</div>
                ) : (
                    messages.map(message => (
                        <div key={message.id} className="message">
                            <div className="message-content">
                                <p>{message.message}</p>
                                <span className="message-time">
                                    {new Date(message.timestamp).toLocaleTimeString()}
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