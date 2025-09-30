import { useEffect, useState } from "react";
import './Chat.css'
import '@fontsource/jura';
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import axios from "axios";


const Chat = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/chat/users');
                setUsers(response.data.users);

            } catch (err) {
                setError('Ошибка при загрузке пользователей');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();

    }, []);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
    };

    if (loading) {
        return (
            <div className="chat-loading">
                <h3>Загрузка чатов...</h3>
            </div>
        )
    }

    if (error) {
        return (
            <div className="chat-error">
                <h3>{error}</h3>
                <button onClick={() => window.location.reload()}>Попробовать снова</button>
            </div>
        )
    }
    return (
        <>
            <ChatList users={users} onUserSelect={handleUserSelect} />
            {selectedUser ? (
                <ChatWindow user={selectedUser} />
            ) : (
                <div className="chat-page-placeholder">
                    <h3>Выберите чат чтобы начать общение</h3>
                </div>
            )}
        </>
    );
};


export default Chat;