import app from './app.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

// Socket.IO
export const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['x-user-id', 'content-type', 'authorization', 'x-requested-with', 'accept', 'origin'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  // Аутентификация по заголовку/параметру
  const userId = socket.handshake.auth?.userId || socket.handshake.headers['x-user-id'];
  if (!userId) {
    socket.disconnect(true);
    return;
  }

  socket.data.userId = String(userId);

  // Присоединение к комнатам чатов
  socket.on('chat:join', (chatId) => {
    if (chatId) socket.join(`chat:${chatId}`);
  });

  socket.on('chat:leave', (chatId) => {
    if (chatId) socket.leave(`chat:${chatId}`);
  });

  // Индикатор набора текста
  socket.on('typing:start', ({ chatId }) => {
    if (!chatId) return;
    socket.to(`chat:${chatId}`).emit('typing', { chatId, userId: socket.data.userId, isTyping: true });
  });

  socket.on('typing:stop', ({ chatId }) => {
    if (!chatId) return;
    socket.to(`chat:${chatId}`).emit('typing', { chatId, userId: socket.data.userId, isTyping: false });
  });

  // Отметка о прочтении
  socket.on('message:read', ({ chatId, messageId }) => {
    if (!chatId || !messageId) return;
    socket.to(`chat:${chatId}`).emit('message:read', { chatId, messageId, readerId: socket.data.userId, readAt: new Date().toISOString() });
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🌐 СЕРВЕР ЗАПУЩЕН');
  console.log('='.repeat(60));
  console.log(`📍 Порт: ${PORT}`);
  console.log(`🔗 Тест: http://localhost:${PORT}/api/test`);
  console.log(`🔗 Регистрация: http://localhost:${PORT}/api/auth/register`);
  console.log('='.repeat(60));
});


