import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
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
import { getStoredUser } from '../../../utils/auth';

export default function Users() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const user = useMemo(() => getStoredUser(), []);
  const isViewer = user?.role?.toLowerCase?.() === 'user';
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 576px)');
    const update = () => setIsMobile(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener('change', update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else mq.removeListener(update);
    };
  }, []);
  const PAGE_OPTIONS = [15, 25, 50, 'all'];
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const prevPageSizeRef = useRef(pageSize);
  const prevPageRef = useRef(currentPage);

  useLayoutEffect(() => {
    const prevPageSize = prevPageSizeRef.current;
    const prevPage = prevPageRef.current;
    if (pageSize < prevPageSize || (currentPage !== prevPage && pageSize === prevPageSize)) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
    prevPageSizeRef.current = pageSize;
    prevPageRef.current = currentPage;
  }, [pageSize, currentPage]);
  const LOAD_MIN_MS = 450;
  const abortRef = useRef(null);
  const loadSeqRef = useRef(0);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('none');

  const dropdownPopper = useMemo(() => ({
    strategy: 'fixed',
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      { name: 'flip', enabled: true, options: { fallbackPlacements: ['bottom', 'top', 'left', 'right'] } },
      { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8, altAxis: true, tether: true } },
    ],
  }), []);

  
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
      }

      .table-card {
        background: var(--surface);
        border:1px solid var(--stroke);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        overflow:hidden;
        margin-bottom: 56px;
      }

      .head-flat {
        padding: 10px 12px;
        background: var(--surface-muted);
        border-bottom: 1px solid var(--stroke);
        color: var(--text);
        font-weight:700;
      }

      .head-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
      .search-block { flex:1 1 320px; min-width:240px; }
      .search-input { width:100%; max-width: 460px; margin:0 !important; }
      .toolbar-block { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

      @media (max-width: 576px) {
        .head-row { display:block; }
        .m-stack { display:grid; grid-template-columns: 1fr; row-gap:6px; margin:0; padding:0; }
        .search-block { margin:0; padding:0; }
        .search-input { max-width: 100%; height: 36px; line-height: 36px; }

        .m-toolbar {
          display:grid;
          grid-template-columns: repeat(3, 1fr);
          gap:6px;
          margin:0; padding:0;
        }

        .m-btn.btn {
          padding: 5px 8px;
          min-height: 32px;
          font-size: .85rem;
          border-radius: 10px;
          font-weight: 600;
          width: 100%;
        }

        .m-menu { width: min(92vw, 360px); max-width: 92vw; }
        .m-menu .dropdown-item { padding: 10px 12px; font-size: .95rem; }
        .m-menu .dropdown-header { font-size: .9rem; }

        .meta-row {
          display:flex; align-items:center; justify-content:space-between; gap:8px;
        }
      }

      .table thead th { white-space:nowrap; color:#6c757d; font-weight:600; }
      .th-eid   { min-width: 120px; }
      .th-uname { min-width: 180px; }
      .th-fname { min-width: 150px; }
      .th-lname { min-width: 150px; }
      .th-role  { min-width: 120px; }
      .th-dept  { min-width: 180px; }
      .th-icon  { width: 60px; }

      .foot-flat { padding:10px 14px; border-top:1px solid var(--stroke); background: var(--surface-muted); }
      .page-spacer { height: 200px; }

      .table-card .table, .table-card .table-responsive { margin: 0 !important; }

      
      .mobile-list { padding: 10px 12px; display: grid; grid-template-columns: 1fr; gap: 10px; }
      .u-card { border: 1px solid var(--stroke); border-radius: 14px; background: #fff; box-shadow: var(--shadow); padding: 10px 12px 12px 12px; }
      .u-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
      .u-ident { display:flex; align-items:center; gap:10px; }
      .u-avatar { width: 36px; height: 36px; border-radius: 999px; background: #edf3f6; color: var(--brand); font-weight: 800; display:grid; place-items:center; font-size: .9rem; }
      .u-title { font-weight: 800; color: var(--text); font-size: .95rem; line-height:1.2; }
      .u-subtle { color: var(--text-muted); font-size: .8rem; margin-top:2px; }
      .u-row { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:4px; }
      .u-chip { display:inline-flex; align-items:center; gap:6px; padding: 3px 8px; border-radius: 999px; border:1px solid var(--stroke); font-size:.78rem; background: #f8fafc; max-width: 70%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .u-actions { display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-top:10px; }
      .u-btn { min-height: 30px; padding: 5px 8px; font-size: .82rem; border-radius: 10px; font-weight:700; }
      .u-btn i { font-size: .85rem; }

      
      .loader-block {
        padding: 24px 0;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:10px;
        color: rgba(150, 150, 150, 1);
      }

      
      .dropdown-menu{
        --bs-dropdown-link-hover-bg:#f1f5f9;
        --bs-dropdown-link-active-bg:#e2e8f0;
      }
      .dropdown-item{ color:var(--text) !important; }
      .dropdown-item:hover,
      .dropdown-item:focus,
      .dropdown-item:active,
      .dropdown-item.active{
        color:var(--text) !important;
      }
    `}</style>
  );

  const refreshData = async () => {
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

  useEffect(() => { refreshData(); return () => abortRef.current?.abort();  }, [API_BASE]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, departmentFilter, pageSize, sortKey, sortDir]);

  const uniqueRoles = [...new Set(users.map(u => u?.role).filter(Boolean))];
  const uniqueDepartments = departments.map(d => d?.department_name).filter(Boolean);

  const handleCheckboxFilter = (value, current, setFunc) => {
    setFunc(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
  };

  const deptNameById = useMemo(
    () => new Map((departments || []).map(d => [d?.department_id, d?.department_name || ''])),
    [departments]
  );

  const filteredUsers = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim();
    return (users || []).filter(u => {
      const depName = deptNameById.get(u?.department_id) || '';
      const txt = `${u?.employee_id ?? ''} ${u?.username ?? ''} ${u?.first_name ?? ''} ${u?.last_name ?? ''} ${u?.role ?? ''} ${depName}`.toLowerCase();
      const okSearch = !q || txt.includes(q);
      const okRole = roleFilter.length ? roleFilter.includes(u?.role) : true;
      const okDept = departmentFilter.length ? departmentFilter.includes(depName) : true;
      return okSearch && okRole && okDept;
    });
  }, [users, deptNameById, searchTerm, roleFilter, departmentFilter]);

  const sortedUsers = useMemo(() => {
    if (sortDir === 'none' || !sortKey) return filteredUsers;
    const val = (u) => {
      if (sortKey === 'employee_id') return String(u?.employee_id ?? '');
      if (sortKey === 'username')    return String(u?.username ?? '').toLowerCase();
      if (sortKey === 'first_name')  return String(u?.first_name ?? '').toLowerCase();
      if (sortKey === 'last_name')   return String(u?.last_name ?? '').toLowerCase();
      if (sortKey === 'role')        return String(u?.role ?? '').toLowerCase();
      if (sortKey === 'department')  return String(deptNameById.get(u?.department_id) || '').toLowerCase();
      return '';
    };
    const dir = sortDir === 'asc' ? 1 : -1;
    const copy = [...filteredUsers];
    copy.sort((a, b) => {
      const av = val(a), bv = val(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return String(a?.employee_id ?? '').localeCompare(String(b?.employee_id ?? ''));
    });
    return copy;
  }, [filteredUsers, sortKey, sortDir, deptNameById]);

  const setSort = (key, dir='asc') => { setSortKey(key); setSortDir(dir); };
  const colCount = isViewer ? 6 : 8;
  const isAll = pageSize === 'all';
  const numericPageSize = isAll ? (sortedUsers.length || 0) : Number(pageSize);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(sortedUsers.length / numericPageSize));
  const paginatedUsers = isAll ? sortedUsers : sortedUsers.slice((currentPage - 1) * numericPageSize, currentPage * numericPageSize);
  const hasPageData = paginatedUsers.length > 0;

  const exportDisabled = loading || !hasLoadedOnce || sortedUsers.length === 0;

  const exportToExcel = () => {
    if (exportDisabled) return;
    const exportData = sortedUsers.map(u => {
      const dep = deptNameById.get(u?.department_id) || '';
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

  const isAdminRole = (role) => String(role || '').toLowerCase() === 'admin';

  const confirmDelete = async () => {
    if (deleteId == null) return;
    const target = users.find(u => u?.employee_id === deleteId);
    if (target && isAdminRole(target.role)) { setShowDelete(false); return; }
    try {
      await fetch(`${API_BASE}/api/users/${deleteId}`, { method: 'DELETE' });
      setShowDelete(false);
      await refreshData();
    } catch {}
  };

  const handleDeleteClick = (empId) => {
    const target = users.find(u => u?.employee_id === empId);
    if (target && isAdminRole(target.role)) return;
    setDeleteId(empId);
    setShowDelete(true);
  };

  
  const initials = (first = '', last = '') => {
    const a = String(first).trim()[0] || '';
    const b = String(last).trim()[0] || '';
    return (a + b || '؟').toUpperCase();
  };

  const MobileCard = ({ u }) => {
    const depName = deptNameById.get(u?.department_id) || '';
    const isAdmin = isAdminRole(u?.role);
    return (
      <div className="u-card" key={u?.employee_id}>
        <div className="u-head">
          <div className="u-ident">
            <div className="u-avatar">{initials(u?.first_name, u?.last_name)}</div>
            <div>
              <div className="u-title">{u?.username}</div>
              <div className="u-subtle">رقم الموظف: {u?.employee_id}</div>
            </div>
          </div>
        </div>

        <div className="u-row">
          <span className="u-subtle">الاسم</span>
          <span className="u-chip" title={`${u?.first_name} ${u?.last_name}`}>{u?.first_name} {u?.last_name}</span>
        </div>

        <div className="u-row">
          <span className="u-subtle">الإدارة</span>
          <span className="u-chip" title={depName}>{depName || '—'}</span>
        </div>

        <div className="u-row">
          <span className="u-subtle">الدور</span>
          <span className="u-chip" title={u?.role || '—'}>{u?.role || '—'}</span>
        </div>

        {!isViewer && (
          <div className="u-actions">
            <button
              className="btn btn-primary u-btn"
              onClick={() => navigate(`/users_edit/${u?.employee_id}`)}
              title="تعديل"
              aria-label="تعديل"
            >
              <i className="fas fa-pen ms-1" />
              تعديل
            </button>
            <button
              className="btn btn-outline-danger u-btn"
              onClick={() => !isAdmin && handleDeleteClick(u?.employee_id)}
              disabled={isAdmin}
              title={isAdmin ? 'لا يمكن حذف مستخدم Admin' : 'حذف'}
              aria-label="حذف"
            >
              <i className={`fas ${isAdmin ? 'fa-lock' : 'fa-times'} ms-1`} />
              حذف
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <LocalTheme />
      <div
        dir="rtl"
        className="min-vh-100 d-flex flex-column"
        style={{
          fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          backgroundColor: '#f6f8fb'
        }}
      >
        <Header />
        <div id="wrapper" style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
          <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
          <div className="d-flex flex-column flex-grow-1 min-vh-100" id="content-wrapper">
            <div id="content" className="flex-grow-1 d-flex">
              <div className="container-fluid d-flex flex-column">

                <div className="row p-4">
                  <div className="col-12"><Breadcrumbs /></div>
                </div>

                <div className="row justify-content-center flex-grow-1">
                  <div className="col-12 col-xl-11 d-flex flex-column">
                    <div className="table-card flex-grow-0" aria-busy={loading}>
                      
                      <div className="head-flat">
                        
                        {!isMobile && (
                          <div className="head-row">
                            <div className="search-block">
                              <input
                                className="form-control form-control-sm search-input"
                                type="search"
                                placeholder="بحث..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>

                            <div className="toolbar-block">
                              {!isViewer && (
                                <>
                                  <Dropdown autoClose="outside" align="end">
                                    <Dropdown.Toggle size="sm" variant="outline-secondary">الدور</Dropdown.Toggle>
                                    <Dropdown.Menu renderOnMount popperConfig={dropdownPopper}>
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

                                  <Dropdown autoClose="outside" align="end">
                                    <Dropdown.Toggle size="sm" variant="outline-secondary">الإدارة</Dropdown.Toggle>
                                    <Dropdown.Menu style={{ maxHeight: 320, overflowY: 'auto' }} renderOnMount popperConfig={dropdownPopper}>
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

                                  <Dropdown align="end">
                                    <Dropdown.Toggle size="sm" variant="outline-secondary">ترتيب</Dropdown.Toggle>
                                    <Dropdown.Menu renderOnMount popperConfig={dropdownPopper}>
                 
                                      <Dropdown.Header>الاسم</Dropdown.Header>
                                      <Dropdown.Item onClick={() => setSort('username','asc')}  active={sortKey==='username' && sortDir==='asc'}>اسم المستخدم (أ-ي)</Dropdown.Item>
                                      <Dropdown.Item onClick={() => setSort('username','desc')} active={sortKey==='username' && sortDir==='desc'}>اسم المستخدم (ي-أ)</Dropdown.Item>
                                      <Dropdown.Item onClick={() => setSort('first_name','asc')}  active={sortKey==='first_name' && sortDir==='asc'}>الاسم الأول (أ-ي)</Dropdown.Item>
                                      <Dropdown.Item onClick={() => setSort('first_name','desc')} active={sortKey==='first_name' && sortDir==='desc'}>الاسم الأول (ي-أ)</Dropdown.Item>
                                      <Dropdown.Item onClick={() => setSort('last_name','asc')}  active={sortKey==='last_name' && sortDir==='asc'}>الاسم الأخير (أ-ي)</Dropdown.Item>
                                      <Dropdown.Item onClick={() => setSort('last_name','desc')} active={sortKey==='last_name' && sortDir==='desc'}>الاسم الأخير (ي-أ)</Dropdown.Item>
                                      <Dropdown.Divider />
                                      <Dropdown.Header>حقول أخرى</Dropdown.Header>
                                      <Dropdown.Item onClick={() => setSort('role','asc')}  active={sortKey==='role' && sortDir==='asc'}>الدور (أ-ي)</Dropdown.Item>
                                      <Dropdown.Item onClick={() => setSort('role','desc')} active={sortKey==='role' && sortDir==='desc'}>الدور (ي-أ)</Dropdown.Item>
                                      <Dropdown.Item onClick={() => setSort('department','asc')}  active={sortKey==='department' && sortDir==='asc'}>الإدارة (أ-ي)</Dropdown.Item>
                                      <Dropdown.Item onClick={() => setSort('department','desc')} active={sortKey==='department' && sortDir==='desc'}>الإدارة (ي-أ)</Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>

                                  <Link className="btn btn-outline-success btn-sm" to="/users_create">إضافة مستخدم</Link>

                                  {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={exportToExcel}
                                      disabled={exportDisabled}
                                      title={exportDisabled ? 'التصدير متاح بعد اكتمال التحميل ووجود نتائج' : 'تصدير Excel'}
                                    >
                                      <i className="fas fa-file-excel ms-1" /> تصدير Excel
                                    </button>
                                  )}
                                </>
                              )}

                              <div className="d-flex align-items-center gap-2 ms-2">
                                {!loading && (
                                  <small className="text-muted">النتائج: {sortedUsers.length.toLocaleString('ar-SA')}</small>
                                )}
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={refreshData}
                                  title="تحديث"
                                  disabled={loading}
                                  aria-busy={loading}
                                >
                                  {loading
                                    ? <span className="spinner-border spinner-border-sm ms-1" />
                                    : <i className="fas fa-rotate-right" />
                                  }
                                  تحديث
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        
                        {isMobile && (
                          <div className="m-stack">
                            <div className="search-block">
                              <input
                                className="form-control form-control-sm search-input"
                                type="search"
                                placeholder="بحث..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>

                            <div className="m-toolbar">
                              <Dropdown align="start">
                                <Dropdown.Toggle size="sm" variant="outline-secondary" className="m-btn">
                                  <i className="fas fa-sort ms-1" /> فرز
                                </Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount className="m-menu" popperConfig={dropdownPopper}>
            
                                  <Dropdown.Header>الاسم</Dropdown.Header>
                                  <Dropdown.Item onClick={() => setSort('username','asc')}  active={sortKey==='username' && sortDir==='asc'}>اسم المستخدم (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('username','desc')} active={sortKey==='username' && sortDir==='desc'}>اسم المستخدم (ي-أ)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('first_name','asc')}  active={sortKey==='first_name' && sortDir==='asc'}>الأول (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('first_name','desc')} active={sortKey==='first_name' && sortDir==='desc'}>الأول (ي-أ)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('last_name','asc')}  active={sortKey==='last_name' && sortDir==='asc'}>الأخير (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('last_name','desc')} active={sortKey==='last_name' && sortDir==='desc'}>الأخير (ي-أ)</Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Header>حقول أخرى</Dropdown.Header>
                                  <Dropdown.Item onClick={() => setSort('role','asc')}  active={sortKey==='role' && sortDir==='asc'}>الدور (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('role','desc')} active={sortKey==='role' && sortDir==='desc'}>الدور (ي-أ)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('department','asc')}  active={sortKey==='department' && sortDir==='asc'}>الإدارة (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('department','desc')} active={sortKey==='department' && sortDir==='desc'}>الإدارة (ي-أ)</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>

                              {!isViewer ? (
                                <Dropdown autoClose="outside" align="start">
                                  <Dropdown.Toggle size="sm" variant="outline-secondary" className="m-btn">
                                    <i className="fas fa-filter ms-1" /> تصفية
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu renderOnMount className="m-menu" popperConfig={dropdownPopper}>
                                    <Dropdown.Header>الدور</Dropdown.Header>
                                    <div className="px-2 pb-2">
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
                                    </div>
                                    <Dropdown.Divider />
                                    <Dropdown.Header>الإدارة</Dropdown.Header>
                                    <div className="px-2" style={{ maxHeight: '48vh', overflowY: 'auto' }}>
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
                                    </div>
                                  </Dropdown.Menu>
                                </Dropdown>
                              ) : <div />}

                              <Dropdown align="start">
                                <Dropdown.Toggle size="sm" variant="outline-secondary" className="m-btn">
                                  <i className="fas fa-wand-magic-sparkles ms-1" /> إجراءات
                                </Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount className="m-menu" popperConfig={dropdownPopper}>
                                  {!isViewer && (
                                    <Dropdown.Item as={Link} to="/users_create">
                                      <i className="fas fa-user-plus ms-1" /> إضافة مستخدم
                                    </Dropdown.Item>
                                  )}
                                  {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                                    <Dropdown.Item onClick={exportToExcel} disabled={exportDisabled}>
                                      <i className="fas fa-file-excel ms-1" /> تصدير Excel
                                    </Dropdown.Item>
                                  )}
                                </Dropdown.Menu>
                              </Dropdown>
                            </div>

                            <div className="meta-row">
                              {!loading ? (
                                <small className="text-muted">النتائج: {sortedUsers.length.toLocaleString('ar-SA')}</small>
                              ) : <span />}
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={refreshData}
                                title="تحديث"
                                disabled={loading}
                                aria-busy={loading}
                              >
                                {loading
                                  ? <span className="spinner-border spinner-border-sm ms-1" />
                                  : <i className="fas fa-rotate-right" />
                                }
                                تحديث
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      
                      {isMobile ? (
                        <div className="mobile-list">
                          {loading ? (
                            <div className="loader-block">
                              <span className="spinner-border" role="status" aria-hidden="true" />
                              <span className="text-muted">جاري التحميل…</span>
                            </div>
                          ) : hasPageData ? (
                            paginatedUsers.map(u => <MobileCard key={u?.employee_id} u={u} />)
                          ) : (
                            <div className="text-muted text-center py-3">لا توجد نتائج</div>
                          )}
                        </div>
                      ) : (
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
                              {loading ? (
                                <tr>
                                  <td colSpan={colCount}>
                                    <div className="loader-block">
                                      <span className="spinner-border" role="status" aria-hidden="true" />
                                      <span className="text-muted">جاري التحميل…</span>
                                    </div>
                                  </td>
                                </tr>
                              ) : hasPageData ? (
                                paginatedUsers.map(u => {
                                  const depName = deptNameById.get(u?.department_id) || '';
                                  const isAdmin = isAdminRole(u?.role);
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
                                            <button
                                              className="btn btn-link p-0 text-danger"
                                              onClick={() => !isAdmin && handleDeleteClick(u?.employee_id)}
                                              disabled={isAdmin}
                                              title={isAdmin ? 'لا يمكن حذف مستخدم Admin' : 'حذف'}
                                            >
                                              <i className={`fas ${isAdmin ? 'fa-lock' : 'fa-times'}`} />
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
                            </tbody>
                          </table>
                        </div>
                      )}

                      
                      <div className="foot-flat d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div className="d-inline-flex align-items-center gap-2">
                          <Dropdown align="start">
                            <Dropdown.Toggle size="sm" variant="outline-secondary">
                              عدد الصفوف: {isAll ? 'الكل' : pageSize}
                            </Dropdown.Toggle>
                            <Dropdown.Menu renderOnMount popperConfig={dropdownPopper}>
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
                          <div className="text-muted small">عرض {sortedUsers.length} صف</div>
                        ) : (
                          <div className="d-inline-flex align-items-center gap-2">
                            <button className="btn btn-outline-primary btn-sm" onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={loading || currentPage === 1}>السابق</button>
                            <button className="btn btn-outline-primary btn-sm" onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} disabled={loading || currentPage === totalPages}>التالي</button>
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
            <div className="mt-auto">
              <Footer />
            </div>
          </div>
        </div>
      </div>

      <DeleteModal show={showDelete} onHide={() => setShowDelete(false)} onConfirm={confirmDelete} />
    </>
  );
}
