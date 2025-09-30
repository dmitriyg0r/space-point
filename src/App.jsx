import { useState, useEffect, useCallback } from 'react'
import '@fontsource/jura';
import './App.css'
import Sidebar from './components/Sidebar'
import UserProfile from './components/UserProfile';
import Regcont from './components/Regcont';
import Starfield from './components/Starfield'; // Импортируем компонент звезд

// Глобальная функция для входа (временное решение)
window.handleGlobalLogin = null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  console.log('App render - isAuthenticated:', isAuthenticated, 'currentUser:', currentUser);

  // Проверяем, есть ли сохраненная сессия при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Ошибка при загрузке пользователя из localStorage:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Функция для входа в систему
  const handleLogin = useCallback((user) => {
    console.log('🚀 handleLogin вызвана с пользователем:', user);
    console.log('🔄 Устанавливаем currentUser и isAuthenticated');
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
    console.log('✅ handleLogin завершена');
  }, []);

  // Устанавливаем глобальную функцию
  useEffect(() => {
    window.handleGlobalLogin = handleLogin;
  }, [handleLogin]);

  // Функция для выхода из системы
  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  // Если пользователь не аутентифицирован, показываем форму входа/регистрации
  if (!isAuthenticated) {
    console.log('App передает onLogin в Regcont:', typeof handleLogin, handleLogin);
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <Starfield />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Regcont onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  // Если пользователь аутентифицирован, показываем основное приложение
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <Starfield />
      <div className='Profile-page' style={{ position: 'relative', zIndex: 1 }}>
        <Sidebar currentUser={currentUser} onLogout={handleLogout} />
        <UserProfile currentUser={currentUser} />
      </div>
    </div>
  )
}

export default App