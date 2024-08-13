import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa';
import { ThemeContext } from './ColorTheme';
import { AuthContext } from './App';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { authState, setAuthState } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Clear auth state
    setAuthState({ token: null, username: null });

    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('username');

    // Clear session storage (if you're using it)
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');

    // Optionally, call the backend to invalidate the token
    try {
      await fetch('http://localhost:3006/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }

    // Navigate to home page
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.userInfo}>
          {authState.username && (
            <span className={styles.userName}>Welcome, {authState.username}</span>
          )}
        </div>
        <div className={styles.navLinksContainer}>
          <div className={styles.navLinks}>
            <CustomNavLink to="/">Home</CustomNavLink>
            <CustomNavLink to="/dashboard">Dashboard</CustomNavLink>
            <CustomNavLink to="/recordemergency">Describe</CustomNavLink>
            <CustomNavLink to="/profile">Profile</CustomNavLink>
            <CustomNavLink to="/2dmap">2d Map</CustomNavLink>
            <CustomNavLink to="/minimal">Minimal Example Video</CustomNavLink>
          </div>
        </div>
        <div className={styles.authButtonContainer}>
          {authState.token ? (
            <button
              className={styles.authButton}
              onClick={handleLogout}
            >
              Log Out
            </button>
          ) : (
            <button className={styles.authButton} onClick={() => navigate('/login')}>
              Log In
            </button>
          )}
        </div>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
    </nav>
  );
};

const CustomNavLink = ({ to, children }) => {
  return (
    <NavLink to={to} className={styles.navLink}>
      {children}
    </NavLink>
  );
};

const ThemeToggle = ({ theme, toggleTheme }) => {
  return (
    <div className={styles.themeToggle} onClick={toggleTheme}>
      <div className={`${styles.slider} ${theme === 'dark' ? styles.dark : styles.light}`}>
        <div className={styles.icon}>{theme === 'dark' ? <FaMoon /> : <FaSun />}</div>
      </div>
    </div>
  );
};

export default Navbar;