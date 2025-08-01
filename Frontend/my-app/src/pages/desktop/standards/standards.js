import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';

export default function Standards() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const rowsPerPage = 11;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/standards`).then(res => res.json()),
      fetch(`${API_BASE}/api/departments`).then(res => res.json())
    ])
      .then(([standards, departments]) => {
        if (user?.role === 'User') {
          standards = standards.filter(s => s.assigned_department_id === user.department_id);
          departments = departments.filter(d => d.department_id === user.department_id);
        }
        setData(standards);
        setDepartments(departments);
      })
      .catch(() => {
        setData([]);
        setDepartments([]);
      })
      .finally(() => setLoading(false));
  }, [API_BASE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter]);

  const uniqueStatuses = [...new Set(data.map((item) => item.status))];
  const uniqueDepartments = departments.map(d => d.department_name);

  const getStatusClass = (status) => {
    switch (status) {
      case 'معتمد': return 'success';
      case 'مكتمل': return 'info';
      case 'تحت العمل': return 'warning text-dark';
      case 'لم يبدأ':
      default: return 'secondary';
    }
  };

  const handleCheckboxFilter = (value, current, setFunc) => {
    if (current.includes(value)) {
      setFunc(current.filter((v) => v !== value));
    } else {
      setFunc([...current, value]);
    }
  };

  const filteredData = data.filter((item) => {
    const deptName = item.department?.department_name || '';
    const text = `${item.standard_number} ${item.standard_name} ${deptName} ${item.status}`;
    return (
      text.includes(searchTerm) &&
      (statusFilter.length ? statusFilter.includes(item.status) : true) &&
      (departmentFilter.length ? departmentFilter.includes(deptName) : true)
    );
  });

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
                <div className="col-md-10 col-xl-10 p-4 my-3 bg-white d-flex flex-column"
                  style={{
                    minHeight: `${rowsPerPage * 48 + 150}px`,
                    position: 'relative',
                    borderTop: "3px solid #4F7689",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                >

                  {/* Top Controls */}
                  <div className="d-flex justify-content-start align-items-center flex-wrap gap-2 mb-3">
                    <input
                      className="form-control form-control-sm"
                      style={{ width: '160px' }}
                      type="search"
                      placeholder="بحث..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {/* Status Filter */}
                    <Dropdown>
                      <Dropdown.Toggle size="sm" variant="outline-secondary">الحالة</Dropdown.Toggle>
                      <Dropdown.Menu>
                        {uniqueStatuses.map((status, idx) => (
                          <label
                            key={idx}
                            className="dropdown-item d-flex align-items-center gap-2 m-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input m-0"
                              checked={statusFilter.includes(status)}
                              onChange={() => handleCheckboxFilter(status, statusFilter, setStatusFilter)}
                            />
                            <span className="form-check-label">{status}</span>
                          </label>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>

                    {/* Department Filter */}
                    <Dropdown>
                      <Dropdown.Toggle size="sm" variant="outline-secondary">الإدارة</Dropdown.Toggle>
                      <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {uniqueDepartments.map((dep, idx) => (
                          <label
                            key={idx}
                            className="dropdown-item d-flex align-items-center gap-2 m-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input m-0"
                              checked={departmentFilter.includes(dep)}
                              onChange={() => handleCheckboxFilter(dep, departmentFilter, setDepartmentFilter)}
                            />
                            <span className="form-check-label">{dep}</span>
                          </label>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>

                    <a className="btn btn-outline-success btn-sm" href="/standards_create">إضافة معيار</a>
                  </div>

                  {/* Table */}
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
                          <th style={{ color: '#6c757d' }}>رقم المعيار</th>
                          <th style={{ color: '#6c757d' }}>اسم المعيار</th>
                          <th style={{ color: '#6c757d' }}>الإدارة</th>
                          <th style={{ color: '#6c757d' }}>حالة المعيار</th>
                          <th style={{ color: '#6c757d' }}>تفاصيل</th>
                          <th style={{ color: '#6c757d' }}>تاريخ الإنشاء</th>
                          <th style={{ color: '#6c757d' }}>تعديل</th>
                          <th style={{ color: '#6c757d' }}>حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="8" className="text-center py-5">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : paginatedData.length === 0 ? (
                          <tr><td colSpan="8" className="text-muted">لا توجد نتائج</td></tr>
                        ) : (
                          paginatedData.map((item) => (
                            <tr key={item.standard_id}>
                              <td>{item.standard_number}</td>
                              <td className="text-primary">{item.standard_name}</td>
                              <td>{item.department?.department_name}</td>
                              <td><span className={`badge bg-${getStatusClass(item.status)}`}>{item.status}</span></td>
                              <td><a href={`/standards_show/${item.standard_id}`} className="text-primary">إظهار</a></td>
                              <td>{new Date(item.created_at).toLocaleDateString()}</td>
                              {user?.role?.toLowerCase() !== 'user' ? (
                                <td>
                                  <i className="fas fa-pen text-success" onClick={() => window.location.href = `/standards_edit/${item.standard_id}`}></i>
                                </td>
                              ) : <td></td>}
                              {user?.role?.toLowerCase() !== 'user' ? (
                                <td>
                                  <i
                                    className="fas fa-times text-danger"
                                    style={{ cursor: 'pointer' }}
                                    onClick={async () => {
                                      try {
                                        await fetch(`${API_BASE}/api/standards/${item.standard_id}`, { method: 'DELETE' });
                                        setLoading(true);
                                        fetch(`${API_BASE}/api/standards`)
                                          .then(res => res.json())
                                          .then(setData)
                                          .catch(() => setData([]))
                                          .finally(() => setLoading(false));
                                      } catch {}
                                    }}
                                  ></i>
                                </td>
                              ) : <td></td>}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {!loading && filteredData.length > rowsPerPage && (
                    <div
                      className="d-flex justify-content-between align-items-center px-3 py-2 bg-white position-absolute bottom-0 start-0 w-100 "
                      style={{
                        zIndex: 10,
                        paddingInline: '1rem'
                      }}
                    >
                      <div>
                        <button className="btn btn-outline-primary btn-sm " onClick={goToNextPage} disabled={currentPage === totalPages}>التالي</button>
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
