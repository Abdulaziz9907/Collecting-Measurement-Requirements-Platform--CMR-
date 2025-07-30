import React, { useState, useEffect } from 'react';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';

export default function Departments_create() {
  const [validated, setValidated] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

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
      setValidated(true);
    } else {
      setIsSubmitting(true);
      const payload = {
        department_name: form.department_name.value.trim(),
        building_number: parseInt(form.building_number.value, 10)
      };

      try {
        const res = await fetch(`${API_BASE}/api/departments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          setShowError(true);
        } else {
          setShowSuccess(true);
          form.reset();
          setValidated(false); // ✅ Reset validation state on success
        }
      } catch {
        setShowError(true);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />
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
            حدث خطأ، الرجاء التحقق من الحقول أو المحاولة مرة أخرى
          </div>
        </div>
      )}
      <div id="wrapper">
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
        <div className="d-flex flex-column" id="content-wrapper">
          <div id="content">
            <div className="container-fluid">
              <div className="row p-4">
                <div className="col-md-12">
                  <Breadcrumbs />
                </div>
              </div>
              <div className="row">
                <div className="col-md-1 col-xl-2" />
                <div className="col-md-10 col-xl-8 p-4 my-3 bg-white" style={{ borderTop: '3px solid #4F7689', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <h4>إنشاء جهة جديدة</h4>
                  <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">اسم الجهة</label>
                      <input type="text" className="form-control" name="department_name" required />
                      <div className="invalid-feedback">يرجى إدخال اسم الجهة</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">رقم المبنى</label>
                      <input type="number" className="form-control" name="building_number" required />
                      <div className="invalid-feedback">يرجى إدخال رقم المبنى</div>
                    </div>
                    <div className="d-flex align-items-center gap-2 pb-4 pt-4">
                      <input type="checkbox" className="form-check-input" id="checkTerms" name="checkTerms" required />
                      <label className="form-check-label" htmlFor="checkTerms">أؤكد صحة المعلومات</label>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                      إرسال
                    </button>
                  </form>
                </div>
                <div className="col-md-1 col-xl-2" />
              </div>
            </div>
          </div>
          <footer className="bg-white sticky-footer">
            <div className="container my-auto">
              <div className="text-center my-auto">
                <span>© RCJY 2025</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
