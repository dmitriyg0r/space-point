import { useState, useEffect, useCallback, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import '@fontsource/jura';
import './App.css'
import Sidebar from './components/Sidebar'
import UserProfile from './components/UserProfile';
import Regcont from './components/Regcont';
import Starfield from './components/Starfield'; // Импортируем компонент звезд
import Chat from './Chat';
import Friends from './components/Friends';
import { SERVER_URL } from './config.js';
import { io as socketIOClient } from 'socket.io-client';

// Глобальная функция для входа (временное решение)
window.handleGlobalLogin = null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const statusSocketRef = useRef(null);

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
    // Отключаем WebSocket перед выходом
    if (statusSocketRef.current) {
      statusSocketRef.current.disconnect();
      statusSocketRef.current = null;
    }
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  // Глобальное WebSocket соединение для отслеживания статуса
  useEffect(() => {
    if (currentUser && isAuthenticated && !statusSocketRef.current) {
      console.log('🌐 Initializing global status socket for user:', currentUser.id);
      
      const socket = socketIOClient(SERVER_URL, {
        transports: ['websocket', 'polling'],
        auth: { userId: currentUser.id },
        timeout: 10000,
        forceNew: false
      });

      socket.on('connect', () => {
        console.log('📡 Global status socket connected');
      });

      socket.on('disconnect', (reason) => {
        console.log('📡 Global status socket disconnected:', reason);
      });

      // Обработчик изменения статуса других пользователей
      socket.on('user:status', ({ userId, isOnline, timestamp }) => {
        console.log(`👤 User ${userId} status changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
        // Здесь можно добавить глобальное обновление статусов если нужно
      });

      statusSocketRef.current = socket;
    }

    return () => {
      if (!isAuthenticated && statusSocketRef.current) {
        statusSocketRef.current.disconnect();
        statusSocketRef.current = null;
      }
    };
  }, [currentUser, isAuthenticated]);

  // Обработчик закрытия страницы/вкладки
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (statusSocketRef.current) {
        // Отправляем событие о том, что пользователь уходит
        statusSocketRef.current.emit('user:leaving');
        statusSocketRef.current.disconnect();
      }
    };

    const handleVisibilityChange = () => {
      if (statusSocketRef.current) {
        if (document.hidden) {
          // Пользователь переключился на другую вкладку
          console.log('👁️ User switched to another tab');
        } else {
          // Пользователь вернулся на вкладку
          console.log('👁️ User returned to tab');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
        <Routes>
          <Route path="/" element={<UserProfile currentUser={currentUser} />} />
          <Route path="/profile" element={<UserProfile currentUser={currentUser} />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/friends" element={<Friends currentUser={currentUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App