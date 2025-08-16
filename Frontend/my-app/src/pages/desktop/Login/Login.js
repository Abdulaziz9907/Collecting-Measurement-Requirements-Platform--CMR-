import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Header.jsx';
import Footer from '../../../components/Footer.jsx';
import ForgotPasswordModal from '../../../components/ForgotPasswordModal.jsx';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // CapsLock & visibility
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showCapsWarning, setShowCapsWarning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const navigate = useNavigate();
  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/+$/, '');

  const isMobile =
    typeof window !== 'undefined' &&
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Smooth mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Prevent scrolling inside fields globally (wheel/touch over inputs) + PageUp/PageDown in fields
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isEditableInPath = (e) => {
      const path = e.composedPath ? e.composedPath() : [e.target];
      for (const el of path) {
        if (!el || !el.tagName) continue;
        const tag = el.tagName.toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return true;
      }
      return false;
    };

    const onWheel = (e) => { if (isEditableInPath(e)) e.preventDefault(); };
    const onTouchMove = (e) => { if (isEditableInPath(e)) e.preventDefault(); };
    const onKeyDownScroll = (e) => {
      const ae = document.activeElement;
      if (!ae) return;
      const tag = ae.tagName ? ae.tagName.toUpperCase() : '';
      const isField = tag === 'INPUT' || tag === 'TEXTAREA';
      if (isField && (e.key === 'PageUp' || e.key === 'PageDown')) e.preventDefault();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDownScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDownScroll);
    };
  }, []);

  // EXTRA: Hard-lock input scroll even while selecting text (per-input handlers)
  useEffect(() => {
    const els = [usernameRef.current, passwordRef.current].filter(Boolean);
    const disposers = els.map((el) => {
      const keep = () => {
        // Keep the field anchored; block any horizontal/vertical offset
        el.scrollLeft = 0;
        el.scrollTop = 0;
      };
      const wheel = (e) => { e.preventDefault(); keep(); };
      const touch = (e) => { e.preventDefault(); keep(); };
      const sc = () => keep();
      const kd = () => requestAnimationFrame(keep);
      const inp = () => keep();
      // Listen on the element itself to catch selection-driven scroll
      el.addEventListener('wheel', wheel, { passive: false });
      el.addEventListener('touchmove', touch, { passive: false });
      el.addEventListener('scroll', sc);
      el.addEventListener('keydown', kd);
      el.addEventListener('input', inp);
      return () => {
        el.removeEventListener('wheel', wheel);
        el.removeEventListener('touchmove', touch);
        el.removeEventListener('scroll', sc);
        el.removeEventListener('keydown', kd);
        el.removeEventListener('input', inp);
      };
    });
    return () => disposers.forEach((fn) => fn && fn());
  }, []);

  // iOS input zoom prevention
  useEffect(() => {
    if (!isIOS || typeof document === 'undefined') return;
    let meta = document.querySelector('meta[name="viewport"]');
    const original = meta?.content;

    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      document.head.appendChild(meta);
    }

    const lock = () => {
      if (!/maximum-scale=1/.test(meta.content)) {
        meta.content = (original || meta.content) + ', maximum-scale=1';
      }
    };
    const unlock = () => {
      meta.content = original || 'width=device-width, initial-scale=1, viewport-fit=cover';
    };

    const onFocusIn = (e) => {
      const t = e.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) lock();
    };
    const onFocusOut = (e) => {
      const t = e.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) unlock();
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      if (original != null) meta.content = original;
    };
  }, [isIOS]);

  // ===== CapsLock tracking (keydown-only to avoid flicker) =====
  useEffect(() => {
    let current = capsLockOn; // persist within closure

    const onKeyDown = (e) => {
      if (e.key === 'CapsLock' || e.code === 'CapsLock') {
        current = !current; // manual toggle on CapsLock key
        setCapsLockOn(current);
        setShowCapsWarning(pwdFocused && !showPassword && current);
        return;
      }
      if (typeof e.getModifierState === 'function') {
        const on = e.getModifierState('CapsLock');
        if (on !== current) {
          current = on;
          setCapsLockOn(on);
        }
        if (pwdFocused && !showPassword) setShowCapsWarning(on);
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: true });
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pwdFocused, showPassword]);

  // Mobile heuristic for Caps/Shift lock
  const prevPasswordRef = useRef('');
  const mobileCapsHeuristic = (val) => {
    const letters = (val || '').replace(/[^A-Za-z]/g, '');
    const upper = (letters.match(/[A-Z]/g) || []).length;
    const lower = (letters.match(/[a-z]/g) || []).length;
    const warn = letters.length >= 2 && upper >= 2 && lower === 0;
    setShowCapsWarning(pwdFocused && !showPassword && warn);
    prevPasswordRef.current = val;
  };

  const normalizeDigits = (s) => {
    const m = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
                '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
    return (s || '').split('').map(ch => m[ch] ?? ch).join('');
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizeDigits(username.trim()), password }),
      });
      if (!res.ok) {
        setMessage('فشل تسجيل الدخول');
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      localStorage.setItem('user', JSON.stringify(data));
      if (typeof onLogin === 'function') onLogin(data);
      setMessage(`تم تسجيل الدخول باسم ${data.username}`);
      navigate('/home', { replace: true });
    } catch (err) {
      console.error(err);
      setMessage('حدث خطأ في الإتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const hasError = message && !message.includes('تم');

  return (
    <>
      <style>{`
        :root {
          --primary-color: #667eea;
          --secondary-color: #764ba2;
          --accent-color: #010B38;
          --accent-hover: #021452;
          --card-bg: #ffffff;
          --card-border: rgba(255, 255, 255, 0.3);
          --overlay-bg: rgba(0, 0, 0, 0.35);
          --input-bg: #fff;
          --input-border: #e2e2e2ff;
          --text-color: #343a40;
        }

        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { opacity: .7; }
          50% { opacity: 1; }
          100% { opacity: .7; }
        }
        .anim-text, .anim-card { opacity: 0; transform: translateY(18px); will-change: opacity, transform; }
        .anim-text.in  { animation: fadeUp 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .anim-card.in  { animation: fadeUp 700ms cubic-bezier(0.22, 1, 0.36, 1) 90ms forwards; }
        @media (prefers-reduced-motion: reduce) {
          .anim-text, .anim-card { animation: none !important; opacity: 1 !important; transform: none !important; }
        }

        .video-background { position: relative; min-height: 100vh; overflow: hidden; }
        .login-video {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; z-index: 0; opacity: 0; transition: opacity 1s ease-in-out;
        }
        .video-loaded { opacity: 1; }
        .video-overlay { position: absolute; inset: 0; background: var(--overlay-bg); z-index: 1; }

        .content-layer {
          position: relative; z-index: 2; min-height: 100vh;
          display: flex; align-items: center; justify-content: center; padding: 1.5rem;
        }

        .login-card {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.15);
          overflow: hidden;
          max-width: 540px; width: 100%;
        }

        .card-header-custom {
          background: #fff; color: #050035;
          text-align: center; padding: 2.5rem 2rem 2rem;
          border-bottom: 1px solid rgba(231, 224, 224, 0.15);
        }
        .welcome-text { margin: 0; }

        .card-body-custom { padding: 2rem 2.5rem 2.5rem; }

        .floating-label-container { position: relative; margin-bottom: 1.4rem; }
        .floating-label-container.has-error input { border-color: #dc3545 !important; background: #fff0f0; }

        .floating-label { position: relative; }
        .floating-label input {
          background: var(--input-bg);
          border: 2px solid var(--input-border);
          border-radius: 8px;
          color: var(--text-color);
          padding: 1rem 3.5rem 1rem 3.5rem; /* RTL: space for icons */
          font-size: 1rem;
          width: 100%;
          transition: all .3s ease;
          direction: rtl; text-align: right;
          -webkit-text-size-adjust: 100%;

          /* Keep inputs tidy; avoid inner scrolling bars (visual) */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior: contain;
          touch-action: manipulation;
        }
        .floating-label input::-webkit-scrollbar { display: none; }

        /* right-side field icon (Font Awesome) */
        .floating-label i.field-icon {
          position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
          color: var(--primary-color); transition: color .3s ease;
        }

        /* Eye toggle on the left for RTL */
        .toggle-password {
          position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
          background: transparent; border: none; padding: 0; cursor: pointer; line-height: 0;
        }
        .toggle-password i { color: var(--primary-color); }

        .caps-warning {
          background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px;
          color: #856404; padding: .5rem .75rem; font-size: .85rem; margin-top: .5rem;
          display: flex; align-items: center; gap: .5rem; animation: pulse 2s infinite;
          text-align: right; direction: rtl;
        }
        .caps-warning i { color: #f39c12; position: static !important; transform: none !important; }

        .global-error-message {
          text-align: center; color: #dc3545; background: rgba(220,53,69,.1);
          padding: .5rem 1rem; border-radius: 8px; font-size: .9rem;
          margin-top: -.5rem; margin-bottom: 1.2rem;
        }

        .btn-login {
          background: var(--accent-color); border: none; border-radius: 16px; color: #fff;
          font-weight: 600; padding: 1rem; width: 100%; font-size: 1.05rem;
          display: flex; align-items: center; justify-content: center; gap: .5rem;
          transition: all .3s ease;
        }
        .btn-login:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-2px); }
        .btn-login:disabled { opacity: .9; cursor: not-allowed; background: var(--accent-color); }

        @media (min-width: 1260px) {
          .login-wrapper { max-width: 460px; margin-left: 30px; margin-right: -100px; }
        }
        @media (min-width: 768px) and (max-width: 991.98px) {
          .login-wrapper { max-width: 430px; margin-left: auto; margin-right: auto; }
        }

        @media (max-width: 576.98px) {
          .card-header-custom { padding: 1.4rem 1rem 1rem; }
          .card-body-custom { padding: 1.25rem 1.25rem 1.4rem; }
          .floating-label input { font-size: 16px; padding: .9rem 3rem; border-radius: 10px; }
          .floating-label-container { margin-bottom: .95rem; }
          .btn-login { font-size: .95rem; padding: .7rem 1rem; border-radius: 12px; }
          .caps-warning { font-size: .8rem; padding: .4rem .6rem; }
        }
      `}</style>

      <div className="d-flex flex-column min-vh-100" style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
        <Header />
        <div className="video-background bg-black">
          <video
            className={`login-video ${videoLoaded ? 'video-loaded' : ''}`}
            autoPlay muted loop playsInline preload="auto"
            poster="/assets/loop2-fallback.jpg"
            onCanPlayThrough={() => setVideoLoaded(true)}
          >
            <source src="/assets/loop2.mp4" type="video/mp4" />
            المتصفح لا يدعم عرض الفيديو.
          </video>
          <div className="video-overlay"></div>

          <div className="content-layer">
            <div className="container">
              <div className="row justify-content-center" style={{ minHeight: '100vh', alignItems: 'center', paddingBottom: '28vh' }}>
                {/* LEFT TEXT COLUMN — hidden on md and below */}
                <div className={`col-lg-7 d-none d-lg-block justify-content-center p-4 rounded anim-text ${mounted ? 'in' : ''}`} dir="rtl" lang="ar">
                  <h1 className="mb-3 text-lg-end" style={{ color: 'rgba(209, 209, 209, 1)' }}>أهمية معايير التحول الرقمي</h1>
                  <p className="fw-light mt-4" style={{ fontSize: 25, color: 'rgba(209, 209, 209, 1)', textAlign: 'justify', lineHeight: 1.8 }}>
                    تُعد معايير التحول الرقمي من الركائز الأساسية التي تعتمد عليها الهيئة الملكية في تحقيق رؤيتها نحو مدينة صناعية ذكية ومستدامة.
                    تسهم هذه المعايير في ضمان توحيد الإجراءات، وتحقيق التكامل بين الأنظمة، وتعزيز الكفاءة التشغيلية عبر مختلف القطاعات.
                    كما تضمن هذه المعايير قابلية التوسع والتحديث المستمر للأنظمة الرقمية، بما يدعم استدامة التطوير التقني ويعزز موقع المدن الصناعية كمركز صناعي وتقني رائد في المملكة.
                  </p>
                </div>

                {/* RIGHT LOGIN COLUMN */}
                <div className="col-lg-5 col-md-8 col-sm-10 order-1 order-lg-2 login-wrapper mt-5 mt-lg-0">
                  <div className={`login-card anim-card ${mounted ? 'in' : ''}`}>
                    <div className="card-header-custom">
                      <h2 className="welcome-text">تسجيل الدخول</h2>
                    </div>

                    <div className="card-body-custom">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleLogin();
                        }}
                      >
                        {/* Username */}
                        <div className={`floating-label-container ${hasError ? 'has-error' : ''}`}>
                          <div className="floating-label">
                            <input
                              ref={usernameRef}
                              type="text"
                              placeholder="اسم المستخدم"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              inputMode="text"
                              autoComplete="username"
                              autoCorrect="off"
                              spellCheck={false}
                              required
                              disabled={isLoading}
                            />
                            <i className={`fas ${hasError ? 'fa-times-circle text-danger' : 'fa-user'} field-icon`}></i>
                          </div>
                        </div>

                        {/* Password */}
                        <div className={`floating-label-container ${hasError ? 'has-error' : ''}`}>
                          <div className="floating-label">
                            <input
                              ref={passwordRef}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="كلمة المرور"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (isMobile) mobileCapsHeuristic(e.target.value);
                              }}
                              onFocus={() => {
                                setPwdFocused(true);
                                setShowCapsWarning(!showPassword && capsLockOn);
                              }}
                              onBlur={() => {
                                setPwdFocused(false);
                                setShowCapsWarning(false);
                              }}
                              style={{ textTransform: 'none' }}
                              autoCapitalize="off"
                              autoComplete="current-password"
                              inputMode="text"
                              autoCorrect="off"
                              spellCheck={false}
                              required
                              disabled={isLoading}
                            />
                            <i className={`fas ${hasError ? 'fa-times-circle text-danger' : 'fa-lock'} field-icon`}></i>

                            {/* Toggle password visibility */}
                            <button
                              type="button"
                              className="toggle-password"
                              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                              onClick={() =>
                                setShowPassword((prev) => {
                                  const next = !prev;
                                  setShowCapsWarning(pwdFocused && !next && capsLockOn);
                                  return next;
                                })
                              }
                              disabled={isLoading}
                              tabIndex={-1}
                            >
                              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>

                          {showCapsWarning && (
                            <div className="caps-warning" role="status" aria-live="polite">
                              <i className="fas fa-exclamation-triangle"></i>
                              <span>تحذير: مفتاح (Caps) مفعل</span>
                            </div>
                          )}
                        </div>

                        {hasError && <div className="global-error-message">{message}</div>}

                        <div className="text-end mb-3">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowForgotModal(true);
                            }}
                          >
                            نسيت كلمة المرور؟
                          </a>
                        </div>

                        <button type="submit" className="btn btn-login" disabled={isLoading}>
                          {isLoading ? (
                            <div className="spinner-border text-light" role="status" style={{ width: '1.2rem', height: '1.2rem' }}>
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          ) : (
                            <>
                              <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                              <span>دخول</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
                {/* END RIGHT LOGIN COLUMN */}
              </div>
            </div>
          </div>
        </div>

        <Footer />
        <ForgotPasswordModal show={showForgotModal} onHide={() => setShowForgotModal(false)} apiBase={API_BASE} />
      </div>
    </>
  );
}
