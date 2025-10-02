import app from './app.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

// Socket.IO
export const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:5173', 
      'http://127.0.0.1:5173',
      'http://172.20.10.4:5173', // Ваш IP адрес
      /^http:\/\/172\.20\.10\.\d+:5173$/, // Разрешить любой IP в сети 172.20.10.x
      /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Разрешить сеть 192.168.x.x
      /^http:\/\/10\.\d+\.\d+\.\d+:5173$/ // Разрешить сеть 10.x.x.x
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['x-user-id', 'content-type', 'authorization', 'x-requested-with', 'accept', 'origin'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  // Аутентификация по заголовку/параметру
  const userId = socket.handshake.auth?.userId || socket.handshake.headers['x-user-id'];
  console.log(`🔌 New WebSocket connection attempt. User ID: ${userId}, Socket ID: ${socket.id}`);
  
  if (!userId) {
    console.log('❌ WebSocket connection rejected: no user ID');
    socket.disconnect(true);
    return;
  }

  socket.data.userId = String(userId);
  console.log(`✅ WebSocket connection established for user ${userId}`);

  // Присоединение к комнатам чатов
  socket.on('chat:join', (chatId) => {
    if (chatId) {
      socket.join(`chat:${chatId}`);
      console.log(`👥 User ${userId} joined chat room: chat:${chatId}`);
      
      // Проверяем сколько пользователей в комнате
      const roomSize = io.sockets.adapter.rooms.get(`chat:${chatId}`)?.size || 0;
      console.log(`📊 Room chat:${chatId} now has ${roomSize} users`);
    }
  });

  socket.on('chat:leave', (chatId) => {
    if (chatId) {
      socket.leave(`chat:${chatId}`);
      console.log(`👋 User ${userId} left chat room: chat:${chatId}`);
    }
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

  // Обработка отключения
  socket.on('disconnect', (reason) => {
    console.log(`🔌 User ${userId} disconnected: ${reason}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🌐 СЕРВЕР ЗАПУЩЕН');
  console.log('='.repeat(60));
  console.log(`📍 Порт: ${PORT}`);
  console.log(`🔗 Локально: http://localhost:${PORT}/api/test`);
  console.log(`🔗 По сети: http://172.20.10.4:${PORT}/api/test`);
  console.log(`🔗 Регистрация: http://172.20.10.4:${PORT}/api/auth/register`);
  console.log('='.repeat(60));
});


