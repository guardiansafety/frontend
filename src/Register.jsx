import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSpring, animated } from 'react-spring';
import { AuthContext } from './App';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import styles from './Register.module.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext);

  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translate3d(0, 50px, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    if (!isPasswordStrong(password)) {
      alert("Password is not strong enough");
      return;
    }
    try {
      const response = await fetch('http://localhost:3006/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setAuthState({ token: data.token, username: data.username });
        navigate('/dashboard');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const isPasswordStrong = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className={styles.container}>
      <animated.form onSubmit={handleSubmit} style={fadeIn} className={styles.form}>
        <h2 className={styles.title}>Register</h2>
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
          <Mail className={styles.inputIcon} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
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
            onClick={() => togglePasswordVisibility('password')}
            className={styles.togglePassword}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div className={styles.inputGroup}>
          <Lock className={styles.inputIcon} />
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
            className={styles.input}
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirm')}
            className={styles.togglePassword}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className={styles.passwordStrength}>
          Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.
        </p>
        <animated.button 
          type="submit" 
          className={styles.button}
          style={useSpring({
            transform: 'scale(1)',
            from: { transform: 'scale(0.9)' },
            config: { tension: 300, friction: 10 }
          })}
        >
          Register
        </animated.button>
        <p className={styles.switchText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </animated.form>
    </div>
  );
};

export default Register;