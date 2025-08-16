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

// ---------- TEMPORARY TEST TIMER (seconds) ----------
const TEMP_TIMER = false;        // set to false after testing
const TEMP_IDLE_SEC = 10;       // show modal after 10 seconds
const TEMP_WARN_SEC = 7;        // countdown inside modal (then logout)

function DebugTimerOverlay({ toWarn, toLogout, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', top: 12, right: 12, zIndex: 9999,
      background: 'rgba(0,0,0,.75)', color: '#fff',
      padding: '10px 12px', borderRadius: 10, fontSize: 13,
      boxShadow: '0 6px 16px rgba(0,0,0,.25)'
    }}>
      <div style={{fontWeight:600, marginBottom:4}}>🧪 Session Test</div>
      <div>Warn in: <b>{toWarn}s</b></div>
      <div>Logout in: <b>{toLogout}s</b></div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [showTimeout, setShowTimeout] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const resetRef = useRef(() => {});            // public reset() for "متابعة الجلسة"
  const showTimeoutRef = useRef(false);         // snapshot used inside listeners
  const timersRef = useRef({ warn: null, logout: null, countdown: null });

  const warnAtRef = useRef(null);               // epoch ms, for debug overlay
  const logoutAtRef = useRef(null);             // epoch ms, for debug overlay
  const [dbg, setDbg] = useState({ toWarn: 0, toLogout: 0 });

  const location = useLocation();
  const navigate = useNavigate();

  // Effective durations (minutes in production, seconds in temp test)
  const idleSec = TEMP_TIMER ? TEMP_IDLE_SEC : 25 * 60;
  const warnSec = TEMP_TIMER ? TEMP_WARN_SEC : 5 * 60;
  const totalSec = idleSec + warnSec;

  useEffect(() => { showTimeoutRef.current = showTimeout; }, [showTimeout]);

  const clearAllTimers = useCallback(() => {
    const t = timersRef.current;
    if (t.warn) clearTimeout(t.warn);
    if (t.logout) clearTimeout(t.logout);
    if (t.countdown) clearInterval(t.countdown);
    timersRef.current = { warn: null, logout: null, countdown: null };
    warnAtRef.current = null;
    logoutAtRef.current = null;
  }, []);

  const handleLogout = useCallback(() => {
    clearAllTimers();
    setShowTimeout(false);
    localStorage.removeItem('user');
    setUser(null);
    navigate('/', { replace: true });
  }, [navigate, clearAllTimers]);

  const role = user?.role?.trim().toLowerCase();
  const allow = roles => roles.map(r => r.toLowerCase()).includes(role);

  // Refresh user when location changes (e.g., after login)
  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user') || 'null'));
  }, [location]);

  // Never show timer on login page
  useEffect(() => {
    if (location.pathname === '/') setShowTimeout(false);
  }, [location.pathname]);

  // Core inactivity / countdown logic
  useEffect(() => {
    if (!user || location.pathname === '/') return;

    const schedule = () => {
      const now = Date.now();
      warnAtRef.current = now + idleSec * 1000;
      logoutAtRef.current = now + (idleSec + warnSec) * 1000;

      // 1) Warning (open modal + start countdown)
      timersRef.current.warn = setTimeout(() => {
        setShowTimeout(true);
        let remaining = warnSec;
        setSecondsLeft(remaining);

        timersRef.current.countdown = setInterval(() => {
          remaining -= 1;
          setSecondsLeft(remaining);
          if (remaining <= 0) {
            clearAllTimers();
            handleLogout();
          }
        }, 1000);
      }, idleSec * 1000);

      // 2) Hard logout guard
      timersRef.current.logout = setTimeout(() => {
        clearAllTimers();
        handleLogout();
      }, (idleSec + warnSec) * 1000);
    };

    const reset = (force = false) => {
      if (showTimeoutRef.current && !force) return; // don't reset while modal open
      clearAllTimers();
      if (showTimeoutRef.current) setShowTimeout(false);
      schedule();
    };

    resetRef.current = () => reset(true);

    // Any activity resets — only if modal not open
    const activityHandler = () => reset(false);
    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, activityHandler, { passive: true }));

    // Start timers immediately
    reset(false);

    return () => {
      events.forEach(e => window.removeEventListener(e, activityHandler));
      clearAllTimers();
    };
  }, [user, handleLogout, location.pathname, clearAllTimers, idleSec, warnSec]);

  // Debug overlay ticker (for TEMP_TIMER)
  useEffect(() => {
    if (!TEMP_TIMER || location.pathname === '/') return;
    const tick = () => {
      const now = Date.now();
      const toWarn = warnAtRef.current ? Math.max(0, Math.ceil((warnAtRef.current - now) / 1000)) : 0;
      const toLogout = logoutAtRef.current ? Math.max(0, Math.ceil((logoutAtRef.current - now) / 1000)) : 0;
      setDbg({ toWarn, toLogout });
    };
    const id = setInterval(tick, 250);
    tick();
    return () => clearInterval(id);
  }, [location.pathname]);

  const stayLoggedIn = () => {
    // Force reset & close modal
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

      <SessionTimeoutModal
        show={showTimeout}
        timeLeft={secondsLeft}
        onStay={stayLoggedIn}
        onLogout={handleLogout}
      />

      {/* TEMP debug overlay */}
      <DebugTimerOverlay
        visible={TEMP_TIMER && user && location.pathname !== '/'}
        toWarn={dbg.toWarn}
        toLogout={dbg.toLogout}
      />
    </>
  );
}

export default App;
