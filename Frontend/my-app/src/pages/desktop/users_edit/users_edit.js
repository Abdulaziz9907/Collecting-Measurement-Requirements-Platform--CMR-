import React, { useEffect, useState } from 'react';
import './assets/bootstrap/css/bootstrap.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';
import { useParams, useNavigate } from 'react-router-dom';

export default function Users_edit() {
  const [validated, setValidated] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [user, setUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

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
      .page-spacer { height:140px; }

      /* Skeleton */
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
    `}</style>
  );

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [depRes, userRes] = await Promise.all([
          fetch(`${API_BASE}/api/departments`),
          fetch(`${API_BASE}/api/users/${id}`)
        ]);
        if (!depRes.ok || !userRes.ok) throw new Error();
        const depData = await depRes.json();
        const userData = await userRes.json();
        if (isMounted) {
          setDepartments(depData);
          setUser(userData);
          setIsLoading(false);
        }
      } catch {
        setDepartments([]);
        setUser(null);
        setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [API_BASE, id]);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setShowSuccess(false);
    setShowError(false);

    if (!form.checkValidity()) {
      setShowError(true);
      e.stopPropagation();
    } else {
      setIsSubmitting(true);
      const payload = {
        employee_id: parseInt(id, 10),
        username: form.username.value.trim(),
        password: form.password.value.trim(),
        first_name: form.first_name.value.trim(),
        last_name: form.last_name.value.trim(),
        email: form.email.value.trim() || null,
        role: form.role.value.trim(),
        department_id: parseInt(form.department.value, 10)
      };
      try {
        const res = await fetch(`${API_BASE}/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          setShowError(true);
        } else {
          setShowSuccess(true);
          setTimeout(() => navigate('/users'), 2000);
        }
      } catch {
        setShowError(true);
      }
      setIsSubmitting(false);
    }
    setValidated(true);
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }} className="page-bg">
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

      <div id="wrapper" style={{ display: 'flex', flexDirection: 'row' }}>
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />

        <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
          <div id="content" className="flex-grow-1">
            <div className="container-fluid">
              {/* Breadcrumbs row */}
              <div className="row p-4">
                <div className="col-12">
                  <Breadcrumbs />
                </div>
              </div>

              {/* Centered card like other pages */}
              <div className="row justify-content-center">
                <div className="col-12 col-xl-10">
                  <div className="surface" aria-busy={isLoading}>
                    {/* Header */}
                    <div className="head-flat head-match">
                      <h5 className="m-0">تعديل مستخدم</h5>
                    </div>

                    {/* Body */}
                    <div className="body-flat">
                      {isLoading ? (
                        // ===== Loading Skeleton (mirrors form layout; no spinner) =====
                        <div className="row g-3">
                          {/* Each block: label line + input block (full width like the form) */}
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div className="col-12" key={`skel-${i}`}>
                              <div className="skel skel-line mb-2" style={{ width: i === 2 ? '30%' : '40%' }} />
                              <div className="skel skel-input" />
                            </div>
                          ))}
                          {/* Role */}
                          <div className="col-12">
                            <div className="skel skel-line mb-2" style={{ width: '30%' }} />
                            <div className="skel skel-input" />
                          </div>
                          {/* Department */}
                          <div className="col-12">
                            <div className="skel skel-line mb-2" style={{ width: '30%' }} />
                            <div className="skel skel-input" />
                          </div>
                          {/* Checkbox row */}
                          <div className="col-12 d-flex align-items-center gap-2 pt-2">
                            <div className="skel" style={{ width: 20, height: 20, borderRadius: 4 }} />
                            <div className="skel skel-line" style={{ width: 180 }} />
                          </div>
                          {/* Buttons row: Submit on one side, Cancel on the other */}
                          <div className="col-12 d-flex justify-content-between align-items-center mt-2">
                            <div className="skel skel-btn" />
                            <div className="skel skel-btn" />
                          </div>
                        </div>
                      ) : (
                        <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                          <div className="mb-3">
                            <label className="form-label">اسم المستخدم</label>
                            <input type="text" className="form-control" name="username" required defaultValue={user?.username || ''} />
                            <div className="invalid-feedback">يرجى إدخال اسم المستخدم</div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">كلمة المرور</label>
                            <input type="text" className="form-control" name="password" required defaultValue={user?.password || ''} />
                            <div className="invalid-feedback">يرجى إدخال كلمة المرور</div>
                          </div>
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
                              defaultValue={user?.role || ''}
                              onChange={e => setUser(prev => ({ ...prev, role: e.target.value }))}
                            >
                              <option value="">اختر الدور...</option>
                              <option value="User">User</option>
                              <option value="Management">Management</option>
                            </select>
                            <div className="invalid-feedback">يرجى تحديد الدور</div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">الإدارة</label>
                            <select
                              className="form-select"
                              name="department"
                              required
                              value={user?.department_id || ''}
                              onChange={e => setUser(prev => ({ ...prev, department_id: parseInt(e.target.value, 10) }))}
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

                          {/* Submit on one side, Cancel on the other (same layout as create) */}
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

              <div className="page-spacer" />
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
