import React, { useState } from 'react';
import styles from './login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        setMessage('فشل تسجيل الدخول');
        return;
      }
      const data = await res.json();
      setMessage(`تم تسجيل الدخول باسم ${data.username}`);
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  return (
    <div className={styles.contain}>
      <div className={styles['scroll-view']}>
        <div className={styles.column}>
          <div className={styles['row-view']}>
            <img
              src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/lr49i5w1_expires_30_days.png"
              className={styles.image}
            />
            <div className={styles['row-view2']}>
              <div className={styles.view}>
                <div className={styles.column2}>
                  <span className={styles.text}>للتواصل</span>
                  <div className={styles.view2}>
                    <div className={styles.box}></div>
                  </div>
                </div>
              </div>
              <div className={styles.view}>
                <div className={styles.column2}>
                  <div className={styles.view2}>
                    <div className={styles.box}></div>
                  </div>
                  <span className={styles.text}>عن المنصة</span>
                </div>
              </div>
              <span className={styles.text2}>الرئيسية</span>
            </div>
            <div className={styles.box2}></div>
            <span className={styles.text3}>منصة جمع متطلبات قياس</span>
            <img
              src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/3w0hbwu4_expires_30_days.png"
              className={styles.image2}
            />
          </div>
          <div
            className={styles['row-view3']}
            style={{
              backgroundImage:
                'url(https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/hfye9b1p_expires_30_days.png)'
            }}
          >
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
                />
                <div className={styles['row-view5']}>
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/1csa65nz_expires_30_days.png"
                    className={styles.image4}
                  />
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/n7cxzp26_expires_30_days.png"
                    className={styles.image5}
                  />
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/inhn8lup_expires_30_days.png"
                    className={styles.image5}
                  />
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/rmojleul_expires_30_days.png"
                    className={styles.image5}
                  />
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/2ne99t4d_expires_30_days.png"
                    className={styles.image5}
                  />
                </div>
                <img
                  src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/hqgs7uof_expires_30_days.png"
                  className={styles.image3}
                />
              </div>
            </div>
            <div
              className={styles.column4}
              style={{ backgroundImage: 'url(https://i.imgur.com/1tMFzp8.png)' }}
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
              <button className={styles.button} onClick={handleLogin}>
                <span className={styles.text8}>دخول</span>
              </button>
              {message && <p className={styles.message}>{message}</p>}
            </div>
            <img
              src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/92zky7kf_expires_30_days.png"
              className={styles['absolute-image']}
            />
          </div>
          <div className={styles.column5}>
            <div className={styles.view6}>
              <span className={styles.text9}>منصة جمع متطلبات قياس</span>
            </div>
            <div className={styles.view2}>
              <img
                src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/a7xc4gag_expires_30_days.png"
                className={styles.image6}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
