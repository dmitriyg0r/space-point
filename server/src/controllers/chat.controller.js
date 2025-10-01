import pool from '../config/database.js';

// Получить всех пользователей для чата
export async function getUsers(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        username,
        user_avatar,
        is_online,
        lastlogin_at
      FROM users 
      WHERE id != $1
      ORDER BY is_online DESC, name ASC
    `, [req.user.id]);

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении пользователей' 
    });
  }
}

// Создать или получить приватный чат
export async function getOrCreatePrivateChat(req, res) {
  const { friendId } = req.params;
  const userId = req.user.id;

  try {
    // Проверяем, существует ли уже приватный чат между пользователями
    const existingChat = await pool.query(`
      SELECT c.id, c.title, c.created_at
      FROM chats c
      INNER JOIN chat_members cm1 ON c.id = cm1.chat_id
      INNER JOIN chat_members cm2 ON c.id = cm2.chat_id
      WHERE c.type = 'private' 
        AND cm1.user_id = $1 AND cm2.user_id = $2
        AND cm1.left_at IS NULL AND cm2.left_at IS NULL
    `, [userId, friendId]);

    if (existingChat.rows.length > 0) {
      return res.json({
        success: true,
        chat: existingChat.rows[0]
      });
    }

    // Создаем новый приватный чат
    const chatResult = await pool.query(`
      INSERT INTO chats (type, title, created_by)
      VALUES ('private', 'Private Chat', $1)
      RETURNING id, title, created_at
    `, [userId]);

    const chatId = chatResult.rows[0].id;

    // Добавляем участников в чат
    await pool.query(`
      INSERT INTO chat_members (chat_id, user_id, role)
      VALUES ($1, $2, 'member'), ($1, $3, 'member')
    `, [chatId, userId, friendId]);

    res.json({
      success: true,
      chat: chatResult.rows[0]
    });
  } catch (error) {
    console.error('Ошибка создания чата:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при создании чата' 
    });
  }
}

// Получить сообщения чата
export async function getChatMessages(req, res) {
  const { chatId } = req.params;
  const userId = req.user.id;
  const { page = 1, limit = 50 } = req.query;

  try {
    // Проверяем, является ли пользователь участником чата
    const memberCheck = await pool.query(`
      SELECT id FROM chat_members 
      WHERE chat_id = $1 AND user_id = $2 AND left_at IS NULL
    `, [chatId, userId]);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'У вас нет доступа к этому чату' 
      });
    }

    const offset = (page - 1) * limit;

    const messages = await pool.query(`
      SELECT 
        m.id,
        m.text,
        m.created_at,
        m.is_edited,
        m.is_deleted,
        m.reply_to_id,
        u.id as user_id,
        u.name,
        u.username,
        u.user_avatar
      FROM messages m
      INNER JOIN users u ON m.user_id = u.id
      WHERE m.chat_id = $1 AND m.is_deleted = false
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [chatId, limit, offset]);

    res.json({
      success: true,
      messages: messages.rows.reverse() // Возвращаем в хронологическом порядке
    });
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении сообщений' 
    });
  }
}

// Отправить сообщение
export async function sendMessage(req, res) {
  const { chatId } = req.params;
  const { text, replyToId } = req.body;
  const userId = req.user.id;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Текст сообщения не может быть пустым' 
    });
  }

  try {
    // Проверяем, является ли пользователь участником чата
    const memberCheck = await pool.query(`
      SELECT id FROM chat_members 
      WHERE chat_id = $1 AND user_id = $2 AND left_at IS NULL
    `, [chatId, userId]);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'У вас нет доступа к этому чату' 
      });
    }

    const result = await pool.query(`
      INSERT INTO messages (chat_id, user_id, text, reply_to_id)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        text,
        created_at,
        reply_to_id
    `, [chatId, userId, text.trim(), replyToId || null]);

    // Получаем информацию о пользователе для ответа
    const userInfo = await pool.query(`
      SELECT id, name, username, user_avatar
      FROM users
      WHERE id = $1
    `, [userId]);

    res.json({
      success: true,
      message: {
        ...result.rows[0],
        user: userInfo.rows[0]
      }
    });
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при отправке сообщения' 
    });
  }
}

// Получить чаты пользователя
export async function getUserChats(req, res) {
  const userId = req.user.id;

  try {
    const chats = await pool.query(`
      SELECT DISTINCT
        c.id,
        c.type,
        c.title,
        c.avatar_url,
        c.created_at,
        c.updated_at,
        (
          SELECT text 
          FROM messages 
          WHERE chat_id = c.id AND is_deleted = false 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at 
          FROM messages 
          WHERE chat_id = c.id AND is_deleted = false 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message_time
      FROM chats c
      INNER JOIN chat_members cm ON c.id = cm.chat_id
      WHERE cm.user_id = $1 AND cm.left_at IS NULL
      ORDER BY last_message_time DESC NULLS LAST, c.updated_at DESC
    `, [userId]);

    res.json({
      success: true,
      chats: chats.rows
    });
  } catch (error) {
    console.error('Ошибка получения чатов:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении чатов' 
    });
  }
}
