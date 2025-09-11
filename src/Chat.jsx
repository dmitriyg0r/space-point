import { useState } from "react";
import './Chat.css'
import '@fontsource/jura';
import Sidebar from './components/Sidebar'
import { Profile } from 'svg-by-dreamsoftware';
import ChatList from "./components/ChatList";



function Chat() {
    return (
        <div className="Chat-page">
            <Sidebar/>
            <ChatList/>
        </div>
    )
    
}


export default Chat;