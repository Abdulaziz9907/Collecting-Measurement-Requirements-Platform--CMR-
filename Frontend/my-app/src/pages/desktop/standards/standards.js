import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import StandardModal from '../../../components/StandardModal.jsx';
import * as XLSX from 'xlsx';
import Footer from '../../../components/Footer.jsx';

export default function Standards() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalId, setModalId] = useState(null);

  const [sortBy, setSortBy] = useState({ key: 'created_at', dir: 'desc' });

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const navigate = useNavigate();
  const location = useLocation();

  const rowsPerPage = 11;
  const [currentPage, setCurrentPage] = useState(1);

  // ---------- styles (scoped) ----------
  const ar = 'ar-SA';
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(ar) : '');
  const fmtNum = (n) => Number(n || 0).toLocaleString(ar);

  // Small internal CSS
  const styles = `
    .panel {
      border-top: 3px solid #4F7689;
      box-shadow: 0 10px 24px rgba(16, 24, 40, 0.08);
      border-radius: 14px;
      background: #fff;
    }
    .tbl-wrap {
      position: relative;
      overflow: hidden;
      border-radius: 10px;
      border: 1px solid #eef2f7;
    }
    .table thead th {
      position: sticky;
      top: 0;
      background: #f8fafc;
      z-index: 2;
    }
    .table tbody tr:hover {
      background: #f9fbff;
    }
    .skeleton-row td {
      height: 44px;
      position: relative;
      background: #eef2f7;
      overflow: hidden;
    }
    .skeleton-row td::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%);
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }
    .chip {
      display:inline-flex; align-items:center; gap:6px;
      padding: 6px 10px; border-radius: 999px; background:#f3f4f6; font-size:.85rem;
    }
    .chip .close-x { cursor:pointer; font-weight:700; opacity:.6; }
    .chip .close-x:hover { opacity:1; }
    .sort-btn { cursor:pointer; user-select:none; }
    .sort-icon { opacity:.6; font-size:.8rem; }
  `;

  // ---------- helpers ----------
  const updateQuery = (patch) => {
    const q = new URLSearchParams(location.search);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) q.delete(k);
      else q.set(k, Array.isArray(v) ? v.join('|') : v);
    });
    navigate({ search: q.toString() }, { replace: true });
  };

  // Load from URL on first mount
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = q.get('s'); const st = q.get('st'); const dp = q.get('dp'); const sb = q.get('sb'); const sd = q.get('sd');
    if (s) setSearchTerm(s);
    if (st) setStatusFilter(st.split('|').filter(Boolean));
    if (dp) setDepartmentFilter(dp.split('|').filter(Boolean));
    if (sb && sd) setSortBy({ key: sb, dir: sd });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/standards`).then(res => res.json()),
      fetch(`${API_BASE}/api/departments`).then(res => res.json())
    ])
      .then(([standardsRaw, departmentsRaw]) => {
        let standards = standardsRaw || [];
        let deps = departmentsRaw || [];
        if (user?.role?.toLowerCase() === 'user') {
          standards = standards.filter(s => s.assigned_department_id === user.department_id);
          deps = deps.filter(d => d.department_id === user.department_id);
        }
        setData(standards);
        setDepartments(deps);
      })
      .catch(() => {
        setData([]);
        setDepartments([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { refreshData(); }, [API_BASE]); // eslint-disable-line

  // Reset page on filters/search/sort
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, departmentFilter, sortBy]);

  // Debounce search to keep it snappy
  const debouncedSearch = useDebounce(searchTerm, 200);

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(data.map((item) => item.status))).filter(Boolean),
    [data]
  );

  const uniqueDepartments = useMemo(
    () => departments.map(d => d.department_name).filter(Boolean),
    [departments]
  );

  const getStatusClass = (status) => {
    switch (status) {
      case 'معتمد': return 'success';
      case 'غير معتمد': return 'danger';
      case 'مكتمل': return 'info';
      case 'تحت العمل': return 'warning text-dark';
      case 'لم يبدأ':
      default: return 'secondary';
    }
  };

  const handleCheckboxFilter = (value, current, setFunc) => {
    const has = current.includes(value);
    const next = has ? current.filter(v => v !== value) : [...current, value];
    setFunc(next);
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setDepartmentFilter([]);
    setSearchTerm('');
    setSortBy({ key: 'created_at', dir: 'desc' });
    updateQuery({ s: '', st: [], dp: [], sb: 'created_at', sd: 'desc' });
  };

  // Persist filters to URL
  useEffect(() => {
    updateQuery({
      s: searchTerm,
      st: statusFilter,
      dp: departmentFilter,
      sb: sortBy.key,
      sd: sortBy.dir,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, departmentFilter, sortBy]);

  // Normalize Arabic search (simple)
  const normalize = (t) => (t || '').toString().trim();

  const filteredData = useMemo(() => {
    const q = normalize(debouncedSearch);
    return (data || []).filter((item) => {
      const deptName = item.department?.department_name || '';
      const text = `${item.standard_number} ${item.standard_name} ${deptName} ${item.status}`;
      const matchesText = q ? text.includes(q) : true;
      const matchesStatus = statusFilter.length ? statusFilter.includes(item.status) : true;
      const matchesDept = departmentFilter.length ? departmentFilter.includes(deptName) : true;
      return matchesText && matchesStatus && matchesDept;
    });
  }, [data, debouncedSearch, statusFilter, departmentFilter]);

  // Sort
  const sortedData = useMemo(() => {
    const { key, dir } = sortBy;
    const mult = dir === 'asc' ? 1 : -1;
    const clone = [...filteredData];
    clone.sort((a, b) => {
      let av = a[key]; let bv = b[key];
      if (key === 'department') {
        av = a.department?.department_name || '';
        bv = b.department?.department_name || '';
      }
      if (key === 'created_at') {
        av = new Date(a.created_at).getTime();
        bv = new Date(b.created_at).getTime();
      }
      if (typeof av === 'string') av = av.toString();
      if (typeof bv === 'string') bv = bv.toString();
      return av > bv ? mult : av < bv ? -mult : 0;
    });
    return clone;
  }, [filteredData, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(
    () => sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [sortedData, currentPage]
  );

  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const goToFirst = () => setCurrentPage(1);
  const goToLast = () => setCurrentPage(totalPages);

  const toggleSort = (key) => {
    setSortBy((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      return { key, dir: 'asc' };
    });
  };

  const SortHeader = ({ label, colKey }) => (
    <th className="sort-btn" onClick={() => toggleSort(colKey)} title="ترتيب">
      {label}{' '}
      <span className="sort-icon">
        {sortBy.key !== colKey ? <i className="fas fa-sort" /> :
          sortBy.dir === 'asc' ? <i className="fas fa-sort-up" /> : <i className="fas fa-sort-down" />}
      </span>
    </th>
  );

  const exportToExcel = () => {
    const exportData = sortedData.map(item => ({
      'رقم المعيار': item.standard_number,
      'اسم المعيار': item.standard_name,
      'الإدارة': item.department?.department_name || '',
      'الحالة': item.status,
      'تاريخ الإنشاء': fmtDate(item.created_at),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    // simple column widths
    const cols = [
      { wch: 12 }, { wch: 40 }, { wch: 28 }, { wch: 16 }, { wch: 16 }
    ];
    ws['!cols'] = cols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المعايير (مُرشّحة)');
    XLSX.writeFile(wb, 'المعايير.xlsx');
  };

  // Tooltips
  const Tip = ({ text, children }) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{text}</Tooltip>}>
      <span>{children}</span>
    </OverlayTrigger>
  );

  return (
    <>
      <style>{styles}</style>
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
                    className="col-md-10 col-xl-10 p-4 my-3 panel d-flex flex-column"
                    style={{
                      minHeight: `${rowsPerPage * 48 + 150}px`,
                      position: 'relative',
                    }}
                  >
                    {/* Top Controls */}
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <input
                          className="form-control form-control-sm"
                          style={{ width: 180 }}
                          type="search"
                          placeholder="بحث..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          aria-label="بحث في المعايير"
                        />

                        {user?.role?.toLowerCase() !== 'user' && (
                          <>
                            <Dropdown>
                              <Dropdown.Toggle size="sm" variant="outline-secondary">الحالة</Dropdown.Toggle>
                              <Dropdown.Menu>
                                <button className="dropdown-item" onClick={() => setStatusFilter(uniqueStatuses)}>تحديد الكل</button>
                                <button className="dropdown-item" onClick={() => setStatusFilter([])}>مسح</button>
                                <Dropdown.Divider />
                                {uniqueStatuses.map((status, idx) => (
                                  <label key={idx} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
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

                            <Dropdown>
                              <Dropdown.Toggle size="sm" variant="outline-secondary">الإدارة</Dropdown.Toggle>
                              <Dropdown.Menu style={{ maxHeight: 320, overflowY: 'auto' }}>
                                <button className="dropdown-item" onClick={() => setDepartmentFilter(uniqueDepartments)}>تحديد الكل</button>
                                <button className="dropdown-item" onClick={() => setDepartmentFilter([])}>مسح</button>
                                <Dropdown.Divider />
                                {uniqueDepartments.map((dep, idx) => (
                                  <label key={idx} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
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

                            <Link className="btn btn-outline-success btn-sm" to="/standards_create">إضافة معيار</Link>

                            {['admin','administrator'].includes(user?.role?.toLowerCase()) && (
                              <button className="btn btn-outline-primary btn-sm" onClick={exportToExcel}>تصدير Excel</button>
                            )}
                          </>
                        )}
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {(statusFilter.length > 0 || departmentFilter.length > 0 || searchTerm) && (
                          <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
                            مسح المرشحات
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active filter chips */}
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {searchTerm && (
                        <span className="chip">
                          بحث: {searchTerm}
                          <span className="close-x" onClick={() => setSearchTerm('')}>×</span>
                        </span>
                      )}
                      {statusFilter.map((s) => (
                        <span key={s} className="chip">
                          حالة: {s}
                          <span className="close-x" onClick={() => setStatusFilter(statusFilter.filter(x => x !== s))}>×</span>
                        </span>
                      ))}
                      {departmentFilter.map((d) => (
                        <span key={d} className="chip">
                          إدارة: {d}
                          <span className="close-x" onClick={() => setDepartmentFilter(departmentFilter.filter(x => x !== d))}>×</span>
                        </span>
                      ))}
                    </div>

                    {/* Table */}
                    <div className="tbl-wrap mb-4" style={{ minHeight: `${rowsPerPage * 48}px` }}>
                      <div className="table-responsive" style={{ overflowX: 'auto', maxHeight: '70vh' }}>
                        <table className="table table-hover text-center align-middle mb-0">
                          <thead>
                            <tr style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                              <SortHeader label="رقم المعيار" colKey="standard_number" />
                              <SortHeader label="اسم المعيار" colKey="standard_name" />
                              <SortHeader label="الإدارة" colKey="department" />
                              <SortHeader label="حالة المعيار" colKey="status" />
                              <th>تفاصيل</th>
                              <SortHeader label="تاريخ الإنشاء" colKey="created_at" />
                              {user?.role?.toLowerCase() !== 'user' && <th>تعديل</th>}
                              {user?.role?.toLowerCase() !== 'user' && <th>حذف</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {loading ? (
                              Array.from({ length: rowsPerPage }).map((_, i) => (
                                <tr key={i} className="skeleton-row">
                                  <td colSpan={8}></td>
                                </tr>
                              ))
                            ) : paginatedData.length === 0 ? (
                              <tr><td colSpan="8" className="text-muted py-4">لا توجد نتائج</td></tr>
                            ) : (
                              paginatedData.map((item) => (
                                <tr key={item.standard_id}>
                                  <td>{item.standard_number}</td>
                                  <td className="text-primary">{item.standard_name}</td>
                                  <td>{item.department?.department_name}</td>
                                  <td><span className={`badge bg-${getStatusClass(item.status)}`}>{item.status}</span></td>
                                  <td>
                                    <a
                                      href="#"
                                      className="text-primary"
                                      onClick={e => { e.preventDefault(); setModalId(item.standard_id); setShowModal(true); }}
                                    >إظهار</a>
                                  </td>
                                  <td>{fmtDate(item.created_at)}</td>
                                  {user?.role?.toLowerCase() !== 'user' && (
                                    <>
                                      <td>
                                        <Tip text="تعديل">
                                          <i
                                            role="button"
                                            className="fas fa-pen text-success"
                                            onClick={() => navigate(`/standards_edit/${item.standard_id}`)}
                                          />
                                        </Tip>
                                      </td>
                                      <td>
                                        <Tip text="حذف">
                                          <i
                                            role="button"
                                            className="fas fa-times text-danger"
                                            onClick={async () => {
                                              try {
                                                await fetch(`${API_BASE}/api/standards/${item.standard_id}`, { method: 'DELETE' });
                                                refreshData();
                                              } catch { /* ignore */ }
                                            }}
                                          />
                                        </Tip>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pagination */}
                    {!loading && sortedData.length > rowsPerPage && (
                      <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-white border-top rounded-bottom">
                        <div className="d-flex align-items-center gap-2">
                          <button className="btn btn-outline-primary btn-sm" onClick={goToFirst} disabled={currentPage === 1}>الأولى</button>
                          <button className="btn btn-outline-primary btn-sm" onClick={goToPreviousPage} disabled={currentPage === 1}>السابق</button>
                          <button className="btn btn-outline-primary btn-sm" onClick={goToNextPage} disabled={currentPage === totalPages}>التالي</button>
                          <button className="btn btn-outline-primary btn-sm" onClick={goToLast} disabled={currentPage === totalPages}>الأخيرة</button>
                        </div>
                        <div className="text-muted small">
                          الصفحة {fmtNum(currentPage)} من {fmtNum(totalPages)} — إجمالي {fmtNum(sortedData.length)} عنصر
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-md-1 col-xl-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <StandardModal
        show={showModal}
        onHide={() => setShowModal(false)}
        standardId={modalId}
        onUpdated={refreshData}
      />
    </>
  );
}

/* ------------ hooks ------------ */
function useDebounce(value, delay = 250) {
  const [v, setV] = useState(value);
  const t = useRef();
  useEffect(() => {
    clearTimeout(t.current);
    t.current = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t.current);
  }, [value, delay]);
  return v;
}
