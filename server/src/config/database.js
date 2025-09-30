import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: '45.91.238.3',
    port: 5432,
    database: 'space_point',
    user: 'postgres',
    password: 'sGLTccA_Na#9zC',
    ssl: false, // Измените на true если требуется SSL
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Тестирование подключения
pool.on('connect', () => {
    console.log('✅ Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
    console.error('❌ Ошибка подключения к PostgreSQL:', err);
});

export default pool;