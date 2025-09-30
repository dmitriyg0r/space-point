import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🌐 СЕРВЕР ЗАПУЩЕН');
  console.log('='.repeat(60));
  console.log(`📍 Порт: ${PORT}`);
  console.log(`🔗 Тест: http://localhost:${PORT}/api/test`);
  console.log(`🔗 Регистрация: http://localhost:${PORT}/api/auth/register`);
  console.log('='.repeat(60));
});


