import { useState } from "react";
import './Chat.css'
import '@fontsource/jura';
import Sidebar from './components/Sidebar'
import { Profile } from 'svg-by-dreamsoftware';



function Chat() {
    return (
        <div className="Chat-page">
            <Sidebar/>
        </div>
    )
    
}


export default Chat