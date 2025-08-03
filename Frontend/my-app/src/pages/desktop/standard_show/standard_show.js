import React, { useEffect, useRef, useState } from 'react';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import { useParams } from 'react-router-dom';

export default function Standard_show() {
  const { id } = useParams();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const [standard, setStandard] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const fileInputRefs = useRef({});
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const loadData = () => {
    fetch(`${API_BASE}/api/standards/${id}`)
      .then(res => res.json())
      .then(setStandard)
      .catch(() => setStandard(null));
    fetch(`${API_BASE}/api/standards/${id}/attachments`)
      .then(res => res.json())
      .then(setAttachments)
      .catch(() => setAttachments([]));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const uploadFile = async (proofName, file) => {
    const form = new FormData();
    form.append('file', file);
    form.append('proofName', proofName);
    await fetch(`${API_BASE}/api/standards/${id}/attachments`, { method: 'POST', body: form });
    loadData();
  };

  const handleFileSelect = async (proofName, fileList) => {
    if (!fileList) return;
    for (const file of Array.from(fileList)) {
      await uploadFile(proofName, file);
    }
    if (fileInputRefs.current[proofName]) {
      fileInputRefs.current[proofName].value = '';
    }
  };

  const deleteFile = async (attId) => {
    await fetch(`${API_BASE}/api/standards/${id}/attachments/${attId}`, { method: 'DELETE' });
    loadData();
  };

  const approve = async () => {
    await fetch(`${API_BASE}/api/standards/${id}/approve`, { method: 'POST' });
    loadData();
  };

  const reject = async () => {
    const reason = prompt('سبب الرفض');
    if (!reason) return;
    await fetch(`${API_BASE}/api/standards/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reason)
    });
    loadData();
  };

  const getAttachments = name => attachments.filter(a => a.proof_name === name);

  if (!standard) {
    return (
      <div dir="rtl">
        <Header />
        <div className="p-5">جاري التحميل...</div>
      </div>
    );
  }

  const proofs = (standard.proof_required || '').split(',').filter(Boolean);

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />
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
                <div className="col-md-10 col-xl-8 p-4 my-3 bg-white" style={{ borderTop: '3px solid #4F7689', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <h4>تفاصيل المعيار</h4>
                  <div className="mb-3">
                    <label className="form-label">رقم المعيار</label>
                    <input className="form-control" type="text" value={standard.standard_number} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">اسم المعيار</label>
                    <input className="form-control" type="text" value={standard.standard_name} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الهدف</label>
                    <input className="form-control" type="text" value={standard.standard_goal} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">متطلبات التطبيق</label>
                    <input className="form-control" type="text" value={standard.standard_requirments} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">الحالة</label>
                    <input className="form-control" type="text" value={standard.status} readOnly />
                  </div>
                  {standard.rejection_reason && (
                    <div className="mb-3">
                      <label className="form-label text-danger">سبب الرفض</label>
                      <input className="form-control text-danger" type="text" value={standard.rejection_reason} readOnly />
                    </div>
                  )}
                  <hr />
                  {proofs.map((p, idx) => {
                    const atts = getAttachments(p);
                    return (
                      <div key={idx} className="mb-4">
                        <label className="form-label">{p}</label>
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
                            </div>
                            {user?.role?.toLowerCase() === 'user' && (
                              <button className="btn btn-outline-danger ms-2" onClick={() => deleteFile(a.attachment_id)}>حذف</button>
                            )}
                          </div>
                        ))}
                        {user?.role?.toLowerCase() === 'user' && (
                          <>
                            <input
                              type="file"
                              multiple
                              ref={el => { fileInputRefs.current[p] = el; }}
                              style={{ display: 'none' }}
                              onChange={e => handleFileSelect(p, e.target.files)}
                            />
                            <button
                              className="btn btn-primary mt-2"
                              type="button"
                              onClick={() => fileInputRefs.current[p]?.click()}
                            >
                              رفع ملف
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {user?.role?.toLowerCase() !== 'user' && proofs.length === attachments.length && (
                    <div className="d-flex gap-2">
                      <button className="btn btn-success" onClick={approve}>معتمد</button>
                      <button className="btn btn-danger" onClick={reject}>غير معتمد</button>
                    </div>
                  )}
                </div>
                <div className="col-md-1 col-xl-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
