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

// ===================== Feature Flags (Production Toggles) =====================
// Toggle the entire inactivity timer system (listeners, timeouts, modal)
const ENABLE_SESSION_TIMER = true;
// Toggle test/dev session controls (seconds-based timings, overlay, 10s demo)
const ENABLE_TEST_SESSION = false;
// Toggle the floating debug button that opens the test/dev panel
const ENABLE_DEBUG_BUTTON = false;
// ============================================================================

// ---------- Session-scoped storage keys ----------
const SESSION_KEY = 'cmr:sessionId';
const mkKeys = (sid) =>
  sid
    ? {
        lastActivity: `cmr:${sid}:lastActivity`,
        warnAt: `cmr:${sid}:warnAt`,
        logoutAt: `cmr:${sid}:logoutAt`,
      }
    : null;

// ---------- Dev settings keys ----------
const DEV_KEYS = {
  testMode: 'cmr:testMode', // '1' | '0'
  showOverlay: 'cmr:showOverlay', // '1' | '0'
  testIdle: 'cmr:testIdleSec', // number
  testWarn: 'cmr:testWarnSec', // number
};

function DebugTimerOverlay({ toWarn, toLogout, visible }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 9999,
        background: 'rgba(0,0,0,.75)',
        color: '#fff',
        padding: '10px 12px',
        borderRadius: 10,
        fontSize: 13,
        boxShadow: '0 6px 16px rgba(0,0,0,.25)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Session Timer</div>
      <div>
        Warn in: <b>{toWarn}s</b>
      </div>
      <div>
        Logout in: <b>{toLogout}s</b>
      </div>
    </div>
  );
}

