import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';

export default function Profile() {
  const stored = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const [user, setUser] = useState(stored);

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');

  // ---------- THEME ----------
  const LocalTheme = () => (
    <style>{`
      :root {
        --radius: 14px; --shadow: 0 10px 24px rgba(16,24,40,.08);
        --surface:#fff; --surface-muted:#fbfdff; --stroke:#eef2f7; --text:#0b2440;

        --skeleton-bg: #e9edf3; --skeleton-sheen: rgba(255,255,255,.6);
        --skeleton-speed: 1.2s;
        
      }
      .card-like{
        background: var(--surface);
        border: 1px solid var(--stroke);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        overflow: hidden;            /* show rounded corners */
        -webkit-mask-image: -webkit-radial-gradient(white, black); /* Safari edge case */
      }
      .head-flat{padding:12px 16px;background:var(--surface-muted);border-bottom:1px solid var(--stroke);color:var(--text);font-weight:700;}
      .stepper{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:14px}
      .step-dot{width:32px;height:32px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:700}
      .step-dot.active{background:#0d6efd;color:#fff}
      .step-dot.inactive{background:#f1f5f9;color:#0b2440}
      .step-line{height:2px;flex:1;border-radius:1px;background:#dee2e6}
      .step-line.active{background:#0d6efd}
      .rounded-soft{border-radius:var(--radius)!important;}

      /* Skeleton */
      .skel{position:relative;overflow:hidden;background:var(--skeleton-bg);display:block;border-radius:8px;min-height:1rem}
      .skel::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%);animation:shimmer var(--skeleton-speed) infinite}
      @keyframes shimmer{100%{transform:translateX(100%)}}
      @media (prefers-reduced-motion: reduce){.skel::after{animation:none}}

      .skel-input{height:38px;border-radius:10px}
      .skel-btn{height:38px;width:120px;border-radius:999px}
      .skel-label{height:14px;width:140px}
    `}</style>
  );

  // ---------- Global top banner (PROFILE only) — normal (auto-dismiss) ----------
  const [banner, setBanner] = useState({ type: null, text: '' });
  const showBanner = (type, text) => setBanner({ type, text });

  useEffect(() => {
    if (!banner.type) return;
    const t = setTimeout(() => setBanner({ type: null, text: '' }), 8000);
    return () => clearTimeout(t);
  }, [banner.type]);

  // ---------- Profile form ----------
  const [form, setForm] = useState({
    username: stored.username || '',
    first_name: stored.first_name || '',
    last_name: stored.last_name || '',
    email: stored.email || ''
  });

  // === NEW: all users for duplicate checks ===
  const [allUsers, setAllUsers] = useState([]);
  const [usernameError, setUsernameError] = useState('');

  // Load all users (for client-side duplicate detection). If it fails (e.g. permissions), we’ll still rely on server 409.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users`);
        if (!res.ok) return;
        const list = await res.json();
        if (alive) setAllUsers(Array.isArray(list) ? list : []);
      } catch {}
    })();
    return () => { alive = false; };
  }, [API_BASE]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'username') {
      // live check against allUsers (ignore current user)
      const trimmed = (value || '').trim().toLowerCase();
      const currentId = user?.employee_id ?? user?.id;
      const currentUsername = (user?.username || '').trim().toLowerCase();

      // If not changed from original, no error
      if (trimmed === currentUsername) {
        setUsernameError('');
        return;
      }
      // If we have users list, check duplicates
      if (allUsers.length) {
        const taken = allUsers.some(u =>
          (u?.employee_id ?? u?.id) !== currentId &&
          (u?.username || '').trim().toLowerCase() === trimmed
        );
        setUsernameError(taken ? 'اسم المستخدم مستخدم بالفعل' : '');
      } else {
        // No list available → don’t block typing; server will enforce
        setUsernameError('');
      }
    }
  };

  // Skeleton + refresh for profile block
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [useSkeleton, setUseSkeleton] = useState(false);
  const LOAD_MIN_MS = 450;

  const refreshUser = async () => {
    const userId = user?.employee_id ?? user?.id;
    if (!userId) {
      showBanner('danger', 'معرّف المستخدم غير معروف.');
      return;
    }
    setUseSkeleton(true);
    setLoadingProfile(true);
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`);
      if (!res.ok) throw new Error('HTTP');
      const data = await res.json();

      const updated = {
        ...user,
        employee_id: data.employee_id ?? data.id ?? userId,
        username: data.username ?? data.Username ?? user.username,
        first_name: data.first_name ?? data.First_name ?? user.first_name,
        last_name: data.last_name ?? data.Last_name ?? user.last_name,
        email: data.email ?? data.Email ?? user.email,
        department_id: data.department_id ?? user.department_id,
        role: data.role ?? user.role,
        password: data.password ?? user.password
      };
      setUser(updated);
      setForm({
        username: updated.username || '',
        first_name: updated.first_name || '',
        last_name: updated.last_name || '',
        email: updated.email || ''
      });
      localStorage.setItem('user', JSON.stringify(updated));
    } catch {
      showBanner('danger', 'تعذر تحديث بيانات الحساب الآن.');
    } finally {
      const elapsed = performance.now() - t0;
      const finish = () => { setLoadingProfile(false); setUseSkeleton(false); };
      if (elapsed < LOAD_MIN_MS) setTimeout(finish, LOAD_MIN_MS - elapsed); else finish();
    }
  };

  // ---------- Utilities ----------
  const normalizeDigits = (s = '') => {
    const map = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
    return String(s).replace(/[٠-٩۰-۹]/g, ch => map[ch] || ch);
  };
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const maskEmail = (email) => {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    const visible = local.slice(0, 2);
    const masked = '*'.repeat(Math.max(1, local.length - 2));
    return `${visible}${masked}@${domain}`;
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    const userId = user?.employee_id ?? user?.id;
    if (!userId) {
      showBanner('danger', 'معرّف المستخدم غير معروف.');
      return;
    }

    // Final duplicate guard (client-side)
    const newName = (form.username || '').trim().toLowerCase();
    const oldName = (user?.username || '').trim().toLowerCase();
    if (newName !== oldName && allUsers.length) {
      const taken = allUsers.some(u =>
        (u?.employee_id ?? u?.id) !== userId &&
        (u?.username || '').trim().toLowerCase() === newName
      );
      if (taken) {
        setUsernameError('اسم المستخدم مستخدم بالفعل');
        showBanner('danger', 'اسم المستخدم مستخدم بالفعل. اختر اسمًا آخر.');
        return;
      }
    }

    try {
      // Try PATCH
      let res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json-patch+json' },
        body: JSON.stringify([
          { op: 'replace', path: '/username',   value: form.username },
          { op: 'replace', path: '/first_name', value: form.first_name },
          { op: 'replace', path: '/last_name',  value: form.last_name },
          { op: 'replace', path: '/email',      value: form.email }
        ])
      });

      // Fallback to PUT
      if (!res.ok) {
        const full = {
          employee_id: userId,
          username: form.username,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          department_id: user.department_id,
          role: user.role,
          password: user.password
        };
        res = await fetch(`${API_BASE}/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(full)
        });
      }

      if (res.ok) {
        const updated = { ...user, ...form };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        showBanner('success', 'تم تحديث البيانات بنجاح.');

        // Refresh users cache (so subsequent checks reflect the new username)
        try {
          const list = await fetch(`${API_BASE}/api/users`).then(r => r.ok ? r.json() : []);
          if (Array.isArray(list)) setAllUsers(list);
        } catch {}
      } else {
        if (res.status === 409) {
          // Server uniqueness enforcement
          setUsernameError('اسم المستخدم مستخدم بالفعل');
          showBanner('danger', 'اسم المستخدم مستخدم بالفعل.');
        } else {
          const data = await res.json().catch(() => null);
          showBanner('danger', data?.title || data?.message || 'فشل تحديث البيانات.');
        }
      }
    } catch {
      showBanner('danger', 'فشل تحديث البيانات.');
    }
  };

  // ---------- Password change (3 steps, stacked) ----------
  const [pwStep, setPwStep] = useState(1);        // 1 → 2 → 3
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expiryAt, setExpiryAt] = useState(null);
  const [lastMinute, setLastMinute] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Password-section banner (persistent, inside the card)
  const [pwBanner, setPwBanner] = useState({ type: null, text: '' });
  const showPwBanner = (type, text) => setPwBanner({ type, text });

  useEffect(() => {
    if (!expiryAt) { setLastMinute(false); return; }
    const id = setInterval(() => {
      const remain = expiryAt - Date.now();
      setLastMinute(remain > 0 && remain <= 60000);
      if (remain <= 0) { setExpiryAt(null); setLastMinute(false); }
    }, 1000);
    return () => clearInterval(id);
  }, [expiryAt]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendCode = async () => {
    if (!form.username.trim() || !validateEmail(form.email.trim())) {
      showPwBanner('warning', 'تأكد من صحة البريد الإلكتروني في بياناتك أولاً ثم احفظ.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username.trim(), email: form.email.trim() })
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setPwStep(2);
        setCooldown(60);
        const sec = (data?.secondsLeft && Number.isFinite(data.secondsLeft)) ? data.secondsLeft : 5 * 60;
        setExpiryAt(Date.now() + sec * 1000);
        showPwBanner('success', `تم إرسال رمز التحقق إلى ${form.email.trim()}. إذا لم تصلك الرسالة خلال دقيقة، يرجى التحقق من مجلد الرسائل غير المرغوب فيها (Spam).`);
      } else if (res.status === 404) {
        showPwBanner('warning', 'المستخدم غير موجود أو البريد الإلكتروني غير مطابق');
      } else {
        showPwBanner('danger', data?.message || 'تعذر إرسال الرمز');
      }
    } catch {
      showPwBanner('danger', 'تعذر إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const norm = normalizeDigits(code).replace(/\D/g, '').slice(0, 6);
    if (norm.length !== 6) return showPwBanner('warning', 'أدخل رمزًا مكوّنًا من 6 أرقام');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username.trim(), email: form.email.trim(), code: norm })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.valid) {
        setPwStep(3);
        if (Number.isFinite(data.secondsLeft)) setExpiryAt(Date.now() + data.secondsLeft * 1000);
        showPwBanner('success', 'تم التحقق من الرمز.');
      } else {
        showPwBanner('danger', data?.message || 'الرمز غير صحيح أو منتهي');
      }
    } catch {
      showPwBanner('danger', 'الرمز غير صحيح أو منتهي');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0) return;
    await sendCode();
  };

  const changePassword = async () => {
    const norm = normalizeDigits(code).replace(/\D/g, '').slice(0, 6);
    if (norm.length !== 6) { setPwStep(2); return showPwBanner('warning', 'أدخل رمزًا مكوّنًا من 6 أرقام'); }
    if (!(newPassword && newPassword.length >= 8)) return showPwBanner('warning', 'الحد الأدنى ٨ أحرف');
    if (newPassword !== confirm) return showPwBanner('warning', 'كلمتا المرور غير متطابقتين');

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          code: norm,
          newPassword
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        showPwBanner('success', 'تم تغيير كلمة المرور بنجاح.');
        setPwStep(1); setCode(''); setNewPassword(''); setConfirm(''); setCooldown(0); setExpiryAt(null); setLastMinute(false);
      } else {
        showPwBanner('danger', data?.message || 'فشل تغيير كلمة المرور'); setPwStep(2);
      }
    } catch {
      showPwBanner('danger', 'فشل تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif', backgroundColor: '#f6f8fb', minHeight: '100vh' }}>
      <LocalTheme />
      <Header />

      {/* Global top banner — PROFILE section only (normal: auto-dismiss) */}
      {banner.type && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className={`alert alert-${banner.type} mb-0`} role="alert">
            {banner.text}
          </div>
        </div>
      )}

      <div id="wrapper" style={{ display: 'flex', flexDirection: 'row' }}>
        <Sidebar />
        <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
          <div id="content" className="flex-grow-1">
            <div className="container-fluid">
              <div className="row p-4">
                <div className="col-12"><Breadcrumbs /></div>
              </div>

              {/* ===== تحديث البيانات — FULL WIDTH ===== */}
              <div className="row justify-content-center mb-4">
                <div className="col-12 col-xl-11">
                  <div className="card-like">
                    <div className="head-flat d-flex align-items-center justify-content-between">
                      <span>تحديث البيانات</span>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm btn-update"
                        onClick={refreshUser}
                        disabled={loadingProfile}
                      >
                        {loadingProfile ? <span className="spinner-border spinner-border-sm ms-1" /> : <i className="fas fa-rotate-right" />}
                        تحديث
                      </button>
                    </div>

                    {/* Form or Skeleton */}
                    <form onSubmit={updateProfile} className="p-4">
                      {useSkeleton ? (
                        <>
                          <div className="row g-3">
                            <div className="col-12 col-md-6">
                              <div className="skel skel-label mb-2" />
                              <div className="skel skel-input" />
                            </div>
                            <div className="col-12 col-md-6">
                              <div className="skel skel-label mb-2" />
                              <div className="skel skel-input" />
                            </div>
                            <div className="col-12 col-md-6">
                              <div className="skel skel-label mb-2" />
                              <div className="skel skel-input" />
                            </div>
                            <div className="col-12 col-md-6">
                              <div className="skel skel-label mb-2" />
                              <div className="skel skel-input" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="skel skel-btn" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="row g-3">
                            <div className="col-12 col-md-6">
                              <label className="form-label">اسم المستخدم</label>
                              <input
                                type="text"
                                className={`form-control ${usernameError ? 'is-invalid' : ''}`}
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                              />
                              {usernameError && (
                                <div className="invalid-feedback d-block">{usernameError}</div>
                              )}
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">البريد الإلكتروني</label>
                              <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">الاسم الأول</label>
                              <input type="text" className="form-control" name="first_name" value={form.first_name} onChange={handleChange} />
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">اسم العائلة</label>
                              <input type="text" className="form-control" name="last_name" value={form.last_name} onChange={handleChange} />
                            </div>
                          </div>
                          <div className="mt-3 d-flex gap-2">
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={!!usernameError}
                            >
                              حفظ
                            </button>
                          </div>
                        </>
                      )}
                    </form>
                  </div>
                </div>
              </div>

              {/* ===== تغيير كلمة المرور — UNDER it, full width ===== */}
              <div className="row justify-content-center">
                <div className="col-12 col-xl-11">
                  <div className="card-like">
                    <div className="head-flat">تغيير كلمة المرور</div>

                    {/* Stepper */}
                    <div className="px-4 pt-3">
                      <div className="stepper">
                        <div className={`step-dot ${pwStep >= 1 ? 'active' : 'inactive'}`}>1</div>
                        <div className={`step-line ${pwStep >= 2 ? 'active' : ''}`} />
                        <div className={`step-dot ${pwStep >= 2 ? 'active' : 'inactive'}`}>2</div>
                        <div className={`step-line ${pwStep >= 3 ? 'active' : ''}`} />
                        <div className={`step-dot ${pwStep >= 3 ? 'active' : 'inactive'}`}>3</div>
                      </div>

                      {/* Password-section banners (persistent) */}
                      {lastMinute && (
                        <div className="alert alert-warning py-2 text-center rounded-soft mb-2">
                          آخر دقيقة لاستخدام الرمز
                        </div>
                      )}
                      {pwBanner.type && (
                        <div className={`alert alert-${pwBanner.type} d-flex align-items-center justify-content-between py-2 rounded-soft mb-0`} role="alert">
                          <span>{pwBanner.text}</span>
                          <button type="button" className="btn-close" aria-label="Close" onClick={() => setPwBanner({ type: null, text: '' })} />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {pwStep === 1 && (
                        <>
                          <div className="mb-2 text-muted">
                            سيتم إرسال رمز تحقق إلى بريدك: <span className="fw-semibold">{(form.email)}</span>
                          </div>
                          <div className="d-flex gap-2">
                            <button type="button" className="btn btn-primary" onClick={sendCode} disabled={loading}>
                              {loading ? <span className="spinner-border spinner-border-sm ms-1" /> : null}
                              إرسال رمز التحقق
                            </button>
                          </div>
                        </>
                      )}

                      {pwStep === 2 && (
                        <>
                          <div className="mb-3">
                            <label className="form-label">رمز التحقق</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              className="form-control text-center fw-bold"
                              style={{ letterSpacing: '0.5em', fontSize: '1.25rem' }}
                              value={code}
                              onChange={(e) => {
                                const norm = normalizeDigits(e.target.value).replace(/\D/g, '').slice(0, 6);
                                setCode(norm);
                              }}
                              placeholder="••••••"
                              autoFocus
                              disabled={loading}
                            />
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <button type="button" className="btn btn-outline-secondary btn-sm rounded" onClick={() => setPwStep(1)} disabled={loading}>
                              الرجوع
                            </button>
                            <button
                              type="button"
                              className="btn btn-link p-0"
                              onClick={resendCode}
                              disabled={loading || cooldown > 0}
                              title={cooldown > 0 ? `يمكن إعادة الإرسال بعد ${cooldown}ث` : 'إعادة إرسال الرمز'}
                            >
                              {cooldown > 0 ? `إعادة الإرسال (${cooldown})` : 'إعادة إرسال الرمز'}
                            </button>
                          </div>
                          <div className="d-flex gap-2">
                            <button type="button" className="btn btn-primary" onClick={verifyCode} disabled={loading || code.length !== 6}>
                              التحقق من الرمز
                            </button>
                          </div>
                        </>
                      )}

                      {pwStep === 3 && (
                        <>
                          <div className="row g-3">
                            <div className="col-12 col-md-6">
                              <label className="form-label">كلمة المرور الجديدة</label>
                              <input
                                type="password"
                                className="form-control"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="٨ أحرف على الأقل"
                                style={{ textTransform: 'none' }}
                                autoCapitalize="off"
                                autoComplete="new-password"
                                autoFocus
                                disabled={loading}
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">تأكيد كلمة المرور</label>
                              <input
                                type="password"
                                className="form-control"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="أعد كتابة كلمة المرور"
                                style={{ textTransform: 'none' }}
                                autoCapitalize="off"
                                autoComplete="new-password"
                                disabled={loading}
                              />
                              {(newPassword || confirm) && (newPassword !== confirm || newPassword.length < 8) && (
                                <div className="text-danger small mt-1">كلمتا المرور غير متطابقتين أو قصيرة جدًا.</div>
                              )}
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <button type="button" className="btn btn-outline-secondary btn-sm rounded" onClick={() => setPwStep(2)} disabled={loading}>
                              الرجوع للتحقق
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={changePassword}
                              disabled={loading || !(newPassword.length >= 8 && newPassword === confirm)}
                            >
                              {loading ? <span className="spinner-border spinner-border-sm ms-1" /> : null}
                              تغيير كلمة المرور
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: 140 }} />
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
