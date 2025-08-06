import React, { useEffect, useState } from 'react';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/fonts/fontawesome-all.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';



export default function Standards_menu() {
  const [sidebarVisible, setSidebarVisible] = useState(false); // Mobile sidebar
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    underWork: 0,
    notStarted: 0,
  });

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    fetch(`${API_BASE}/api/standards`)
      .then((res) => res.json())
      .then((standards) => {
        let data = standards;
        if (user?.role?.toLowerCase() === 'user') {
          data = data.filter(
            (s) => s.assigned_department_id === user.department_id
          );
        }
        const statusMap = {
          'معتمد': 'approved',
          'غير معتمد': 'rejected',
          'مكتمل': 'completed',
          'تحت العمل': 'underWork',
          'لم يبدأ': 'notStarted',
        };
        const counts = {
          approved: 0,
          rejected: 0,
          completed: 0,
          underWork: 0,
          notStarted: 0,
        };
        data.forEach((s) => {
          const key = statusMap[s.status];
          if (key) counts[key] += 1;
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
          notStarted: 0,
        })
      );
  }, [API_BASE, user]);

  const summaryCards = [
    { key: 'total', title: 'مجموع المعايير', value: summary.total },
    { key: 'completed', title: 'معايير مكتملة', value: summary.completed },
    { key: 'approved', title: 'معايير معتمدة', value: summary.approved },
    { key: 'rejected', title: 'معايير غير معتمدة', value: summary.rejected },
    { key: 'underWork', title: 'تحت العمل', value: summary.underWork },
    { key: 'notStarted', title: 'لم يبدأ', value: summary.notStarted },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />



      {/* Alerts */}
 

      {/* Main Layout */}
      <div id="wrapper">

<Sidebar
  sidebarVisible={sidebarVisible}
  setSidebarVisible={setSidebarVisible}
/>
        {/* Content Wrapper */}
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
                <div
                  className="col-md-10 col-xl-8 p-4 my-3 bg-white"
                  style={{
                    borderTop: '3px solid #4F7689',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  <div className="row mb-4">
                    {summaryCards.map((b, i) => (
                      <div className="col-md-2 col-sm-4 mb-3" key={i}>
                        <div className="bg-white text-center p-3 border rounded shadow-sm">
                          <h5>{b.value.toLocaleString()}</h5>
                          <small className="text-muted">{b.title}</small>
                        </div>
                      </div>
                    ))}
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
