import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';

export default function Users() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isUser = user?.role?.toLowerCase() === 'user';

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const rowsPerPage = 11;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/users`).then(res => res.json()),
      fetch(`${API_BASE}/api/departments`).then(res => res.json())
    ])
      .then(([usersData, depData]) => {
        setUsers(usersData);
        setDepartments(depData);
      })
      .catch(() => {
        setUsers([]);
        setDepartments([]);
      })
      .finally(() => setLoading(false));
  }, [API_BASE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, departmentFilter]);

  const uniqueRoles = [...new Set(users.map(u => u.role))];
  const uniqueDepartments = departments.map(d => d.department_name);

  const handleCheckboxFilter = (value, current, setFunc) => {
    if (current.includes(value)) {
      setFunc(current.filter(v => v !== value));
    } else {
      setFunc([...current, value]);
    }
  };

  const filteredUsers = users.filter(u => {
    const dep = departments.find(d => d.department_id === u.department_id)?.department_name || '';
    const text = `${u.username} ${u.first_name} ${u.last_name} ${u.role} ${dep}`;
    return (
      text.includes(searchTerm) &&
      (roleFilter.length ? roleFilter.includes(u.role) : true) &&
      (departmentFilter.length ? departmentFilter.includes(dep) : true)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  const deleteUser = async (empId) => {
    try {
      await fetch(`${API_BASE}/api/users/${empId}`, { method: 'DELETE' });
      setLoading(true);
      const data = await fetch(`${API_BASE}/api/users`).then(res => res.json());
      setUsers(data);
      setLoading(false);
    } catch {}
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
                <div className="col-md-10 col-xl-10 p-4 my-3 bg-white d-flex flex-column" style={{ minHeight: `${rowsPerPage * 48 + 150}px`, position: 'relative', borderTop: '3px solid #4F7689', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <div className="d-flex justify-content-start align-items-center flex-wrap gap-2 mb-3">
                    <input className="form-control form-control-sm" style={{ width: '160px' }} type="search" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Dropdown>
                      <Dropdown.Toggle size="sm" variant="outline-secondary">الدور</Dropdown.Toggle>
                      <Dropdown.Menu>
                        {uniqueRoles.map((r, idx) => (
                          <label key={idx} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" className="form-check-input m-0" checked={roleFilter.includes(r)} onChange={() => handleCheckboxFilter(r, roleFilter, setRoleFilter)} />
                            <span className="form-check-label">{r}</span>
                          </label>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown>
                      <Dropdown.Toggle size="sm" variant="outline-secondary">الإدارة</Dropdown.Toggle>
                      <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {uniqueDepartments.map((dep, idx) => (
                          <label key={idx} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" className="form-check-input m-0" checked={departmentFilter.includes(dep)} onChange={() => handleCheckboxFilter(dep, departmentFilter, setDepartmentFilter)} />
                            <span className="form-check-label">{dep}</span>
                          </label>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                    <a className="btn btn-outline-success btn-sm" href="/users_create">إضافة مستخدم</a>
                  </div>
                  <div className="table-responsive" style={{ overflowX: 'auto', minHeight: `${rowsPerPage * 48}px`, marginBottom: '80px' }}>
                  <table className="table text-center align-middle">
                      <thead>
                        <tr style={{ color: '#c9c9c9ff', fontSize: '0.875rem' }}>
                          <th style={{ color: '#6c757d' }}>رقم الموظف</th>
                          <th style={{ color: '#6c757d' }}>اسم المستخدم</th>
                          <th style={{ color: '#6c757d' }}>الاسم الأول</th>
                          <th style={{ color: '#6c757d' }}>الاسم الأخير</th>
                          <th style={{ color: '#6c757d' }}>الدور</th>
                          <th style={{ color: '#6c757d' }}>الإدارة</th>
                           {!isUser && <th style={{ color: '#6c757d' }}>تعديل</th>}
                          {!isUser && <th style={{ color: '#6c757d' }}>حذف</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                             <td colSpan={isUser ? 6 : 8} className="text-center py-5">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : paginatedUsers.length === 0 ? (
                          <tr><td colSpan={isUser ? 6 : 8} className="text-muted">لا توجد نتائج</td></tr>
                        ) : (
                          paginatedUsers.map(u => (
                            <tr key={u.id}>
                              <td>{u.employee_id}</td>
                              <td className="text-primary">{u.username}</td>
                              <td>{u.first_name}</td>
                              <td>{u.last_name}</td>
                              <td>{u.role}</td>
                              <td>{departments.find(d => d.department_id === u.department_id)?.department_name}</td>
                               {!isUser && (
                                <td>
                                  <i className="fas fa-pen text-success" onClick={() => window.location.href = `/users_edit/${u.employee_id}`}></i>
                                </td>
                              )}
                              {!isUser && (
                                <td>
                                  <i className="fas fa-times text-danger" style={{ cursor: 'pointer' }} onClick={() => deleteUser(u.employee_id)}></i>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {!loading && filteredUsers.length > rowsPerPage && (
                    <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-white position-absolute bottom-0 start-0 w-100" style={{ zIndex: 10, paddingInline: '1rem' }}>
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
