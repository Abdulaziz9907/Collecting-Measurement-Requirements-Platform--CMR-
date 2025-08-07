import React, { useEffect, useState, useMemo } from 'react';
import { Spinner } from 'react-bootstrap';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/fonts/fontawesome-all.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';

export default function Standards_menu() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    underWork: 0,
    notStarted: 0,
  });
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const user = useMemo(
    () => JSON.parse(localStorage.getItem('user') || 'null'),
    []
  );

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/standards`)
      .then(res => res.json())
      .then(standards => {
        let data = standards;
        if (user?.role?.toLowerCase() === 'user') {
          data = data.filter(s => s.assigned_department_id === user.department_id);
        }
        const statusMap = {
          'معتمد': 'approved',
          'غير معتمد': 'rejected',
          'مكتمل': 'completed',
          'تحت العمل': 'underWork',
          'لم يبدأ': 'notStarted'
        };
        const counts = {
          approved: 0,
          rejected: 0,
          completed: 0,
          underWork: 0,
          notStarted: 0
        };
        data.forEach(s => {
          const key = statusMap[s.status];
          if (key) counts[key]++;
        });
        setSummary({ total: data.length, ...counts });
      })
      .catch(() =>
        setSummary({
          total: 0,
          approved: 0,
          rejected: 0,
          completed: 0,
          underWork: 0,
          notStarted: 0
        })
      )
      .finally(() => setLoading(false));
  }, [API_BASE, user]);

  const summaryCards = [
    { key: 'total', title: 'مجموع المعايير', value: summary.total },
    { key: 'completed', title: 'معايير مكتملة', value: summary.completed },
    { key: 'approved', title: 'معايير معتمدة', value: summary.approved },
    { key: 'rejected', title: 'معايير غير معتمدة', value: summary.rejected },
    { key: 'underWork', title: 'تحت العمل', value: summary.underWork },
    { key: 'notStarted', title: 'لم يبدأ', value: summary.notStarted },
  ];

  const summaryCardColors = {
    total: '#0d6efd',
    completed: '#17a2b8',
    approved: '#198754',
    rejected: '#dc3545',
    underWork: '#ffc107',
    notStarted: '#6c757d',
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />

      <div id="wrapper">
        <Sidebar
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
        />

        <div className="d-flex flex-column" id="content-wrapper">
          <div id="content">
            <div className="container-fluid">

              {/* Breadcrumbs */}
              <div className="row p-4">
                <div className="col-md-12">
                  <Breadcrumbs />
                </div>
              </div>

              {/* Summary Panel styled like Reports */}
              <div className="row">
                <div className="col-md-1 col-xl-1" />
                <div
                  className="col-md-10 col-xl-10 p-4 my-3 bg-white d-flex flex-column"
                  style={{
                    minHeight: '300px',
                    position: 'relative',
                    borderTop: '3px solid #4F7689',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {loading ? (
                    <div className="d-flex flex-grow-1 justify-content-center align-items-center">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <div className="row g-3 mb-4 justify-content-center">
                      {summaryCards.map((b, i) => (
                        <div className="col-lg-2 col-md-4 col-6" key={i}>
                          <div
                            className="p-3 rounded text-white text-center shadow-sm h-100"
                            style={{ backgroundColor: summaryCardColors[b.key] }}
                          >
                            <h5 className="fw-bold mb-1">{b.value.toLocaleString()}</h5>
                            <small>{b.title}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-md-1 col-xl-1" />
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
