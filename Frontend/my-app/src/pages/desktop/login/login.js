import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Header.jsx';
import Footer from '../../../components/Footer.jsx';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
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
      setMessage('خطأ في الشبكة');
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
          --card-bg: rgba(255, 255, 255, 0.85);
          --card-border: rgba(255, 255, 255, 0.3);
          --overlay-bg: rgba(0, 0, 0, 0.35);
          --input-bg: #fff;
          --input-border: #fff;
          --text-color: #343a40;
        }

        @keyframes gradientShine {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        .video-background {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
        }

        .video-background video {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
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
          background: linear-gradient(-45deg, #667eea, #764ba2, #667eea);
          background-size: 300% 300%;
          color: white;
          text-align: center;
          padding: 2.5rem 2rem 2rem;
          animation: gradientShine 6s ease infinite;
          border-bottom: 1px solid rgba(255,255,255,0.15);
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

        .floating-label input {
          background: var(--input-bg);
          border: 2px solid var(--input-border);
          border-radius: 16px;
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

        @media (min-width: 992px) {
          .login-wrapper {
            max-width: 460px;
            margin-left: 30px;
            margin-right: -100px;
          }
        }
      `}</style>

      <div className="d-flex flex-column min-vh-100">
        <Header />
        <div className="video-background">
          <video autoPlay muted loop playsInline>
            <source src="/assets/loop2.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay"></div>

          <div className="content-layer">
            <div className="container">
              <div className="row justify-content-center" style={{ minHeight: '100vh', alignItems: 'center', paddingBottom: '28vh' }}>
                <div className="col-lg-6 col-md-8 mb-4 mb-lg-0 order-2 order-lg-1">
                  <div className="info-card d-none d-lg-block">
                    <h1 className="info-title">عن التحول الرقمي</h1>
                    <p className="info-description mb-0">
                      التحول الرقمي هو استخدام التكنولوجيا لتحسين الخدمات والعمليات،
                      مثل تحويل المعاملات الورقية إلى إلكترونية، بهدف زيادة الكفاءة
                      وتسهيل حياة الأفراد.
                    </p>
                  </div>
                </div>

                <div className="col-lg-5 col-md-8 col-sm-10 order-1 order-lg-2 login-wrapper mt-5 mt-lg-0">
                  <div className="login-card">
                    <div className="card-header-custom">
                      <h4 className="welcome-text">تسجيل الدخول</h4>
                    </div>
                    <div className="card-body-custom">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin();
                      }}>
                        <div className={`floating-label-container ${hasError ? 'has-error' : ''}`}>
                          <div className="floating-label">
                            <input
                              type="text"
                              placeholder="اسم المستخدم"
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
                          <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>
                            نسيت كلمة المرور؟
                          </a>
                        </div>

                        <button type="submit" className="btn btn-login" disabled={isLoading}>
                          {isLoading ? (
                            <div className="spinner-border text-light" role="status" style={{ width: '1.3rem', height: '1.3rem' }}>
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
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
