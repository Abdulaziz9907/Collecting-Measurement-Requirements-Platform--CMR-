import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/fonts/fontawesome-all.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';

export default function Departments() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  const rowsPerPage = 11;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/departments`)
      .then(res => res.json())
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [API_BASE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredData = data.filter(item =>
    `${item.department_name} ${item.building_number}`.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

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
                <div className="col-md-1 col-xl-1" />
                <div
                  className="col-md-10 col-xl-10 p-4 my-3 bg-white d-flex flex-column"
                  style={{
                    minHeight: `${rowsPerPage * 48 + 150}px`,
                    position: 'relative',
                    borderTop: '3px solid #4F7689',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="d-flex justify-content-start align-items-center flex-wrap gap-2 mb-3">
                    <input
                      className="form-control form-control-sm"
                      style={{ width: '160px' }}
                      type="search"
                      placeholder="بحث..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <a className="btn btn-outline-success btn-sm" href="/departments_create">إضافة جهة</a>
                  </div>
                  <div
                    className="table-responsive"
                    style={{
                      overflowX: 'auto',
                      minHeight: `${rowsPerPage * 48}px`,
                      marginBottom: '80px'
                    }}
                  >
                    <table className="table text-center align-middle">
                      <thead>
                        <tr style={{ color: '#c9c9c9ff', fontSize: '0.875rem' }}>
                          <th style={{ color: '#6c757d' }}>اسم الجهة</th>
                          <th style={{ color: '#6c757d' }}>رقم المبنى</th>
                          <th style={{ color: '#6c757d' }}>تاريخ الإنشاء</th>
                          <th style={{ color: '#6c757d' }}>تعديل</th>
                          <th style={{ color: '#6c757d' }}>حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="text-center py-5">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : paginatedData.length === 0 ? (
                          <tr><td colSpan="5" className="text-muted">لا توجد نتائج</td></tr>
                        ) : (
                          paginatedData.map((item) => (
                            <tr key={item.department_id}>
                              <td className="text-primary">{item.department_name}</td>
                              <td>{item.building_number}</td>
                              <td>{new Date(item.created_at).toLocaleDateString()}</td>
                              <td>
                                <i className="fas fa-pen text-success" onClick={() => window.location.href = `/departments_edit/${item.department_id}`}></i>
                              </td>
                              <td>
                                <i
                                  className="fas fa-times text-danger"
                                  style={{ cursor: 'pointer' }}
                                  onClick={async () => {
                                    try {
                                      await fetch(`${API_BASE}/api/departments/${item.department_id}`, { method: 'DELETE' });
                                      setLoading(true);
                                      fetch(`${API_BASE}/api/departments`)
                                        .then(res => res.json())
                                        .then(setData)
                                        .catch(() => setData([]))
                                        .finally(() => setLoading(false));
                                    } catch {}
                                  }}
                                ></i>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {!loading && filteredData.length > rowsPerPage && (
                    <div
                      className="d-flex justify-content-between align-items-center px-3 py-2 bg-white position-absolute bottom-0 start-0 w-100"
                      style={{
                        zIndex: 10,
                        paddingInline: '1rem'
                      }}
                    >
                      <div>
                        <button className="btn btn-outline-primary btn-sm" onClick={goToNextPage} disabled={currentPage === totalPages}>التالي</button>
                        <button className="btn btn-outline-primary btn-sm me-2 m-2" onClick={goToPreviousPage} disabled={currentPage === 1}>السابق</button>
                      </div>
                      <div className="text-muted small">الصفحة {currentPage} من {totalPages}</div>
                    </div>
                  )}
                </div>
                <div className="col-md-1 col-xl-1" />
              </div>
            </div>
          </div>
          <footer className="bg-white sticky-footer mt-auto py-3">
            <div className="container my-auto">
              <div className="text-center my-auto"><span>© RCJY 2025</span></div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
