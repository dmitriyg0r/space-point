import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { mockUsers, mockMessages } from './data/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.join(__dirname, '..', '.env')
});

const app = express();
const PORT = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());

// Исправлено: добавлен слэш в начале пути
app.get('/api/chat/users', (req, res) => {
    res.json({
        success: true,
        users: mockUsers
    });
});

app.get('/api/chat/messages', (req, res) => {
    const messagesWithUsers = mockMessages.map(message => {
        const user = mockUsers.find(u => u.id === message.user_id);
        return {
            id: message.id,
            message: message.message,
            timestamp: message.timestamp,
            room: message.room,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
                isOnline: user.isOnline 
            }
        }     
    });
    res.json({
        success: true,
        messages: messagesWithUsers 
    });
});

// Отправить новое сообщение
app.post('/api/chat/messages', (req, res) => {
    const { user_id, message, room = 'general' } = req.body;
    
    if (!user_id || !message) {
        return res.status(400).json({
            success: false,
            message: 'user_id и message обязательны'
        });
    }
    
    const user = mockUsers.find(u => u.id === user_id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Пользователь не найден'
        });
    }
    
    const newMessage = {
        id: (mockMessages.length + 1).toString(),
        user_id: user_id,   
        message: message,
        room: room,
        timestamp: new Date().toISOString()
    };
    
    mockMessages.push(newMessage);
    
    res.status(201).json({
        success: true,
        message: {
            id: newMessage.id,
            message: newMessage.message,
            timestamp: newMessage.timestamp,
            room: newMessage.room,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
                isOnline: user.isOnline
            }
        }
    });
});

// ======================
// ОСТАЛЬНОЙ КОД (health, ошибки и т.д.)
// ======================
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true,
        message: '✅ Сервер работает корректно',
        timestamp: new Date().toISOString(),
        usersCount: mockUsers.length,
        messagesCount: mockMessages.length
    });
});

// ИСПРАВЛЕННЫЙ ОБРАБОТЧИК 404
// Используем регулярное выражение вместо '*'
app.use(/.*/, (req, res) => {
    res.status(404).json({
        success: false,
        message: '❌ endpoint не найден',
        requestedUrl: req.originalUrl
    });
});

app.use((error, req, res, next) => {
    console.error('💥 Ошибка сервера:', error);
    res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
    });
});

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🌐 СЕРВЕР ЗАПУЩЕН');
    console.log('='.repeat(60));
    console.log(`📍 Порт: ${PORT}`);
    console.log(`👥 Пользователей: ${mockUsers.length}`);
    console.log(`💬 Сообщений: ${mockMessages.length}`);
    console.log('='.repeat(60));
});

export default app;