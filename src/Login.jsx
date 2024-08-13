import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSpring, animated } from 'react-spring';
import { AuthContext } from './App';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import styles from './Login.module.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext);

  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translate3d(0, 50px, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:3006/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setAuthState({ token: data.token, username: data.username });
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  return (
    <div className={styles.container}>
      <animated.form onSubmit={handleSubmit} style={fadeIn} className={styles.form}>
        <h2 className={styles.title}>Login</h2>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.inputGroup}>
          <User className={styles.inputIcon} />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className={styles.input}
          />
        </div>
        <div className={styles.inputGroup}>
          <Lock className={styles.inputIcon} />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className={styles.input}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={styles.togglePassword}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <animated.button 
          type="submit" 
          className={styles.button}
          style={useSpring({
            transform: 'scale(1)',
            from: { transform: 'scale(0.9)' },
            config: { tension: 300, friction: 10 }
          })}
        >
          Login
        </animated.button>
        <p className={styles.switchText}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </animated.form>
    </div>
  );
};

export default Login;