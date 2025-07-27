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
        <nav className="navbar align-items-start p-0 sidebar sidebar-dark accordion bg-gradient-primary navbar-dark d-md-block d-sm-none d-xs-none d-none" style={{ background: "#061736" }}>
          {/* ... */}
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