function SessionDevPanel({
  testMode,
  setTestMode,
  showOverlay,
  setShowOverlay,
  testIdle,
  setTestIdle,
  testWarn,
  setTestWarn,
  onTenSecDemo,
  onResetSession,
}) {
  const [open, setOpen] = useState(false);

  // If the debug button is disabled via flag, don't render anything
  if (!ENABLE_DEBUG_BUTTON) return null;

  return (
    <>
  <button
  type="button"
  onClick={() => setOpen((v) => !v)}
  style={{
    position: 'fixed',
    bottom: 14,
    right: 14,
    zIndex: 10000,
    width: 44,
    height: 44,
    borderRadius: 12,
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(0,0,0,.12)', 
  }}
  title="Session Dev Panel"
>
  timer
</button>


      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 68,
            right: 14,
            zIndex: 10000,
            width: 300,
            borderRadius: 14,
            border: '1px solid #e5e7eb',
            background: '#fff',
            boxShadow: '0 16px 40px rgba(0,0,0,.14)',
            padding: 12,
          }}
          dir="rtl"
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>لوحة الاختبار</div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
            />
            <span>وضع الاختبار (بالـثواني)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={showOverlay}
              onChange={(e) => setShowOverlay(e.target.checked)}
            />
            <span>إظهار العداد على الشاشة</span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Idle (sec)</div>
              <input
                type="number"
                min="0"
                value={testIdle}
                onChange={(e) =>
                  setTestIdle(Math.max(0, Number(e.target.value) || 0))
                }
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Warn (sec)</div>
              <input
                type="number"
                min="0"
                value={testWarn}
                onChange={(e) =>
                  setTestWarn(Math.max(0, Number(e.target.value) || 0))
                }
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={onTenSecDemo}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid #ddd',
                background: '#f8fafc',
                cursor: 'pointer',
              }}
              title="Idle=10s, Warn=7s, Test Mode ON"
            >
              10s demo
            </button>
            <button
              type="button"
              onClick={onResetSession}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid #ddd',
                background: '#fff',
                cursor: 'pointer',
              }}
              title="Recalculate clocks from now"
            >
              تعيين الآن
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  // -------- user/login state --------
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  // Always-available view of the auth state for guards (avoids first-render race)
  const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');

  // -------- modal + countdown (seconds) --------
  const [showTimeout, setShowTimeout] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // -------- dev/test settings (persisted) --------
  // If test session is disabled, force-safe defaults and ignore persisted values
  const initialTestMode =
    ENABLE_TEST_SESSION && localStorage.getItem(DEV_KEYS.testMode) === '1';
  const initialShowOverlay =
    ENABLE_TEST_SESSION && localStorage.getItem(DEV_KEYS.showOverlay) !== '0';

  const [testMode, setTestMode] = useState(initialTestMode);
  const [showOverlay, setShowOverlay] = useState(initialShowOverlay);
  const [testIdle, setTestIdle] = useState(() =>
    ENABLE_TEST_SESSION ? Number(localStorage.getItem(DEV_KEYS.testIdle)) || 10 : 10
  );
  const [testWarn, setTestWarn] = useState(() =>
    ENABLE_TEST_SESSION ? Number(localStorage.getItem(DEV_KEYS.testWarn)) || 7 : 7
  );

  // Persist dev settings only if test session feature is enabled
  useEffect(() => {
    if (!ENABLE_TEST_SESSION) return;
    localStorage.setItem(DEV_KEYS.testMode, testMode ? '1' : '0');
  }, [testMode]);
  useEffect(() => {
    if (!ENABLE_TEST_SESSION) return;
    localStorage.setItem(DEV_KEYS.showOverlay, showOverlay ? '1' : '0');
  }, [showOverlay]);
  useEffect(() => {
    if (!ENABLE_TEST_SESSION) return;
    localStorage.setItem(DEV_KEYS.testIdle, String(testIdle));
  }, [testIdle]);
  useEffect(() => {
    if (!ENABLE_TEST_SESSION) return;
    localStorage.setItem(DEV_KEYS.testWarn, String(testWarn));
  }, [testWarn]);

  // -------- derived durations --------
  const idleSec =
    ENABLE_TEST_SESSION && testMode ? testIdle : 25 * 60; // 25 min in prod
  const warnSec =
    ENABLE_TEST_SESSION && testMode ? testWarn : 5 * 60; // 5 min in prod

  // -------- refs & routing --------
  const resetRef = useRef(() => {});
  const showTimeoutRef = useRef(false);
  const timersRef = useRef({ warn: null, logout: null, tick: null });

  const sessionIdRef = useRef(localStorage.getItem(SESSION_KEY) || null);
  const lsKeysRef = useRef(mkKeys(sessionIdRef.current));

  const warnAtRef = useRef(null);
  const logoutAtRef = useRef(null);
  const [dbg, setDbg] = useState({ toWarn: 0, toLogout: 0 });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    showTimeoutRef.current = showTimeout;
  }, [showTimeout]);

  // ----- session helpers -----
  const ensureSessionId = useCallback(() => {
    if (!user) return null;
    let sid = sessionIdRef.current || localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(SESSION_KEY, sid);
    }
    sessionIdRef.current = sid;
    lsKeysRef.current = mkKeys(sid);
    return sid;
  }, [user]);

  const clearSessionId = useCallback(() => {
    sessionIdRef.current = null;
    lsKeysRef.current = null;
    localStorage.removeItem(SESSION_KEY);
  }, []);

  // ----- clocks I/O (scoped by session) -----
  const persistClocks = useCallback(
    (lastActivityMs) => {
      if (!lsKeysRef.current) return {};
      const { lastActivity, warnAt, logoutAt } = lsKeysRef.current;
      const warnAtVal = lastActivityMs + idleSec * 1000;
      const logoutAtVal = lastActivityMs + (idleSec + warnSec) * 1000;
      localStorage.setItem(lastActivity, String(lastActivityMs));
      localStorage.setItem(warnAt, String(warnAtVal));
      localStorage.setItem(logoutAt, String(logoutAtVal));
      warnAtRef.current = warnAtVal;
      logoutAtRef.current = logoutAtVal;
      return { warnAt: warnAtVal, logoutAt: logoutAtVal };
    },
    [idleSec, warnSec]
  );

  const readClocks = useCallback(() => {
    if (!lsKeysRef.current) return {};
    const { warnAt, logoutAt, lastActivity } = lsKeysRef.current;
    const warnAtVal = Number(localStorage.getItem(warnAt)) || null;
    const logoutAtVal = Number(localStorage.getItem(logoutAt)) || null;
    const lastActivityVal = Number(localStorage.getItem(lastActivity)) || null;
    warnAtRef.current = warnAtVal;
    logoutAtRef.current = logoutAtVal;
    return { warnAt: warnAtVal, logoutAt: logoutAtVal, lastActivity: lastActivityVal };
  }, []);

  const clearClockKeys = useCallback(() => {
    if (!lsKeysRef.current) return;
    const { lastActivity, warnAt, logoutAt } = lsKeysRef.current;
    localStorage.removeItem(lastActivity);
    localStorage.removeItem(warnAt);
    localStorage.removeItem(logoutAt);
    warnAtRef.current = null;
    logoutAtRef.current = null;
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
    clearClockKeys();
    clearSessionId();
    localStorage.removeItem('user');
    setUser(null);
    navigate('/', { replace: true });
  }, [navigate, clearAllTimers, clearClockKeys, clearSessionId]);

  const role = currentUser?.role?.trim().toLowerCase();
  const allow = (roles) => roles.map((r) => r.toLowerCase()).includes(role);

  // never show modal on login page
  useEffect(() => {
    if (location.pathname === '/') setShowTimeout(false);
  }, [location.pathname]);

  // ticker for countdown + overlay
  const startTick = useCallback(() => {
    // If session timer is disabled, do nothing
    if (!ENABLE_SESSION_TIMER) return;

    if (timersRef.current.tick) return;
    timersRef.current.tick = setInterval(() => {
      const now = Date.now();
      const warnAt = warnAtRef.current;
      const logoutAt = logoutAtRef.current;

      // Only update debug overlay when test session is enabled
      if (
        ENABLE_TEST_SESSION &&
        showOverlay &&
        currentUser &&
        location.pathname !== '/'
      ) {
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
  }, [handleLogout, clearAllTimers, location.pathname, showOverlay, currentUser]);

  // schedule from current clocks (no overwrite unless missing)
  const scheduleFromClocks = useCallback(() => {
    if (!ENABLE_SESSION_TIMER) return; // gated by feature flag
    if (!sessionIdRef.current || !lsKeysRef.current) return;
    clearAllTimers();

    const now = Date.now();
    let { warnAt, logoutAt } = readClocks();

    if (!warnAt || !logoutAt) {
      const fresh = persistClocks(now);
      warnAt = fresh.warnAt;
      logoutAt = fresh.logoutAt;
    }

    if (now >= logoutAt) {
      handleLogout();
      return;
    }
    if (now >= warnAt && now < logoutAt) {
      setShowTimeout(true);
    }

    const warnDelay = Math.max(0, warnAt - now);
    const logoutDelay = Math.max(0, logoutAt - now);

    timersRef.current.warn = setTimeout(() => setShowTimeout(true), warnDelay);
    timersRef.current.logout = setTimeout(() => handleLogout(), logoutDelay);

    startTick();
  }, [readClocks, persistClocks, clearAllTimers, handleLogout, startTick]);

  // core inactivity logic
  useEffect(() => {
    if (!ENABLE_SESSION_TIMER) {
      // Ensure everything is cleanly off when disabled
      clearAllTimers();
      setShowTimeout(false);
      return;
    }

    if (!user || location.pathname === '/') {
      clearAllTimers();
      return;
    }

    ensureSessionId();
    if (!sessionIdRef.current) return;

    const reset = (force = false) => {
      if (showTimeoutRef.current && !force) return;
      persistClocks(Date.now());
      scheduleFromClocks();
      if (showTimeoutRef.current) setShowTimeout(false);
    };
    resetRef.current = () => reset(true);

    const activityHandler = () => {
      if (showTimeoutRef.current) return;
      persistClocks(Date.now());
      scheduleFromClocks();
    };

    const events = [
      'click',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'pointerdown',
    ];
    events.forEach((e) =>
      window.addEventListener(e, activityHandler, { passive: true })
    );

    const resumeHandler = () => {
      scheduleFromClocks();
    };
    document.addEventListener('visibilitychange', resumeHandler, {
      passive: true,
    });
    window.addEventListener('focus', resumeHandler, { passive: true });
    window.addEventListener('pageshow', resumeHandler, { passive: true });

    const storageHandler = (ev) => {
      if (!sessionIdRef.current) return;
      const keys = lsKeysRef.current || {};
      if (
        ev.key === keys.warnAt ||
        ev.key === keys.logoutAt ||
        ev.key === keys.lastActivity
      ) {
        scheduleFromClocks();
      }
      if (ev.key === 'user') {
        if (!ev.newValue) handleLogout();
        else scheduleFromClocks();
      }
      if (ev.key === SESSION_KEY) {
        sessionIdRef.current = ev.newValue || null;
        lsKeysRef.current = mkKeys(sessionIdRef.current);
        scheduleFromClocks();
      }
    };
    window.addEventListener('storage', storageHandler);

    // init
    scheduleFromClocks();

    return () => {
      events.forEach((e) => window.removeEventListener(e, activityHandler));
      document.removeEventListener('visibilitychange', resumeHandler);
      window.removeEventListener('focus', resumeHandler);
      window.removeEventListener('pageshow', resumeHandler);
      window.removeEventListener('storage', storageHandler);
      clearAllTimers();
    };
  }, [
    user,
    location.pathname,
    ensureSessionId,
    persistClocks,
    scheduleFromClocks,
    clearAllTimers,
    handleLogout,
  ]);

  // when durations change (toggle test mode or change values), apply immediately
  useEffect(() => {
    if (!ENABLE_SESSION_TIMER) return;
    if (user && location.pathname !== '/' && sessionIdRef.current) {
      persistClocks(Date.now());
      scheduleFromClocks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleSec, warnSec]);

  const stayLoggedIn = () => resetRef.current();

  // Dev helpers (no-ops if test session disabled)
  const tenSecDemo = () => {
    if (!ENABLE_TEST_SESSION) return;
    setTestMode(true);
    setTestIdle(10);
    setTestWarn(7);
  };
  const devResetSession = () => {
    if (!sessionIdRef.current) return;
    if (!ENABLE_SESSION_TIMER) return;
    persistClocks(Date.now());
    scheduleFromClocks();
    setShowTimeout(false);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Login onLogin={setUser} />} />
        <Route
          path="/home"
          element={currentUser ? <Home /> : <Navigate to="/" replace />}
        />
        <Route
          path="/standards_create"
          element={
            currentUser && allow(['admin', 'administrator']) ? (
              <StandardsCreate />
            ) : (
              <Navigate to={currentUser ? '/home' : '/'} replace />
            )
          }
        />
        <Route
          path="/standards"
          element={
            currentUser && allow(['admin', 'administrator', 'user']) ? (
              <Standards />
            ) : (
              <Navigate to={currentUser ? '/home' : '/'} replace />
            )
          }
        />
        <Route
          path="/standards_edit/:id"
          element={
            currentUser && allow(['admin', 'administrator']) ? (
              <StandardsEdit />
            ) : (
              <Navigate to={currentUser ? '/home' : '/'} replace />
            )
          }
        />
        <Route
          path="/departments"
          element={
            currentUser && allow(['admin', 'administrator']) ? (
              <Departments />
            ) : (
              <Navigate to={currentUser ? '/home' : '/'} replace />
            )
          }
        />
        <Route
          path="/departments_edit/:id"
          element={
            currentUser && allow(['admin', 'administrator']) ? (
              <DepartmentsEdit />
            ) : (
              <Navigate to={currentUser ? '/home' : '/'} replace />
            )
          }
        />
        <Route
          path="/departments_create"
          element={
            currentUser && allow(['admin', 'administrator']) ? (
              <DepartmentsCreate />
            ) : (
              <Navigate to={currentUser ? '/home' : '/'} replace />
            )
          }
        />
        <Route
          path="/users"
          element={
            currentUser && allow(['admin', 'administrator']) ? (
              <Users />
            ) : (
              <Navigate to={currentUser ? '/home' : '/'} replace />
            )
          }
        />
        <Route
          path="/users_create"
          element={
            currentUser && allow(['admin', 'administrator']) ? (
              <UsersCreate />
            ) : (
              <Navigate to={currentUser ? '/home' : '/'} replace />
            )
          }
        />
        <Route
          path="/users_edit/:id"
          element={
            currentUser && allow(['admin', 'administrator']) ? (
              <UsersEdit />
            ) : (
              <Navigate to={currentUser ? '/home' : '/'} replace />
            )
          }
        />
        <Route
          path="/reports"
          element={
            currentUser && allow(['admin', 'administrator', 'management']) ? (
              <Report />
            ) : (
              <Navigate to={currentUser ? '/home' : '/'} replace />
            )
          }
        />
        <Route
          path="/profile"
          element={currentUser ? <Profile /> : <Navigate to="/" replace />}
        />
      </Routes>

      {/* Session timeout modal (gated by master flag) */}
      {ENABLE_SESSION_TIMER && (
        <SessionTimeoutModal
          show={showTimeout}
          timeLeft={secondsLeft}
          onStay={stayLoggedIn}
          onLogout={handleLogout}
        />
      )}

      {/* Debug overlay only when test session is enabled */}
      <DebugTimerOverlay
        visible={
          ENABLE_TEST_SESSION &&
          showOverlay &&
          currentUser &&
          location.pathname !== '/'
        }
        toWarn={dbg.toWarn}
        toLogout={dbg.toLogout}
      />

      {/* Dev panel is entirely gated by ENABLE_TEST_SESSION (and the button by ENABLE_DEBUG_BUTTON) */}
      {ENABLE_TEST_SESSION && currentUser && location.pathname !== '/' && (
        <SessionDevPanel
          testMode={testMode}
          setTestMode={setTestMode}
          showOverlay={showOverlay}
          setShowOverlay={setShowOverlay}
          testIdle={testIdle}
          setTestIdle={setTestIdle}
          testWarn={testWarn}
          setTestWarn={setTestWarn}
          onTenSecDemo={tenSecDemo}
          onResetSession={devResetSession}
        />
      )}
    </>
  );
}

export default App;
