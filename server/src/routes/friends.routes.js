import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getIncomingRequests,
  getOutgoingRequests,
  searchUsers
} from '../controllers/friends.controller.js';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Получить список друзей
router.get('/', getFriends);

// Поиск пользователей
router.get('/search', searchUsers);

// Получить входящие запросы
router.get('/requests/incoming', getIncomingRequests);

// Получить исходящие запросы
router.get('/requests/outgoing', getOutgoingRequests);

// Отправить запрос в друзья
router.post('/:friendId/request', sendFriendRequest);

// Принять запрос в друзья
router.post('/:friendId/accept', acceptFriendRequest);

// Отклонить запрос в друзья
router.post('/:friendId/reject', rejectFriendRequest);

// Удалить из друзей
router.delete('/:friendId', removeFriend);

export default router;
