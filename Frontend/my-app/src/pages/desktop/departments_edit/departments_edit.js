import React, { useEffect, useState } from 'react';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';
import { useParams, useNavigate } from 'react-router-dom';

export default function Departments_edit() {
  const [validated, setValidated] = useState(false);
  const [department, setDepartment] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/api/departments/${id}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => { if (isMounted) setDepartment(data); })
      .catch(err => { console.error('Error fetching department', err); if (isMounted) setDepartment(null); });
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
        department_id: parseInt(id, 10),
        department_name: form.department_name.value.trim(),
        building_number: parseInt(form.building_number.value, 10)
      };

      try {
        const res = await fetch(`${API_BASE}/api/departments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          setShowError(true);
        } else {
          setShowSuccess(true);
          setTimeout(() => navigate('/departments'), 2000);
        }
      } catch {
        setShowError(true);
      }
      setIsSubmitting(false);
    }

    setValidated(true);
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
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
                  {!department ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label className="form-label">اسم الجهة</label>
                        <input type="text" className="form-control" name="department_name" required defaultValue={department.department_name || ''} />
                        <div className="invalid-feedback">يرجى إدخال اسم الجهة</div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">رقم المبنى</label>
                        <input type="number" className="form-control" name="building_number" required defaultValue={department.building_number || ''} />
                        <div className="invalid-feedback">يرجى إدخال رقم المبنى</div>
                      </div>
                      <div className="d-flex align-items-center gap-2 pb-4 pt-4">
                        <input type="checkbox" className="form-check-input" id="checkTerms" name="checkTerms" required />
                        <label className="form-check-label" htmlFor="checkTerms">أؤكد صحة المعلومات</label>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                        تحديث
                      </button>
                    </form>
                  )}
                </div>
                <div className="col-md-1 col-xl-2" />
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
