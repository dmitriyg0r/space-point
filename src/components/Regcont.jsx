
import './Regcont.css';
import logoImage from '../assets/logo.png';


const Login = () => {
  const [userLogin, setUserLogin] = useState([]);
  const [userPasword, setUserPasword] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


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
          <div className="login-input">
            <input type="text" placeholder="Введите логин..." />
            <input type="password" placeholder="Введите пароль..." />
          </div>
          <button className="login-btn">Войти</button>
          <button className="login-reg">Регистрация</button>
        </div>
      </div>
    </div>
  );
};

export default Regcont;