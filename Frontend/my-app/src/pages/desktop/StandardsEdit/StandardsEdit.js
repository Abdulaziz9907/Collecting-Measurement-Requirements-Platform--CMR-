import React, { useEffect, useState } from 'react';
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';
import { useParams, useNavigate } from 'react-router-dom';

function escapeInput(str) {
  return String(str).replace(/[&<>'"]/g, (char) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
    return map[char] || char;
  });
}
function escapeCommas(str) {
  return String(str).replace(/[,،]/g, '\\,');
}

// ===== Helpers shared with "create" page =====
// Normalize Arabic/ASCII digits & separators to ASCII ("." and 0-9)
function normalizeStandardNumber(str = "") {
  const map = {
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
  };
  return String(str)
    .replace(/[٠-٩۰-۹]/g, ch => map[ch] || ch)
    .replace(/[٫۔]/g, '.')
    .replace(/\s+/g, '');
}
function normalizeProofTitle(s = '') {
  return String(s).replace(/\s+/g, ' ').trim().toLowerCase();
}
// Split a comma-separated list where commas may be escaped as "\,"
function splitEscapedCommaList(str = '') {
  if (!str) return [''];
  const normalized = String(str).replace(/،/g, ',');
  const parts = normalized.match(/(?:\\.|[^,])+/g) || [];
  return parts.map(s => s.replace(/\\,/g, ',').trim());
}

