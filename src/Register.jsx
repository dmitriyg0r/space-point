import { useState, useEffect, useCallback } from 'react'
import '@fontsource/jura';
import * as icons from "svg-by-dreamsoftware/icons-react-dist";
import Regcont from'./components/Regcont.jsx'
import Sidebar from './components/Sidebar'
import UserProfile from './components/UserProfile';

function Register() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  console.log('Register render - isAuthenticated:', isAuthenticated, 'currentUser:', currentUser);

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
    console.log('🚀 Register handleLogin вызвана с пользователем:', user);
    console.log('🔄 Устанавливаем currentUser и isAuthenticated');
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
    console.log('✅ Register handleLogin завершена');
  }, []);

  // Функция для выхода из системы
  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  // Если пользователь не аутентифицирован, показываем форму входа/регистрации
  if (!isAuthenticated) {
    console.log('Register передает onLogin в Regcont:', typeof handleLogin, handleLogin);
    return (
      <div className='Register-page'>
        <Regcont onLogin={handleLogin} />
      </div>
    );
  }

  // Если пользователь аутентифицирован, показываем основное приложение
  return (
    <div className='Profile-page'>
      <Sidebar currentUser={currentUser} onLogout={handleLogout} />
      <UserProfile currentUser={currentUser} />
    </div>
  )
}

export default Register;
