import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/desktop/Login/Login';
import StandardsCreate from './pages/desktop/StandardsCreate/StandardsCreate';
import Standards from './pages/desktop/Standards/Standards';
import StandardsEdit from './pages/desktop/StandardsEdit/StandardsEdit';
import Departments from './pages/desktop/Departments/Departments';
import DepartmentsEdit from './pages/desktop/DepartmentsEdit/DepartmentsEdit';
import DepartmentsCreate from './pages/desktop/DepartmentsCreate/DepartmentsCreate';
import Users from './pages/desktop/Users/Users';
import UsersCreate from './pages/desktop/UsersCreate/UsersCreate';
import UsersEdit from './pages/desktop/UsersEdit/UsersEdit';
import Report from './pages/desktop/Reports/Report';
import Home from './pages/desktop/Home/Home';
import Profile from './pages/desktop/Profile/Profile';
import SessionTimeoutModal from './components/SessionTimeoutModal.jsx';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [showTimeout, setShowTimeout] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const resetRef = useRef(() => {});
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/', { replace: true });
  }, [navigate]);

  const role = user?.role?.trim().toLowerCase();
  const allow = roles => roles.map(r => r.toLowerCase()).includes(role);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user') || 'null'));
  }, [location]);

  useEffect(() => {
    if (!user) return;

    let warnTimer, logoutTimer, countdown;

    const reset = () => {
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdown);
      setShowTimeout(false);

      warnTimer = setTimeout(() => {
        setShowTimeout(true);
        let remaining = 5 * 60;
        setSecondsLeft(remaining);
        countdown = setInterval(() => {
          remaining -= 1;
          setSecondsLeft(remaining);
          if (remaining <= 0) clearInterval(countdown);
        }, 1000);
      }, 25 * 60 * 1000);

      logoutTimer = setTimeout(() => {
        handleLogout();
      }, 30 * 60 * 1000);
    };

    resetRef.current = reset;

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, reset));
    reset();

    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdown);
    };
  }, [user, handleLogout]);

  const stayLoggedIn = () => {
    resetRef.current();
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Login onLogin={setUser} />} />
        <Route path="/home" element={user ? <Home /> : <Navigate to="/" replace />} />
        <Route path="/standards_create" element={user && allow(['admin','administrator']) ? <StandardsCreate /> : <Navigate to={user ? '/home' : '/'} replace />} />
        <Route path="/standards" element={user && allow(['admin','administrator','user']) ? <Standards /> : <Navigate to={user ? '/home' : '/'} replace />} />
        <Route path="/standards_edit/:id" element={user && allow(['admin','administrator']) ? <StandardsEdit /> : <Navigate to={user ? '/home' : '/'} replace />} />
        <Route path="/departments" element={user && allow(['admin','administrator']) ? <Departments /> : <Navigate to={user ? '/home' : '/'} replace />} />
        <Route path="/departments_edit/:id" element={user && allow(['admin','administrator']) ? <DepartmentsEdit /> : <Navigate to={user ? '/home' : '/'} replace />} />
        <Route path="/departments_create" element={user && allow(['admin','administrator']) ? <DepartmentsCreate /> : <Navigate to={user ? '/home' : '/'} replace />} />
        <Route path="/users" element={user && allow(['admin','administrator']) ? <Users /> : <Navigate to={user ? '/home' : '/'} replace />} />
        <Route path="/users_create" element={user && allow(['admin','administrator']) ? <UsersCreate /> : <Navigate to={user ? '/home' : '/'} replace />} />
        <Route path="/users_edit/:id" element={user && allow(['admin','administrator']) ? <UsersEdit /> : <Navigate to={user ? '/home' : '/'} replace />} />
        <Route path="/reports" element={user && allow(['admin','administrator','management']) ? <Report /> : <Navigate to={user ? '/home' : '/'} replace />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" replace />} />
      </Routes>
      <SessionTimeoutModal show={showTimeout} timeLeft={secondsLeft} onStay={stayLoggedIn} onLogout={handleLogout} />
    </>
  );
}

export default App;
