import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';

export default function Departments() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const navigate = useNavigate();

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
  }, [searchTerm, buildingFilter]);

  const uniqueBuildings = [...new Set(data.map(d => d.building_number))];

  const handleCheckboxFilter = (value) => {
    if (buildingFilter.includes(value)) {
      setBuildingFilter(buildingFilter.filter(v => v !== value));
    } else {
      setBuildingFilter([...buildingFilter, value]);
    }
  };

  const filteredData = data.filter(item =>
    `${item.department_name} ${item.building_number}`.includes(searchTerm) &&
    (buildingFilter.length ? buildingFilter.includes(item.building_number) : true)
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
    <div dir="rtl">
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
                <div className="col-md-10 col-xl-10 my-3 surface">
                  <div className="head-flat d-flex justify-content-start align-items-center flex-wrap gap-2">
                    <input
                      className="form-control form-control-sm"
                      style={{ width: '160px' }}
                      type="search"
                      placeholder="بحث..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Dropdown>
                      <Dropdown.Toggle size="sm" variant="outline-secondary">المبنى</Dropdown.Toggle>
                      <Dropdown.Menu>
                        {uniqueBuildings.map((num, idx) => (
                          <label
                            key={idx}
                            className="dropdown-item d-flex align-items-center gap-2 m-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input m-0"
                              checked={buildingFilter.includes(num)}
                              onChange={() => handleCheckboxFilter(num)}
                            />
                            <span className="form-check-label">{num}</span>
                          </label>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                    <Link className="btn btn-outline-primary btn-sm" to="/departments_create">إضافة جهة</Link>
                  </div>
                  <div
                    className="body-flat"
                    style={{
                      minHeight: `${rowsPerPage * 48 + 100}px`,
                      position: 'relative'
                    }}
                  >
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
                          <th style={{ color: '#6c757d' }}>تعديل</th>
                          <th style={{ color: '#6c757d' }}>حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="4" className="text-center py-5">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : paginatedData.length === 0 ? (
                          <tr><td colSpan="4" className="text-muted">لا توجد نتائج</td></tr>
                        ) : (
                          paginatedData.map((item) => (
                            <tr key={item.department_id}>
                              <td className="text-primary">{item.department_name}</td>
                              <td>{item.building_number}</td>
                              <td>
                                <i className="fas fa-pen text-primary" onClick={() => navigate(`/departments_edit/${item.department_id}`)}></i>
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
