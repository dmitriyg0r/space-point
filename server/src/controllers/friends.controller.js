import pool from '../config/database.js';

// Получить список друзей
export async function getFriends(req, res) {
  const userId = req.user.id;
  const { status = 'accepted' } = req.query;

  try {
    const friends = await pool.query(`
      SELECT 
        f.id,
        f.status,
        f.created_at,
        u.id as friend_id,
        u.name,
        u.username,
        u.user_avatar,
        u.is_online,
        u.lastlogin_at
      FROM friends f
      INNER JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1 AND f.status = $2
      ORDER BY u.is_online DESC, u.name ASC
    `, [userId, status]);

    res.json({
      success: true,
      friends: friends.rows
    });
  } catch (error) {
    console.error('Ошибка получения друзей:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении списка друзей' 
    });
  }
}

// Отправить запрос в друзья
export async function sendFriendRequest(req, res) {
  const { friendId } = req.params;
  const userId = req.user.id;

  if (userId === parseInt(friendId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Нельзя добавить себя в друзья' 
    });
  }

  try {
    // Проверяем, существует ли уже запрос
    const existingRequest = await pool.query(`
      SELECT id, status FROM friends 
      WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
    `, [userId, friendId]);

    if (existingRequest.rows.length > 0) {
      const request = existingRequest.rows[0];
      if (request.status === 'accepted') {
        return res.status(409).json({ 
          success: false, 
          message: 'Пользователь уже в друзьях' 
        });
      } else if (request.status === 'pending') {
        return res.status(409).json({ 
          success: false, 
          message: 'Запрос в друзья уже отправлен' 
        });
      } else if (request.status === 'blocked') {
        return res.status(403).json({ 
          success: false, 
          message: 'Пользователь заблокирован' 
        });
      }
    }

    // Создаем запрос в друзья
    await pool.query(`
      INSERT INTO friends (user_id, friend_id, status)
      VALUES ($1, $2, 'pending')
    `, [userId, friendId]);

    res.json({
      success: true,
      message: 'Запрос в друзья отправлен'
    });
  } catch (error) {
    console.error('Ошибка отправки запроса в друзья:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при отправке запроса в друзья' 
    });
  }
}

// Принять запрос в друзья
export async function acceptFriendRequest(req, res) {
  const { friendId } = req.params;
  const userId = req.user.id;

  try {
    // Находим запрос от друга
    const request = await pool.query(`
      SELECT id, status FROM friends 
      WHERE user_id = $1 AND friend_id = $2
    `, [friendId, userId]);

    if (request.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Запрос в друзья не найден' 
      });
    }

    if (request.rows[0].status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Запрос уже обработан' 
      });
    }

    // Обновляем статус запроса
    await pool.query(`
      UPDATE friends 
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND friend_id = $2
    `, [friendId, userId]);

    res.json({
      success: true,
      message: 'Запрос в друзья принят'
    });
  } catch (error) {
    console.error('Ошибка принятия запроса в друзья:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при принятии запроса в друзья' 
    });
  }
}

// Отклонить запрос в друзья
export async function rejectFriendRequest(req, res) {
  const { friendId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      DELETE FROM friends 
      WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
    `, [friendId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Запрос в друзья не найден' 
      });
    }

    res.json({
      success: true,
      message: 'Запрос в друзья отклонен'
    });
  } catch (error) {
    console.error('Ошибка отклонения запроса в друзья:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при отклонении запроса в друзья' 
    });
  }
}

// Удалить из друзей
export async function removeFriend(req, res) {
  const { friendId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      DELETE FROM friends 
      WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
    `, [userId, friendId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден в друзьях' 
      });
    }

    res.json({
      success: true,
      message: 'Пользователь удален из друзей'
    });
  } catch (error) {
    console.error('Ошибка удаления из друзей:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении из друзей' 
    });
  }
}

// Получить входящие запросы в друзья
export async function getIncomingRequests(req, res) {
  const userId = req.user.id;

  try {
    const requests = await pool.query(`
      SELECT 
        f.id,
        f.created_at,
        u.id as user_id,
        u.name,
        u.username,
        u.user_avatar,
        u.is_online
      FROM friends f
      INNER JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      requests: requests.rows
    });
  } catch (error) {
    console.error('Ошибка получения входящих запросов:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении входящих запросов' 
    });
  }
}

// Получить исходящие запросы в друзья
export async function getOutgoingRequests(req, res) {
  const userId = req.user.id;

  try {
    const requests = await pool.query(`
      SELECT 
        f.id,
        f.created_at,
        u.id as friend_id,
        u.name,
        u.username,
        u.user_avatar,
        u.is_online
      FROM friends f
      INNER JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      requests: requests.rows
    });
  } catch (error) {
    console.error('Ошибка получения исходящих запросов:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении исходящих запросов' 
    });
  }
}

// Поиск пользователей для добавления в друзья
export async function searchUsers(req, res) {
  const { query } = req.query;
  const userId = req.user.id;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ 
      success: false, 
      message: 'Поисковый запрос должен содержать минимум 2 символа' 
    });
  }

  try {
    const users = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.user_avatar,
        u.is_online,
        f.status as friendship_status
      FROM users u
      LEFT JOIN friends f ON (
        (f.user_id = $1 AND f.friend_id = u.id) OR 
        (f.friend_id = $1 AND f.user_id = u.id)
      )
      WHERE u.id != $1 
        AND (u.name ILIKE $2 OR u.username ILIKE $2)
      ORDER BY u.is_online DESC, u.name ASC
      LIMIT 20
    `, [userId, `%${query.trim()}%`]);

    res.json({
      success: true,
      users: users.rows
    });
  } catch (error) {
    console.error('Ошибка поиска пользователей:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при поиске пользователей' 
    });
  }
}
