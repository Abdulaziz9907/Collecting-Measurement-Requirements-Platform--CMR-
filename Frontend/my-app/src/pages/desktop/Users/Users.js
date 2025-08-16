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

export default function Users() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useSkeleton, setUseSkeleton] = useState(true); // نظهر السكيلتون أثناء كل تحميل
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);
  const isViewer = user?.role?.toLowerCase?.() === 'user';
  const navigate = useNavigate();

  // نفس تجربة التصفح في الصفحات الأخرى
  const PAGE_OPTIONS = [15, 25, 50, 'all'];
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // حماية من الوميض + أمان التزامن
  const LOAD_MIN_MS = 450;
  const SPINNER_MIN_MS = 200; // موجود للتماثل فقط
  const abortRef = useRef(null);
  const loadSeqRef = useRef(0);

  /* ===== المظهر المحلي ===== */
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

      /* عرض الأعمدة ثابت لثبات السكيلتون */
      .table thead th { white-space:nowrap; color:#6c757d; font-weight:600; }
      .th-eid   { min-width: 120px; }
      .th-uname { min-width: 180px; }
      .th-fname { min-width: 150px; }
      .th-lname { min-width: 150px; }
      .th-role  { min-width: 120px; }
      .th-dept  { min-width: 180px; }
      .th-icon  { width: 60px; }

      .foot-flat { padding:10px 14px; border-top:1px solid var(--stroke); background: var(--surface-muted); }
      .page-spacer { height: 140px; }

      .table-card .table { margin: 0 !important; }
      .table-card .table-responsive { margin: 0; }

      /* سكيلتون */
      .skel { position:relative; overflow:hidden; background:var(--skeleton-bg); display:inline-block; border-radius:6px; }
      .skel::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%); animation:shimmer var(--skeleton-speed) infinite; }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .skel::after { animation:none; } }

      .skel-line  { height: 12px; }
      .skel-badge { height: 22px; width: 72px; border-radius: 999px; }
      .skel-link  { height: 12px; width: 48px; }
      .skel-icon  { height: 16px; width: 16px; border-radius: 4px; }

      /* صفوف الحشو */
      .table-empty-row td { height:44px; padding:0; border-color:#eef2f7 !important; background:#fff; }

      .dropdown-menu { --bs-dropdown-link-hover-bg:#f1f5f9; --bs-dropdown-link-active-bg:#e2e8f0; }
      .dropdown-item { color:var(--text) !important; }
      .dropdown-item:hover, .dropdown-item:focus, .dropdown-item:active, .dropdown-item.active { color:var(--text) !important; }
    `}</style>
  );

  // === نظهر السكيلتون أثناء كل refresh ===
  const refreshData = async () => {
    setUseSkeleton(true);
    setLoading(true);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    loadSeqRef.current += 1;
    const seq = loadSeqRef.current;
    const t0 = performance.now();

    try {
      const [usersRes, depsRes] = await Promise.all([
        fetch(`${API_BASE}/api/users`, { signal }),
        fetch(`${API_BASE}/api/departments`, { signal }),
      ]);
      if (!usersRes.ok || !depsRes.ok) throw new Error('HTTP error');

      const usersJson = await usersRes.json();
      const depsJson = await depsRes.json();

      if (seq !== loadSeqRef.current) return;
      setUsers(Array.isArray(usersJson) ? usersJson : []);
      setDepartments(Array.isArray(depsJson) ? depsJson : []);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        if (seq !== loadSeqRef.current) return;
        setUsers([]); setDepartments([]);
      }
    } finally {
      const elapsed = performance.now() - t0;
      const finish = () => {
        if (seq === loadSeqRef.current) {
          setHasLoadedOnce(true);
          setLoading(false);
        }
      };
      if (elapsed < LOAD_MIN_MS) setTimeout(finish, LOAD_MIN_MS - elapsed);
      else finish();
    }
  };

  useEffect(() => { refreshData(); return () => abortRef.current?.abort(); /* eslint-disable-next-line */ }, [API_BASE]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, departmentFilter, pageSize]);

  const uniqueRoles = [...new Set(users.map(u => u?.role).filter(Boolean))];
  const uniqueDepartments = departments.map(d => d?.department_name).filter(Boolean);

  const handleCheckboxFilter = (value, current, setFunc) => {
    setFunc(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
  };

  // تصفية
  const filteredUsers = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    return (users || []).filter(u => {
      const depName = departments.find(d => d?.department_id === u?.department_id)?.department_name || '';
      const txt = `${u?.employee_id ?? ''} ${u?.username ?? ''} ${u?.first_name ?? ''} ${u?.last_name ?? ''} ${u?.role ?? ''} ${depName}`.toLowerCase();
      const okSearch = !q || txt.includes(q);
      const okRole = roleFilter.length ? roleFilter.includes(u?.role) : true;
      const okDept = departmentFilter.length ? departmentFilter.includes(depName) : true;
      return okSearch && okRole && okDept;
    });
  }, [users, departments, searchTerm, roleFilter, departmentFilter]);

  const colCount = isViewer ? 6 : 8;

  // ترقيم الصفحات
  const isAll = pageSize === 'all';
  const numericPageSize = isAll ? (filteredUsers.length || 0) : Number(pageSize);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filteredUsers.length / numericPageSize));
  const paginatedUsers = isAll
    ? filteredUsers
    : filteredUsers.slice((currentPage - 1) * numericPageSize, currentPage * numericPageSize);

  const hasPageData = paginatedUsers.length > 0;

  // وضع السكيلتون + العدّ
  const skeletonMode = loading && useSkeleton;
  const skeletonCount = isAll ? 15 : Number(pageSize);

  // صفوف الحشو عند عدم التحميل (للمحافظة على الارتفاع الثابت)
  const baseRowsCount = hasPageData ? paginatedUsers.length : 1; // صف "لا توجد نتائج" إن كانت فارغة
  const fillerCount = isAll ? 0 : Math.max(0, Number(pageSize) - baseRowsCount);

  const goToPreviousPage = () => { if (!isAll && currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (!isAll && currentPage < totalPages) setCurrentPage(currentPage + 1); };

  // صف سكيلتون مطابق للأعمدة
  const SkeletonRow = ({ idx }) => (
    <tr key={`sk-${idx}`}>
      <td><span className="skel skel-line" style={{ width: '60%' }} /></td>  {/* رقم الموظف */}
      <td><span className="skel skel-line" style={{ width: '80%' }} /></td>  {/* اسم المستخدم */}
      <td><span className="skel skel-line" style={{ width: '70%' }} /></td>  {/* الاسم الأول */}
      <td><span className="skel skel-line" style={{ width: '65%' }} /></td>  {/* الاسم الأخير */}
      <td><span className="skel skel-badge" /></td>                          {/* الدور */}
      <td><span className="skel skel-line" style={{ width: '75%' }} /></td>  {/* الإدارة */}
      {!isViewer && <td><span className="skel skel-icon" /></td>}            {/* تعديل */}
      {!isViewer && <td><span className="skel skel-icon" /></td>}            {/* حذف */}
    </tr>
  );

  // صفوف الحشو
  const renderFillerRows = (count) =>
    Array.from({ length: count }).map((_, r) => (
      <tr key={`filler-${r}`} className="table-empty-row">
        {Array.from({ length: colCount }).map((__, c) => <td key={`f-${r}-${c}`} />)}
      </tr>
    ));

  const confirmDelete = async () => {
    try {
      await fetch(`${API_BASE}/api/users/${deleteId}`, { method: 'DELETE' });
      setShowDelete(false);
      await refreshData(); // سكيلتون بعد الحذف
    } catch {}
  };

  const handleDeleteClick = (empId) => {
    setDeleteId(empId);
    setShowDelete(true);
  };

  const exportToExcel = () => {
    const exportData = filteredUsers.map(u => {
      const dep = departments.find(d => d?.department_id === u?.department_id)?.department_name || '';
      return {
        'رقم الموظف': u?.employee_id,
        'اسم المستخدم': u?.username,
        'الاسم الأول': u?.first_name,
        'الاسم الأخير': u?.last_name,
        'الدور': u?.role,
        'الإدارة': dep,
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المستخدمون');
    XLSX.writeFile(wb, 'المستخدمون.xlsx');
  };

  return (
    <>
      <LocalTheme />
      <div
        dir="rtl"
        style={{
          fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          backgroundColor: '#f6f8fb',
          minHeight: '100vh'
        }}
      >
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

                          {!isViewer && (
                            <>
                              <Dropdown autoClose="outside" align="end" flip={false}>
                                <Dropdown.Toggle size="sm" variant="outline-secondary">الدور</Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed', modifiers: [{ name: 'offset', options: { offset: [0, 8] } }, { name: 'flip', enabled: false }] }}>
                                  {uniqueRoles.map((r, idx) => (
                                    <label key={idx} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        className="form-check-input m-0"
                                        checked={roleFilter.includes(r)}
                                        onChange={() => handleCheckboxFilter(r, roleFilter, setRoleFilter)}
                                      />
                                      <span className="form-check-label">{r}</span>
                                    </label>
                                  ))}
                                </Dropdown.Menu>
                              </Dropdown>

                              <Dropdown autoClose="outside" align="end" flip={false}>
                                <Dropdown.Toggle size="sm" variant="outline-secondary">الإدارة</Dropdown.Toggle>
                                <Dropdown.Menu style={{ maxHeight: 320, overflowY: 'auto' }} renderOnMount popperConfig={{ strategy: 'fixed', modifiers: [{ name: 'offset', options: { offset: [0, 8] } }, { name: 'flip', enabled: false }] }}>
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

                              <Link className="btn btn-outline-success btn-sm" to="/users_create">إضافة مستخدم</Link>
                              {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                                <button className="btn btn-success btn-sm" onClick={exportToExcel}>
                                  <i className="fas fa-file-excel ms-1" /> تصدير Excel
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          {!skeletonMode && (
                            <small className="text-muted">النتائج: {filteredUsers.length.toLocaleString('ar-SA')}</small>
                          )}
                          <button
                            className="btn btn-outline-primary btn-sm btn-update"
                            onClick={refreshData}
                            title="تحديث"
                            disabled={loading}
                            aria-busy={loading}
                          >
                            {loading ? (
                              <span className="spinner-border spinner-border-sm ms-1" />
                            ) : (
                              <i className="fas fa-rotate-right" />
                            )}
                            تحديث
                          </button>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="table-responsive">
                        <table className="table table-hover text-center align-middle">
                          <thead>
                            <tr>
                              <th className="th-eid">رقم الموظف</th>
                              <th className="th-uname">اسم المستخدم</th>
                              <th className="th-fname">الاسم الأول</th>
                              <th className="th-lname">الاسم الأخير</th>
                              <th className="th-role">الدور</th>
                              <th className="th-dept">الإدارة</th>
                              {!isViewer && <th className="th-icon">تعديل</th>}
                              {!isViewer && <th className="th-icon">حذف</th>}
                            </tr>
                          </thead>

                          <tbody>
                            {skeletonMode ? (
                              Array.from({ length: skeletonCount }).map((_, i) => <SkeletonRow key={i} idx={i} />)
                            ) : hasPageData ? (
                              paginatedUsers.map(u => {
                                const depName = departments.find(d => d?.department_id === u?.department_id)?.department_name;
                                return (
                                  <tr key={u?.employee_id}>
                                    <td>{u?.employee_id}</td>
                                    <td className="text-primary">{u?.username}</td>
                                    <td>{u?.first_name}</td>
                                    <td>{u?.last_name}</td>
                                    <td>{u?.role}</td>
                                    <td>{depName}</td>
                                    {!isViewer && (
                                      <>
                                        <td>
                                          <button className="btn btn-link p-0 text-success" onClick={() => navigate(`/users_edit/${u?.employee_id}`)}>
                                            <i className="fas fa-pen" />
                                          </button>
                                        </td>
                                        <td>
                                          <button className="btn btn-link p-0 text-danger" onClick={() => handleDeleteClick(u?.employee_id)}>
                                            <i className="fas fa-times" />
                                          </button>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })
                            ) : (
                              <tr className="table-empty-row">
                                <td colSpan={colCount} className="text-muted">لا توجد نتائج</td>
                              </tr>
                            )}

                            {/* صفوف الحشو لإبقاء الارتفاع ثابتًا بعد التحميل */}
                            {!skeletonMode && renderFillerRows(fillerCount)}
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
                          <div className="text-muted small">عرض {filteredUsers.length} صف</div>
                        ) : (
                          <div className="d-inline-flex align-items-center gap-2">
                            <button className="btn btn-outline-primary btn-sm" onClick={goToPreviousPage} disabled={skeletonMode || currentPage === 1}>السابق</button>
                            <button className="btn btn-outline-primary btn-sm" onClick={goToNextPage} disabled={skeletonMode || currentPage === totalPages}>التالي</button>
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
      <DeleteModal show={showDelete} onHide={() => setShowDelete(false)} onConfirm={confirmDelete} />
    </>
  );
}
