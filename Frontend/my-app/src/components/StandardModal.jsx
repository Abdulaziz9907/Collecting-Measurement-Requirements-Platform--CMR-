import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function StandardModal({
  show,
  onHide,
  standardId,
  onUpdated,
  onLocalStatusChange,   // optional: update the row in the table immediately
}) {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = (user?.role || '').toLowerCase();

  const [standard, setStandard] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [dragOverProof, setDragOverProof] = useState(null);
  const [notice, setNotice] = useState('');
  const prevEffectiveRef = useRef(null);
  const autoDowngradedOnceRef = useRef(false);

  // previous reasons modal state
  const [showReasons, setShowReasons] = useState(false);

  // ---------- helpers ----------
  const parseProofs = (raw = '') =>
    String(raw).replace(/،/g, ',').split(',').map(s => s.trim()).filter(Boolean);

  const proofs = useMemo(
    () => parseProofs(standard?.proof_required ?? standard?.Proof_required ?? ''),
    [standard]
  );

  const getAttachments = name =>
    attachments.filter(a => (a.proof_name ?? a.Proof_name) === name);

  const hasAllProofs = useMemo(() => {
    if (!proofs.length) return false; // "مكتمل" requires at least one proof
    return proofs.every(p => attachments.some(a => (a.proof_name ?? a.Proof_name) === p));
  }, [proofs, attachments]);

  const apiStatus = standard?.status ?? standard?.Status ?? 'لم يبدأ';
  const effectiveStatus = (apiStatus === 'معتمد' && !hasAllProofs) ? 'تحت العمل' : apiStatus;

  const isUser = role === 'user';
  const canManageFiles = isUser && effectiveStatus !== 'معتمد';

  const showActionButtons = !isUser && ['مكتمل', 'معتمد', 'غير معتمد'].includes(effectiveStatus);

  const getStatusClass = (status) => {
    switch (status) {
      case 'معتمد': return 'success';
      case 'غير معتمد': return 'danger';
      case 'مكتمل': return 'info';
      case 'تحت العمل': return 'warning text-dark';
      case 'لم يبدأ': default: return 'secondary';
    }
  };

  // ---------- Rejection log parsing ----------
  // [CURRENT] latest
  // [H]ISO_DATE|older
  const parsedReject = useMemo(() => {
    const raw = standard?.rejection_reason ?? standard?.Rejection_reason ?? '';
    if (!raw) return { current: '', history: [] };
    const lines = String(raw).replace(/\r/g, '').split('\n').filter(Boolean);
    let current = '';
    const history = [];
    for (const line of lines) {
      if (line.startsWith('[CURRENT] ')) {
        current = line.slice(10);
      } else if (line.startsWith('[H]')) {
        const idx = line.indexOf('|');
        if (idx > 3) {
          const ts = line.slice(3, idx);
          const rsn = line.slice(idx + 1);
          history.push({ at: ts, reason: rsn });
        }
      } else {
        if (!current) current = line; else current += '\n' + line;
      }
    }
    history.sort((a, b) => new Date(b.at) - new Date(a.at));
    return { current, history };
  }, [standard]);

  // ---------- API ----------
  const loadData = async () => {
    if (!standardId) return;
    try {
      const [stdRes, attRes] = await Promise.all([
        fetch(`${API_BASE}/api/standards/${standardId}`),
        fetch(`${API_BASE}/api/standards/${standardId}/attachments`)
      ]);
      const s = stdRes.ok ? await stdRes.json() : null;
      const atts = attRes.ok ? await attRes.json() : [];
      setStandard(s);
      setAttachments(atts);
    } catch {
      setStandard(null);
      setAttachments([]);
    }
  };

  const buildUpdatePayload = (overrides = {}) => {
    const cur = standard || {};
    return {
      standard_number: cur.standard_number ?? cur.Standard_number ?? '',
      standard_name: cur.standard_name ?? cur.Standard_name ?? '',
      standard_goal: cur.standard_goal ?? cur.Standard_goal ?? '',
      standard_requirments: cur.standard_requirments ?? cur.Standard_requirments ?? '',
      assigned_department_id: cur.assigned_department_id ?? cur.Assigned_department_id ?? 0,
      proof_required: cur.proof_required ?? cur.Proof_required ?? '',
      status: overrides.status ?? (cur.status ?? cur.Status ?? 'لم يبدأ'),
    };
  };

  const putStandard = async (overrides = {}) => {
    try {
      const payload = buildUpdatePayload(overrides);
      const res = await fetch(`${API_BASE}/api/standards/${standardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const approve = async () => {
    if (!hasAllProofs) return;
    await fetch(`${API_BASE}/api/standards/${standardId}/approve`, { method: 'POST' });

    // نحذف السجل محليًا فقط عند الاعتماد (معتمد)
    setStandard(s => s ? {
      ...s,
      status: 'معتمد',
      Status: 'معتمد',
      rejection_reason: null,
      Rejection_reason: null
    } : s);

    onUpdated && onUpdated();
    onHide();
  };

  const reject = async () => {
    if (!reason.trim()) return;
    await fetch(`${API_BASE}/api/standards/${standardId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reason)
    });
    onUpdated && onUpdated();
    setShowReject(false);
    onHide();
  };

  // ---------- file ops ----------
  const uploadFile = async (proof, file) => {
    if (!canManageFiles) return;
    const form = new FormData();
    form.append('file', file);
    form.append('proofName', proof);
    await fetch(`${API_BASE}/api/standards/${standardId}/attachments`, { method: 'POST', body: form });
    await loadData();
    onUpdated && onUpdated();
  };

  const handleFileSelect = (proof) => {
    if (!canManageFiles) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) await uploadFile(proof, file);
    };
    input.click();
  };

  const deleteFile = async (id) => {
    if (!canManageFiles) return;
    await fetch(`${API_BASE}/api/standards/${standardId}/attachments/${id}`, { method: 'DELETE' });
    await loadData();
    onUpdated && onUpdated();
  };

  // ---------- effects ----------
  useEffect(() => {
    if (show) {
      setReason('');
      setShowReject(false);
      setNotice('');
      prevEffectiveRef.current = null;
      autoDowngradedOnceRef.current = false;
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, standardId]);

  useEffect(() => {
    if (!standard) return;

    const prev = prevEffectiveRef.current;
    if (prev !== effectiveStatus) {
      prevEffectiveRef.current = effectiveStatus;
      onLocalStatusChange && onLocalStatusChange(effectiveStatus);
    }

    if (apiStatus === 'معتمد' && !hasAllProofs && !autoDowngradedOnceRef.current) {
      autoDowngradedOnceRef.current = true;
      (async () => {
        const ok = await putStandard({ status: 'تحت العمل' });
        setNotice(ok
          ? 'تم تحويل الحالة إلى "تحت العمل" لعدم اكتمال مستندات الإثبات.'
          : 'تم اعتبار الحالة "تحت العمل" لعدم اكتمال الإثباتات (تعذر تحديث الخادم الآن).'
        );
        onUpdated && onUpdated();
        await loadData();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standard, hasAllProofs, apiStatus, effectiveStatus]);

  // ---------- Banner ----------
  const renderStatusBanner = () => {
    let color = 'secondary';
    let text = '';

    if (isUser) {
      switch (effectiveStatus) {
        case 'لم يبدأ':  color = 'secondary'; text = 'ابدأ برفع مستندات الإثبات لبدء متابعة المعيار.'; break;
        case 'تحت العمل': color = 'warning'; text = 'يمكنك رفع أو حذف الملفات حتى يكتمل كل المطلوب.'; break;
        case 'مكتمل':   color = 'info'; text = 'تم رفع جميع الإثباتات المطلوبة. بانتظار المراجعة.'; break;
        case 'معتمد':   color = 'success'; text = 'تم اعتماد هذا المعيار. لا يمكن رفع أو حذف ملفات.'; break;
        case 'غير معتمد': color = 'danger'; text = 'تم رفض الاعتماد. يرجى مراجعة سبب الرفض مع تصحيح الملفات.'; break;
        default:        color = 'secondary'; text = 'حالة غير معروفة.';
      }
    } else {
      switch (effectiveStatus) {
        case 'لم يبدأ':  color = 'secondary'; text = 'لا توجد إثباتات بعد.'; break;
        case 'تحت العمل': color = 'warning'; text = ' ممثل الإدارة يعمل على رفع الملفات.'; break;
        case 'مكتمل':   color = 'info'; text = 'الإثباتات مكتملة. يمكنك الاعتماد أو الرفض مع السبب.'; break;
        case 'معتمد':   color = 'success'; text = 'تم اعتماد المعيار.'; break;
        case 'غير معتمد': color = 'danger'; text = ' تم رفض الاعتماد. سيُعاد للمراجعة عند رفع ملفات جديدة  من قبل ممثل الإدارة.'; break;
        default:        color = 'secondary'; text = 'حالة غير معروفة.';
      }
    }

    return <div className={`alert alert-${color} py-2 mb-3`}>{text}</div>;
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered dir="rtl">
        <Modal.Header>
          <Modal.Title>تفاصيل المعيار</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {standard ? (
            <div style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
              {notice && <div className="alert alert-info py-2 mb-2">{notice}</div>}
              {renderStatusBanner()}

              <Form.Group className="mb-3">
                <Form.Label>رقم المعيار</Form.Label>
                <Form.Control type="text" value={standard.standard_number ?? standard.Standard_number ?? ''} readOnly />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>اسم المعيار</Form.Label>
                <Form.Control type="text" value={standard.standard_name ?? standard.Standard_name ?? ''} readOnly />
              </Form.Group>

              {/* === الهدف كـ textarea كبيرة === */}
              <Form.Group className="mb-3">
                <Form.Label>الهدف</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={standard?.standard_goal ?? standard?.Standard_goal ?? ''}
                  readOnly
                  dir="rtl"
                  style={{ resize: 'vertical', minHeight: 120, backgroundColor: '#ffffffff', whiteSpace: 'pre-wrap' }}
                />
              </Form.Group>

              {/* === متطلبات التطبيق كـ textarea أكبر === */}
              <Form.Group className="mb-3">
                <Form.Label>متطلبات التطبيق</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={standard?.standard_requirments ?? standard?.Standard_requirments ?? ''}
                  readOnly
                  dir="rtl"
                  style={{ resize: 'vertical', minHeight: 160, backgroundColor: '#ffffffff', whiteSpace: 'pre-wrap' }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>الحالة</Form.Label>
                <div>
                  <span className={`badge bg-${getStatusClass(effectiveStatus)}`}>{effectiveStatus}</span>
                </div>
              </Form.Group>

              {/* ✅ اعرض سبب الرفض فقط عندما الحالة "غير معتمد" */}
              {effectiveStatus === 'غير معتمد' && Boolean(parsedReject.current) && (
                <Form.Group className="mb-3">
                  <Form.Label className="text-danger d-flex justify-content-between align-items-center">
                    <span>سبب الرفض</span>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setShowReasons(true)}
                    >
                      أسباب الرفض السابقة
                    </Button>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={parsedReject.current}
                    readOnly
                    className="text-danger"
                    dir="rtl"
                    style={{ backgroundColor: '#fff5f5', whiteSpace: 'pre-wrap' }}
                  />
                </Form.Group>
              )}

              {/* ✅ زر عرض السجل فقط عندما الحالة "غير معتمد" */}
              {!parsedReject.current && parsedReject.history.length > 0 && effectiveStatus === 'غير معتمد' && (
                <div className="mb-3">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setShowReasons(true)}
                  >
                    أسباب الرفض السابقة
                  </Button>
                </div>
              )}

              <h4>مستندات الإثبات</h4>
              {proofs.map((p, idx) => {
                const atts = getAttachments(p);
                const isDragging = dragOverProof === p;

                const onDragOver = (e) => {
                  if (!canManageFiles) return;
                  e.preventDefault();
                  setDragOverProof(p);
                };
                const onDragLeave = () => {
                  if (!canManageFiles) return;
                  setDragOverProof(null);
                };
                const onDrop = async (e) => {
                  if (!canManageFiles) return;
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []);
                  for (const file of files) await uploadFile(p, file);
                  setDragOverProof(null);
                };

                return (
                  <div
                    key={`${p}-${idx}`}
                    className={`border rounded p-3 mb-4 mt-3 ${isDragging ? 'drag-over' : ''}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  >
                    <h6 className="fw-bold mb-3 text-primary">
                      <i className="fas fa-file-alt me-2 text-secondary"></i>{p}
                    </h6>

                    {atts.length === 0 && (
                      <div className="text-muted mb-2">لا يوجد ملفات مرفوعة لهذا المستند.</div>
                    )}

                    {atts.map(a => {
                      const id = a.attachment_id ?? a.Attachment_id;
                      const path = a.filePath ?? a.FilePath ?? '';
                      const filename = path.split('/').pop();
                      return (
                        <div className="d-flex align-items-start mb-2" key={id}>
                          <div className="input-group flex-grow-1">
                            <input className="form-control" type="text" value={filename} readOnly />
                            <a className="btn btn-outline-secondary" href={`${API_BASE}/${path}`} target="_blank" rel="noreferrer">
                              عرض
                            </a>
                            {canManageFiles && (
                              <Button
                                variant="outline-danger"
                                className="ms-2"
                                size="sm"
                                onClick={() => deleteFile(id)}
                              >
                                حذف
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {canManageFiles ? (
                      <div className="mt-2">
                        <Button variant="primary" size="sm" onClick={() => handleFileSelect(p)}>
                          <i className="fas fa-upload me-1"></i> رفع ملفات
                        </Button>
                        <Form.Text className="text-muted d-block mt-1">
                          يمكنك رفع ملف أو أكثر، أو سحبها وإفلاتها هنا.
                        </Form.Text>
                      </div>
                    ) : (
                      isUser && effectiveStatus === 'معتمد' && (
                        <Form.Text className="text-muted d-block mt-1">
                          لا يمكنك رفع أو حذف ملفات بعد اعتماد المعيار.
                        </Form.Text>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">جاري التحميل...</div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            {showActionButtons && (
              <div className="d-flex">
                <Button variant="success" onClick={approve} disabled={!hasAllProofs}>
                  معتمد
                </Button>
                <Button variant="danger" className="ms-2" onClick={() => setShowReject(true)}>
                  غير معتمد
                </Button>
              </div>
            )}
            <Button variant="secondary" onClick={onHide}>إغلاق</Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Reject reason modal — darker backdrop */}
      <Modal
        show={showReject}
        onHide={() => setShowReject(false)}
        centered
        dir="rtl"
        backdropClassName="reject-backdrop"
      >
        <Modal.Header closeButton>
          <Modal.Title>سبب الرفض</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="rejectReason">
            <Form.Control
              as="textarea"
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              dir="rtl"
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={reject}>إرسال</Button>
        </Modal.Footer>
      </Modal>

      {/* Previous rejection reasons modal */}
      <Modal show={showReasons} onHide={() => setShowReasons(false)} centered dir="rtl">
        <Modal.Header closeButton>
          <Modal.Title>أسباب الرفض السابقة</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {parsedReject.history.length === 0 ? (
            <div className="text-muted">لا يوجد سجل لأسباب الرفض.</div>
          ) : (
            <div className="list-group">
              {parsedReject.history.map((r, idx) => (
                <div key={idx} className="list-group-item">
                  <div className="small text-muted mb-1">
                    {(() => {
                      const d = new Date(r.at);
                      return isNaN(d) ? r.at : d.toLocaleString('ar-SA');
                    })()}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{r.reason}</div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReasons(false)}>إغلاق</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .drag-over { background-color: #f0f8ff; border: 2px dashed #007bff; }
        /* Darker backdrop only for the reject modal */
        .modal-backdrop.reject-backdrop.show {
          opacity: 0.85 !important;
          background-color: #000 !important;
        }
      `}</style>
    </>
  );
}
