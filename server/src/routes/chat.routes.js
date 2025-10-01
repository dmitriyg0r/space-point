import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getUsers, 
  getOrCreatePrivateChat, 
  getChatMessages, 
  sendMessage, 
  getUserChats,
  markChatRead
} from '../controllers/chat.controller.js';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Получить всех пользователей
router.get('/users', getUsers);

// Получить чаты пользователя
router.get('/chats', getUserChats);

// Создать или получить приватный чат
router.get('/private/:friendId', getOrCreatePrivateChat);

// Получить сообщения чата
router.get('/:chatId/messages', getChatMessages);

// Отправить сообщение
router.post('/:chatId/messages', sendMessage);

// Отметить прочитанное до messageId
router.post('/:chatId/read', markChatRead);

export default router;
