import React, { useEffect, useState } from 'react';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';
import { useNavigate } from 'react-router-dom';

export default function UsersCreate() {
  const [validated, setValidated] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]); // ✅ for username uniqueness check
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const navigate = useNavigate();

  /* ===== Helpers ===== */
  // Normalize Arabic/ASCII digits to ASCII
  const normalizeDigits = (str = '') => {
    const map = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
    return String(str).replace(/[٠-٩۰-۹]/g, ch => map[ch] || ch);
  };

  /* ===== Minimal theme (card + exact header height). Does NOT change font. ===== */
  const LocalTheme = () => (
    <style>{`
      :root{
        --radius:14px;
        --shadow:0 10px 24px rgba(16,24,40,.08);
        --surface:#fff;
        --surface-muted:#fbfdff;
        --stroke:#eef2f7;
      }
      .page-bg { background:#f6f8fb; min-height:100vh; }
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
      .page-spacer { height:300px; }
    `}</style>
  );

  useEffect(() => {
    fetch(`${API_BASE}/api/departments`)
      .then(res => res.json())
      .then(setDepartments)
      .catch(() => setDepartments([]));
    // ✅ fetch users once to validate duplicate usernames
    fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [API_BASE]);

  useEffect(() => {
    if (showError || showSuccess) {
      const timer = setTimeout(() => { setShowError(false); setShowSuccess(false); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError, showSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setShowSuccess(false);
    setShowError(false);

    // --- Clear any previous custom validity ---
    form.employee_id.setCustomValidity('');
    form.username.setCustomValidity('');

    // --- 7-digit employee number (Arabic/English digits allowed) ---
    const empRaw = normalizeDigits(form.employee_id.value || '').replace(/\D/g, '');
    if (!/^\d{7}$/.test(empRaw)) {
      form.employee_id.setCustomValidity('رقم الموظف يجب أن يتكون من 7 أرقام');
    }

    // --- Username uniqueness (case-sensitive) ---
    const username = (form.username.value || '').trim();
    const usernameTaken = (users || []).some(u => (u?.username || '').trim() === username);
    if (usernameTaken) {
      form.username.setCustomValidity('اسم المستخدم مستخدم بالفعل');
    }

    if (!form.checkValidity()) {
      setShowError(true);
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(false);
    setIsSubmitting(true);

    const payload = {
      employee_id: parseInt(empRaw, 10),
      username,
      password: (form.password.value || '').trim(),
      first_name: (form.first_name.value || '').trim(),
      last_name: (form.last_name.value || '').trim(),
      email: (form.email.value || '').trim() || null,
      role: (form.role.value || '').trim(),
      department_id: parseInt(form.department.value, 10)
    };

    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        // If backend also enforces unique username and returns a conflict
        try {
          const err = await res.json();
          if (err?.message?.toLowerCase?.().includes('username')) {
            form.username.setCustomValidity('اسم المستخدم مستخدم بالفعل');
            setValidated(true);
          }
        } catch {}
        setShowError(true);
      } else {
        setShowSuccess(true);
        form.reset();
        setValidated(false);
        // refresh users list so future dup checks are accurate
        try {
          const updated = await fetch(`${API_BASE}/api/users`).then(r => r.json());
          setUsers(Array.isArray(updated) ? updated : []);
        } catch {}
      }
    } catch {
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="page-bg min-vh-100 d-flex flex-column" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <LocalTheme />
      <Header />

      {showSuccess && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className="alert alert-success mb-0" role="alert">تم إنشاء المستخدم بنجاح</div>
        </div>
      )}
      {showError && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className="alert alert-danger mb-0" role="alert">حدث خطأ، الرجاء التحقق من الحقول أو المحاولة مرة أخرى</div>
        </div>
      )}

      <div id="wrapper" style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />

        <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
          <div id="content" className="flex-grow-1 d-flex">
            <div className="container-fluid">
              <div className="row p-4">
                <div className="col-12">
                  <Breadcrumbs />
                </div>
              </div>

              <div className="row justify-content-center">
                <div className="col-12 col-xl-10">
                  <div className="surface">
                    <div className="head-flat head-match">
                      <h5 className="m-0">إنشاء مستخدم</h5>
                    </div>

                    <div className="body-flat">
                      <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label className="form-label">رقم الموظف</label>
                          <input
                            type="text"
                            className="form-control"
                            name="employee_id"
                            inputMode="numeric"
                            pattern="^\d{7}$"
                            maxLength={7}
                            onInput={(e) => {
                              // keep only digits (Arabic/English) and limit to 7
                              const v = normalizeDigits(e.target.value).replace(/\D/g, '').slice(0,7);
                              e.target.value = v;
                              // clear custom validity while typing
                              e.currentTarget.setCustomValidity('');
                            }}
                            required
                          />
                          <div className="invalid-feedback">رقم الموظف يجب أن يتكون من 7 أرقام</div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">اسم المستخدم</label>
                          <input
                            type="text"
                            className="form-control"
                            name="username"
                            onInput={(e) => e.currentTarget.setCustomValidity('')}
                            required
                          />
                          <div className="invalid-feedback">يرجى إدخال اسم مستخدم صالح وغير مستخدم من قبل</div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">كلمة المرور</label>
                          <input type="password" className="form-control" name="password" style={{ textTransform: 'none' }} autoCapitalize="off" autoComplete="new-password" required />
                          <div className="invalid-feedback">يرجى إدخال كلمة المرور</div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">الاسم الأول</label>
                          <input type="text" className="form-control" name="first_name" required />
                          <div className="invalid-feedback">يرجى إدخال الاسم الأول</div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">الاسم الأخير</label>
                          <input type="text" className="form-control" name="last_name" required />
                          <div className="invalid-feedback">يرجى إدخال الاسم الأخير</div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">البريد الإلكتروني</label>
                          <input type="email" className="form-control" name="email" />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">الدور</label>
                          <select className="form-select" name="role" required>
                            <option value="">اختر الدور...</option>
                            <option value="User">User</option>
                            <option value="Management">Management</option>
                          </select>
                          <div className="invalid-feedback">يرجى تحديد الدور</div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">الإدارة</label>
                          <select className="form-select" name="department" required>
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
                            إرسال
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
                    </div>
                  </div>
                </div>
              </div>

              <div className="page-spacer" />
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
