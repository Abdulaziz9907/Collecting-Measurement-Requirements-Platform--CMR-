import React, { useEffect, useState } from 'react';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';
import { useParams, useNavigate } from 'react-router-dom';

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

export default function Standards_edit() {
  const [validated, setValidated] = useState(false);
  const [proofRequired, setProofRequired] = useState(['']);
  const [departments, setDepartments] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [standard, setStandard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [departmentsRes, standardRes] = await Promise.all([
          fetch(`${API_BASE}/api/departments`),
          fetch(`${API_BASE}/api/standards/${id}`)
        ]);

        if (!departmentsRes.ok || !standardRes.ok) throw new Error();

        const departmentsData = await departmentsRes.json();
        const standardData = await standardRes.json();

        if (isMounted) {
          setDepartments(departmentsData);
          setStandard(standardData);
          if (standardData.proof_required) {
            setProofRequired(standardData.proof_required.split(',').filter(Boolean));
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data', err);
        setDepartments([]);
        setStandard(null);
        setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false };
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
      const proofs = proofRequired
        .filter(text => text.trim())
        .map(text => escapeCommas(escapeInput(text)))
        .join(',');

      const payload = {
        standard_number: escapeInput(form.standard_num.value),
        standard_name: escapeInput(form.goal.value),
        standard_goal: escapeInput(form.desc2.value),
        standard_requirments: escapeInput(form.desc3.value),
        assigned_department_id: standard?.assigned_department_id,
        proof_required: proofs,
        status: standard?.status || 'لم يبدأ',
      };

      try {
        const res = await fetch(`${API_BASE}/api/standards/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          setShowError(true);
        } else {
          setShowSuccess(true);
          setTimeout(() => navigate('/standards'), 2000);
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

  return (
    <div dir="rtl">
      <Header />
      {showSuccess && (
        <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
          <div className="alert alert-success mb-0" role="alert">
            تم تحديث بطاقة المعيار بنجاح
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
                <div className="col-md-10 col-xl-8 my-3 surface">
                  <div className="head-flat">تعديل بطاقة معيار</div>
                  <div className="body-flat">
                  {isLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
                      <div className="spinner-border m-5" role="status">
                        <span className="sr-only">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label className="form-label">رقم المعيار</label>
                        <input type="text" className="form-control" id="standard_num" name="standard" required defaultValue={standard?.standard_number || ''} />
                        <div className="invalid-feedback">يرجى إدخال المعيار</div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">اسم المعيار</label>
                        <input type="text" className="form-control" id="goal" name="goal" required defaultValue={standard?.standard_name || ''} />
                        <div className="invalid-feedback">يرجى إدخال اسم المعيار</div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">الهدف</label>
                        <textarea className="form-control" id="desc2" name="desc2" rows="3" required defaultValue={standard?.standard_goal || ''} />
                        <div className="invalid-feedback">يرجى إدخال الهدف</div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">متطلبات التطبيق</label>
                        <textarea className="form-control" id="desc3" name="desc3" rows="3" required defaultValue={standard?.standard_requirments || ''} />
                        <div className="invalid-feedback">يرجى تحديد متطلبات التطبيق</div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">الجهة</label>
                        <select
                          className="form-select"
                          id="scope"
                          name="scope"
                          required
                          value={standard?.assigned_department_id || ''}
                          onChange={e =>
                            setStandard(prev => ({
                              ...prev,
                              assigned_department_id: parseInt(e.target.value, 10)
                            }))
                          }
                        >
                          <option value="">اختر الجهة...</option>
                          {departments.map(d => (
                            <option key={d.department_id} value={d.department_id}>
                              {d.department_name}
                            </option>
                          ))}
                        </select>
                        <div className="invalid-feedback">يرجى اختيار الجهة</div>
                      </div>

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
                        تحديث
                      </button>
                    </form>
                  )}
                  </div>
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
