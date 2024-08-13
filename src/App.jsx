import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import LandingPage from './landing_page/LandingPage';
import ImageDescriber from './img_description/ImageDescriber';
import Profile from './profile/Profile';
import Dashboard from './dashboard/Dashboard';
import GetStarted from './GetStarted';
import { ThemeProvider } from './ColorTheme';
import EmergencyMap from './2dmap/2dmap';
import ImageDescriberMinimal from './img_description/minimalExample';
import Login from './Login';
import Register from './Register';
import './App.css';

export const AuthContext = React.createContext();

const AppContent = () => {
  const location = useLocation();
  const { authState } = React.useContext(AuthContext);
  const showNavbar = !['/', '/login', '/register'].includes(location.pathname);

  useEffect(() => {
    if (authState.username) {
      console.log(`Logged in as: ${authState.username}`);
    }
  }, [authState.username]);

  return (
    <>
      {showNavbar && <Navbar />}
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/recordemergency" 
            element={authState.username ? <ImageDescriber /> : <Navigate to="/login" />} 
          />
          <Route path="/get-started" element={<GetStarted />} />
          <Route 
            path="/profile" 
            element={authState.username ? <Profile /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/dashboard" 
            element={authState.username ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route path="/2dmap" element={<EmergencyMap />} />
          <Route path="/minimal" element={<ImageDescriberMinimal />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username'),
  });

  const verifyToken = useCallback(async () => {
    if (authState.token) {
      try {
        const response = await fetch('http://localhost:3006/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: authState.token }),
        });
        const data = await response.json();
        if (!data.isValid) {
          setAuthState({ token: null, username: null });
          localStorage.removeItem('token');
          localStorage.removeItem('username');
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setAuthState({ token: null, username: null });
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      }
    }
  }, [authState.token]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  return (
    <AuthContext.Provider value={{ authState, setAuthState }}>
      <Router>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;

