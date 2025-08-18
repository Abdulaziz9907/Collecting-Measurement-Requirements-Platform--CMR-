import React, { useEffect, useState } from 'react';
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';
import { useParams, useNavigate } from 'react-router-dom';

export default function DepartmentsEdit() {
  const [validated, setValidated] = useState(false);
  const [department, setDepartment] = useState(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('حدث خطأ، الرجاء التحقق من الحقول أو المحاولة مرة أخرى');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Duplicate-check state
  const [existingNames, setExistingNames] = useState(new Set()); // names of OTHER departments
  const [nameIsDuplicate, setNameIsDuplicate] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');

  /* ===== Helpers ===== */
  const normalizeName = (s = '') =>
    s.toString().trim().replace(/\s+/g, ' ').toLocaleLowerCase('ar');

  /* ===== Minimal shell + skeleton + sticky footer (mobile-safe) ===== */
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

      /* Full-height column so Footer sits at bottom on mobile */
      .page-bg {
        background:#f6f8fb;
        min-height:100dvh;
        min-height:100svh;
        display:flex;
        flex-direction:column;
      }

      /* Area under Header */
      #wrapper {
        flex:1 1 auto;
        min-height:0;
        display:flex;
        flex-direction:row;
      }

      #content-wrapper {
        flex:1 1 auto;
        min-height:0;
        display:flex;
        flex-direction:column;
      }

      #content {
        flex:1 1 auto;
        min-height:0;
      }

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

      /* Responsive spacer: small on phones so footer doesn't look "lifted" */
      .page-spacer { height:24px; }
      @media (min-width: 768px) { .page-spacer { height:80px; } }
      @media (min-width: 1200px) { .page-spacer { height:140px; } }

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

      /* RTL checkbox safety if non-RTL Bootstrap leaks in */
      [dir="rtl"] .form-check .form-check-input { float: right; }
    `}</style>
  );

  /* ===== Data fetching ===== */
  // Load the department being edited
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetch(`${API_BASE}/api/departments/${id}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { if (isMounted) { setDepartment(data); setIsLoading(false); } })
      .catch(err => { console.error('Error fetching department', err); if (isMounted) { setDepartment(null); setIsLoading(false); } });
    return () => { isMounted = false; };
  }, [API_BASE, id]);

  // Load all departments to build a set of names EXCLUDING this department (for duplicate checks)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/departments`, { method: 'GET' });
        if (!res.ok) return;
        const arr = await res.json();
        const currentId = parseInt(id, 10);
        const items = (Array.isArray(arr) ? arr : []).filter((x) => {
          const depId = parseInt(x?.department_id ?? x?.id ?? x?.DepartmentId ?? -1, 10);
          return depId !== currentId;
        });
        const names = items
          .map(x => x?.department_name ?? x?.name ?? x?.departmentName ?? '')
          .filter(Boolean);
        if (isMounted) setExistingNames(new Set(names.map(normalizeName)));
      } catch {
        // ignore; server will still protect
      }
    })();
    return () => { isMounted = false; };
  }, [API_BASE, id]);

  /* ===== UI behavior ===== */
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    const dup = existingNames.has(normalizeName(value));
    setNameIsDuplicate(dup);
    if (dup) e.target.setCustomValidity('duplicate');
    else e.target.setCustomValidity('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setShowSuccess(false);
    setShowError(false);
    setErrorMessage('حدث خطأ، الرجاء التحقق من الحقول أو المحاولة مرة أخرى');

    // Re-check duplicate before submit
    const nameInput = form.department_name;
    const rawName = nameInput?.value ?? '';
    const isDupNow = existingNames.has(normalizeName(rawName));
    setNameIsDuplicate(isDupNow);
    if (isDupNow) {
      nameInput.setCustomValidity('duplicate');
    } else {
      nameInput.setCustomValidity('');
    }

    if (!form.checkValidity()) {
      if (isDupNow) {
        setErrorMessage('اسم الجهة موجود مسبقاً، الرجاء اختيار اسم مختلف');
        setShowError(true);
      }
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      department_id: parseInt(id, 10),
      department_name: rawName.trim(),
      building_number: parseInt(form.building_number.value, 10)
    };

    try {
      const res = await fetch(`${API_BASE}/api/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 409) {
          // Server says duplicate
          setErrorMessage('اسم الجهة موجود مسبقاً، لا يمكن تحديث الجهة باسم مكرر');
          setShowError(true);
          setNameIsDuplicate(true);
          nameInput.setCustomValidity('duplicate');
          setValidated(true);
        } else {
          setShowError(true);
        }
      } else {
        setShowSuccess(true);
        // Update local set (if the name changed) to prevent immediate duplicates after edit
        if (!existingNames.has(normalizeName(rawName))) {
          setExistingNames(prev => new Set([...prev, normalizeName(rawName)]));
        }
        setTimeout(() => navigate('/departments'), 1500);
      }
    } catch {
      setShowError(true);
    }
    setIsSubmitting(false);
  };

  return (
    <div dir="rtl" className="page-bg min-vh-100 d-flex flex-column" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <LocalTheme />
      <Header />

      {showSuccess && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className="alert alert-success mb-0" role="alert">
            تم تحديث الجهة بنجاح
          </div>
        </div>
      )}
      {showError && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className="alert alert-danger mb-0" role="alert">
            {errorMessage}
          </div>
        </div>
      )}

      <div id="wrapper">
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />

        <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
          <div id="content" className="flex-grow-1 d-flex">
            <div className="container-fluid">
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
                      <h5 className="m-0">تعديل جهة</h5>
                    </div>

                    {/* Body */}
                    <div className="body-flat">
                      {isLoading ? (
                        // Loading skeleton (mirrors form fields, no spinner)
                        <div className="row g-3">
                          <div className="col-12">
                            <div className="skel skel-line mb-2" style={{ width: '30%' }} />
                            <div className="skel skel-input" />
                          </div>
                          <div className="col-12">
                            <div className="skel skel-line mb-2" style={{ width: '30%' }} />
                            <div className="skel skel-input" />
                          </div>
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
                        <form
                          className={`needs-validation ${validated ? 'was-validated' : ''}`}
                          noValidate
                          onSubmit={handleSubmit}
                        >
                          <div className="mb-3">
                            <label className="form-label">اسم الجهة</label>
                            <input
                              type="text"
                              className="form-control"
                              name="department_name"
                              required
                              defaultValue={department?.department_name || ''}
                              onChange={handleNameChange}
                            />
                            <div className="invalid-feedback">
                              {nameIsDuplicate ? 'اسم الجهة موجود مسبقاً' : 'يرجى إدخال اسم الجهة'}
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">رقم المبنى</label>
                            <input
                              type="number"
                              className="form-control"
                              name="building_number"
                              required
                              defaultValue={department?.building_number || ''}
                            />
                            <div className="invalid-feedback">يرجى إدخال رقم المبنى</div>
                          </div>

                          {/* Proper RTL checkbox block with validation */}
                          <div className="form-check pt-4 pb-4 m-0">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="checkTerms"
                              name="checkTerms"
                              required
                            />
                            <label className="form-check-label ms-0 mb-0 text-nowrap" htmlFor="checkTerms">
                              أؤكد صحة المعلومات
                            </label>
                            <div className="invalid-feedback">يرجى تأكيد صحة المعلومات</div>
                          </div>

                          {/* Submit on one side, Cancel on the other */}
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
                              onClick={() => navigate('/departments')}
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

              {/* Responsive spacer */}
              <div className="page-spacer" />
            </div>
          </div>

          {/* Footer stays at bottom now on all screen sizes */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
