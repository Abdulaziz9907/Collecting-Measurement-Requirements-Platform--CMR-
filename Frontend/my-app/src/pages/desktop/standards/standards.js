import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/fonts/fontawesome-all.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';

export default function Standards() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/standards`).then(res => res.json()),
      fetch(`${API_BASE}/api/departments`).then(res => res.json())
    ])
      .then(([standards, departments]) => {
        setData(standards);
        setDepartments(departments);
      })
      .catch(() => {
        setData([]);
        setDepartments([]);
      })
      .finally(() => setLoading(false));
  }, [API_BASE]);

  const allSelected = selectedItems.length === data.length && data.length > 0;
  const isChecked = (id) => selectedItems.includes(id);

  const toggleSelectAll = () => {
    setSelectedItems(allSelected ? [] : data.map((item) => item.standard_id));
  };

  const toggleItem = (id) => {
    setSelectedItems(isChecked(id) ? selectedItems.filter((x) => x !== id) : [...selectedItems, id]);
  };

  const handleDelete = async () => {
    for (const id of selectedItems) {
      try {
        await fetch(`${API_BASE}/api/standards/${id}`, { method: 'DELETE' });
      } catch {
        // ignore errors
      }
    }
    setSelectedItems([]);
    setLoading(true);
    fetch(`${API_BASE}/api/standards`)
      .then(res => res.json())
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  const uniqueStatuses = [...new Set(data.map((item) => item.status))];
  const uniqueDepartments = departments.map(d => d.department_name);

  const getStatusClass = (status) => {
    switch (status) {
      case 'معتمد':
        return 'success';
      case 'مكتمل':
        return 'info';
      case 'تحت العمل':
        return 'warning text-dark';
      case 'لم يبدأ':
      default:
        return 'secondary';
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
                  <h4>الرئيسية / إدارة المعايير</h4>
                </div>
              </div>

              {/* Control bar */}
              <div className="row mb-3 px-4 align-items-center justify-content-between">
                <div className="col">
                  <div className="d-flex justify-content-start flex-wrap gap-2">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => (window.location.href = 'http://localhost:3000/standards_add')}
                    >
                      إضافة معيار جديد
                    </button>

                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="بحث..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '180px' }}
                    />

                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        الحالة
                      </Dropdown.Toggle>
                      <Dropdown.Menu style={{ minWidth: '200px' }} className="p-2 text-end">
                        {uniqueStatuses.map((status, i) => (
                          <div
                            key={i}
                            className="form-check form-check-reverse text-end px-2 py-1"
                            style={{ backgroundColor: 'white', borderRadius: '0.25rem' }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`status-${i}`}
                              checked={statusFilter.includes(status)}
                              onChange={() => handleCheckboxFilter(status, statusFilter, setStatusFilter)}
                            />
                            <label className="form-check-label" htmlFor={`status-${i}`}>
                              {status}
                            </label>
                          </div>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        الإدارة
                      </Dropdown.Toggle>
                      <Dropdown.Menu style={{ minWidth: '200px' }} className="p-2 text-end">
                        {uniqueDepartments.map((dept, i) => (
                          <div
                            key={i}
                            className="form-check form-check-reverse text-end px-2 py-1"
                            style={{ backgroundColor: 'white', borderRadius: '0.25rem' }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`dept-${i}`}
                              checked={departmentFilter.includes(dept)}
                              onChange={() => handleCheckboxFilter(dept, departmentFilter, setDepartmentFilter)}
                            />
                            <label className="form-check-label" htmlFor={`dept-${i}`}>
                              {dept}
                            </label>
                          </div>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                <div className="col-auto order-last mb-2">
                  {selectedItems.length > 0 && (
                    <button className="btn btn-danger btn-sm" onClick={handleDelete}>حذف المحدد</button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="row">
                <div className="col-md-1 col-xl-1" />
                <div className="col-md-10 col-xl-10 p-4 my-3 bg-white">
                  <div className="table-responsive">
                    <table className="table text-center align-middle">
                      <thead>
                        <tr style={{ color: '#c9c9c9ff', fontSize: '0.875rem' }}>
                          <th>
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={toggleSelectAll}
                            />
                          </th>
                          <th style={{ color: '#6c757d' }}>رقم المعيار</th>
                          <th style={{ color: '#6c757d' }}>اسم المعيار</th>
                          <th style={{ color: '#6c757d' }}>الإدارة</th>
                          <th style={{ color: '#6c757d' }}>حالة المعيار</th>
                          <th style={{ color: '#6c757d' }}>تفاصيل المعيار</th>
                          <th style={{ color: '#6c757d' }}>تاريخ الإنشاء</th>
                          <th style={{ color: '#6c757d' }}>تعديل</th>
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
                        ) : filteredData.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-muted">لا توجد نتائج مطابقة</td>
                          </tr>
                        ) : (
                          filteredData.map((item) => (
                            <tr key={item.standard_id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={isChecked(item.standard_id)}
                                  onChange={() => toggleItem(item.standard_id)}
                                />
                              </td>
                              <td>{item.standard_number}</td>
                              <td className="text-primary" style={{ cursor: 'pointer' }}>{item.standard_name}</td>
                              <td>{item.department?.department_name}</td>
                              <td>
                                <span className={`badge bg-${getStatusClass(item.status)}`}>{item.status}</span>
                              </td>
                              <td>
                                <a href="#" className="text-primary text-decoration-none">إظهار</a>
                              </td>
                              <td>{new Date(item.created_at).toLocaleDateString()}</td>
                              <td>
                                <i className="fas fa-pen text-success" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/standards_edit/${item.standard_id}`}></i>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col-md-1 col-xl-1" />
              </div>
            </div>
          </div>

          <footer className="bg-white sticky-footer mt-auto py-3">
            <div className="container my-auto">
              <div className="text-center my-auto">
                <span>© RCJY 2025</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
