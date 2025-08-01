import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function StandardModal({ show, onHide, standardId, onUpdated }) {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [standard, setStandard] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [files, setFiles] = useState({});
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleFileChange = (proof, fileList) => {
    setFiles(prev => ({ ...prev, [proof]: fileList }));
  };

  const sendFiles = async proof => {
    const fileList = files[proof];
    if (!fileList) return;
    for (const file of Array.from(fileList)) {
      // eslint-disable-next-line no-await-in-loop
      await uploadFile(proof, file);
    }
    setFiles(prev => ({ ...prev, [proof]: null }));
  };

  const sendAllFiles = async () => {
    for (const [proof, fileList] of Object.entries(files)) {
      if (!fileList) continue;
      for (const file of Array.from(fileList)) {
        // eslint-disable-next-line no-await-in-loop
        await uploadFile(proof, file);
      }
    }
    setFiles({});
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
    onHide();
  };

  const getAttachments = name => attachments.filter(a => a.proof_name === name);
  const proofs = (standard?.proof_required || '').split(',').filter(Boolean);
  const hasFiles = Object.values(files).some(f => f && f.length > 0);

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered dir="rtl">
        <Modal.Header closeButton>
          <Modal.Title>تفاصيل المعيار</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {standard ? (
            <div style={{ fontFamily: 'Noto Sans Arabic' }}>
              <p>رقم المعيار: {standard.standard_number}</p>
              <p>اسم المعيار: {standard.standard_name}</p>
              <p>الهدف: {standard.standard_goal}</p>
              <p>متطلبات التطبيق: {standard.standard_requirments}</p>
              <p>الحالة: {standard.status}</p>
              {standard.rejection_reason && (
                <p className="text-danger">سبب الرفض: {standard.rejection_reason}</p>
              )}
              <hr />
              {proofs.map((p, idx) => {
                const atts = getAttachments(p);
                return (
                  <Form.Group className="mb-4" controlId={`proof-${idx}`} key={idx}>
                    <Form.Label>{p}</Form.Label>
                    {atts.map(a => (
                      <div className="d-flex align-items-start mb-2" key={a.attachment_id}>
                        <div className="input-group flex-grow-1">
                          <a className="form-control" href={`/${a.filePath}`} target="_blank" rel="noreferrer">{a.filePath.split('/').pop()}</a>
                        </div>
                        {user?.role?.toLowerCase() === 'user' && (
                          <Button variant="outline-danger" className="ms-2" onClick={() => deleteFile(a.attachment_id)}>حذف</Button>
                        )}
                      </div>
                    ))}
                    {user?.role?.toLowerCase() === 'user' && (
                      <div className="input-group">
                        <span className="input-group-text"><i className="far fa-file-alt"></i></span>
                        <Form.Control className="form-control" type="file" multiple onChange={e => handleFileChange(p, e.target.files)} />
                      </div>
                    )}
                  </Form.Group>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">جاري التحميل...</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {user?.role?.toLowerCase() === 'user' && (
            <Button variant="primary" className="me-auto" disabled={!hasFiles} onClick={sendAllFiles}>إرسال</Button>
          )}
          {user?.role?.toLowerCase() !== 'user' && proofs.length === attachments.length && (
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
            <Form.Control as="textarea" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={reject}>إرسال</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
