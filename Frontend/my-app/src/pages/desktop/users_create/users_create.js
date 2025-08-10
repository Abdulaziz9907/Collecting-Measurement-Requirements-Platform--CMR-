import React, { useEffect, useState } from 'react';
import './assets/bootstrap/css/bootstrap.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';

export default function Users_create() {
  const [validated, setValidated] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  useEffect(() => {
    fetch(`${API_BASE}/api/departments`)
      .then(res => res.json())
      .then(setDepartments)
      .catch(() => setDepartments([]));
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

    if (!form.checkValidity()) {
      setShowError(true);
      e.stopPropagation();
      setValidated(true);
    } else {
      setIsSubmitting(true);
      const payload = {
        employee_id: parseInt(form.employee_id.value, 10),
        username: form.username.value.trim(),
        password: form.password.value.trim(),
        first_name: form.first_name.value.trim(),
        last_name: form.last_name.value.trim(),
        email: form.email.value.trim() || null,
        role: form.role.value.trim(),
        department_id: parseInt(form.department.value, 10)
      };

      try {
        const res = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          setShowError(true);
        } else {
          setShowSuccess(true);
          form.reset();
          setValidated(false);
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
          <div className="alert alert-success mb-0" role="alert">تم إنشاء المستخدم بنجاح</div>
        </div>
      )}
      {showError && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className="alert alert-danger mb-0" role="alert">حدث خطأ، الرجاء التحقق من الحقول أو المحاولة مرة أخرى</div>
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
                <div className="col-md-10 col-xl-8 p-4 my-3 surface">
                  <h4>إنشاء مستخدم</h4>
                  <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">رقم الموظف</label>
                      <input type="number" className="form-control" name="employee_id" required />
                      <div className="invalid-feedback">يرجى إدخال رقم الموظف</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">اسم المستخدم</label>
                      <input type="text" className="form-control" name="username" required />
                      <div className="invalid-feedback">يرجى إدخال اسم المستخدم</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">كلمة المرور</label>
                      <input type="password" className="form-control" name="password" required />
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
          
        </div>
      </div>
      <Footer />
    </div>
  );
}
