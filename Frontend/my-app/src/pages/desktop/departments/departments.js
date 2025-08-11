import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';
import * as XLSX from 'xlsx';
import DeleteModal from '../../../components/DeleteModal.jsx';

export default function Departments() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState([]); // store building numbers as strings
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useSkeleton, setUseSkeleton] = useState(true); // skeleton only on first load
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);
  const isViewer = user?.role?.toLowerCase?.() === 'user';
  const navigate = useNavigate();

  // Paging like other pages
  const PAGE_OPTIONS = [15, 25, 50, 'all'];
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Anti-flicker + concurrency safety
  const LOAD_MIN_MS = 450;
  const SPINNER_MIN_MS = 200;
  const abortRef = useRef(null);
  const loadSeqRef = useRef(0);

  /* ========== Local theme to match Standards/Users ========== */
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

      /* Column hints so skeleton aligns perfectly */
      .table thead th { white-space:nowrap; color:#6c757d; font-weight:600; }
      .th-name  { min-width: 280px; }
      .th-bnum  { min-width: 140px; }
      .th-icon  { width: 60px; }

      .foot-flat { padding:10px 14px; border-top:1px solid var(--stroke); background: var(--surface-muted); }
      .page-spacer { height: 140px; }

      /* Remove table bottom gap */
      .table-card .table { margin: 0 !important; }
      .table-card .table-responsive { margin: 0; }

      /* Skeleton */
      .skel { position:relative; overflow:hidden; background:var(--skeleton-bg); display:inline-block; border-radius:6px; }
      .skel::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%); animation:shimmer var(--skeleton-speed) infinite; }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .skel::after { animation:none; } }

      .skel-line  { height: 12px; }
      .skel-badge { height: 22px; width: 72px; border-radius: 999px; }
      .skel-link  { height: 12px; width: 48px; }
      .skel-icon  { height: 16px; width: 16px; border-radius: 4px; }

      /* Filler rows to keep consistent height */
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
      const res = await fetch(`${API_BASE}/api/departments`, { signal });
      if (!res.ok) throw new Error('HTTP error');
      const deps = await res.json();
      if (seq !== loadSeqRef.current) return;
      setData(Array.isArray(deps) ? deps : []);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        if (seq !== loadSeqRef.current) return;
        setData([]);
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
  useEffect(() => { setCurrentPage(1); }, [searchTerm, buildingFilter, pageSize]);

  // Build unique buildings list as strings
  const uniqueBuildings = [...new Set((data || []).map(d => String(d?.building_number ?? '')).filter(Boolean))];

  const handleCheckboxFilter = (value) => {
    setBuildingFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  // Filtering
  const filteredData = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    return (data || []).filter(item => {
      const name = item?.department_name || '';
      const bnum = String(item?.building_number ?? '');
      const txt = `${name} ${bnum}`.toLowerCase();
      const okSearch = !q || txt.includes(q);
      const okBld = buildingFilter.length ? buildingFilter.includes(bnum) : true;
      return okSearch && okBld;
    });
  }, [data, searchTerm, buildingFilter]);

  // Pagination like other pages
  const colCount = isViewer ? 2 : 4;
  const isAll = pageSize === 'all';
  const numericPageSize = isAll ? (filteredData.length || 0) : Number(pageSize);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filteredData.length / numericPageSize));
  const paginatedData = isAll
    ? filteredData
    : filteredData.slice((currentPage - 1) * numericPageSize, currentPage * numericPageSize);

  const hasPageData = paginatedData.length > 0;
  const baseRowsCount = hasPageData ? paginatedData.length : 1;
  const fillerCount = isAll ? 0 : Math.max(0, numericPageSize - baseRowsCount);

  const goToPreviousPage = () => { if (!isAll && currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (!isAll && currentPage < totalPages) setCurrentPage(currentPage + 1); };

  // Skeleton rows aligned with columns
  const SkeletonRow = ({ idx }) => (
    <tr key={`sk-${idx}`}>
      <td><span className="skel skel-line" style={{ width: '70%' }} /></td>  {/* اسم الجهة */}
      <td><span className="skel skel-line" style={{ width: '40%' }} /></td>  {/* رقم المبنى */}
      {!isViewer && <td><span className="skel skel-icon" /></td>}            {/* تعديل */}
      {!isViewer && <td><span className="skel skel-icon" /></td>}            {/* حذف */}
    </tr>
  );
  const skeletonCount = typeof pageSize === 'number' ? pageSize : Math.max(15, Math.min(25, filteredData.length || 15));

  const confirmDelete = async () => {
    try {
      await fetch(`${API_BASE}/api/departments/${deleteId}`, { method: 'DELETE' });
      setShowDelete(false);
      await refreshData('soft');
    } catch {}
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDelete(true);
  };

  // Filler rows to keep steady height
  const renderFillerRows = (count) =>
    Array.from({ length: count }).map((_, r) => (
      <tr key={`filler-${r}`} className="table-empty-row">
        {Array.from({ length: colCount }).map((__, c) => <td key={`f-${r}-${c}`} />)}
      </tr>
    ));

  // Export to Excel (admins)
  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'اسم الجهة': item?.department_name || '',
      'رقم المبنى': item?.building_number ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الجهات');
    XLSX.writeFile(wb, 'الجهات.xlsx');
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
                  <div className="col-12 col-xl-10">
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

                          <Dropdown autoClose="outside" align="end" flip={false}>
                            <Dropdown.Toggle size="sm" variant="outline-secondary">المبنى</Dropdown.Toggle>
                            <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed', modifiers: [{ name: 'offset', options: { offset: [0, 8] } }, { name: 'flip', enabled: false }] }}>
                              {uniqueBuildings.map((num, idx) => (
                                <label key={idx} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
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

                          <Link className="btn btn-outline-success btn-sm" to="/departments_create">إضافة جهة</Link>
                          {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                            <button className="btn btn-success btn-sm" onClick={exportToExcel}>
                              <i className="fas fa-file-excel ms-1" /> تصدير Excel
                            </button>
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
                              <th className="th-name">اسم الجهة</th>
                              <th className="th-bnum">رقم المبنى</th>
                              {!isViewer && <th className="th-icon">تعديل</th>}
                              {!isViewer && <th className="th-icon">حذف</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {loading && useSkeleton ? (
                              Array.from({ length: skeletonCount }).map((_, i) => <SkeletonRow key={i} idx={i} />)
                            ) : hasPageData ? (
                              paginatedData.map((item) => (
                                <tr key={item.department_id}>
                                  <td className="text-primary">{item.department_name}</td>
                                  <td>{item.building_number}</td>
                                  {!isViewer && (
                                    <>
                                      <td>
                                        <button className="btn btn-link p-0 text-success" onClick={() => navigate(`/departments_edit/${item.department_id}`)}>
                                          <i className="fas fa-pen" />
                                        </button>
                                      </td>
                                      <td>
                                        <button
                                          className="btn btn-link p-0 text-danger"
                                          onClick={() => handleDeleteClick(item.department_id)}
                                        >
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

                            {/* Filler rows to keep height steady */}
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
                          <div className="text-muted small">عرض {filteredData.length} صف</div>
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
    </div>
    <DeleteModal show={showDelete} onHide={() => setShowDelete(false)} onConfirm={confirmDelete} />
    </>
  );
}
