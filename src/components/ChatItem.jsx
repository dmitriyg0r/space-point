import { useState } from 'react'
import * as icons from "svg-by-dreamsoftware/icons-react-dist";
import './ChatItems.css'

const ChatItem = ({user, onClick, isSelected}) => {
    return (
        <div className={`chat-item ${isSelected ? 'chat-item--selected' : ''}`} onclick={onClick}>

        </div>
    );
};

export default ChatItem;