import React, { useState } from 'react';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';

export default function Profile() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(stored);
  const [form, setForm] = useState({
    username: stored.username || '',
    first_name: stored.first_name || '',
    last_name: stored.last_name || '',
    email: stored.email || ''
  });

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { op: 'replace', path: '/Username', value: form.username },
          { op: 'replace', path: '/First_name', value: form.first_name },
          { op: 'replace', path: '/Last_name', value: form.last_name },
          { op: 'replace', path: '/Email', value: form.email }
        ])
      });
      if (res.ok) {
        const updated = { ...user, ...form };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        alert('تم تحديث البيانات');
      } else {
        alert('فشل التحديث');
      }
    } catch {
      alert('فشل التحديث');
    }
  };

  // Password change
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const sendCode = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/login/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, email: user.email })
      });
      if (res.ok) {
        setCodeSent(true);
        alert('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      } else {
        alert('تعذر إرسال الرمز');
      }
    } catch {
      alert('تعذر إرسال الرمز');
    }
  };

  const verifyCode = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, email: user.email, code })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.valid) {
        setVerified(true);
        alert('تم التحقق من الرمز');
      } else {
        alert(data?.message || 'الرمز غير صحيح');
      }
    } catch {
      alert('الرمز غير صحيح');
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 8) {
      alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/login/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          email: user.email,
          code,
          newPassword
        })
      });
      if (res.ok) {
        alert('تم تغيير كلمة المرور');
        setCode('');
        setNewPassword('');
        setCodeSent(false);
        setVerified(false);
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.message || 'فشل تغيير كلمة المرور');
      }
    } catch {
      alert('فشل تغيير كلمة المرور');
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />
      <div id="wrapper" style={{ display: 'flex', flexDirection: 'row' }}>
        <Sidebar />
        <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
          <div id="content" className="flex-grow-1">
            <div className="container-fluid">
              <div className="row p-4">
                <div className="col-12">
                  <Breadcrumbs />
                </div>
              </div>

              <div className="row justify-content-center">
                <div className="col-12 col-xl-6">
                  <form onSubmit={updateProfile} className="card p-4 mb-4">
                    <h5 className="mb-3">تحديث البيانات</h5>
                    <div className="mb-3">
                      <label className="form-label">اسم المستخدم</label>
                      <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">الاسم الأول</label>
                      <input type="text" className="form-control" name="first_name" value={form.first_name} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">اسم العائلة</label>
                      <input type="text" className="form-control" name="last_name" value={form.last_name} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">البريد الإلكتروني</label>
                      <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
                    </div>
                    <button type="submit" className="btn btn-primary">حفظ</button>
                  </form>

                  <div className="card p-4">
                    <h5 className="mb-3">تغيير كلمة المرور</h5>
                    {!codeSent && (
                      <button type="button" className="btn btn-secondary" onClick={sendCode}>إرسال رمز التحقق</button>
                    )}
                    {codeSent && !verified && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">رمز التحقق</label>
                          <input type="text" className="form-control" value={code} onChange={e => setCode(e.target.value)} />
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={verifyCode}>تحقق</button>
                      </>
                    )}
                    {verified && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">كلمة المرور الجديدة</label>
                          <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <button type="button" className="btn btn-primary" onClick={changePassword}>تحديث كلمة المرور</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}

