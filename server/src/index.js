console.log('🚀 Запуск сервера...');

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('📦 Базовые импорты загружены');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📁 Пути настроены');

dotenv.config({
    path: path.join(__dirname, '..', '.env')
});

console.log('⚙️ dotenv настроен');

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

console.log('🛣️ Маршруты настроены');

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🌐 СЕРВЕР ЗАПУЩЕН');
    console.log('='.repeat(60));
    console.log(`📍 Порт: ${PORT}`);
    console.log(`🔗 Тест: http://localhost:${PORT}/api/test`);
    console.log('='.repeat(60));
});

console.log('🎯 Сервер настроен и запускается...');