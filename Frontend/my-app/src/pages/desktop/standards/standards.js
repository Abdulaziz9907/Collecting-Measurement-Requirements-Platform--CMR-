import React, { useEffect, useState } from 'react';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/fonts/fontawesome-all.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';

export default function Standards() {
  const [validated, setValidated] = useState(false);
  const [attachments, setAttachments] = useState(['']);
  const [departments, setDepartments] = useState([]);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  useEffect(() => {
    fetch(`${API_BASE}/api/departments`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setDepartments(data))
      .catch(err => {
        console.error('Failed to fetch departments:', err);
        setDepartments([]);
      });
  }, [API_BASE]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      event.stopPropagation();
    } else {
      const data = {
        standard_name: form.goal.value,
        standard_goal: form.desc2.value,
        standard_requirments: form.desc3.value,
        assigned_department_id: parseInt(form.scope.value, 10),
        attachments: attachments.filter(a => a.trim() !== ''),
      };

      try {
        const res = await fetch(`${API_BASE}/api/standards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          console.error('Failed to submit standard:', res.statusText);
        } else {
          console.log('Standard submitted successfully');
          // Optionally reset form here
        }
      } catch (err) {
        console.error('Error submitting standard:', err);
      }
    }

    setValidated(true);
  };

  const handleAttachmentChange = (e, idx) => {
    const text = e.target.value;
    setAttachments(prev => {
      const next = [...prev];
      next[idx] = text;
      return next;
    });
  };

  const addAttachment = () => setAttachments(prev => [...prev, '']);
  const removeAttachment = (idx) =>
    setAttachments(prev => prev.filter((_, i) => i !== idx));

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />

      <div id="wrapper">
        {/* SIDEBAR (unchanged) */}
   <nav
          className="navbar align-items-start p-0 sidebar sidebar-dark accordion bg-gradient-primary navbar-dark d-md-block d-sm-none d-xs-none d-none"
          style={{ background: "#061736" }}
        >
          <div className="container-fluid d-flex flex-column p-0">
            {/* ...sidebar content unchanged... */}

             <a className="navbar-brand d-flex justify-content-center align-items-center m-0 sidebar-brand" href="#">
              <div className="d-none d-sm-none d-md-block d-lg-block d-xl-block">
                {/* navbar top */}
              </div>
            </a>
            <hr className="my-0 sidebar-divider" />
            <ul className="navbar-nav text-light" id="accordionSidebar">
              <li className="nav-item">
                <a className="nav-link d-flex justify-content-start" href="/index.html">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-house" viewBox="0 0 16 16">
                    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
                  </svg>
                  <span className="me-2" style={{ fontSize: 17 }}> الرئيسية </span>
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link d-flex justify-content-start" href="/table.html">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style={{ opacity: 0.8 }} className="bi bi-card-checklist" viewBox="0 0 16 16">
                    <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z"/>
                    <path d="M7 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0M7 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-1.496-.854a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 1 1 .708-.708l.146.147 1.146-1.147a.5.5 0 0 1 .708 0"/>
                  </svg>
                  <span className="me-2" style={{ fontSize: 17 }}> معايير التحول </span>
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link d-flex justify-content-start" href="/login.html">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style={{ opacity: 0.8 }} className="bi bi-diagram-2" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 5 7h2.5V6A1.5 1.5 0 0 1 6 4.5zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5zM3 11.5A1.5 1.5 0 0 1 4.5 10h1A1.5 1.5 0 0 1 7 11.5v1A1.5 1.5 0 0 1 5.5 14h-1A1.5 1.5 0 0 1 3 12.5zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm4.5.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 9 12.5zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5"/>
                  </svg>
                  <span className="me-2" style={{ fontSize: 17 }}> الجهات </span>
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link d-flex justify-content-start" href="/login.html">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style={{ opacity: 0.8 }} className="bi bi-pie-chart" viewBox="0 0 16 16">
                    <path d="M7.5 1.018a7 7 0 0 0-4.79 11.566L7.5 7.793zm1 0V7.5h6.482A7 7 0 0 0 8.5 1.018M14.982 8.5H8.207l-4.79 4.79A7 7 0 0 0 14.982 8.5M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8"/>
                  </svg>
                  <span className="me-2" style={{ fontSize: 17 }}> الإحصائيات </span>
                </a>
              </li>
            </ul>


          </div>
        </nav>

        {/* PAGE CONTENT */}
        <div className="d-flex flex-column" id="content-wrapper">
          <div id="content">
            <div className="container-fluid">
              <div className="row p-4">
                <div className='col-md-12'>
                  <h4>الرئيسية/ إدارة المعايير</h4>
                </div>
              </div>

              <div className="row">
                <div className="col-md-1 col-xl-2 col-xxl-2" />
                <div className="col-md-10 col-xl-8 col-xxl-8 p-4 my-3 bg-white"
                     style={{ borderTop: "3px solid #4F7689", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                  <h4>إنشاء بطاقة معيار</h4>
                  <form
                    className={`needs-validation ${validated ? 'was-validated' : ''}`}
                    noValidate
                    onSubmit={handleSubmit}
                  >
                    {/* رقم المعيار */}
                    <div className="mb-3">
                      <label htmlFor="standard" className="form-label">رقم المعيار</label>
                      <input type="text" className="form-control" id="standard" name="standard" required />
                      <div className="invalid-feedback">يرجى إدخال المعيار</div>
                    </div>

                    {/* اسم المعيار */}
                    <div className="mb-3">
                      <label htmlFor="goal" className="form-label">اسم المعيار</label>
                      <input type="text" className="form-control" id="goal" name="goal" required />
                      <div className="invalid-feedback">يرجى إدخال اسم المعيار</div>
                    </div>

                    {/* الهدف */}
                    <div className="mb-3">
                      <label htmlFor="desc2" className="form-label">الهدف</label>
                      <textarea className="form-control" id="desc2" name="desc2" rows="3" required />
                      <div className="invalid-feedback">يرجى إدخال الهدف</div>
                    </div>

                    {/* متطلبات التطبيق */}
                    <div className="mb-3">
                      <label htmlFor="desc3" className="form-label">متطلبات التطبيق</label>
                      <textarea className="form-control" id="desc3" name="desc3" rows="3" required />
                      <div className="invalid-feedback">يرجى تحديد متطلبات التطبيق</div>
                    </div>

                    {/* الجهة */}
                    <div className="mb-3">
                      <label htmlFor="scope" className="form-label">الجهة</label>
                      <select className="form-select" id="scope" name="scope" required>
                        <option value="">اختر الجهة...</option>
                        {departments.map(dept => (
                          <option key={dept.department_id} value={dept.department_id}>
                            {dept.department_name}
                          </option>
                        ))}
                      </select>
                      <div className="invalid-feedback">يرجى اختيار الجهة</div>
                    </div>

                    {/* مستندات الإثبات (نصية) */}
                    {attachments.map((text, idx) => (
                      <div className="mb-4" key={idx}>
                        <label htmlFor={`attachment${idx}`} className="form-label">
                          مستند إثبات {idx + 1}
                        </label>
                        <div className="d-flex align-items-start">
                          <div className="input-group flex-grow-1 has-validation">
                            <span className="input-group-text">
                              <i className="far fa-file-alt"></i>
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              id={`attachment${idx}`}
                              value={text}
                              placeholder="أدخل مسار أو وصلة المستند"
                              onChange={e => handleAttachmentChange(e, idx)}
                              required
                            />
                            <div className="invalid-feedback">يرجى إدخال مسار المستند</div>
                          </div>
                          {idx > 0 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger ms-2"
                              onClick={() => removeAttachment(idx)}
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn btn-secondary mb-3" onClick={addAttachment}>
                      إضافة حقل نصي
                    </button>

                    {/* تأكيد المعلومات */}
                    <div className="form-check mb-3">
                      <input type="checkbox" className="form-check-input" id="checkTerms" name="checkTerms" required />
                      <label className="form-check-label" htmlFor="checkTerms">
                        أؤكد صحة المعلومات
                      </label>
                      <div className="invalid-feedback">يجب تأكيد صحة المعلومات</div>
                    </div>

                    <button type="submit" className="btn btn-primary">إرسال</button>
                  </form>
                </div>
                <div className="col-md-1 col-xl-2 col-xxl-2" />
              </div>
            </div>
          </div>

          {/* FOOTER & Scroll-to-top */}
          <footer className="bg-white sticky-footer">
            <div className="container my-auto">
              <div className="text-center my-auto copyright">
                <span>Copyright © Brand 2025</span>
              </div>
            </div>
          </footer>
          <a className="border rounded d-inline scroll-to-top" href="#page-top">
            <i className="fas fa-angle-up"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
