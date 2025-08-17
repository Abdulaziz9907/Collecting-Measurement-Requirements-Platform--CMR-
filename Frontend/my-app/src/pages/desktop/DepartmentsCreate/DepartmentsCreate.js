import React, { useState, useEffect } from 'react';
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';
import { useNavigate } from 'react-router-dom';

export default function DepartmentsCreate() {
  const [validated, setValidated] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('حدث خطأ، الرجاء التحقق من الحقول أو المحاولة مرة أخرى');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Existing department names (normalized) for duplicate check
  const [existingNames, setExistingNames] = useState(new Set());
  const [nameIsDuplicate, setNameIsDuplicate] = useState(false);

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const navigate = useNavigate();

  /* ===== Layout fixes: full-height column + sticky footer ===== */
  const LocalTheme = () => (
    <style>{`
      :root{
        --radius:14px;
        --shadow:0 10px 24px rgba(16,24,40,.08);
        --surface:#fff;
        --surface-muted:#fbfdff;
        --stroke:#eef2f7;
      }

      /* Make whole page (below) fill the viewport and push Footer down */
      .page-bg {
        background:#f6f8fb;
        min-height: 100dvh;      /* modern mobile browsers */
        min-height: 100svh;      /* small viewport unit fallback */
        display:flex;
        flex-direction:column;
      }

      /* The region under the Header should grow to fill remaining height */
      #wrapper {
        flex: 1 1 auto;          /* take up leftover space under header */
        min-height: 0;           /* prevent overflow issues in nested flex */
        display:flex;
        flex-direction:row;
      }

      #content-wrapper {
        flex: 1 1 auto;
        min-height: 0;
        display:flex;
        flex-direction:column;   /* so Footer sits after #content */
      }

      #content {
        flex: 1 1 auto;          /* grow to push Footer down */
        min-height: 0;
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

      /* Responsive spacer: small on phones, larger on desktop */
      .page-spacer { height: 24px; }
      @media (min-width: 768px) { .page-spacer { height: 80px; } }
      @media (min-width: 1200px) { .page-spacer { height: 140px; } }

      /* Safety net for RTL checkboxes if non-RTL Bootstrap leaks in */
      [dir="rtl"] .form-check .form-check-input{
        float: right;
      }
    `}</style>
  );

  // --- Helpers ---
  const normalizeName = (s = '') =>
    s.toString().trim().replace(/\s+/g, ' ').toLocaleLowerCase('ar');

  // Load existing department names once (for client-side duplicate prevention)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/departments`, { method: 'GET' });
        if (!res.ok) return;
        const arr = await res.json();
        const names = (Array.isArray(arr) ? arr : []).map(
          x => x?.department_name ?? x?.name ?? x?.departmentName ?? ''
        );
        setExistingNames(new Set(names.filter(Boolean).map(normalizeName)));
      } catch {
        // ignore; server-side will still protect if implemented
      }
    })();
  }, [API_BASE]);

  // Auto-hide error alert
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
    if (dup) {
      e.target.setCustomValidity('duplicate');
    } else {
      e.target.setCustomValidity('');
    }
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
    const normName = normalizeName(rawName);
    const isDupNow = existingNames.has(normName);
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
      department_name: rawName.trim(),
      building_number: parseInt(form.building_number.value, 10)
    };

    try {
      const res = await fetch(`${API_BASE}/api/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 409) {
          setErrorMessage('اسم الجهة موجود مسبقاً، لا يمكن إنشاء جهة مكررة');
          setShowError(true);
          setNameIsDuplicate(true);
          nameInput.setCustomValidity('duplicate');
          setValidated(true);
        } else {
          setShowError(true);
        }
      } else {
        setShowSuccess(true);
        setExistingNames(prev => new Set([...prev, normName]));
        form.reset();
        setValidated(false);
        setNameIsDuplicate(false);
      }
    } catch {
      setShowError(true);
    }
    setIsSubmitting(false);
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }} className="page-bg">
      <LocalTheme />
      <Header />

      {/* Top alerts */}
      {showSuccess && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className="alert alert-success mb-0" role="alert">
            تم إنشاء الجهة بنجاح
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
          <div id="content" className="flex-grow-1">
            <div className="container-fluid">
              <div className="row p-4">
                <div className="col-12">
                  <Breadcrumbs />
                </div>
              </div>

              {/* Centered card like Standards/Users */}
              <div className="row justify-content-center">
                <div className="col-12 col-xl-11">
                  <div className="surface">
                    <div className="head-flat head-match">
                      <h5 className="m-0">إنشاء جهة جديدة</h5>
                    </div>

                    <div className="body-flat">
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
                            onChange={handleNameChange}
                          />
                          <div className="invalid-feedback">
                            {nameIsDuplicate ? 'اسم الجهة موجود مسبقاً' : 'يرجى إدخال اسم الجهة'}
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">رقم المبنى</label>
                          <input type="number" className="form-control" name="building_number" required />
                          <div className="invalid-feedback">يرجى إدخال رقم المبنى</div>
                        </div>

                        {/* Proper RTL checkbox block */}
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
                          <div className="invalid-feedback">
                            يرجى تأكيد صحة المعلومات
                          </div>
                        </div>

                        {/* Submit on one side, Cancel on the other */}
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
                            onClick={() => navigate('/departments')}
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

              {/* Responsive spacer (small on phones so the footer doesn't look "lifted") */}
              <div className="page-spacer" />
            </div>
          </div>

          {/* Footer will naturally sit at the bottom now */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
