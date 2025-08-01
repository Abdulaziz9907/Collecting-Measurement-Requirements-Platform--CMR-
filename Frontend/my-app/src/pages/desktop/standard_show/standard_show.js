import React, { useEffect, useState } from 'react';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import { useParams } from 'react-router-dom';

export default function Standard_show() {
  const { id } = useParams();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const [standard, setStandard] = useState(null);
  const [attachments, setAttachments] = useState([]);
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

  useEffect(() => { loadData(); }, [id]);

  const uploadFile = async (proofName, file) => {
    const form = new FormData();
    form.append('file', file);
    form.append('proofName', proofName);
    await fetch(`${API_BASE}/api/standards/${id}/attachments`, { method: 'POST', body: form });
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

  const getAttachment = name => attachments.find(a => a.proof_name === name);

  if (!standard) return <div dir="rtl"><Header /><div className="p-5">جاري التحميل...</div></div>;

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
                  <p>رقم المعيار: {standard.standard_number}</p>
                  <p>اسم المعيار: {standard.standard_name}</p>
                  <p>الهدف: {standard.standard_goal}</p>
                  <p>متطلبات التطبيق: {standard.standard_requirments}</p>
                  <p>الحالة: {standard.status}</p>
                  {standard.rejection_reason && <p className="text-danger">سبب الرفض: {standard.rejection_reason}</p>}

                  <hr />
                  {proofs.map((p, idx) => {
                    const att = getAttachment(p);
                    return (
                      <div key={idx} className="mb-3">
                        <label className="form-label">{p}</label>
                        {att ? (
                          <div>
                            <a href={`/${att.filePath}`} target="_blank" rel="noreferrer">الملف الحالي</a>
                            <input type="file" className="form-control mt-2" onChange={e => uploadFile(p, e.target.files[0])} />
                          </div>
                        ) : (
                          <input type="file" className="form-control" onChange={e => uploadFile(p, e.target.files[0])} />
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
