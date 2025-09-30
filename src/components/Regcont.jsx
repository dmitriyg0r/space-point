import './Regcont.css';
import logoImage from '../assets/logo.png';
import { useState } from 'react';

function Regcont() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [loginData, setLoginData] = useState({
    login: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    login: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegisterClick = () => {
    setIsRegisterModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRegisterModalOpen(false);
    // Очищаем форму при закрытии
    setRegisterData({
      login: '',
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

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    
    if (!loginData.login || !loginData.password) {
      alert('Пожалуйста, заполните все поля!');
      return;
    }

    // Детальный лог входа
    console.group('🔐 ВХОД В СИСТЕМУ');
    console.log('📅 Время входа:', new Date().toLocaleString('ru-RU'));
    console.log('👤 Логин:', loginData.login);
    console.log('🔐 Пароль введен:', loginData.password ? 'Да' : 'Нет');
    console.log('✅ Статус:', 'Успешный вход');
    console.log('🎯 Данные для проверки:', {
      login: loginData.login,
      password: '***скрыто***',
      timestamp: Date.now()
    });
    console.log('👋 Успешный вход,', loginData.login + '!');
    console.groupEnd();
  };

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    
    // Проверка совпадения паролей
    if (registerData.password !== registerData.confirmPassword) {
      alert('Пароли не совпадают!');
      return;
    }

    // Проверка заполненности полей
    if (!registerData.login || !registerData.email || !registerData.password) {
      alert('Пожалуйста, заполните все поля!');
      return;
    }
    
    // Детальный лог регистрации
    console.group('🚀 РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ');
    console.log('📅 Время регистрации:', new Date().toLocaleString('ru-RU'));
    console.log('👤 Логин:', registerData.login);
    console.log('📧 Email:', registerData.email);
    console.log('🔐 Пароль установлен:', registerData.password ? 'Да' : 'Нет');
    console.log('✅ Статус:', 'Успешно зарегистрирован');
    console.log('🎯 Данные для отправки на сервер:', {
      login: registerData.login,
      email: registerData.email,
      password: '***скрыто***',
      timestamp: Date.now()
    });
    console.log('🎉 Добро пожаловать,', registerData.login + '! Регистрация прошла успешно.');
    console.groupEnd();
    
    // Закрываем модальное окно после успешной регистрации
    handleCloseModal();
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
            <div className="login-input">
              <input 
                type="text" 
                name="login"
                placeholder="Введите логин..." 
                value={loginData.login}
                onChange={handleLoginInputChange}
                required
              />
              <input 
                type="password" 
                name="password"
                placeholder="Введите пароль..." 
                value={loginData.password}
                onChange={handleLoginInputChange}
                required
              />
            </div>
            <button type="submit" className="login-btn">Войти</button>
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
              <div className="form-group">
                <input
                  type="text"
                  name="login"
                  placeholder="Придумайте логин..."
                  value={registerData.login}
                  onChange={handleRegisterInputChange}
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
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Придумайте пароль..."
                  value={registerData.password}
                  onChange={handleRegisterInputChange}
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
                  required
                />
              </div>
              <button type="submit" className="register-submit-btn">
                Зарегистрироваться
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Regcont;