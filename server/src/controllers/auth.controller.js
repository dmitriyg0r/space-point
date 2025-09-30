import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { generateUsername } from '../utils/generateUsername.js';

export async function register(req, res) {
  const { name, email, password, user_avatar, profile_info } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Имя, email и пароль обязательны' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Некорректный формат email' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Пароль должен содержать минимум 6 символов' });
  }

  try {
    let username = generateUsername(name);

    let usernameExists = true;
    let attempts = 0;
    while (usernameExists && attempts < 10) {
      const existingUsername = await pool.query(`
                SELECT id FROM users WHERE username = $1
            `, [username]);

      if (existingUsername.rows.length === 0) {
        usernameExists = false;
      } else {
        username = generateUsername(name);
        attempts++;
      }
    }

    const existingUser = await pool.query(`
            SELECT id FROM users 
            WHERE email = $1
        `, [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Пользователь с таким email уже существует' });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(`
            INSERT INTO users (name, username, email, password_hash, user_avatar, profile_info, is_online, role)
            VALUES ($1, $2, $3, $4, $5, $6, false, 'user')
            RETURNING 
                id,
                name,
                username,
                email,
                user_avatar,
                profile_info,
                is_online,
                role,
                created_at
        `, [name, username, email, password_hash, user_avatar || null, profile_info || null]);

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        user_avatar: newUser.user_avatar,
        profile_info: newUser.profile_info,
        role: newUser.role,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Ошибка регистрации пользователя:', error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Пользователь с таким email уже существует' });
    }
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера при регистрации' });
  }
}

export async function login(req, res) {
  // eslint-disable-next-line no-console
  console.log('🔐 Попытка входа в систему');
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ success: false, message: 'Логин и пароль обязательны' });
  }

  try {
    const userResult = await pool.query(`
            SELECT 
                id,
                name,
                username,
                email,
                password_hash,
                user_avatar,
                profile_info,
                is_online,
                role,
                created_at
            FROM users 
            WHERE username = $1 OR email = $1
        `, [login]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }

    await pool.query(`
            UPDATE users 
            SET is_online = true, lastlogin_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [user.id]);

    res.json({
      success: true,
      message: 'Успешный вход в систему',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        user_avatar: user.user_avatar,
        profile_info: user.profile_info,
        role: user.role,
        is_online: true,
        created_at: user.created_at
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('💥 Ошибка входа в систему:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера при входе' });
  }
}


