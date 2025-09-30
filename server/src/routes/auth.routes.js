import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = Router();

router.get('/register', (req, res) => {
  res.json({
    success: false,
    message: 'Используйте POST запрос для регистрации',
    method: 'POST',
    endpoint: '/api/auth/register',
    requiredFields: ['name', 'email', 'password']
  });
});

router.post('/register', register);
router.post('/login', login);

export default router;


