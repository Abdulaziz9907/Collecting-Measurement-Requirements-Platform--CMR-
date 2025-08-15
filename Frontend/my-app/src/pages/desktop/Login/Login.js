import React, { useState } from 'react';
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
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

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
      if (typeof onLogin === 'function') {
        onLogin(data);
      }
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
          --card-bg: rgba(255, 255, 255, 1);
          --card-border: rgba(255, 255, 255, 0.3);
          --overlay-bg: rgba(0, 0, 0, 0.35);
          --input-bg: #fff;
          --input-border: #e2e2e2ff;
          --text-color: #343a40;
        }

        .video-background {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
        }

        .login-video {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
          opacity: 0;
          transition: opacity 1s ease-in-out;
        }

        .video-loaded {
          opacity: 1;
        }

        .video-overlay {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          background: var(--overlay-bg);
          z-index: 1;
        }

        .content-layer {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .login-card {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.15);
          overflow: hidden;
          max-width: 540px;
          width: 100%;
        }

        .card-header-custom {
          position: relative;
          background: #FFFFFF;
          background-size: 400% 400%;
          color: white;
          text-align: center;
          padding: 2.5rem 2rem 2rem;
          border-bottom: 1px solid rgba(231, 224, 224, 0.15);
        }

        .card-body-custom {
          padding: 2rem 2.5rem 2.5rem;
        }

        .floating-label-container {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .floating-label-container.has-error input {
          border-color: #dc3545 !important;
          background: #fff0f0;
        }

        .floating-label-container.has-error i {
          color: #dc3545 !important;
        }

        .welcome-text{
          color: rgba(5, 0, 53, 1);
        }

        .floating-label input {
          background: var(--input-bg);
          border: 2px solid var(--input-border);
          border-radius: 8px;
          color: var(--text-color);
          padding: 1rem 3.5rem 1rem 1.125rem;
          font-size: 1rem;
          width: 100%;
          transition: all 0.3s ease;
          direction: rtl;
          text-align: right;
        }

        .floating-label i {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--primary-color);
          transition: color 0.3s ease;
        }

        .global-error-message {
          text-align: center;
          color: #dc3545;
          background: rgba(220, 53, 69, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-top: -0.5rem;
          margin-bottom: 1.5rem;
        }

        .btn-login {
          background: var(--accent-color);
          border: none;
          border-radius: 16px;
          color: #fff;
          font-weight: 600;
          padding: 1rem;
          width: 100%;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .btn-login:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-3px);
        }

        .btn-login:disabled {
          opacity: 0.9;
          cursor: not-allowed;
          background: var(--accent-color);
        }

        .info-card {
          text-align: center;
          color: #fff;
        }

        .info-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .info-description {
          font-size: 1.1rem;
          line-height: 1.6;
        }


        @media (min-width: 1260px) {
          .login-wrapper {
            max-width: 460px;
            margin-left: 30px;
            margin-right: -100px;
          }
        }
      `}</style>

      <div className="d-flex flex-column min-vh-100 " style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
        <Header />
        <div className="video-background bg-black">
          <video
            className={`login-video ${videoLoaded ? 'video-loaded' : ''}`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/assets/loop2-fallback.jpg"
            onCanPlayThrough={() => setVideoLoaded(true)}
          >
            <source src="/assets/loop2.mp4" type="video/mp4" />
            المتصفح لا يدعم عرض الفيديو.
          </video>
          <div className="video-overlay"></div>

          <div className="content-layer">
            <div className="container">
              <div
                className="row justify-content-center"
                style={{ minHeight: '100vh', alignItems: 'center', paddingBottom: '28vh' }}
              >
           {/* LEFT TEXT COLUMN — hidden on md and below */}
<div
  className="col-lg-7 d-none d-lg-block justify-content-center bg-opacity-50 p-4 rounded"
  dir="rtl"
  lang="ar"
>
  <h1
    className="mb-3 text-lg-end"
    style={{ color: 'rgba(209, 209, 209, 1)' }}
  >
    أهمية معايير التحول الرقمي
  </h1>

  <p
    className="fw-light mt-4"
    style={{
      fontSize: '25px',
      color: 'rgba(209, 209, 209, 1)',
      textAlign: 'justify',      
      textAlignLast: 'right',
      lineHeight: 1.8
    }}
  >
    تُعد معايير التحول الرقمي من الركائز الأساسية التي تعتمد عليها الهيئة الملكية في تحقيق رؤيتها نحو
    مدينة صناعية ذكية ومستدامة. تسهم هذه المعايير في ضمان توحيد الإجراءات، وتحقيق التكامل بين الأنظمة،
    وتعزيز الكفاءة التشغيلية عبر مختلف القطاعات. كما تضمن هذه المعايير قابلية التوسع والتحديث المستمر
    للأنظمة الرقمية، بما يدعم استدامة التطوير التقني ويعزز موقع المدن الصناعية كمركز صناعي وتقني رائد في
    المملكة.
  </p>
</div>


                {/* RIGHT LOGIN COLUMN */}
                <div className="col-lg-5 col-md-8 col-sm-10 order-1 order-lg-2 login-wrapper mt-5 mt-lg-0">
                  <div className="login-card">
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
                        <div className={`floating-label-container ${hasError ? 'has-error' : ''}`}>
                          <div className="floating-label">
                              <input
                                type="text"
                                placeholder="اسم المستخدم أو رقم الموظف"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                              />
                            <i className={`fas ${hasError ? 'fa-times-circle text-danger' : 'fa-user'}`}></i>
                          </div>
                        </div>

                        <div className={`floating-label-container ${hasError ? 'has-error' : ''}`}>
                          <div className="floating-label">
                            <input
                              type="password"
                              placeholder="كلمة المرور"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              disabled={isLoading}
                            />
                            <i className={`fas ${hasError ? 'fa-times-circle text-danger' : 'fa-lock'}`}></i>
                          </div>
                        </div>

                        {hasError && <div className="global-error-message">{message}</div>}

                        <div className="text-end mb-3">
                          <a
                            href="#"
                            className="forgot-password"
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
                            <div
                              className="spinner-border text-light"
                              role="status"
                              style={{ width: '1.3rem', height: '1.3rem' }}
                            >
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          ) : (
                            <>
                              <i className="fas fa-sign-in-alt"></i>
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
        <ForgotPasswordModal
          show={showForgotModal}
          onHide={() => setShowForgotModal(false)}
          apiBase={API_BASE}
        />
      </div>
    </>
  );
}