export default function StandardsEdit() {
  const [validated, setValidated] = useState(false);
  const [proofRequired, setProofRequired] = useState(['']);
  const [departments, setDepartments] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [standard, setStandard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // New validation states (same behavior as "create")
  const [proofDupIdxs, setProofDupIdxs] = useState(new Set());
  const [proofEmptyIdxs, setProofEmptyIdxs] = useState(new Set());
  const [proofMinError, setProofMinError] = useState(false);
  const [stdError, setStdError] = useState('');

  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');

  /* ===== Theme to match Standards/Reports look (with skeleton) ===== */
  const LocalTheme = () => (
    <style>{`
      :root{
        --radius:14px;
        --shadow:0 10px 24px rgba(16,24,40,.08);
        --surface:#fff;
        --surface-muted:#fbfdff;
        --stroke:#eef2f7;
        --skeleton-bg:#e9edf3;
        --skeleton-sheen: rgba(255,255,255,.6);
        --skeleton-speed: 1.2s;
      }
      .page-bg { background:#f6f8fb; min-height:100vh; }
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
      .page-spacer { height:140px; }

      /* Skeleton */
      .skel { position:relative; overflow:hidden; background:var(--skeleton-bg); border-radius:10px; }
      .skel::after {
        content:""; position:absolute; inset:0; transform:translateX(-100%);
        background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%);
        animation:shimmer var(--skeleton-speed) infinite;
      }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .skel::after { animation:none; } }

      .skel-label   { height:12px; width:120px; margin-bottom:8px; border-radius:6px; }
      .skel-input   { height:38px; width:100%; }
      .skel-textarea{ height:96px; width:100%; }
      .skel-icon    { width:40px; height:38px; border-radius:8px; }
      .skel-line    { height:12px; width:180px; border-radius:6px; }
    `}</style>
  );

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
          setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
          setStandard(standardData || null);

          // Parse proof_required safely (supports escaped commas)
          if (standardData?.proof_required) {
            const list = splitEscapedCommaList(standardData.proof_required).filter(Boolean);
            setProofRequired(list.length > 0 ? list : ['']);
          } else {
            setProofRequired(['']);
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data', err);
        if (isMounted) {
          setDepartments([]);
          setStandard(null);
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [API_BASE, id]);

  useEffect(() => {
    if (showError || showSuccess) {
      const t = setTimeout(() => {
        setShowError(false);
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [showError, showSuccess]);

  // Best-effort client-side uniqueness check (ignore current record)
  const standardNumberExistsElsewhere = async (normalized, currentStandard) => {
    try {
      const res = await fetch(`${API_BASE}/api/standards`);
      if (!res.ok) return false;
      const list = await res.json();
      const currentIdNum = Number(id);
      const currentNorm = normalizeStandardNumber(String(currentStandard?.standard_number ?? ''));

      return (Array.isArray(list) ? list : []).some(s => {
        const sNorm = normalizeStandardNumber(String(s?.standard_number ?? ''));
        // Try to exclude by id if present; otherwise exclude by same original number
        const sid = Number(s?.standard_id ?? s?.id ?? NaN);
        const isSelf = Number.isFinite(sid) ? (sid === currentIdNum) : (sNorm === currentNorm);
        return !isSelf && sNorm === normalized;
      });
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setShowSuccess(false);
    setShowError(false);
    setProofDupIdxs(new Set());
    setProofMinError(false);
    setStdError('');

    // 1) Validate standard number (Arabic/ASCII digits allowed)
    const standardNumRaw = (form.standard_num.value || '').trim();
    const standardNumNorm = normalizeStandardNumber(standardNumRaw);
    const STD_RE = /^[0-9\u0660-\u0669\u06F0-\u06F9]+[.\u066B\u06D4][0-9\u0660-\u0669\u06F0-\u06F9]+[.\u066B\u06D4][0-9\u0660-\u06F0-\u06F9]+$/u;
    const isStandardNumValid = STD_RE.test(standardNumRaw);

    if (!form.checkValidity() || !isStandardNumValid) {
      const msg = 'يرجى إدخال رقم بالصيغة الصحيحة مثل 88.863.2';
      setStdError(msg);
      form.standard_num.setCustomValidity(msg);
      setShowError(true);
      e.stopPropagation();
      setValidated(true);
      form.reportValidity?.();
      return;
    }
    form.standard_num.setCustomValidity('');

    // 2) Validate proofs: at least one non-empty, no duplicate titles, no empty fields
    const trimmed = proofRequired.map(p => p.trim());
    const nonEmptyProofs = trimmed.filter(Boolean);

    const dupIdxs = new Set();
    const emptyIdxs = new Set();
    const seen = new Map();
    trimmed.forEach((title, idx) => {
      if (!title) {
        emptyIdxs.add(idx);
        return;
      }
      const norm = normalizeProofTitle(title);
      if (seen.has(norm)) {
        dupIdxs.add(idx);
        dupIdxs.add(seen.get(norm));
      } else {
        seen.set(norm, idx);
      }
    });

    const noProofs = nonEmptyProofs.length === 0;
    if (noProofs || dupIdxs.size > 0 || emptyIdxs.size > 0) {
      if (noProofs) {
        setProofMinError(true);
        setProofEmptyIdxs(new Set());
      }
      if (dupIdxs.size > 0) setProofDupIdxs(dupIdxs);
      if (!noProofs && emptyIdxs.size > 0) setProofEmptyIdxs(emptyIdxs);
      setShowError(true);
      setValidated(true);
      return;
    }
    setProofDupIdxs(new Set());
    setProofEmptyIdxs(new Set());
    setProofMinError(false);

    // 3) Uniqueness across other standards
    setIsSubmitting(true);
    try {
      const existsElsewhere = await standardNumberExistsElsewhere(standardNumNorm, standard);
      if (existsElsewhere) {
        const msg = 'رقم المعيار مُستخدم بالفعل — لا يُسمح بتكرار رقم المعيار';
        setStdError(msg);
        form.standard_num.setCustomValidity(msg);
        setShowError(true);
        setValidated(true);
        form.reportValidity?.();
        setIsSubmitting(false);
        return;
      }
    } catch {
      // ignore; server should enforce uniqueness as well
    } finally {
      if (!stdError) form.standard_num.setCustomValidity('');
    }

    // 4) Prepare payload (escape + keep normalized number)
    const proofsJoined = nonEmptyProofs
      .map(text => escapeCommas(escapeInput(text)))
      .join(',');

    const payload = {
      standard_number: escapeInput(standardNumNorm),
      standard_name: escapeInput(form.goal.value),
      standard_goal: escapeInput(form.desc2.value),
      standard_requirments: escapeInput(form.desc3.value),
      assigned_department_id: standard?.assigned_department_id,
      proof_required: proofsJoined,
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
    } finally {
      setIsSubmitting(false);
    }

    setValidated(true);
  };

  const onStdNumChange = (e) => {
    if (stdError) setStdError('');
    e.currentTarget.setCustomValidity('');
  };

  const handleAttachmentChange = (e, idx) => {
    const text = e.target.value;
    setProofRequired(prev => {
      const next = [...prev];
      next[idx] = text;
      return next;
    });
    if (proofDupIdxs.size) {
      const nextDup = new Set(proofDupIdxs);
      nextDup.delete(idx);
      setProofDupIdxs(nextDup);
    }
    if (proofEmptyIdxs.size) {
      const nextEmpty = new Set(proofEmptyIdxs);
      if (text.trim()) nextEmpty.delete(idx); else nextEmpty.add(idx);
      setProofEmptyIdxs(nextEmpty);
    }
    if (proofMinError && text.trim()) setProofMinError(false);
  };
  const addAttachment = () => setProofRequired(prev => [...prev, '']);
  const removeAttachment = idx =>
    setProofRequired(prev => prev.filter((_, i) => i !== idx));

  /* ------- Skeleton renderer (matches form layout visually) ------- */
  const FormSkeleton = () => (
    <div>
      <div className="mb-3">
        <div className="skel skel-label" />
        <div className="skel skel-input" />
      </div>
      <div className="mb-3">
        <div className="skel skel-label" />
        <div className="skel skel-input" />
      </div>
      <div className="mb-3">
        <div className="skel skel-label" />
        <div className="skel skel-textarea" />
      </div>
      <div className="mb-3">
        <div className="skel skel-label" />
        <div className="skel skel-textarea" />
      </div>
      <div className="mb-3">
        <div className="skel skel-label" />
        <div className="skel skel-input" />
      </div>
      <div className="mb-4">
        <div className="skel skel-label" />
        <div className="d-flex align-items-center gap-2">
          <div className="skel skel-icon" />
          <div className="skel skel-input" />
        </div>
      </div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="skel" style={{ width: 120, height: 32, borderRadius: 8 }} />
      </div>
      <div className="d-flex align-items-center gap-2 pb-4 pt-4 flex-nowrap">
        <div className="skel" style={{ width: 18, height: 18, borderRadius: 4 }} />
        <div className="skel skel-line" style={{ width: 160 }} />
      </div>
      <div className="skel" style={{ width: 96, height: 38, borderRadius: 8 }} />
    </div>
  );

  return (
    <div dir="rtl" className="page-bg min-vh-100 d-flex flex-column" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <LocalTheme />
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

      <div id="wrapper" style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />

        <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
          <div id="content" className="flex-grow-1 d-flex">
            <div className="container-fluid">
              {/* Breadcrumbs — same placement as Standards */}
              <div className="row p-4">
                <div className="col-12">
                  <Breadcrumbs />
                </div>
              </div>

              {/* Centered card — same grid as Standards (col-12 col-xl-10) */}
              <div className="row justify-content-center">
                <div className="col-12 col-xl-10">
                  <div className="surface" aria-busy={isSubmitting || isLoading}>
                    {/* Header inside the card with exact height */}
                    <div className="head-flat head-match">
                      <h5 className="m-0">تعديل معيار</h5>
                    </div>

                    <div className="body-flat">
                      {isLoading ? (
                        <FormSkeleton />
                      ) : (
                        <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                          <div className="mb-3">
                            <label className="form-label">رقم المعيار</label>
                            <input
                              type="text"
                              className={`form-control ${stdError ? 'is-invalid' : ''}`}
                              id="standard_num"
                              name="standard_num"
                              inputMode="text"
                              defaultValue={standard?.standard_number || ''}
                              onChange={onStdNumChange}
                              // Accept Arabic/ASCII digits & separators
                              pattern="[0-9\u0660-\u0669\u06F0-\u06F9]+[.\u066B\u06D4][0-9\u0660-\u0669\u06F0-\u06F9]+[.\u066B\u06D4][0-9\u0660-\u06F0-\u06F9]+"
                              required
                            />
                            <div className="invalid-feedback">
                              {stdError || 'يرجى إدخال رقم بالصيغة الصحيحة مثل 88.863.2'}
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">اسم المعيار</label>
                            <input
                              type="text"
                              className="form-control"
                              id="goal"
                              name="goal"
                              required
                              defaultValue={standard?.standard_name || ''}
                            />
                            <div className="invalid-feedback">يرجى إدخال اسم المعيار</div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">الهدف</label>
                            <textarea
                              className="form-control"
                              id="desc2"
                              name="desc2"
                              rows="3"
                              required
                              defaultValue={standard?.standard_goal || ''}
                            />
                            <div className="invalid-feedback">يرجى إدخال الهدف</div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">متطلبات التطبيق</label>
                            <textarea
                              className="form-control"
                              id="desc3"
                              name="desc3"
                              rows="3"
                              required
                              defaultValue={standard?.standard_requirments || ''}
                            />
                            <div className="invalid-feedback">يرجى تحديد متطلبات التطبيق</div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">الجهة</label>
                            <select
                              className="form-select"
                              id="scope"
                              name="scope"
                              required
                              value={standard?.assigned_department_id ?? ''}
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

                          {proofRequired.map((text, idx) => {
                            const isDup = proofDupIdxs.has(idx);
                            const isEmpty = proofEmptyIdxs.has(idx);
                            const isFirst = idx === 0;
                            const inputClasses = `form-control ${(isDup || isEmpty) ? 'is-invalid' : ''} ${isFirst && proofMinError ? 'is-invalid' : ''}`;
                            return (
                              <div className="mb-4" key={idx}>
                                <label className="form-label">مستند إثبات {idx + 1}</label>
                                <div className="d-flex align-items-start">
                                  <div className="input-group flex-grow-1">
                                    <span className="input-group-text"><i className="far fa-file-alt" /></span>
                                    <input
                                      type="text"
                                      className={inputClasses}
                                      value={text}
                                      maxLength={255}
                                      placeholder="أدخل وصف المستند"
                                      onChange={e => handleAttachmentChange(e, idx)}
                                    />
                                  </div>
                                  {idx > 0 && (
                                    <button type="button" className="btn btn-outline-danger ms-2" onClick={() => removeAttachment(idx)}>
                                      حذف
                                    </button>
                                  )}
                                </div>
                                {isFirst && proofMinError && (
                                  <div className="invalid-feedback d-block">يجب إدخال مستند إثبات واحد على الأقل</div>
                                )}
                                {isDup && (
                                  <div className="invalid-feedback d-block">عنوان مستند إثبات مكرر</div>
                                )}
                                {isEmpty && !isFirst && (
                                  <div className="invalid-feedback d-block">لا يمكن ترك عنوان مستند إثبات فارغاً</div>
                                )}
                                {isEmpty && isFirst && !proofMinError && (
                                  <div className="invalid-feedback d-block">لا يمكن ترك عنوان مستند إثبات فارغاً</div>
                                )}
                              </div>
                            );
                          })}

                          <button type="button" className="btn btn-light mb-3" onClick={() => setProofRequired(prev => [...prev, ''])}>
                            إضافة مستند إثبات
                          </button>

                          <div className="d-flex align-items-center gap-2 pb-4 pt-4 flex-nowrap">
                            <input type="checkbox" className="form-check-input" id="checkTerms" name="checkTerms" required />
                            <label className="form-check-label text-nowrap" htmlFor="checkTerms">أؤكد صحة المعلومات</label>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                              {isSubmitting && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                              تحديث
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => navigate('/standards')}
                              disabled={isSubmitting}
                            >
                              إلغاء
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacer before footer to match other pages */}
              <div className="page-spacer" />
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
