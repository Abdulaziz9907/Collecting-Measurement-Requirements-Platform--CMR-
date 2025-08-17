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

// Keys for cross-tab & resume robustness
const LS_KEYS = {
  lastActivity: 'cmr:lastActivityAt',
  warnAt: 'cmr:warnAt',
  logoutAt: 'cmr:logoutAt',
};

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
  const timersRef = useRef({ warn: null, logout: null, tick: null }); // tick = 1s UI updater

  const warnAtRef = useRef(null);               // epoch ms
  const logoutAtRef = useRef(null);             // epoch ms
  const [dbg, setDbg] = useState({ toWarn: 0, toLogout: 0 });

  const location = useLocation();
  const navigate = useNavigate();

  // Effective durations (minutes in production, seconds in temp test)
  const idleSec = TEMP_TIMER ? TEMP_IDLE_SEC : 25 * 60; // 25 min idle -> show modal
  const warnSec = TEMP_TIMER ? TEMP_WARN_SEC : 5 * 60;  // 5 min countdown -> logout
  const totalSec = idleSec + warnSec;                   // total 30 min

  useEffect(() => { showTimeoutRef.current = showTimeout; }, [showTimeout]);

  const persistClocks = useCallback((lastActivityMs) => {
    const warnAt = lastActivityMs + idleSec * 1000;
    const logoutAt = lastActivityMs + (idleSec + warnSec) * 1000;
    localStorage.setItem(LS_KEYS.lastActivity, String(lastActivityMs));
    localStorage.setItem(LS_KEYS.warnAt, String(warnAt));
    localStorage.setItem(LS_KEYS.logoutAt, String(logoutAt));
    warnAtRef.current = warnAt;
    logoutAtRef.current = logoutAt;
    return { warnAt, logoutAt };
  }, [idleSec, warnSec]);

  const readClocks = useCallback(() => {
    const warnAt = Number(localStorage.getItem(LS_KEYS.warnAt)) || null;
    const logoutAt = Number(localStorage.getItem(LS_KEYS.logoutAt)) || null;
    const lastActivity = Number(localStorage.getItem(LS_KEYS.lastActivity)) || null;
    warnAtRef.current = warnAt;
    logoutAtRef.current = logoutAt;
    return { warnAt, logoutAt, lastActivity };
  }, []);

  const clearAllTimers = useCallback(() => {
    const t = timersRef.current;
    if (t.warn) clearTimeout(t.warn);
    if (t.logout) clearTimeout(t.logout);
    if (t.tick) clearInterval(t.tick);
    timersRef.current = { warn: null, logout: null, tick: null };
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

  // Start a live 1s ticker (for modal countdown & debug overlay)
  const startTick = useCallback(() => {
    if (timersRef.current.tick) return;
    timersRef.current.tick = setInterval(() => {
      const now = Date.now();
      const warnAt = warnAtRef.current;
      const logoutAt = logoutAtRef.current;
      if (TEMP_TIMER && location.pathname !== '/') {
        const toWarn = warnAt ? Math.max(0, Math.ceil((warnAt - now) / 1000)) : 0;
        const toLogout = logoutAt ? Math.max(0, Math.ceil((logoutAt - now) / 1000)) : 0;
        setDbg({ toWarn, toLogout });
      }
      if (showTimeoutRef.current && logoutAt) {
        const secLeft = Math.max(0, Math.ceil((logoutAt - now) / 1000));
        setSecondsLeft(secLeft);
        if (secLeft <= 0) {
          clearAllTimers();
          handleLogout();
        }
      }
    }, 1000);
  }, [handleLogout, clearAllTimers, location.pathname]);

  // Apply the "resume" check: if we've been idle long enough while backgrounded, act immediately
  const applyResumeCheck = useCallback(() => {
    const now = Date.now();
    const { warnAt, logoutAt } = readClocks();

    if (!warnAt || !logoutAt) return;

    if (now >= logoutAt) {
      // Hard-expired while backgrounded
      handleLogout();
      return;
    }
    if (now >= warnAt && !showTimeoutRef.current) {
      // Should be in warning state
      setShowTimeout(true);
      // secondsLeft will be driven by the 1s tick from logoutAt clock
    }
  }, [handleLogout, readClocks]);

  // Core inactivity / countdown logic
  useEffect(() => {
    if (!user || location.pathname === '/') {
      clearAllTimers();
      return;
    }

    const schedule = () => {
      const now = Date.now();
      persistClocks(now);

      // Warning: open modal at idleSec
      if (timersRef.current.warn) clearTimeout(timersRef.current.warn);
      timersRef.current.warn = setTimeout(() => {
        setShowTimeout(true);
        // secondsLeft is computed from logoutAt via 1s tick
      }, idleSec * 1000);

      // Hard logout guard at idleSec + warnSec
      if (timersRef.current.logout) clearTimeout(timersRef.current.logout);
      timersRef.current.logout = setTimeout(() => {
        handleLogout();
      }, (idleSec + warnSec) * 1000);
    };

    const reset = (force = false) => {
      if (showTimeoutRef.current && !force) return; // don't reset while modal open
      clearAllTimers();
      if (showTimeoutRef.current) setShowTimeout(false);
      schedule();
      startTick();
    };

    resetRef.current = () => reset(true);

    // Any activity resets — only if modal not open
    const activityHandler = () => {
      if (showTimeoutRef.current) return;
      persistClocks(Date.now());
      reset(false);
    };

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart', 'pointerdown'];
    events.forEach(e => window.addEventListener(e, activityHandler, { passive: true }));

    // Resume/background handling (iOS Safari suspends timers)
    const resumeHandler = () => applyResumeCheck();
    document.addEventListener('visibilitychange', resumeHandler, { passive: true });
    window.addEventListener('focus', resumeHandler, { passive: true });
    window.addEventListener('pageshow', resumeHandler, { passive: true }); // Safari bfcache

    // Cross-tab sync (if another tab logs out or resets)
    const storageHandler = (ev) => {
      if (ev.key === LS_KEYS.warnAt || ev.key === LS_KEYS.logoutAt || ev.key === LS_KEYS.lastActivity) {
        applyResumeCheck();
      }
      if (ev.key === 'user' && !ev.newValue) {
        // Logged out elsewhere
        handleLogout();
      }
    };
    window.addEventListener('storage', storageHandler);

    // Start timers immediately
    startTick();
    // On mount, ensure clocks exist & then check if already expired while we were away
    if (!localStorage.getItem(LS_KEYS.warnAt) || !localStorage.getItem(LS_KEYS.logoutAt)) {
      persistClocks(Date.now());
    }
    applyResumeCheck();

    return () => {
      events.forEach(e => window.removeEventListener(e, activityHandler));
      document.removeEventListener('visibilitychange', resumeHandler);
      window.removeEventListener('focus', resumeHandler);
      window.removeEventListener('pageshow', resumeHandler);
      window.removeEventListener('storage', storageHandler);
      clearAllTimers();
    };
  }, [
    user,
    location.pathname,
    idleSec,
    warnSec,
    persistClocks,
    applyResumeCheck,
    clearAllTimers,
    startTick,
    handleLogout
  ]);

  const stayLoggedIn = () => {
    // Force reset & close modal (also refresh clocks)
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
