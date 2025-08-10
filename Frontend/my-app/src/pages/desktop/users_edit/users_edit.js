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
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
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
                  {isLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                      <div className="spinner-border m-5" role="status">
                        <span className="sr-only">Loading...</span>
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
                        <select className="form-select" name="role" required defaultValue={user?.role || ''} onChange={e => setUser(prev => ({ ...prev, role: e.target.value }))}>
                          <option value="">اختر الدور...</option>
                          <option value="User">User</option>
                          <option value="Management">Management</option>
                        </select>
                        <div className="invalid-feedback">يرجى تحديد الدور</div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">الإدارة</label>
                        <select className="form-select" name="department" required value={user?.department_id || ''} onChange={e => setUser(prev => ({ ...prev, department_id: parseInt(e.target.value, 10) }))}>
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
                        تحديث
                      </button>
                    </form>
                  )}
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
