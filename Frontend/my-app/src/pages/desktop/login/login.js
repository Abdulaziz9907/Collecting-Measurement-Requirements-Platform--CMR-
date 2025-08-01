import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './login.module.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        setMessage('فشل تسجيل الدخول');
        return;
      }
      const data = await res.json();
      localStorage.setItem('user', JSON.stringify(data));
      if (typeof onLogin === 'function') {
        onLogin(data);
      }
      setMessage(`تم تسجيل الدخول باسم ${data.username}`);
      navigate('/standards', { replace: true });
    } catch (err) {
      console.error(err);
      setMessage('خطأ في الشبكة');
    }
  };

  return (
    <div className={styles.contain}>
      <div className={styles['scroll-view']}>
        <div className={styles.column}>

          {/* Header */}
          {/* <div className={styles['row-view']}>
            <img
              src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/lr49i5w1_expires_30_days.png"
              className={styles.image}
              alt="Notifications"
            />
            <div className={styles.navRow}>
              <span className={styles.navItem}>الرئيسية</span>
              <span className={styles.navItem}>عن المنصة</span>
              <span className={styles.navItem}>للتواصل</span>
            </div>
            <div className={styles.box2}></div>
            <span className={styles.text3}>منصة جمع متطلبات قياس</span>
            <img
              src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/3w0hbwu4_expires_30_days.png"
              className={styles.image2}
              alt="Logo"
            />
          </div> */}

          {/* Main Content */}
          <div
            className={styles['row-view3']}
            style={{
              backgroundImage:
                'url(https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/hfye9b1p_expires_30_days.png)'
            }}
          >
            {/* Left Column */}
            <div className={styles.column3}>
              <div className={styles.view3}>
                <span className={styles.text4}>عن التحول الرقمي</span>
              </div>
              <span className={styles.text5}>
                التحول الرقمي هو استخدام التكنولوجيا لتحسين الخدمات والعمليات، مثل تحويل المعاملات الورقية إلى إلكترونية، بهدف زيادة الكفاءة وتسهيل حياة الأفراد.
              </span>
              <div className={styles['row-view4']}>
                <img
                  src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/oiayap0x_expires_30_days.png"
                  className={styles.image3}
                  alt=""
                />
                <div className={styles['row-view5']}>
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/1csa65nz_expires_30_days.png"
                    className={styles.image4}
                    alt=""
                  />
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/n7cxzp26_expires_30_days.png"
                    className={styles.image5}
                    alt=""
                  />
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/inhn8lup_expires_30_days.png"
                    className={styles.image5}
                    alt=""
                  />
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/rmojleul_expires_30_days.png"
                    className={styles.image5}
                    alt=""
                  />
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/2ne99t4d_expires_30_days.png"
                    className={styles.image5}
                    alt=""
                  />
                </div>
                <img
                  src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/hqgs7uof_expires_30_days.png"
                  className={styles.image3}
                  alt=""
                />
              </div>
            </div>

            {/* Login Column */}
            <div
              className={styles.column4}
              // style={{ backgroundImage: 'url(https://i.imgur.com/1tMFzp8.png)' }}
            >
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleLogin();
                }}
                className={styles.loginForm}
              >
                <div className={styles.view4}>
                  <span className={styles.text6}>تسجيل دخول</span>
                </div>
                <input
                  placeholder="اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.input}
                />
                <input
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input2}
                  type="password"
                />
                <div className={styles.view5}>
                  <span className={styles.text7}>نسيت كلمة المرور؟</span>
                </div>
                <button className={styles.button} type="submit">
                  <span className={styles.text8}>دخول</span>
                </button>
                {message && <p className={styles.message}>{message}</p>}
              </form>
            </div>

            <img
              src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/92zky7kf_expires_30_days.png"
              className={styles['absolute-image']}
              alt=""
            />
          </div>

          {/* Footer */}
          <div className={styles.column5}>
            <div className={styles.view6}>
              <span className={styles.text9}>منصة جمع متطلبات قياس</span>
            </div>
            <div className={styles.view2}>
              <img
                src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/a7xc4gag_expires_30_days.png"
                className={styles.image6}
                alt=""
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
