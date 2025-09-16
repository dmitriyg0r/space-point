import React, { useState } from "react";
import './ChatList.css'
import ChatItem from "./ChatItem";

const ChatList = ({ users, onUserSelect}) => {

    const [selectedUserId, setSelectedUserId] = useState(null);
    const  handleUserClick = (user) => {
        setSelectedUserId(user.id);
        onUserSelect(user);
    }    
    return(
        <div className="Chat-list">
            <div className="chat-serch">
                <h3>QUANTUM COMM</h3>
                <div className="chat-serch-button">
                    
                </div>
            </div>

            <div className="chat-list-items">
                {users.map (user => ( 
                    <ChatItem
                      key={user.id}
                      user={user}
                      timetamp={user.timetamp}
                      isSelected={selectedUserId === user.id}
                      onClick={() => handleUserClick(user)}
                    />
                    ))}
            </div>
        </div>
 );
};



export default ChatList;