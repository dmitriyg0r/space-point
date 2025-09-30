import './Regcont.css';
import logoImage from '../assets/logo.png';
import { useState } from 'react';
import axios from 'axios';

// Конфигурация API
const API_BASE_URL = 'http://localhost:3001/api';

function Regcont(props) {
  console.log('Regcont получил props:', props);
  const { onLogin } = props;
  console.log('Regcont получил onLogin:', typeof onLogin, onLogin);
  
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [loginData, setLoginData] = useState({
    login: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegisterClick = () => {
    setIsRegisterModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRegisterModalOpen(false);
    setError('');
    setSuccess('');
    // Очищаем форму при закрытии
    setRegisterData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!loginData.login || !loginData.password) {
      setError('Пожалуйста, заполните все поля!');
      return;
    }

    setIsLoading(true);

    try {
      // Отправляем запрос на вход
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        login: loginData.login,
        password: loginData.password
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      if (response.data.success) {
        // Детальный лог входа
        console.group('🔐 ВХОД В СИСТЕМУ');
        console.log('📅 Время входа:', new Date().toLocaleString('ru-RU'));
        console.log('👤 Пользователь:', response.data.user.name);
        console.log('✅ Статус:', 'Успешный вход');
        console.log('👋 Добро пожаловать,', response.data.user.name + '!');
        console.groupEnd();

        // Вызываем функцию входа из родительского компонента
        console.log('🔍 Проверяем функции входа...');
        console.log('onLogin type:', typeof onLogin);
        console.log('window.handleGlobalLogin type:', typeof window.handleGlobalLogin);
        
        if (typeof onLogin === 'function') {
          console.log('✅ Используем onLogin из пропсов');
          onLogin(response.data.user);
        } else if (typeof window.handleGlobalLogin === 'function') {
          console.log('✅ Используем глобальную функцию входа');
          window.handleGlobalLogin(response.data.user);
        } else {
          console.error('❌ Ни одна функция входа не доступна');
          console.error('onLogin:', onLogin);
          console.error('Все пропсы:', props);
          // Временное решение - сохраняем пользователя в localStorage и перезагружаем страницу
          console.log('🔄 Перезагружаем страницу...');
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === 'ECONNREFUSED') {
        setError('Не удается подключиться к серверу. Проверьте, что сервер запущен.');
      } else {
        setError('Неверный логин или пароль.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Проверка совпадения паролей
    if (registerData.password !== registerData.confirmPassword) {
      setError('Пароли не совпадают!');
      return;
    }

    // Проверка заполненности полей
    if (!registerData.name || !registerData.email || !registerData.password) {
      setError('Пожалуйста, заполните все поля!');
      return;
    }

    // Проверка длины пароля
    if (registerData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Отправляем данные на сервер
      console.log('Отправляем POST запрос на:', `${API_BASE_URL}/auth/register`);
      console.log('Данные:', {
        name: registerData.name,
        email: registerData.email,
        password: '***'
      });
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        user_avatar: `https://i.pravatar.cc/150?u=${registerData.name}`, // Генерируем аватар
        profile_info: `Пользователь ${registerData.name}`
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 секунд таймаут
      });

      if (response.data.success) {
        setSuccess('Регистрация прошла успешно! Теперь вы можете войти в систему.');
        
        // Детальный лог регистрации
        console.group('🚀 РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ');
        console.log('📅 Время регистрации:', new Date().toLocaleString('ru-RU'));
        console.log('👤 Имя:', registerData.name);
        console.log('👤 Username (сгенерирован):', response.data.user.username);
        console.log('📧 Email:', registerData.email);
        console.log('✅ Статус:', 'Успешно зарегистрирован');
        console.log('🆔 ID пользователя:', response.data.user.id);
        console.log('🎉 Добро пожаловать,', registerData.name + '!');
        console.groupEnd();
        
        // Закрываем модальное окно через 2 секунды
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === 'ECONNREFUSED') {
        setError('Не удается подключиться к серверу. Проверьте, что сервер запущен.');
      } else {
        setError('Произошла ошибка при регистрации. Попробуйте еще раз.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="Regcont">
      <div className="Reg-box">
        <div className="login-header">
          <div className="login-logo">
            <img src={logoImage} alt="logo" />
          </div>
          <div className="login-logotext">
            <h1>Space-Point</h1>
            <p>Космическая сеть</p>
          </div>
        </div>
        <div className="login-content">
          <form onSubmit={handleLoginSubmit}>
            {error && !isRegisterModalOpen && (
              <div className="error-message" style={{ marginBottom: '16px' }}>
                ❌ {error}
              </div>
            )}
            
            <div className="login-input">
              <input 
                type="text" 
                name="login"
                placeholder="Введите логин..." 
                value={loginData.login}
                onChange={handleLoginInputChange}
                disabled={isLoading}
                required
              />
              <input 
                type="password" 
                name="password"
                placeholder="Введите пароль..." 
                value={loginData.password}
                onChange={handleLoginInputChange}
                disabled={isLoading}
                required
              />
            </div>
            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <button className="login-reg" onClick={handleRegisterClick}>
            Регистрация
          </button>
        </div>
      </div>

      {/* Модальное окно регистрации */}
      {isRegisterModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Регистрация</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form className="register-form" onSubmit={handleRegisterSubmit}>
              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}
              {success && (
                <div className="success-message">
                  ✅ {success}
                </div>
              )}
              
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Введите ваше имя..."
                  value={registerData.name}
                  onChange={handleRegisterInputChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Введите email..."
                  value={registerData.email}
                  onChange={handleRegisterInputChange}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Придумайте пароль (минимум 6 символов)..."
                  value={registerData.password}
                  onChange={handleRegisterInputChange}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Повторите пароль..."
                  value={registerData.confirmPassword}
                  onChange={handleRegisterInputChange}
                  disabled={isLoading}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="register-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Regcont;