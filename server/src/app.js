import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import pool from './config/database.js';

// middleware
import corsMiddleware from './middleware/cors.js';
import requestLogger from './middleware/logger.js';

// routes
import authRoutes from './routes/auth.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, '..', '.env')
});

const app = express();

// built-ins
app.use(express.json());

// cors
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// custom middleware
app.use(corsMiddleware);
app.use(requestLogger);

// health/test
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Сервер работает!', timestamp: new Date().toISOString() });
});

// feature routes
app.use('/api/auth', authRoutes);

export default app;


