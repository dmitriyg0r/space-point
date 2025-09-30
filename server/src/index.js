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

// Настройка CORS для разрешения запросов с фронтенда
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'], // Vite dev server
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Логирование всех запросов для отладки
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
    next();
});

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

// Функция для транслитерации русского текста в английский
function transliterate(text) {
    const translitMap = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
        ' ': '_', '-': '_'
    };
    
    return text.split('').map(char => translitMap[char] || char).join('');
}

// Функция для генерации уникального username
function generateUsername(name) {
    // Транслитерируем имя
    let username = transliterate(name.toLowerCase());
    
    // Убираем все символы кроме букв, цифр и подчеркиваний
    username = username.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Если username пустой после очистки, используем default
    if (!username) {
        username = 'user';
    }
    
    // Добавляем 5 случайных цифр
    const randomNumbers = Math.floor(10000 + Math.random() * 90000);
    username += randomNumbers;
    
    return username;
}

// Регистрация нового пользователя
app.post('/api/auth/register', async (req, res) => {
    const { name, login, email, password, user_avatar, profile_info } = req.body;
    
    // Валидация обязательных полей
    if (!name || !login || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Имя, логин, email и пароль обязательны'
        });
    }

    // Валидация логина (только английские буквы, цифры и подчеркивания)
    const loginRegex = /^[a-zA-Z0-9_]+$/;
    if (!loginRegex.test(login)) {
        return res.status(400).json({
            success: false,
            message: 'Логин должен содержать только английские буквы, цифры и подчеркивания'
        });
    }

    // Валидация длины логина
    if (login.length < 3 || login.length > 20) {
        return res.status(400).json({
            success: false,
            message: 'Логин должен содержать от 3 до 20 символов'
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

        // Генерируем уникальный username из имени
        let username = generateUsername(name);
        
        // Проверяем уникальность username и генерируем новый если нужно
        let usernameExists = true;
        let attempts = 0;
        while (usernameExists && attempts < 10) {
            const existingUsername = await global.pool.query(`
                SELECT id FROM users WHERE username = $1
            `, [username]);
            
            if (existingUsername.rows.length === 0) {
                usernameExists = false;
            } else {
                // Генерируем новый username
                username = generateUsername(name);
                attempts++;
            }
        }

        // Проверяем, существует ли пользователь с таким логином или email
        const existingUser = await global.pool.query(`
            SELECT id FROM users 
            WHERE email = $1
        `, [email]);

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Пользователь с таким email уже существует'
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
                login: login, // Возвращаем введенный логин для отображения
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
                message: 'Пользователь с таким email уже существует'
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