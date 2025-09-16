import { useState } from "react";
import './Chat.css'
import '@fontsource/jura';
import Sidebar from './components/Sidebar'
import { Profile } from 'svg-by-dreamsoftware';
import ChatList from "./components/ChatList";
import { mockUsers } from './Data/mockUsers';



const Chat = () => {
    const [selectedUser, setSelectedUser] = useState(null);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
    };
    return (
        <div className="Chat-page">
            <Sidebar/>
            <ChatList users={mockUsers} onUserSelect={handleUserSelect}/>

        </div>
    

  );    
};


export default Chat;