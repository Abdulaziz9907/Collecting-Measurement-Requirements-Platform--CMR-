import React, { useState } from 'react';
import styles from './login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Logged in', data);
      } else {
        alert('Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login request error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>منصة جمع متطلبات قياس</h2>
        <h3 className={styles.subtitle}>تسجيل دخول</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="اسم المستخدم"
          />
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
          />
          <div className={styles.forgot}>نسيت كلمة المرور؟</div>
          <button type="submit" className={styles.button}>دخول</button>
        </form>
      </div>
    </div>
  );
}
