import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import StandardModal from '../../../components/StandardModal.jsx';
import * as XLSX from 'xlsx';
import Footer from '../../../components/Footer.jsx';
import DeleteModal from '../../../components/DeleteModal.jsx';

export default function Standards() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useSkeleton, setUseSkeleton] = useState(true); // skeleton only on first load
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalId, setModalId] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // ✅ Simple click-to-sort state
  const [sortKey, setSortKey] = useState(null);   // 'standard_number'|'standard_name'|'department'|'status'|'created_at'
  const [sortDir, setSortDir] = useState('none'); // 'asc'|'desc'|'none'

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);
  const navigate = useNavigate();

  // page size options
  const PAGE_OPTIONS = [15, 25, 50, 'all'];
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // anti-flicker + concurrency safety
  const LOAD_MIN_MS = 450;
  const SPINNER_MIN_MS = 200;
  const abortRef = useRef(null);
  const loadSeqRef = useRef(0);

  /* ========== Theme & Skeleton tuned to table columns ========== */
  const LocalTheme = () => (
    <style>{`
      :root {
        --radius: 14px;
        --shadow: 0 10px 24px rgba(16, 24, 40, 0.08);
        --surface: #ffffff;
        --surface-muted: #fbfdff;
        --stroke: #eef2f7;
        --text: #0b2440;
        --text-muted: #6b7280;
        --brand: #4F7689;
        --skeleton-bg: #e9edf3;
        --skeleton-sheen: rgba(255,255,255,.6);
        --skeleton-speed: 1.2s;
      }

      .table-card { background: var(--surface); border:1px solid var(--stroke); border-radius: var(--radius); box-shadow: var(--shadow); overflow:hidden; }
      .head-flat {
        padding: 12px 16px; background: var(--surface-muted); border-bottom: 1px solid var(--stroke);
        color: var(--text); font-weight:700; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
      }
      .controls-inline { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

      /* columns width hints (help skeleton match layout) */
      .table thead th { white-space:nowrap; color:#6c757d; font-weight:600; }
      .th-num    { min-width: 96px; }
      .th-name   { min-width: 220px; }
      .th-dept   { min-width: 160px; }
      .th-status { min-width: 110px; }
      .th-det    { min-width: 90px;  }
      .th-date   { min-width: 140px; }
      .th-icon   { width: 60px; }

      /* clickable header button */
      .th-sort{
        background:transparent;
        border:0;
        padding:0;
        color:#6c757d;
        font-weight:600;
        cursor:pointer;
      }
      .th-sort:focus{ outline:none; text-decoration:underline; }

      .foot-flat { padding:10px 14px; border-top:1px solid var(--stroke); background: var(--surface-muted); }
      .page-spacer { height: 140px; }

      /* ✅ Remove the bottom gap between table and the footer bar */
      .table-card .table { margin: 0 !important; }
      .table-card .table-responsive { margin: 0; }

      /* Skeleton building blocks (inside table cells) */
      .skel { position:relative; overflow:hidden; background:var(--skeleton-bg); display:inline-block; border-radius:6px; }
      .skel::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%); animation:shimmer var(--skeleton-speed) infinite; }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .skel::after { animation:none; } }

      .skel-line  { height: 12px; }
      .skel-badge { height: 22px; width: 72px; border-radius: 999px; }
      .skel-link  { height: 12px; width: 48px; }
      .skel-icon  { height: 16px; width: 16px; border-radius: 4px; }

      /* filler rows for fixed height pages */
      .table-empty-row td { height:44px; padding:0; border-color:#eef2f7 !important; background:#fff; }

      /* Dropdown polish */
      .dropdown-menu { --bs-dropdown-link-hover-bg:#f1f5f9; --bs-dropdown-link-active-bg:#e2e8f0; }
      .dropdown-item { color:var(--text) !important; }
      .dropdown-item:hover, .dropdown-item:focus, .dropdown-item:active, .dropdown-item.active { color:var(--text) !important; }
    `}</style>
  );

  const refreshData = async (mode = 'auto') => {
    const wantSkeleton = mode === 'skeleton' || (mode === 'auto' && !hasLoadedOnce);
    setUseSkeleton(wantSkeleton);
    setLoading(true);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    loadSeqRef.current += 1;
    const seq = loadSeqRef.current;
    const t0 = performance.now();

    try {
      const [standardsRes, depsRes] = await Promise.all([
        fetch(`${API_BASE}/api/standards`, { signal }),
        fetch(`${API_BASE}/api/departments`, { signal }),
      ]);
      if (!standardsRes.ok || !depsRes.ok) throw new Error('HTTP error');

      let standards = await standardsRes.json();
      let deps = await depsRes.json();

      if (user?.role === 'User') {
        standards = (standards || []).filter(s => Number(s.assigned_department_id) === Number(user.department_id));
        deps = (deps || []).filter(d => Number(d.department_id) === Number(user.department_id));
      }

      // tag original order for "افتراضي"
      standards = (standards || []).map((s, i) => ({ ...s, __i: i }));

      if (seq !== loadSeqRef.current) return;
      setData(Array.isArray(standards) ? standards : []);
      setDepartments(Array.isArray(deps) ? deps : []);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        if (seq !== loadSeqRef.current) return;
        setData([]); setDepartments([]);
      }
    } finally {
      const elapsed = performance.now() - t0;
      const minWait = wantSkeleton ? LOAD_MIN_MS : SPINNER_MIN_MS;
      const finish = () => {
        if (seq === loadSeqRef.current) {
          setHasLoadedOnce(true);
          setLoading(false);
        }
      };
      if (elapsed < minWait) setTimeout(finish, minWait - elapsed);
      else finish();
    }
  };

  useEffect(() => { refreshData('skeleton'); return () => abortRef.current?.abort(); /* eslint-disable-next-line */ }, [API_BASE]);

  // Reset page when filters, page size, or sorting changes
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, departmentFilter, pageSize, sortKey, sortDir]);

  const uniqueStatuses = [...new Set(data.map(i => i?.status).filter(Boolean))];
  const uniqueDepartments = departments.map(d => d?.department_name).filter(Boolean);

  const getStatusClass = (status) => {
    switch (status) {
      case 'معتمد': return 'success';
      case 'غير معتمد': return 'danger';
      case 'مكتمل': return 'info';
      case 'تحت العمل': return 'warning text-dark';
      case 'لم يبدأ': default: return 'secondary';
    }
  };

  const handleCheckboxFilter = (value, current, setFunc) => {
    setFunc(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
  };

  // Filtering
  const filteredData = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    return (data || []).filter(item => {
      const deptName = item?.department?.department_name || '';
      const txt = `${item?.standard_number ?? ''} ${item?.standard_name ?? ''} ${deptName} ${item?.status ?? ''}`.toLowerCase();
      const okSearch = !q || txt.includes(q);
      const okStatus = statusFilter.length ? statusFilter.includes(item?.status) : true;
      const okDept = departmentFilter.length ? departmentFilter.includes(deptName) : true;
      return okSearch && okStatus && okDept;
    });
  }, [data, searchTerm, statusFilter, departmentFilter]);

  // ✅ Sorting (simple: click header to toggle asc -> desc -> none)
  const sortedData = useMemo(() => {
    if (sortDir === 'none' || !sortKey) return filteredData;

    const val = (item) => {
      if (sortKey === 'department')   return (item?.department?.department_name || '').toLowerCase();
      if (sortKey === 'created_at')   return new Date(item?.created_at || 0).getTime();
      if (sortKey === 'standard_number') return (item?.standard_number || '').toLowerCase();
      if (sortKey === 'standard_name')   return (item?.standard_name || '').toLowerCase();
      if (sortKey === 'status')          return (item?.status || '').toLowerCase();
      return '';
    };

    const dir = sortDir === 'asc' ? 1 : -1;
    const copy = [...filteredData];
    copy.sort((a, b) => {
      const av = val(a), bv = val(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      // stable fallback to original API order
      return (a.__i ?? 0) - (b.__i ?? 0);
    });
    return copy;
  }, [filteredData, sortKey, sortDir]);

  const isViewer = user?.role?.toLowerCase?.() === 'user';
  const colCount = isViewer ? 6 : 8;

  const isAll = pageSize === 'all';
  const numericPageSize = isAll ? (sortedData.length || 0) : Number(pageSize);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(sortedData.length / numericPageSize));
  const paginatedData = isAll
    ? sortedData
    : sortedData.slice((currentPage - 1) * numericPageSize, currentPage * numericPageSize);

  const hasPageData = paginatedData.length > 0;
  const baseRowsCount = hasPageData ? paginatedData.length : 1;
  const fillerCount = isAll ? 0 : Math.max(0, numericPageSize - baseRowsCount);

  const renderFillerRows = (count) =>
    Array.from({ length: count }).map((_, r) => (
      <tr key={`filler-${r}`} className="table-empty-row">
        {Array.from({ length: colCount }).map((__, c) => <td key={`f-${r}-${c}`} />)}
      </tr>
    ));

  // skeleton row that matches columns
  const SkeletonRow = ({ idx }) => (
    <tr key={`sk-${idx}`}>
      <td><span className="skel skel-line" style={{ width: '60%' }} /></td>
      <td><span className="skel skel-line" style={{ width: '85%' }} /></td>
      <td><span className="skel skel-line" style={{ width: '70%' }} /></td>
      <td><span className="skel skel-badge" /></td>
      <td><span className="skel skel-link" /></td>
      <td><span className="skel skel-line" style={{ width: '55%' }} /></td>
      {!isViewer && <td><span className="skel skel-icon" /></td>}
      {!isViewer && <td><span className="skel skel-icon" /></td>}
    </tr>
  );

  const skeletonCount = typeof pageSize === 'number' ? pageSize : Math.max(15, Math.min(25, filteredData.length || 15));

  const goToPreviousPage = () => { if (!isAll && currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (!isAll && currentPage < totalPages) setCurrentPage(currentPage + 1); };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'رقم المعيار': item.standard_number,
      'اسم المعيار': item.standard_name,
      'الإدارة': item.department?.department_name || '',
      'الحالة': item.status,
      'تاريخ الإنشاء': new Date(item.created_at).toLocaleDateString('ar-SA'),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المعايير');
    XLSX.writeFile(wb, 'المعايير.xlsx');
  };

  const confirmDelete = async () => {
    try {
      await fetch(`${API_BASE}/api/standards/${deleteId}`, { method: 'DELETE' });
      setShowDelete(false);
      await refreshData('soft');
    } catch {}
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDelete(true);
  };

  // Helpers for header sort toggling
  const toggleSort = (key) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    if (sortDir === 'desc') { setSortKey(null); setSortDir('none'); return; }
    setSortDir('asc');
  };
  const sortIcon = (key) => {
    if (sortKey !== key || sortDir === 'none') return null;
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <>
      <LocalTheme />
      <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif', backgroundColor: '#f6f8fb', minHeight: '100vh' }}>
        <Header />
        <div id="wrapper" style={{ display: 'flex', flexDirection: 'row' }}>
          <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
          <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
            <div id="content" className="flex-grow-1">
              <div className="container-fluid">

                <div className="row p-4">
                  <div className="col-12"><Breadcrumbs /></div>
                </div>

                <div className="row justify-content-center">
                  {/* ⬅️ Increased width: col-xl-11 (use col-xl-12 for max) */}
                  <div className="col-12 col-xl-11">
                    <div className="table-card" aria-busy={loading}>
                      {/* Header */}
                      <div className="head-flat">
                        <div className="controls-inline">
                          <input
                            className="form-control form-control-sm"
                            style={{ width: 200 }}
                            type="search"
                            placeholder="بحث..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {user?.role?.toLowerCase?.() !== 'user' && (
                            <>
                              <Dropdown autoClose="outside" align="end" flip={false}>
                                <Dropdown.Toggle size="sm" variant="outline-secondary">الحالة</Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed', modifiers: [{ name: 'offset', options: { offset: [0, 8] } }, { name: 'flip', enabled: false }] }}>
                                  {uniqueStatuses.map((status, idx) => (
                                    <label key={idx} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
                                      <input type="checkbox" className="form-check-input m-0" checked={statusFilter.includes(status)} onChange={() => handleCheckboxFilter(status, statusFilter, setStatusFilter)} />
                                      <span className="form-check-label">{status}</span>
                                    </label>
                                  ))}
                                </Dropdown.Menu>
                              </Dropdown>

                              <Dropdown autoClose="outside" align="end" flip={false}>
                                <Dropdown.Toggle size="sm" variant="outline-secondary">الإدارة</Dropdown.Toggle>
                                <Dropdown.Menu style={{ maxHeight: 320, overflowY: 'auto' }} renderOnMount popperConfig={{ strategy: 'fixed', modifiers: [{ name: 'offset', options: { offset: [0, 8] } }, { name: 'flip', enabled: false }] }}>
                                  {uniqueDepartments.map((dep, idx) => (
                                    <label key={idx} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
                                      <input type="checkbox" className="form-check-input m-0" checked={departmentFilter.includes(dep)} onChange={() => handleCheckboxFilter(dep, departmentFilter, setDepartmentFilter)} />
                                      <span className="form-check-label">{dep}</span>
                                    </label>
                                  ))}
                                </Dropdown.Menu>
                              </Dropdown>

                              <Link className="btn btn-outline-success btn-sm" to="/standards_create">إضافة معيار</Link>
                              {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                                <button className="btn btn-success btn-sm" onClick={exportToExcel}>
                                  <i className="fas fa-file-excel ms-1" /> تصدير Excel
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          {(!loading || !useSkeleton) && (
                            <small className="text-muted">النتائج: {filteredData.length.toLocaleString('ar-SA')}</small>
                          )}
                          <button
                            className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                            onClick={() => refreshData('soft')}
                            title="تحديث"
                          >
                            <i className="fas fa-rotate-right" />
                            تحديث
                            {loading && !useSkeleton && (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="table-responsive">
                        <table className="table table-hover text-center align-middle">
                          <thead>
                            <tr>
                              <th className="th-num">
                                <button type="button" className="th-sort" onClick={() => toggleSort('standard_number')}>
                                  رقم المعيار{sortIcon('standard_number')}
                                </button>
                              </th>
                              <th className="th-name">
                                <button type="button" className="th-sort" onClick={() => toggleSort('standard_name')}>
                                  اسم المعيار{sortIcon('standard_name')}
                                </button>
                              </th>
                              <th className="th-dept">
                                <button type="button" className="th-sort" onClick={() => toggleSort('department')}>
                                  الإدارة{sortIcon('department')}
                                </button>
                              </th>
                              <th className="th-status">
                                <button type="button" className="th-sort" onClick={() => toggleSort('status')}>
                                  حالة المعيار{sortIcon('status')}
                                </button>
                              </th>
                              <th className="th-det">تفاصيل</th>
                              <th className="th-date">
                                <button type="button" className="th-sort" onClick={() => toggleSort('created_at')}>
                                  تاريخ الإنشاء{sortIcon('created_at')}
                                </button>
                              </th>
                              {user?.role?.toLowerCase?.() !== 'user' && <th className="th-icon">تعديل</th>}
                              {user?.role?.toLowerCase?.() !== 'user' && <th className="th-icon">حذف</th>}
                            </tr>
                          </thead>

                          <tbody>
                            {loading && useSkeleton ? (
                              Array.from({ length: skeletonCount }).map((_, i) => <SkeletonRow key={i} idx={i} />)
                            ) : hasPageData ? (
                              paginatedData.map((item) => (
                                <tr key={item.standard_id}>
                                  <td>{item.standard_number}</td>
                                  <td className="text-primary">{item.standard_name}</td>
                                  <td>{item.department?.department_name}</td>
                                  <td><span className={`badge bg-${getStatusClass(item.status)}`}>{item.status}</span></td>
                                  <td>
                                    <button className="btn btn-link p-0 text-primary" onClick={(e) => { e.preventDefault(); setModalId(item.standard_id); setShowModal(true); }}>
                                      إظهار
                                    </button>
                                  </td>
                                  <td>{new Date(item.created_at).toLocaleDateString('ar-SA')}</td>
                                  {user?.role?.toLowerCase?.() !== 'user' && (
                                    <>
                                      <td>
                                        <button className="btn btn-link p-0 text-success" onClick={() => navigate(`/standards_edit/${item.standard_id}`)}>
                                          <i className="fas fa-pen" />
                                        </button>
                                      </td>
                                      <td>
                                        <button className="btn btn-link p-0 text-danger" onClick={() => handleDeleteClick(item.standard_id)}>
                                          <i className="fas fa-times" />
                                        </button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))
                            ) : (
                              <tr className="table-empty-row">
                                <td colSpan={colCount} className="text-muted">لا توجد نتائج</td>
                              </tr>
                            )}

                            {/* Filler rows to keep consistent height */}
                            {!loading && renderFillerRows(fillerCount)}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer: page size + pagination */}
                      <div className="foot-flat d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div className="d-inline-flex align-items-center gap-2">
                          <Dropdown align="start">
                            <Dropdown.Toggle size="sm" variant="outline-secondary">
                              عدد الصفوف: {isAll ? 'الكل' : pageSize}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {PAGE_OPTIONS.map(opt => (
                                <Dropdown.Item
                                  key={opt}
                                  as="button"
                                  active={opt === pageSize}
                                  onClick={() => { setPageSize(opt); setCurrentPage(1); }}
                                >
                                  {opt === 'all' ? 'الكل' : opt}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>

                        {isAll ? (
                          <div className="text-muted small">عرض {sortedData.length} صف</div>
                        ) : (
                          <div className="d-inline-flex align-items-center gap-2">
                            <button className="btn btn-outline-primary btn-sm" onClick={goToPreviousPage} disabled={currentPage === 1}>السابق</button>
                            <button className="btn btn-outline-primary btn-sm" onClick={goToNextPage} disabled={currentPage === totalPages}>التالي</button>
                            <div className="text-muted small">الصفحة {currentPage} من {totalPages}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="page-spacer" />
              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>

      <StandardModal show={showModal} onHide={() => setShowModal(false)} standardId={modalId} onUpdated={() => refreshData('soft')} />
      <DeleteModal show={showDelete} onHide={() => setShowDelete(false)} onConfirm={confirmDelete} />
    </>
  );
}
