console.log('🚀 Запуск сервера...');

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

console.log('📦 Базовые импорты загружены');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📁 Пути настроены');

dotenv.config({
    path: path.join(__dirname, '..', '.env')
});

console.log('⚙️ dotenv настроен');

// Импорт базы данных
import('./config/database.js').then(({ default: pool }) => {
    global.pool = pool;
    console.log('🗄️ База данных подключена');
}).catch(err => {
    console.error('❌ Ошибка подключения к базе данных:', err.message);
});

const app = express();
const PORT = process.env.PORT || 3001; 

console.log('🌐 Express приложение создано');

app.use(cors());
app.use(express.json());

console.log('🔧 Middleware настроен');

// Простой тестовый эндпоинт
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Сервер работает!',
        timestamp: new Date().toISOString()
    });
});

// Регистрация нового пользователя
app.post('/api/auth/register', async (req, res) => {
    const { name, username, email, password, user_avatar, profile_info } = req.body;
    
    // Валидация обязательных полей
    if (!name || !username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Имя, username, email и пароль обязательны'
        });
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Некорректный формат email'
        });
    }

    // Валидация пароля (минимум 6 символов)
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Пароль должен содержать минимум 6 символов'
        });
    }

    try {
        if (!global.pool) {
            return res.status(500).json({
                success: false,
                message: 'База данных не подключена'
            });
        }

        // Проверяем, существует ли пользователь с таким username или email
        const existingUser = await global.pool.query(`
            SELECT id FROM users 
            WHERE username = $1 OR email = $2
        `, [username, email]);

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Пользователь с таким username или email уже существует'
            });
        }

        // Хешируем пароль
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Создаем пользователя
        const result = await global.pool.query(`
            INSERT INTO users (name, username, email, password_hash, user_avatar, profile_info, is_online, role)
            VALUES ($1, $2, $3, $4, $5, $6, false, 'user')
            RETURNING 
                id,
                name,
                username,
                email,
                user_avatar,
                profile_info,
                is_online,
                role,
                created_at
        `, [name, username, email, password_hash, user_avatar || null, profile_info || null]);

        const newUser = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Пользователь успешно зарегистрирован',
            user: {
                id: newUser.id,
                name: newUser.name,
                username: newUser.username,
                email: newUser.email,
                user_avatar: newUser.user_avatar,
                profile_info: newUser.profile_info,
                role: newUser.role,
                created_at: newUser.created_at
            }
        });
    } catch (error) {
        console.error('Ошибка регистрации пользователя:', error);
        
        // Обработка специфичных ошибок PostgreSQL
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({
                success: false,
                message: 'Пользователь с таким username или email уже существует'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера при регистрации'
        });
    }
});

console.log('🛣️ Маршруты настроены');

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🌐 СЕРВЕР ЗАПУЩЕН');
    console.log('='.repeat(60));
    console.log(`📍 Порт: ${PORT}`);
    console.log(`🔗 Тест: http://localhost:${PORT}/api/test`);
    console.log(`🔗 Регистрация: http://localhost:${PORT}/api/auth/register`);
    console.log('='.repeat(60));
});

console.log('🎯 Сервер настроен и запускается...');