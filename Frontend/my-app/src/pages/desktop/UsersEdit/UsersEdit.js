import React, { useEffect, useState, useRef } from 'react';
import './assets/bootstrap/css/bootstrap.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';
import { useParams, useNavigate } from 'react-router-dom';

export default function UsersEdit() {
  const [validated, setValidated] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]); // for duplicate checks
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [usernameError, setUsernameError] = useState('');
  const usernameRef = useRef(null);

  const [employeeIdInput, setEmployeeIdInput] = useState(''); // raw (may include Arabic digits)
  const [employeeIdError, setEmployeeIdError] = useState('');
  const employeeIdRef = useRef(null);

  const originalRoleRef = useRef(''); // lock Admin if original role is admin

  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');

  // 👁 نفس سلوك الأيقونة في صفحة تسجيل الدخول
  const [showPassword, setShowPassword] = useState(false);

  // Normalize Arabic/ASCII digits to ASCII
  const normalizeDigits = (str = '') => {
    const map = {
      '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
      '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'
    };
    return String(str).replace(/[٠-٩۰-۹]/g, ch => map[ch] || ch);
  };
  const toSevenDigitNumber = (val) => {
    const ascii = normalizeDigits(val).replace(/\D/g, '');
    if (ascii.length !== 7) return NaN;
    return parseInt(ascii, 10);
  };

  /* ===== Minimal theme + skeleton (matches other pages) ===== */
  const LocalTheme = () => (
    <style>{`
      :root{
        --radius:14px;
        --shadow:0 10px 24px rgba(16,24,40,.08);
        --surface:#fff;
        --surface-muted:#fbfdff;
        --stroke:#eef2f7;
        --skeleton-bg:#e9edf3;
        --skeleton-sheen:rgba(255,255,255,.6);
        --skeleton-speed:1.2s;
      }

      /* صفحة كاملة بمرونة عمودية لضمان التصاق الفوتر بأسفل الشاشة */
      .page-shell { min-height: 100dvh; display: flex; flex-direction: column; background:#f6f8fb; }

      /* الحاوية الرئيسية (السايدبار + المحتوى) تملأ المساحة المتبقية تحت الهيدر */
      #wrapper { display:flex; flex-direction:row; flex: 1 1 auto; min-height:0; }

      /* عمود المحتوى يمتد عموديًا ويمنع الانكماش */
      #content-wrapper { display:flex; flex-direction:column; flex:1 1 auto; min-height:0; }

      /* منطقة المحتوى تتمدد؛ لا نحتاج لأي spacer يدوي */
      #content { flex: 1 1 auto; min-height:0; }

      .surface {
        background:var(--surface);
        border:1px solid var(--stroke);
        border-radius:var(--radius);
        box-shadow:var(--shadow);
        overflow:hidden;
      }
      .head-flat {
        padding:12px 16px;
        background:var(--surface-muted);
        border-bottom:1px solid var(--stroke);
        display:flex; align-items:center; justify-content:space-between; gap:12px;
      }
      .head-match { height:56px; padding-block:10px; }
      .head-match > * { margin:0; }
      .body-flat { padding:16px; }

      .skel { position:relative; overflow:hidden; background:var(--skeleton-bg); display:inline-block; border-radius:6px; }
      .skel::after {
        content:""; position:absolute; inset:0; transform:translateX(-100%);
        background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%);
        animation:shimmer var(--skeleton-speed) infinite;
      }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .skel::after { animation:none; } }
      .skel-line  { height:14px; width:40%; }
      .skel-input { height:38px; width:100%; border-radius:8px; }
      .skel-btn   { height:38px; width:120px; border-radius:8px; }

      /* === Password field icons (match Login) === */
      .pwd-floating { position: relative; }
      .pwd-floating input.form-control {
        padding: .75rem 2.75rem; /* مساحة للأيقونتين يمين/يسار */
        direction: rtl; text-align: right;
      }
      .pwd-floating i.field-icon {
        position: absolute; right: .9rem; top: 50%; transform: translateY(-50%);
        color: #667eea; pointer-events: none;
      }
      .pwd-floating .toggle-password {
        position: absolute; left: .9rem; top: 50%; transform: translateY(-50%);
        background: transparent; border: none; padding: 0; line-height: 0; cursor: pointer;
      }
      .pwd-floating .toggle-password i { color: #667eea; }
    `}</style>
  );

  // Fetch departments, current user, and all users list (for duplicate checks)
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [depRes, userRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/api/departments`),
          fetch(`${API_BASE}/api/users/${id}`),
          fetch(`${API_BASE}/api/users`)
        ]);
        if (!depRes.ok || !userRes.ok || !usersRes.ok) throw new Error();
        const [depData, userData, usersData] = await Promise.all([
          depRes.json(), userRes.json(), usersRes.json()
        ]);
        if (isMounted) {
          originalRoleRef.current = String(userData?.role || '').toLowerCase();
          setDepartments(Array.isArray(depData) ? depData : []);
          setUser(userData || null);
          setAllUsers(Array.isArray(usersData) ? usersData : []);
          setEmployeeIdInput(userData?.employee_id != null ? String(userData.employee_id) : '');
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          originalRoleRef.current = '';
          setDepartments([]);
          setUser(null);
          setAllUsers([]);
          setEmployeeIdInput('');
          setIsLoading(false);
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [API_BASE, id]);

  // Auto-hide alerts
  useEffect(() => {
    if (showError || showSuccess) {
      const timer = setTimeout(() => { setShowError(false); setShowSuccess(false); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError, showSuccess]);

  // Duplicate helpers
  const isUsernameDuplicate = (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return false;
    const currentEmp = user?.employee_id;
    return (allUsers || []).some(u =>
      u?.employee_id !== currentEmp &&
      (u?.username || '').trim() === trimmed
    );
  };
  const isEmployeeIdDuplicate = (val) => {
    const num = toSevenDigitNumber(val);
    if (!Number.isFinite(num)) return false; // format error handled separately
    const currentEmp = user?.employee_id;
    return (allUsers || []).some(u => u?.employee_id !== currentEmp && Number(u?.employee_id) === num);
  };

  // Live checks
  const handleUsernameChange = (e) => {
    const input = e.target;
    input.setCustomValidity('');
    setUsernameError('');
    if (isUsernameDuplicate(input.value)) {
      input.setCustomValidity('اسم المستخدم مستخدم بالفعل');
      setUsernameError('اسم المستخدم مستخدم بالفعل');
    }
  };

  const handleEmployeeIdChange = (e) => {
    const input = e.target;
    const val = input.value;
    setEmployeeIdInput(val);
    input.setCustomValidity('');
    setEmployeeIdError('');

    // format: exactly 7 digits (Arabic or ASCII)
    const ascii = normalizeDigits(val).replace(/\D/g, '');
    if (ascii.length !== 7) {
      input.setCustomValidity('رقم الموظف يجب أن يكون 7 أرقام');
      setEmployeeIdError('رقم الموظف يجب أن يكون 7 أرقام');
      return;
    }
    // duplicate
    if (isEmployeeIdDuplicate(val)) {
      input.setCustomValidity('رقم الموظف مستخدم بالفعل');
      setEmployeeIdError('رقم الموظف مستخدم بالفعل');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setShowSuccess(false);
    setShowError(false);

    // clear custom validity
    form.username.setCustomValidity('');
    setUsernameError('');
    form.employee_id.setCustomValidity('');
    setEmployeeIdError('');

    // re-check at submit time
    const newUsername = (form.username.value || '').trim();
    if (isUsernameDuplicate(newUsername)) {
      form.username.setCustomValidity('اسم المستخدم مستخدم بالفعل');
      setUsernameError('اسم المستخدم مستخدم بالفعل');
    }
    const newEmpNum = toSevenDigitNumber(employeeIdInput);
    if (!Number.isFinite(newEmpNum)) {
      form.employee_id.setCustomValidity('رقم الموظف يجب أن يكون 7 أرقام');
      setEmployeeIdError('رقم الموظف يجب أن يكون 7 أرقام');
    } else if (isEmployeeIdDuplicate(employeeIdInput)) {
      form.employee_id.setCustomValidity('رقم الموظف مستخدم بالفعل');
      setEmployeeIdError('رقم الموظف مستخدم بالفعل');
    }

    if (!form.checkValidity()) {
      setShowError(true);
      e.stopPropagation();
      setValidated(true);
      if (form.username.validationMessage && usernameRef.current) {
        usernameRef.current.focus();
      } else if (form.employee_id.validationMessage && employeeIdRef.current) {
        employeeIdRef.current.focus();
      }
      return;
    }

    setIsSubmitting(true);

    // Use original employee_id in the URL so the backend can locate the record,
    // and send the new employee_id in the payload (to update it).
    const originalEmpId = user?.employee_id;

    const newPassword = form.password ? (form.password.value || '').trim() : '';
    const selectedRole = form.role ? (form.role.value || '').trim() : (user?.role || '').trim();
    const isAdminOriginal = (originalRoleRef.current === 'admin'); // lock if originally admin
    const finalRole = isAdminOriginal ? 'Admin' : selectedRole;

    const payload = {
      employee_id: newEmpNum,
      username: newUsername,
      first_name: (form.first_name.value || '').trim(),
      last_name: (form.last_name.value || '').trim(),
      email: (form.email.value || '').trim() || null,
      role: finalRole,
      department_id: parseInt(form.department.value, 10)
    };

    // Only include password if provided (and there is a password field)
    if (newPassword) payload.password = newPassword;

    try {
      const res = await fetch(`${API_BASE}/api/users/${originalEmpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let handled = false;
        try {
          const err = await res.json();
          const msg = (err?.message || '').toLowerCase();
          if (res.status === 409 || msg.includes('username')) {
            form.username.setCustomValidity('اسم المستخدم مستخدم بالفعل');
            setUsernameError('اسم المستخدم مستخدم بالفعل');
            setValidated(true);
            usernameRef.current?.focus();
            handled = true;
          }
          if (res.status === 409 || msg.includes('employee')) {
            form.employee_id.setCustomValidity('رقم الموظف مستخدم بالفعل');
            setEmployeeIdError('رقم الموظف مستخدم بالفعل');
            setValidated(true);
            employeeIdRef.current?.focus();
            handled = true;
          }
        } catch {}
        if (!handled) setShowError(true);
      } else {
        setShowSuccess(true);
        // refresh users cache (optional)
        try {
          const updated = await fetch(`${API_BASE}/api/users`).then(r => r.json());
          setAllUsers(Array.isArray(updated) ? updated : []);
        } catch {}
        setTimeout(() => navigate('/users'), 1500);
      }
    } catch {
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI logic:
  const isAdminOriginal = (originalRoleRef.current === 'admin'); // lock role select if true
  const isAdminNow = ((user?.role || '').toLowerCase() === 'admin'); // for password visibility

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }} className="page-shell">
      <LocalTheme />
      <Header />

      {showSuccess && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className="alert alert-success mb-0" role="alert">تم تحديث المستخدم بنجاح</div>
        </div>
      )}
      {showError && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className="alert alert-danger mb-0" role="alert">حدث خطأ، الرجاء التحقق من الحقول أو المحاولة مرة أخرى</div>
        </div>
      )}

      <div id="wrapper">
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />

        <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
          <div id="content" className="flex-grow-1">
            <div className="container-fluid">
              <div className="row p-4">
                <div className="col-12">
                  <Breadcrumbs />
                </div>
              </div>

              <div className="row justify-content-center">
                <div className="col-12 col-xl-10">
                  <div className="surface" aria-busy={isLoading}>
                    <div className="head-flat head-match">
                      <h5 className="m-0">تعديل مستخدم</h5>
                    </div>

                    <div className="body-flat">
                      {isLoading ? (
                        <div className="row g-3">
                          {Array.from({ length: 7 }).map((_, i) => (
                            <div className="col-12" key={`skel-${i}`}>
                              <div className="skel skel-line mb-2" style={{ width: i === 2 ? '30%' : '40%' }} />
                              <div className="skel skel-input" />
                            </div>
                          ))}
                          <div className="col-12 d-flex align-items-center gap-2 pt-2">
                            <div className="skel" style={{ width: 20, height: 20, borderRadius: 4 }} />
                            <div className="skel skel-line" style={{ width: 180 }} />
                          </div>
                          <div className="col-12 d-flex justify-content-between align-items-center mt-2">
                            <div className="skel skel-btn" />
                            <div className="skel skel-btn" />
                          </div>
                        </div>
                      ) : (
                        <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                          {/* Employee ID (editable) */}
                          <div className="mb-3">
                            <label className="form-label">رقم الموظف</label>
                            <input
                              ref={employeeIdRef}
                              type="text"
                              inputMode="numeric"
                              className={`form-control ${employeeIdError ? 'is-invalid' : ''}`}
                              name="employee_id"
                              required
                              value={employeeIdInput}
                              onChange={handleEmployeeIdChange}
                              aria-invalid={!!employeeIdError}
                              aria-describedby="employeeIdFeedback"
                              pattern="[0-9\u0660-\u0669\u06F0-\u06F9]{7}"
                            />
                            <div id="employeeIdFeedback" className="invalid-feedback" aria-live="polite">
                              {employeeIdError || 'يرجى إدخال رقم موظف مكون من 7 أرقام'}
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">اسم المستخدم</label>
                            <input
                              ref={usernameRef}
                              type="text"
                              className={`form-control ${usernameError ? 'is-invalid' : ''}`}
                              name="username"
                              required
                              defaultValue={user?.username || ''}
                              onChange={handleUsernameChange}
                              aria-invalid={!!usernameError}
                              aria-describedby="usernameFeedback"
                            />
                            <div id="usernameFeedback" className="invalid-feedback" aria-live="polite">
                              {usernameError || 'يرجى إدخال اسم المستخدم'}
                            </div>
                          </div>

                          {/* Password — hidden whenever current selection is Admin */}
                          {!isAdminNow && (
                            <div className="mb-3">
                              <label className="form-label">كلمة المرور</label>
                              <div className="pwd-floating">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  className="form-control"
                                  name="password"
                                  style={{ textTransform: 'none' }}
                                  autoCapitalize="off"
                                  autoComplete="new-password"
                                  required
                                  defaultValue={user?.password || ''}
                                  aria-label="حقل كلمة المرور"
                                />
                                {/* أيقونة القفل — يمين */}
                                <i className="fas fa-lock field-icon" aria-hidden="true"></i>

                                {/* زر إظهار/إخفاء — يسار */}
                                <button
                                  type="button"
                                  className="toggle-password"
                                  onClick={() => setShowPassword(s => !s)}
                                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                >
                                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>

                                <div className="invalid-feedback">يرجى إدخال كلمة المرور</div>
                              </div>
                            </div>
                          )}

                          <div className="mb-3">
                            <label className="form-label">الاسم الأول</label>
                            <input type="text" className="form-control" name="first_name" required defaultValue={user?.first_name || ''} />
                            <div className="invalid-feedback">يرجى إدخال الاسم الأول</div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">الاسم الأخير</label>
                            <input type="text" className="form-control" name="last_name" required defaultValue={user?.last_name || ''} />
                            <div className="invalid-feedback">يرجى إدخال الاسم الأخير</div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">البريد الإلكتروني</label>
                            <input type="email" className="form-control" name="email" defaultValue={user?.email || ''} />
                          </div>

                          <div className="mb-3">
                            <label className="form-label">الدور</label>
                            <select
                              className="form-select"
                              name="role"
                              required
                              value={user?.role || ''}
                              onChange={e => setUser(prev => ({ ...(prev || {}), role: e.target.value }))}
                              disabled={isAdminOriginal} // 🔒 lock if originally Admin
                            >
                              <option value="">اختر الدور...</option>
                              <option value="User">User</option>
                              <option value="Management">Management</option>
                              <option value="Admin">Admin</option>
                            </select>
                            {isAdminOriginal && (
                              <small className="text-muted d-block mt-1">لا يمكن تعديل دور مدير النظام.</small>
                            )}
                            <div className="invalid-feedback">يرجى تحديد الدور</div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">الإدارة</label>
                            <select
                              className="form-select"
                              name="department"
                              required
                              value={user?.department_id || ''}
                              onChange={e => setUser(prev => ({ ...(prev || {}), department_id: parseInt(e.target.value, 10) }))}
                            >
                              <option value="">اختر الإدارة...</option>
                              {departments.map(d => (
                                <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                              ))}
                            </select>
                            <div className="invalid-feedback">يرجى اختيار الإدارة</div>
                          </div>

                          <div className="d-flex align-items-center gap-2 pb-4 pt-4">
                            <input type="checkbox" className="form-check-input" id="checkTerms" name="checkTerms" required />
                            <label className="form-check-label" htmlFor="checkTerms">أؤكد صحة المعلومات</label>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                              {isSubmitting && (
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              )}
                              تحديث
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => navigate('/users')}
                              disabled={isSubmitting}
                            >
                              إلغاء
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
