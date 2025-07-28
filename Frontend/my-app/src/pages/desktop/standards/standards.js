import React, { useEffect, useState } from 'react';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/fonts/fontawesome-all.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';

function escapeInput(str) {
  return str.replace(/[&<>'"]/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return map[char] || char;
  });
}

function escapeCommas(str) {
  return str.replace(/,/g, '\\,');
}

export default function Standards() {
  const [validated, setValidated] = useState(false);
  const [proofRequired, setProofRequired] = useState(['']);
  const [departments, setDepartments] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false); // Mobile sidebar

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  useEffect(() => {
    fetch(`${API_BASE}/api/departments`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(setDepartments)
      .catch(err => {
        console.error('Failed to fetch departments:', err);
        setDepartments([]);
      });
  }, [API_BASE]);

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
      const proofs = proofRequired
        .filter(text => text.trim())
        .map(text => escapeCommas(escapeInput(text)))
        .join(',');

      const payload = {
        standard_number: escapeInput(form.standard_num.value),
        standard_name: escapeInput(form.goal.value),
        standard_goal: escapeInput(form.desc2.value),
        standard_requirments: escapeInput(form.desc3.value),
        assigned_department_id: parseInt(form.scope.value, 10),
        proof_required: proofs,
      };

      try {
        const res = await fetch(`${API_BASE}/api/standards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          setShowError(true);
        } else {
          setShowSuccess(true);
          setTimeout(() => window.location.reload(), 5000);
        }
      } catch {
        setShowError(true);
      }
      setIsSubmitting(false);
    }

    setValidated(true);
  };

  const handleAttachmentChange = (e, idx) => {
    const text = e.target.value;
    setProofRequired(prev => {
      const next = [...prev];
      next[idx] = text;
      return next;
    });
  };

  const addAttachment = () => setProofRequired(prev => [...prev, '']);
  const removeAttachment = idx =>
    setProofRequired(prev => prev.filter((_, i) => i !== idx));

  const navItems = [
    { href: '/index.html', icon: <i className="fas fa-home me-2" />, label: 'الرئيسية' },
    { href: '/table.html', icon: <i className="fas fa-list me-2" />, label: 'معايير التحول' },
    { href: '/login.html', icon: <i className="fas fa-sitemap me-2" />, label: 'الجهات' },
    { href: '/login.html', icon: <i className="fas fa-chart-pie me-2" />, label: 'الإحصائيات' },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />

{/* Hamburger Button (Top-Left) */}
<button
  type="button"
  className="position-fixed top-0 start-0 m-3 z-1030 d-md-none"
  style={{
    backgroundColor: '#ffffff',
    border: '1px solid #ccc',
    padding: '8px 10px',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '42px',
    height: '42px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
  }}
  onClick={(e) => {
    e.preventDefault();            // ✅ Prevent default link/page behavior
    setSidebarVisible((prev) => !prev); // ✅ Just toggle open/close
  }}
  aria-label="Toggle sidebar"
>
  <div style={{ width: '22px', height: '2px', backgroundColor: '#222', margin: '3px 0' }} />
  <div style={{ width: '22px', height: '2px', backgroundColor: '#222', margin: '3px 0' }} />
  <div style={{ width: '22px', height: '2px', backgroundColor: '#222', margin: '3px 0' }} />
</button>

{/* Slide-in Sidebar (Mobile Only - LEFT) */}
<div
  className="bg-dark text-white position-fixed top-0 start-0 h-100 d-md-none"
  style={{
    width: '320px',
    transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
    opacity: sidebarVisible ? 1 : 0,
    transition: 'transform 0.4s ease, opacity 0.3s ease',
    zIndex: 1025,
    boxShadow: sidebarVisible ? '4px 0 12px rgba(0,0,0,0.2)' : 'none',
  }}
>
  <div className="p-3">
    <ul className="navbar-nav">
      {navItems.map((item, idx) => (
        <li className="nav-item" key={idx}>
          <a
            className="nav-link text-white d-flex align-items-center"
            href={item.href}
            onClick={() => setSidebarVisible(false)} // ✅ Close on link click
          >
            {item.icon}
            <span className="me-2">{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  </div>
</div>




      {/* Alerts */}
      {showSuccess && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className="alert alert-success mb-0" role="alert">
            تم إنشاء بطاقة المعيار بنجاح
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

      {/* Main Layout */}
      <div id="wrapper">
        {/* Desktop Sidebar */}
        <nav className="navbar align-items-start p-0 sidebar sidebar-dark accordion bg-gradient-primary navbar-dark d-none d-md-block" style={{ background: "#061736" }}>
          <div className="container-fluid d-flex flex-column p-0">
            <hr className="my-0 sidebar-divider" />
            <ul className="navbar-nav text-light" id="accordionSidebar">
              {navItems.map((item, idx) => (
                <li className="nav-item" key={idx}>
                  <a className="nav-link d-flex justify-content-start" href={item.href}>
                    {item.icon}
                    <span className="me-2" style={{ fontSize: 17 }}>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Content Wrapper */}
        <div className="d-flex flex-column" id="content-wrapper">
          <div id="content">
            <div className="container-fluid">
              <div className="row p-4">
                <div className="col-md-12">
                  <h4>الرئيسية / إدارة المعايير</h4>
                </div>
              </div>
              <div className="row">
                <div className="col-md-1 col-xl-2" />
                <div className="col-md-10 col-xl-8 p-4 my-3 bg-white" style={{ borderTop: "3px solid #4F7689", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                  <h4>إنشاء بطاقة معيار</h4>
                  {/* Form */}
                  <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">رقم المعيار</label>
                      <input type="text" className="form-control" id="standard_num" name="standard" required />
                      <div className="invalid-feedback">يرجى إدخال المعيار</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">اسم المعيار</label>
                      <input type="text" className="form-control" id="goal" name="goal" required />
                      <div className="invalid-feedback">يرجى إدخال اسم المعيار</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">الهدف</label>
                      <textarea className="form-control" id="desc2" name="desc2" rows="3" required />
                      <div className="invalid-feedback">يرجى إدخال الهدف</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">متطلبات التطبيق</label>
                      <textarea className="form-control" id="desc3" name="desc3" rows="3" required />
                      <div className="invalid-feedback">يرجى تحديد متطلبات التطبيق</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">الجهة</label>
                      <select className="form-select" id="scope" name="scope" required>
                        <option value="">اختر الجهة...</option>
                        {departments.map(d => (
                          <option key={d.department_id} value={d.department_id}>
                            {d.department_name}
                          </option>
                        ))}
                      </select>
                      <div className="invalid-feedback">يرجى اختيار الجهة</div>
                    </div>

                    {/* Proof Attachments */}
                    {proofRequired.map((text, idx) => (
                      <div className="mb-4" key={idx}>
                        <label className="form-label">مستند إثبات {idx + 1}</label>
                        <div className="d-flex align-items-start">
                          <div className="input-group flex-grow-1 has-validation">
                            <span className="input-group-text"><i className="far fa-file-alt"></i></span>
                            <input
                              type="text"
                              className="form-control"
                              value={text}
                              placeholder="أدخل مسار أو وصلة المستند"
                              onChange={e => handleAttachmentChange(e, idx)}
                              required
                            />
                            <div className="invalid-feedback">يرجى إدخال مسار المستند</div>
                          </div>
                          {idx > 0 && (
                            <button type="button" className="btn btn-outline-danger ms-2" onClick={() => removeAttachment(idx)}>
                              حذف
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn btn-light mb-3" onClick={addAttachment}>
                      إضافة مستند إثبات
                    </button>

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
