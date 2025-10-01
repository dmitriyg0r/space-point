import pool from '../config/database.js';

export async function authenticateToken(req, res, next) {
  try {
    // В реальном приложении здесь должна быть проверка JWT токена
    // Для простоты используем userId из заголовка
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'ID пользователя не предоставлен' 
      });
    }

    // Проверяем, существует ли пользователь
    const user = await pool.query(`
      SELECT id, name, username, email, user_avatar, is_online, role
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (user.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка аутентификации' 
    });
  }
}
