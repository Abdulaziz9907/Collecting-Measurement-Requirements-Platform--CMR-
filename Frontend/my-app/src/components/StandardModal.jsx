import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function StandardModal({ show, onHide, standardId, onUpdated }) {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [standard, setStandard] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [dragOverProof, setDragOverProof] = useState(null);

  const loadData = () => {
    if (!standardId) return;
    fetch(`${API_BASE}/api/standards/${standardId}`)
      .then(res => res.json())
      .then(setStandard)
      .catch(() => setStandard(null));
    fetch(`${API_BASE}/api/standards/${standardId}/attachments`)
      .then(res => res.json())
      .then(setAttachments)
      .catch(() => setAttachments([]));
  };

  useEffect(() => {
    if (show) {
      loadData();
      setReason('');
      setShowReject(false);
    }
  }, [show, standardId]);

  const uploadFile = async (proof, file) => {
    const form = new FormData();
    form.append('file', file);
    form.append('proofName', proof);
    await fetch(`${API_BASE}/api/standards/${standardId}/attachments`, {
      method: 'POST',
      body: form
    });
    loadData();
    if (onUpdated) onUpdated();
  };

  const handleFileSelect = (proof) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = e.target.files;
      for (const file of Array.from(files)) {
        await uploadFile(proof, file);
      }
    };
    input.click();
  };

  const deleteFile = async id => {
    await fetch(`${API_BASE}/api/standards/${standardId}/attachments/${id}`, {
      method: 'DELETE'
    });
    loadData();
    if (onUpdated) onUpdated();
  };

  const approve = async () => {
    await fetch(`${API_BASE}/api/standards/${standardId}/approve`, { method: 'POST' });
    if (onUpdated) onUpdated();
    onHide();
  };

  const reject = async () => {
    if (!reason.trim()) return;
    await fetch(`${API_BASE}/api/standards/${standardId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reason)
    });
    if (onUpdated) onUpdated();
    setShowReject(false);
    onHide();
  };

  const getAttachments = name => attachments.filter(a => a.proof_name === name);
  const proofs = (standard?.proof_required || '').split(',').filter(Boolean);
  const hasAllProofs = proofs.every(p => attachments.some(a => a.proof_name === p));

  const getStatusClass = (status) => {
    switch (status) {
      case 'معتمد': return 'success';
      case 'غير معتمد': return 'danger';
      case 'مكتمل': return 'info';
      case 'تحت العمل': return 'warning text-dark';
      case 'لم يبدأ':
      default: return 'secondary';
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered dir="rtl"
>
        <Modal.Header>
          <Modal.Title>تفاصيل المعيار</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {standard ? (
            <div style={{ fontFamily: 'Noto Sans Arabic' }} >
              <Form.Group className="mb-3">
                <Form.Label>رقم المعيار</Form.Label>
                <Form.Control type="text" value={standard.standard_number} readOnly />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>اسم المعيار</Form.Label>
                <Form.Control type="text" value={standard.standard_name} readOnly />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>الهدف</Form.Label>
                <Form.Control type="text" value={standard.standard_goal} readOnly />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>متطلبات التطبيق</Form.Label>
                <Form.Control type="text" value={standard.standard_requirments} readOnly />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>الحالة</Form.Label>
                <div>
                  <span className={`badge bg-${getStatusClass(standard.status)}`}>
                    {standard.status}
                  </span>
                </div>
              </Form.Group>
              {standard.rejection_reason && (
                <Form.Group className="mb-3">
                  <Form.Label className="text-danger">سبب الرفض</Form.Label>
                  <Form.Control type="text" value={standard.rejection_reason} readOnly className="text-danger" />
                </Form.Group>
              )}

              <h4> مستندات الاثبات</h4>
              {proofs.map((p, idx) => {
                const atts = getAttachments(p);
                const isDragging = dragOverProof === p;

                return (
                  <div
                    key={idx}
                    className={`border rounded p-3 mb-4 mt-3 ${isDragging ? 'drag-over' : ''}`}
                    style={{ borderRight: '5px solid #ffffffff' }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverProof(p);
                    }}
                    onDragLeave={() => setDragOverProof(null)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      for (const file of files) {
                        await uploadFile(p, file);
                      }
                      setDragOverProof(null);
                    }}
                  >
                    <h6 className="fw-bold mb-3 text-primary">
                      <i className="fas fa-file-alt me-2 text-secondary"></i>{p}
                    </h6>

                    {atts.length === 0 && (
                      <div className="text-muted mb-2">لا يوجد ملفات مرفوعة لهذا المستند.</div>
                    )}

                    {atts.map(a => (
                      <div className="d-flex align-items-start mb-2" key={a.attachment_id}>
                        <div className="input-group flex-grow-1">
                          <input
                            className="form-control"
                            type="text"
                            value={a.filePath.split('/').pop()}
                            readOnly
                          />
                          <a
                            className="btn btn-outline-secondary"
                            href={`${API_BASE}/${a.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            عرض
                          </a>
                          {user?.role?.toLowerCase() === 'user' && (
                            <Button
                              variant="outline-danger"
                              className="ms-2"
                              size="sm"
                              onClick={() => deleteFile(a.attachment_id)}
                            >
                              حذف
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {user?.role?.toLowerCase() === 'user' && (
                      <div className="mt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleFileSelect(p)}
                        >
                          <i className="fas fa-upload me-1"></i> رفع ملفات
                        </Button>
                        <Form.Text className="text-muted d-block mt-1">
                          يمكنك رفع ملف أو أكثر، أو سحبها وإفلاتها هنا.
                        </Form.Text>
                      </div>
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
          {user?.role?.toLowerCase() !== 'user' && hasAllProofs && (
            <div className="me-auto">
              <Button variant="success" className="ms-2" onClick={approve}>معتمد</Button>
              <Button variant="danger" onClick={() => setShowReject(true)}>غير معتمد</Button>
            </div>
          )}
          <Button variant="secondary" onClick={onHide}>إغلاق</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showReject} onHide={() => setShowReject(false)} centered dir="rtl">
        <Modal.Header closeButton>
          <Modal.Title>سبب الرفض</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="rejectReason">
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={reject}>إرسال</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .drag-over {
          background-color: #f0f8ff;
          border: 2px dashed #007bff;
        }
          
      `}</style>
    </>
  );
}
