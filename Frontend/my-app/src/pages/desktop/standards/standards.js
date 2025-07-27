import React, { useState } from 'react';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/fonts/fontawesome-all.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';

export default function Standards() {
  const [validated, setValidated] = useState(false);
  const [attachments, setAttachments] = useState(['']);

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      event.stopPropagation();
    } else {
      const data = {
        standard: form.standard.value,
        goal: form.goal.value,
        desc1: form.desc1.value,
        desc2: form.desc2.value,
        desc3: form.desc3.value,
        scope: form.scope.value,
        attachments,
        confirmed: form.checkTerms.checked,
      };
      console.log('Submitting:', data);
      // TODO: send `data` to server
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
        {/* SIDEBAR */}
        <nav
          className="navbar align-items-start p-0 sidebar sidebar-dark accordion bg-gradient-primary navbar-dark"
          style={{ background: "#061736" }}
        >
          <div className="container-fluid d-flex flex-column p-0">
            {/* ...sidebar content unchanged... */}
          </div>
        </nav>

        {/* PAGE CONTENT */}
        <div className="d-flex flex-column" id="content-wrapper">
          <div id="content">
            <div className="container-fluid">
              <div className="row">
                <div className="col-md-2" />
                <div className="col-md-8 p-4 my-3 bg-white border rounded">
                  <form
                    className={`needs-validation ${validated ? 'was-validated' : ''}`}
                    noValidate
                    onSubmit={handleSubmit}
                  >
                    {/* المعيار */}
                    <div className="mb-3">
                      <label htmlFor="standard" className="form-label">رقم المعيار </label>
                      <input
                        type="text"
                        className="form-control"
                        id="standard"
                        name="standard"
                        required
                      />
                      <div className="invalid-feedback">يرجى إدخال المعيار</div>
                    </div>

                    {/* اسم المعيار */}
                    <div className="mb-3">
                      <label htmlFor="goal" className="form-label">اسم المعيار</label>
                      <input
                        type="text"
                        className="form-control"
                        id="goal"
                        name="goal"
                        required
                      />
                      <div className="invalid-feedback">يرجى إدخال الهدف</div>
                    </div>


                    {/* الهدف */}
                    <div className="mb-3">
                      <label htmlFor="desc2" className="form-label">
                      الهدف
                      </label>
                      <textarea
                        className="form-control"
                        id="desc2"
                        name="desc2"
                        rows="3"
                        required
                      />
                      <div className="invalid-feedback">يرجى إدخال البيانات المرتبطة</div>
                    </div>

                    {/* متطلبات التطبيق */}
                    <div className="mb-3">
                      <label htmlFor="desc3" className="form-label">متطلبات التطبيق</label>
                      <textarea
                        className="form-control"
                        id="desc3"
                        name="desc3"
                        rows="3"
                        required
                      />
                      <div className="invalid-feedback">يرجى تحديد متطلبات التطبيق</div>
                    </div>

                    {/* الجهة */}
                    <div className="mb-3">
                      <label htmlFor="scope" className="form-label">الجهة</label>
                      <select
                        className="form-select"
                        id="scope"
                        name="scope"
                        required
                      >
                        <option value="">اختر الجهة...</option>
                        <option>وزارة التعليم</option>
                        <option>وزارة المالية</option>
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
                            <div className="invalid-feedback">
                              يرجى إدخال مسار المستند
                            </div>
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
                    <button
                      type="button"
                      className="btn btn-secondary mb-3"
                      onClick={addAttachment}
                    >
                      إضافة حقل نصي
                    </button>

                    {/* تأكيد المعلومات */}
                    <div className="form-check mb-3">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="checkTerms"
                        name="checkTerms"
                        required
                      />
                      <label className="form-check-label" htmlFor="checkTerms">
                        أؤكد صحة المعلومات
                      </label>
                      <div className="invalid-feedback">يجب تأكيد صحة المعلومات</div>
                    </div>

                    <button type="submit" className="btn btn-primary">إرسال</button>
                  </form>
                </div>
                <div className="col-md-2" />
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
