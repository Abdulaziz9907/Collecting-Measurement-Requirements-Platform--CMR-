import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { getStoredUser } from '../utils/auth';

export default function StandardModal({
  show,
  onHide,
  standardId,
  onUpdated,
  onLocalStatusChange,
}) {
  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const user = getStoredUser();
  const role = (user?.role || '').toLowerCase();

  const [standard, setStandard] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [dragOverProof, setDragOverProof] = useState(null);
  const [notice, setNotice] = useState('');
  const prevEffectiveRef = useRef(null);
  const autoDowngradedOnceRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const reqIdRef = useRef(0);
  const abortRef = useRef(null);

  const [animTick, setAnimTick] = useState(0);
  const prevLoadingRef = useRef(false);

  const [showReasons, setShowReasons] = useState(false);

  const isStacked = showReject || showReasons;

  const normalizeProof = (s = '') =>
    String(s).replace(/\u060C/g, ',').normalize('NFC').replace(/\s+/g, ' ').trim();

  const [uploadingCounts, setUploadingCounts] = useState({});
  const [deleting, setDeleting] = useState({});
  const [successAt, setSuccessAt] = useState({});

  const incUpload = (p) =>
    setUploadingCounts(prev => ({ ...prev, [p]: (prev[p] || 0) + 1 }));
  const decUpload = (p) =>
    setUploadingCounts(prev => {
      const next = { ...prev };
      const n = (next[p] || 1) - 1;
      if (n <= 0) delete next[p]; else next[p] = n;
      return next;
    });

  const markSuccess = (p) => {
    const stamp = Date.now();
    setSuccessAt(prev => ({ ...prev, [p]: stamp }));
    setTimeout(() => {
      setSuccessAt(prev => {
        if (prev[p] === stamp) {
          const copy = { ...prev };
          delete copy[p];
          return copy;
        }
        return prev;
      });
    }, 3200);
  };

  const parseProofs = (raw = '') => {
    const text = String(raw).replace(/،/g, ',');
    const parts = text.match(/(?:\\.|[^,])+/g) || [];
    return parts.map(s => s.replace(/\\,/g, ',')).map(normalizeProof).filter(Boolean);
  };

  const proofs = useMemo(
    () => parseProofs(standard?.proof_required ?? standard?.Proof_required ?? ''),
    [standard]
  );

  const getAttachments = (name) => {
    const target = normalizeProof(name);
    return attachments.filter(a => normalizeProof(a.proof_name ?? a.Proof_name) === target);
  };

  const normalizedProofs = useMemo(() => proofs.map(normalizeProof), [proofs]);
  const normalizedUploaded = useMemo(
    () => new Set(attachments.map(a => normalizeProof(a.proof_name ?? a.Proof_name))),
    [attachments]
  );

  const hasAllProofs = useMemo(() => {
    if (!normalizedProofs.length) return false;
    return normalizedProofs.every(p => normalizedUploaded.has(p));
  }, [normalizedProofs, normalizedUploaded]);

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

  const uploadFile = async (proof, file, { reload = true } = {}) => {
    if (!canManageFiles) return false;
    const form = new FormData();
    form.append('file', file);
    form.append('proofName', normalizeProof(proof));

    incUpload(proof);
    try {
      const res = await fetch(`${API_BASE}/api/standards/${standardId}/attachments`, { method: 'POST', body: form });
      if (!res.ok) {
        const msg = (await res.text().catch(() => '' )).trim();
        setNotice(msg || `تعذّر رفع الملف (${res.status}).`);
        return false;
      }
      if (reload) {
        await loadData();
        onUpdated && onUpdated();
      }
      return true;
    } catch {
      setNotice('حدث خطأ');
      return false;
    } finally {
      decUpload(proof);
    }
  };

  const handleFileSelect = (proof) => {
    if (!canManageFiles) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      let allOk = true;
      for (let i = 0; i < files.length; i++) {
        const last = i === files.length - 1;
        const ok = await uploadFile(proof, files[i], { reload: last });
        allOk = allOk && ok;
      }
      if (allOk) markSuccess(proof);
    };
    input.click();
  };

  const deleteFile = async (id, proofNameForSuccess) => {
    if (!canManageFiles) return;
    setDeleting(prev => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API_BASE}/api/standards/${standardId}/attachments/${id}`, { method: 'DELETE' });
      await loadData();
      onUpdated && onUpdated();
      markSuccess(proofNameForSuccess);
    } finally {
      setDeleting(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const loadData = async () => {
    if (!standardId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setLoadError('');
    setStandard(null);
    setAttachments([]);

    const myReqId = ++reqIdRef.current;
    try {
      const [stdRes, attRes] = await Promise.all([
        fetch(`${API_BASE}/api/standards/${standardId}`, { signal: controller.signal }),
        fetch(`${API_BASE}/api/standards/${standardId}/attachments`, { signal: controller.signal })
      ]);

      if (myReqId !== reqIdRef.current) return;

      if (!stdRes.ok) throw new Error('failed standard');
      const s = await stdRes.json();

      if (myReqId !== reqIdRef.current) return;

      const atts = attRes.ok ? await attRes.json() : [];

      if (myReqId !== reqIdRef.current) return;

      setStandard(s);
      setAttachments(atts);
    } catch (e) {
      if (e?.name === 'AbortError') return;
      if (myReqId === reqIdRef.current) {
        setStandard(null);
        setAttachments([]);
        setLoadError('تعذّر تحميل البيانات.');
      }
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (show && standardId) {
      setReason('');
      setShowReject(false);
      setNotice('');
      prevEffectiveRef.current = null;
      autoDowngradedOnceRef.current = false;
      loadData();
    } else {
      abortRef.current?.abort();
    }
    return () => {
      abortRef.current?.abort();
    };
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
        setNotice(ok ? 'تم تحويل الحالة إلى "تحت العمل" لعدم اكتمال مستندات الإثبات.' : 'حدث خطأ');
        onUpdated && onUpdated();
        await loadData();
      })();
    }
  }, [standard, hasAllProofs, apiStatus, effectiveStatus]);

  useEffect(() => {
    if (prevLoadingRef.current && !loading && standard) {
      setAnimTick(t => t + 1);
    }
    prevLoadingRef.current = loading;
  }, [loading, standard]);

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
      <Modal
        show={show}
        onHide={onHide}
        size="lg"
        centered
        dir="rtl"
        contentClassName={isStacked ? 'underlay-dim-content' : undefined}
      >
        <Modal.Header>
          <Modal.Title>تفاصيل المعيار</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <Spinner animation="border" role="status" />
              <div className="mt-3 text-muted">جاري التحميل...</div>
            </div>
          ) : loadError ? (
            <div className="alert alert-danger mb-0">{loadError}</div>
          ) : standard ? (
            <div
              key={`content-${animTick}`}
              className="modal-content-animated"
              style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}
            >
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

              {effectiveStatus === 'غير معتمد' && Boolean(parsedReject.current) && (
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center gap-2">
                    <Form.Label className="mb-1 text-danger flex-shrink-0">سبب الرفض</Form.Label>
                    <Button
                      type="button"
                      variant="outline-danger"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setShowReasons(true); }}
                    >
                      أسباب الرفض السابقة
                    </Button>
                  </div>

                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={parsedReject.current}
                    readOnly
                    className="text-danger mt-2"
                    dir="rtl"
                    style={{ backgroundColor: '#fff5f5', whiteSpace: 'pre-wrap' }}
                  />
                </Form.Group>
              )}

              {!parsedReject.current && parsedReject.history.length > 0 && effectiveStatus === 'غير معتمد' && (
                <div className="mb-3 d-flex justify-content-end">
                  <Button
                    type="button"
                    variant="outline-danger"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setShowReasons(true); }}
                  >
                    أسباب الرفض السابقة
                  </Button>
                </div>
              )}

              <h4>مستندات الإثبات</h4>
              {proofs.map((p, idx) => {
                const atts = getAttachments(p);
                const isDragging = dragOverProof === p;
                const uploadingCount = uploadingCounts[p] || 0;
                const isUploadingNow = uploadingCount > 0;
                const successPing = !!successAt[p];

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
                  if (files.length === 0) return;

                  let allOk = true;
                  for (let i = 0; i < files.length; i++) {
                    const last = i === files.length - 1;
                    const ok = await uploadFile(p, files[i], { reload: last });
                    allOk = allOk && ok;
                  }
                  if (allOk) markSuccess(p);

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
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <h6 className="fw-bold m-0 text-primary proof-title">
                        <i className="fas fa-file-alt me-2 text-secondary"></i>{p}
                      </h6>
                      {successPing && (
                        <span className="tiny-success-badge ms-2">
                          <i className="fas fa-check"></i> تم
                        </span>
                      )}
                    </div>

                    {atts.length === 0 && <div className="text-muted mb-2">لا يوجد ملفات مرفوعة لهذا المستند.</div>}

                    {atts.map(a => {
                      const id = a.attachment_id ?? a.Attachment_id;
                      const filename = a.fileName ?? a.FileName ?? '';
                      const url = `${API_BASE}/api/standards/${standardId}/attachments/${id}`;
                      const isDeleting = !!deleting[id];

                      return (
                        <div className="d-flex align-items-start mb-2" key={id}>
                          <div className="input-group flex-grow-1">
                            <input className="form-control" type="text" value={filename} readOnly />
                            <a className="btn btn-outline-secondary" href={url} target="_blank" rel="noreferrer">
                              عرض
                            </a>
                            {canManageFiles && (
                              <Button
                                variant="outline-danger"
                                className="ms-2"
                                size="sm"
                                disabled={isDeleting || isUploadingNow}
                                onClick={() => deleteFile(id, p)}
                              >
                                {isDeleting ? (
                                  <span className="d-inline-flex align-items-center gap-1">
                                    <Spinner animation="border" size="sm" />
                                    <span>جارٍ الحذف...</span>
                                  </span>
                                ) : (
                                  'حذف'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {canManageFiles ? (
                      <div className="mt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isUploadingNow}
                          onClick={() => handleFileSelect(p)}
                        >
                          {isUploadingNow ? (
                            <span className="d-inline-flex align-items-center gap-1">
                              <Spinner animation="border" size="sm" />
                              <span>جارٍ الرفع...</span>
                            </span>
                          ) : (
                            <>
                              <i className="fas fa-upload me-1"></i> رفع ملفات
                            </>
                          )}
                        </Button>
                        <Form.Text className="text-muted d-block mt-1">
                          يمكنك رفع ملف أو أكثر، أو سحبها وإفلاتها هنا.
                        </Form.Text>
                      </div>
                    ) : (
                      isUser && effectiveStatus === 'معتمد' && (
                        <Form.Text className="text-muted d-block mt-1">
                          لا يمكنك رفع أو حذف الملفات بعد اعتماد المعيار.
                        </Form.Text>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">لا توجد بيانات.</div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            {showActionButtons && (
              <div className="d-flex">
                <Button variant="success" onClick={approve} disabled={loading || !hasAllProofs}>
                  معتمد
                </Button>
                <Button variant="danger" className="ms-2" onClick={() => setShowReject(true)} disabled={loading}>
                  غير معتمد
                </Button>
              </div>
            )}
            <Button variant="secondary" onClick={onHide} disabled={loading}>إغلاق</Button>
          </div>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showReject}
        onHide={() => setShowReject(false)}
        centered
        dir="rtl"
        backdropClassName="reject-backdrop stacked-backdrop"
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
          <Button variant="danger" onClick={reject} disabled={loading}>إرسال</Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showReasons}
        onHide={() => setShowReasons(false)}
        centered
        dir="rtl"
        backdropClassName="stacked-backdrop"
      >
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
        .modal-backdrop.reject-backdrop.show,
        .modal-backdrop.stacked-backdrop.show {
          opacity: 0.85 !important;
          background-color: #000 !important;
          backdrop-filter: blur(2px);
        }
        .underlay-dim-content {
          position: relative;
          filter: brightness(.72) saturate(.92) blur(.6px);
          transition: filter .18s ease;
        }
        .underlay-dim-content::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,.15);
          border-radius: inherit;
          pointer-events: none;
        }
        .proof-title {
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .modal-content-animated {
          animation: modalPop .22s cubic-bezier(.22,.61,.36,1) both;
          will-change: transform, opacity, filter;
        }
        @keyframes modalPop {
          from {
            transform: translateY(8px) scale(.985);
            opacity: 0;
            filter: blur(1.2px);
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
            filter: none;
          }
        }
        .tiny-success-badge {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          font-size: .78rem;
          background: #e7f7ed;
          color: #137c3a;
          border: 1px solid #bfe9cd;
          padding: .15rem .45rem;
          border-radius: 999px;
          animation: pingFade 2.8s ease both;
        }
        @keyframes pingFade {
          0%   { transform: scale(.96); opacity: 0; }
          10%  { transform: scale(1); opacity: 1; }
          90%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .form-label { display: inline-block; }
        @media (prefers-reduced-motion: reduce) {
          .modal-content-animated { animation: none !important; }
          .underlay-dim-content { filter: none !important; }
          .modal-backdrop.stacked-backdrop.show { backdrop-filter: none !important; }
          .tiny-success-badge { animation: none !important; }
        }
      `}</style>
    </>
  );
}
