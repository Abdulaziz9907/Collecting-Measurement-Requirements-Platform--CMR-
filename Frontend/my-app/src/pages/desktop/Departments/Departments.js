import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, OverlayTrigger, Popover } from 'react-bootstrap';
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

export default function Departments() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState([]); // strings
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useSkeleton, setUseSkeleton] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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

  const [sortKey, setSortKey] = useState(null); // 'name' | 'building'
  const [sortDir, setSortDir] = useState('none');

  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState({ type: null, text: '' });
  const fileInputRef = useRef(null);

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const user = useMemo(() => getStoredUser(), []);
  const isViewer = user?.role?.toLowerCase?.() === 'user';
  const navigate = useNavigate();

  const PAGE_OPTIONS = [15, 25, 50, 'all'];
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const LOAD_MIN_MS = 450;
  const abortRef = useRef(null);
  const loadSeqRef = useRef(0);

  const dropdownPopper = useMemo(() => ({
    strategy: 'fixed',
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      { name: 'flip', enabled: true, options: { fallbackPlacements: ['bottom', 'top', 'left', 'right'] } },
      { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8, altAxis: true, tether: true } },
    ],
  }), []);

  /* ===== Local Theme (aligned with Users) ===== */
  const LocalTheme = () => (
    <style>{`
      :root {
        --radius: 14px;
        --shadow: 0 10px 24px rgba(16, 24, 40, 0.08);
        --surface:#ffffff; --surface-muted:#fbfdff; --stroke:#eef2f7;
        --text:#0b2440; --text-muted:#6b7280; --brand:#4F7689;
        --skeleton-bg:#e9edf3; --skeleton-sheen:rgba(255,255,255,.6); --skeleton-speed:1.2s;
        --search-max: 460px; /* ✅ unified desktop search width */
      }

      .table-card { background:var(--surface); border:1px solid var(--stroke); border-radius:var(--radius); box-shadow:var(--shadow); overflow:hidden; margin-bottom:56px; }
      .head-flat { padding:10px 12px; background:var(--surface-muted); border-bottom:1px solid var(--stroke); color:var(--text); }
      .head-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
      .controls-inline { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

      /* ✅ Desktop: identical width */
      .search-block { flex: 0 0 var(--search-max); }
      .search-input { width: var(--search-max); max-width: 100%; margin:0 !important; }

      .table thead th { white-space:nowrap; color:#6c757d; font-weight:600; }
      .th-name{ min-width:280px; } .th-bnum{ min-width:140px; } .th-icon{ width:60px; }

      .foot-flat { padding:10px 14px; border-top:1px solid var(--stroke); background:var(--surface-muted); }
      .page-spacer { height:200px; }
      .table-card .table, .table-card .table-responsive { margin:0 !important; }

      /* Skeletons */
      .skel{ position:relative; overflow:hidden; background:var(--skeleton-bg); display:inline-block; border-radius:6px; }
      .skel::after{ content:""; position:absolute; inset:0; transform:translateX(-100%);
        background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%);
        animation:shimmer var(--skeleton-speed) infinite; }
      @keyframes shimmer { 100% { transform: translateX(100%);} }
      @media (prefers-reduced-motion: reduce){ .skel::after{ animation:none; } }
      .skel-line{ height:12px; }
      .skel-chip{ height:28px; width:100%; border-radius:999px; }
      .skel-icon{ height:16px; width:16px; border-radius:4px; } /* ✅ match Users skeleton icon */
      .table-empty-row td{ height:44px; padding:0; border-color:#eef2f7 !important; background:#fff; }

      /* Dropdown look identical to Users */
      .dropdown-menu{
        --bs-dropdown-link-hover-bg:#f1f5f9;
        --bs-dropdown-link-active-bg:#e2e8f0;
      }
      .dropdown-item{ color:var(--text) !important; }
      .dropdown-item:hover, .dropdown-item:focus, .dropdown-item:active, .dropdown-item.active{ color:var(--text) !important; }

      /* Mobile unified header sizing (like Users) */
      @media (max-width:576px){
        .head-row{ display:none; }
        .m-stack{ display:grid; grid-template-columns:1fr; row-gap:6px; margin:0; padding:0; }
        .m-toolbar{ display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin:0; padding:0; }
        .m-btn.btn{ padding:5px 8px; min-height:32px; font-size:.85rem; border-radius:10px; font-weight:600; width:100%; }

        /* ✅ Mobile: full width */
        .search-block{ flex:1 1 auto; min-width:0; }
        .search-input{ width:100%; max-width:100%; height:36px; line-height:36px; }

        .meta-row{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
        /* The special mobile dropdown menu sizing class */
        .m-menu{ width:min(92vw, 360px); max-width:92vw; }
        .m-menu .dropdown-item{ padding:10px 12px; font-size:.95rem; }
        .m-menu .dropdown-header{ font-size:.9rem; }
      }

      /* Mobile cards */
      .mobile-list{ padding:10px 12px; display:grid; grid-template-columns:1fr; gap:10px; }
      .d-card{ border:1px solid var(--stroke); border-radius:12px; background:#fff; box-shadow:var(--shadow); padding:10px 12px; }
      .d-head{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; }
      .d-title{ font-weight:700; color:var(--text); font-size:.95rem; }
      .d-subtle{ color:var(--text-muted); font-size:.8rem; }
      .d-row{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:4px; }
      .d-chip{ display:inline-flex; align-items:center; gap:6px; padding:3px 8px; border-radius:999px; border:1px solid var(--stroke); font-size:.78rem; background:#f8fafc; }
      .d-actions{ display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:10px; }
      .d-btn{ min-height:30px; padding:5px 8px; font-size:.82rem; border-radius:10px; font-weight:600; }
      .d-btn i{ font-size:.85rem; }
    `}</style>
  );

  const popTemplateHelp = (
    <Popover id="pop-dept-template" dir="rtl">
      <Popover.Header as="h6">طريقة استخدام قالب الجهات</Popover.Header>
      <Popover.Body>
        <div className="small text-muted mb-2">الأعمدة المطلوبة: <code>اسم الجهة، رقم المبنى</code></div>
        <ul className="mb-0 ps-3">
          <li>حمّل القالب وافتحه في Excel.</li>
          <li>أدخل <code>اسم الجهة</code> بالاسم الرسمي.</li>
          <li>اكتب <code>رقم المبنى</code> كعدد صحيح فقط.</li>
          <li>تجنّب التكرار — الصفوف المكررة تُتجاهل.</li>
          <li>احفظ الملف ثم استخدم «استيراد Excel» لرفعه.</li>
        </ul>
      </Popover.Body>
    </Popover>
  );

  useEffect(() => {
    if (!banner.type) return;
    const t = setTimeout(() => setBanner({ type: null, text: '' }), 6000);
    return () => clearTimeout(t);
  }, [banner.type]);

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
      const finish = () => {
        if (seq === loadSeqRef.current) { setHasLoadedOnce(true); setLoading(false); }
      };
      if (elapsed < LOAD_MIN_MS) setTimeout(finish, LOAD_MIN_MS - elapsed);
      else finish();
    }
  };

  useEffect(() => { refreshData(); return () => abortRef.current?.abort(); /* eslint-disable-next-line */ }, [API_BASE]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, buildingFilter, pageSize, sortKey, sortDir]);

  const uniqueBuildings = [...new Set((data || []).map(d => String(d?.building_number ?? '')).filter(Boolean))];

  const handleCheckboxFilter = (value) => {
    setBuildingFilter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  // Filter
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

  // Sort
  const sortedData = useMemo(() => {
    if (sortDir === 'none' || !sortKey) return filteredData;
    const dir = sortDir === 'asc' ? 1 : -1;
    const copy = [...filteredData];
    copy.sort((a, b) => {
      const aName = (a?.department_name || '').toLowerCase();
      const bName = (b?.department_name || '').toLowerCase();
      const aB = Number(a?.building_number ?? 0);
      const bB = Number(b?.building_number ?? 0);
      let av = '', bv = '';
      if (sortKey === 'name') { av = aName; bv = bName; }
      if (sortKey === 'building') { av = aB; bv = bB; }
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });
    return copy;
  }, [filteredData, sortKey, sortDir]);

  const setSort = (key, dir='asc') => { setSortKey(key); setSortDir(dir); };

  // Pagination
  const colCount = isViewer ? 2 : 4;
  const isAll = pageSize === 'all';
  const numericPageSize = isAll ? (sortedData.length || 0) : Number(pageSize);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(sortedData.length / numericPageSize));
  const paginatedData = isAll ? sortedData : sortedData.slice((currentPage - 1) * numericPageSize, currentPage * numericPageSize);
  const hasPageData = paginatedData.length > 0;

  const skeletonMode = loading && useSkeleton;
  const skeletonCount = isAll ? 15 : Number(pageSize);

  const baseRowsCount = hasPageData ? paginatedData.length : 1;
  const fillerCount = isAll ? 0 : Math.max(0, Number(pageSize) - baseRowsCount);

  const goToPreviousPage = () => { if (!isAll && currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (!isAll && currentPage < totalPages) setCurrentPage(currentPage + 1); };

  /* ✅ Skeleton row — edit/delete now use .skel-icon to match Users */
  const SkeletonRow = ({ idx }) => (
    <tr key={`sk-${idx}`}>
      <td><span className="skel skel-line" style={{ width: '70%' }} /></td>
      <td><span className="skel skel-line" style={{ width: '40%' }} /></td>
      {!isViewer && <td><span className="skel skel-icon" /></td>}
      {!isViewer && <td><span className="skel skel-icon" /></td>}
    </tr>
  );

  const renderFillerRows = (count) =>
    Array.from({ length: count }).map((_, r) => (
      <tr key={`filler-${r}`} className="table-empty-row">
        {Array.from({ length: colCount }).map((__, c) => <td key={`f-${r}-${c}`} />)}
      </tr>
    ));

  /* Block delete if an Admin is in THIS department */
  const hasAdminInDepartment = async (departmentId) => {
    const idNum = Number(departmentId);
    try {
      let res = await fetch(`${API_BASE}/api/users?department_id=${idNum}`);
      if (!res.ok) res = await fetch(`${API_BASE}/api/users?departmentId=${idNum}`);
      if (!res.ok) res = await fetch(`${API_BASE}/api/users`);
      if (!res.ok) return false;

      const users = await res.json();
      if (!Array.isArray(users)) return false;

      return users.some(u => {
        const sameDept = Number(u?.department_id) === idNum;
        const role = String(u?.role || '').trim().toLowerCase();
        return sameDept && (role === 'admin' || role === 'administrator');
      });
    } catch {
      return false;
    }
  };

  const handleDeleteClick = async (id, name) => {
    const blocked = await hasAdminInDepartment(id);
    if (blocked) {
      setBanner({ type: 'danger', text: 'لا يمكن حذف الجهة لأنها مرتبطة بمستخدم لديه دور "Admin". يرجى نقل المستخدم أولاً.' });
      return;
    }
    setDeleteId(id);
    setDeleteName(name || '');
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/departments/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setShowDelete(false);
        setDeleteId(null);
        setDeleteName('');
        await refreshData();
      } else {
        if ([409,400,422].includes(res.status)) {
          setShowDelete(false);
          setBanner({ type: 'danger', text: 'تعذّر الحذف: الجهة مرتبطة بمستخدم لديه دور "Admin".' });
        } else {
          setShowDelete(false);
          setBanner({ type: 'danger', text: 'تعذّر الحذف حالياً. حاول لاحقاً.' });
        }
      }
    } catch {
      setShowDelete(false);
      setBanner({ type: 'danger', text: 'حدث خطأ أثناء عملية الحذف.' });
    }
  };

  const exportDisabled = loading || skeletonMode || !hasLoadedOnce || !sortedData.length;

  const exportToExcel = () => {
    if (exportDisabled) return;
    const exportData = sortedData.map(item => ({
      'اسم الجهة': item?.department_name || '',
      'رقم المبنى': item?.building_number ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الجهات');
    XLSX.writeFile(wb, 'الجهات.xlsx');
  };

  const downloadTemplateExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([['اسم الجهة', 'رقم المبنى']]);
    ws['!cols'] = [{ wch: 30 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب الجهات');
    XLSX.writeFile(wb, 'قالب_الجهات.xlsx');
  };

  const stripHidden = (s='') =>
    String(s).replace(/\u200f|\u200e|\ufeff/g, '').replace(/\u00A0/g, ' ').trim();
  const normalizeHeaderKey = (k='') => stripHidden(k);
  const HEADER_ALIASES = {
    'اسم الجهة': ['اسم الجهة','الجهة','الإدارة','القسم','department','department name','dept name','department_name'],
    'رقم المبنى': ['رقم المبنى','المبنى','building','building number','building_no','building_number']
  };
  const buildHeaderMap = (firstRowObj) => {
    const keys = Object.keys(firstRowObj || {}).map(normalizeHeaderKey);
    const originalKeys = Object.keys(firstRowObj || {});
    const lookup = new Map();
    for (const canon in HEADER_ALIASES) {
      const candidates = HEADER_ALIASES[canon].map(normalizeHeaderKey);
      let foundIndex = -1;
      for (let i=0; i<keys.length && foundIndex === -1; i++) if (candidates.includes(keys[i])) foundIndex = i;
      if (foundIndex !== -1) lookup.set(canon, originalKeys[foundIndex]);
    }
    return lookup;
  };
  const getCell = (row, headerMap, canonKey) => {
    const actual = headerMap.get(canonKey);
    return stripHidden(row[actual] ?? '');
  };

  const handleExcelImport = async (file) => {
    if (!file) return;
    setImporting(true);
    setBanner({ type: null, text: '' });

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const firstSheet = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheet];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
      if (!rows.length) { setBanner({ type: 'danger', text: 'الملف فارغ أو خالي من البيانات.' }); return; }

      const headerMap = buildHeaderMap(rows[0]);
      const missing = ['اسم الجهة','رقم المبنى'].filter(k => !headerMap.get(k));
      if (missing.length) {
        setBanner({ type: 'danger', text: `الأعمدة المطلوبة مفقودة أو غير متطابقة: ${missing.join('، ')}.` });
        return;
      }

      const normalizeInt = (val) => {
        if (val === null || val === undefined) return NaN;
        const map = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
        const s = String(val).replace(/[٠-٩۰-۹]/g, ch => map[ch] || ch).replace(/[^\d-]+/g, '');
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : NaN;
      };
      const normalizeName = (name = '') => {
        const diacritics = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
        const tatweel = /\u0640/g;
        return String(name).replace(diacritics,'').replace(tatweel,'').replace(/\u200f|\u200e|\ufeff/g,'').replace(/\u00A0/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
      };

      const existingNames = new Set((data || []).map(d => normalizeName(d?.department_name)));
      const batchSeen = new Set();

      let ok = 0, fail = 0, dup = 0, skipped = 0;

      for (const r of rows) {
        const nameRaw = getCell(r, headerMap, 'اسم الجهة');
        const bnumRaw = getCell(r, headerMap, 'رقم المبنى');
        const department_name = String(nameRaw).trim();
        const building_number = normalizeInt(bnumRaw);
        if (!department_name || !Number.isFinite(building_number)) { skipped++; continue; }
        const norm = normalizeName(department_name);
        if (!norm) { skipped++; continue; }
        if (existingNames.has(norm) || batchSeen.has(norm)) { dup++; continue; }

        try {
          const res = await fetch(`${API_BASE}/api/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ department_name, building_number }),
          });
          if (res.ok) { ok++; batchSeen.add(norm); existingNames.add(norm); } else { fail++; }
        } catch { fail++; }
      }

      setBanner({ type: 'success', text: `تمت المعالجة: ${ok} مضافة، ${dup} مكررة، ${skipped} غير مكتملة/غير صالحة، ${fail} فشلت.` });
      await refreshData();
    } catch {
      setBanner({ type: 'danger', text: 'تعذر قراءة الملف. تأكد من صحة الأعمدة أو استخدم القالب.' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* Mobile card */
  const MobileCard = ({ item }) => (
    <div className="d-card" key={item.department_id}>
      <div className="d-head">
        <div className="d-title" title={item.department_name}>{item.department_name}</div>
      </div>
      <div className="d-row">
        <span className="d-subtle">رقم المبنى</span>
        <span className="d-chip">{item.building_number ?? '—'}</span>
      </div>
      {!isViewer && (
        <div className="d-actions">
          <button className="btn btn-primary d-btn" onClick={() => navigate(`/departments_edit/${item.department_id}`)}>
            <i className="fas fa-pen ms-1" /> تعديل
          </button>
          <button className="btn btn-outline-danger d-btn" onClick={() => handleDeleteClick(item.department_id, item.department_name)} title="حذف">
            <i className="fas fa-times ms-1" /> حذف
          </button>
        </div>
      )}
    </div>
  );

  const SkeletonCard = ({ idx }) => (
    <div className="d-card" key={`dsk-${idx}`}>
      <div className="d-head">
        <span className="skel skel-line" style={{ width: '60%' }} />
      </div>
      <div className="d-row">
        <span className="d-subtle">رقم المبنى</span>
        <span className="skel skel-chip" style={{ width: '40%' }} />
      </div>
      {!isViewer && (
        <div className="d-actions">
          <span className="skel skel-chip" />
          <span className="skel skel-chip" />
        </div>
      )}
    </div>
  );

  return (
    <>
      <LocalTheme />
      <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif', backgroundColor: '#f6f8fb' }} className="min-vh-100 d-flex flex-column">
        <Header />

        {banner.type && (
          <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
            <div
              className={`alert alert-${banner.type} mb-0`}
              role="alert"
              dir="rtl"
              style={{
                position: 'relative',
                paddingLeft: '2.5rem',
              }}
            >
              {banner.text}

              {/* Close (×) — black, not overlapping text */}
              <button
                type="button"
                className="btn-close"
                aria-label="إغلاق"
                onClick={() => setBanner({ type: null, text: '' })}
                style={{ position: 'absolute', left: 8, opacity: 1 }}
              />
            </div>
          </div>
        )}

        <div id="wrapper" style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
          <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
          <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
            <div id="content" className="flex-grow-1 d-flex">
              <div className="container-fluid d-flex flex-column">

                <div className="row p-4">
                  <div className="col-12"><Breadcrumbs /></div>
                </div>

                <div className="row justify-content-center flex-grow-1">
                  <div className="col-12 col-xl-10 d-flex flex-column">
                    <div className="table-card" aria-busy={loading}>
                      {/* Header */}
                      <div className="head-flat">
                        {/* Desktop */}
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

                            <div className="controls-inline">
                              {/* Sort */}
                              <Dropdown align="end">
                                <Dropdown.Toggle size="sm" variant="outline-secondary">ترتيب</Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount>
                                  <Dropdown.Header>الاسم</Dropdown.Header>
                                  <Dropdown.Item onClick={() => setSort('name','asc')}  active={sortKey==='name' && sortDir==='asc'}>اسم الجهة (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('name','desc')} active={sortKey==='name' && sortDir==='desc'}>اسم الجهة (ي-أ)</Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Header>المبنى</Dropdown.Header>
                                  <Dropdown.Item onClick={() => setSort('building','asc')}  active={sortKey==='building' && sortDir==='asc'}>رقم المبنى (تصاعدي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('building','desc')} active={sortKey==='building' && sortDir==='desc'}>رقم المبنى (تنازلي)</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>

                              {/* Filter building */}
                              <Dropdown autoClose="outside" align="end">
                                <Dropdown.Toggle size="sm" variant="outline-secondary">المبنى</Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount popperConfig={dropdownPopper} style={{ maxHeight: 320, overflowY: 'auto' }}>
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
                                  {!uniqueBuildings.length && <div className="dropdown-item text-muted small">لا توجد أرقام مبانٍ</div>}
                                </Dropdown.Menu>
                              </Dropdown>

                              <Link className="btn btn-outline-success btn-sm" to="/departments_create">إضافة جهة</Link>

                              {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                                <>
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={exportToExcel}
                                    disabled={exportDisabled}
                                    aria-disabled={exportDisabled}
                                    title={exportDisabled ? 'انتظر اكتمال التحميل أو لا توجد بيانات' : 'تصدير Excel'}
                                  >
                                    <i className="fas fa-file-excel ms-1" /> تصدير Excel
                                  </button>

                                  <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                                    {importing ? (<><span className="spinner-border spinner-border-sm ms-1" /> جارِ الاستيراد</>) : (<><i className="fas fa-file-upload ms-1" /> استيراد Excel</>)}
                                  </button>

                                  <OverlayTrigger
                                    placement="bottom"
                                    delay={{ show: 200, hide: 100 }}
                                    overlay={popTemplateHelp}
                                    popperConfig={dropdownPopper}
                                    trigger={['hover','focus']}
                                  >
                                    <button className="btn btn-outline-secondary btn-sm" onClick={downloadTemplateExcel}>
                                      <i className="fas fa-download ms-1" /> تحميل القالب
                                    </button>
                                  </OverlayTrigger>
                                </>
                              )}

                              <div className="d-flex align-items-center gap-2">
                                {!skeletonMode && <small className="text-muted">النتائج: {sortedData.length.toLocaleString('ar-SA')}</small>}
                                <button className="btn btn-outline-primary btn-sm" onClick={refreshData} disabled={loading} aria-busy={loading}>
                                  {loading ? <span className="spinner-border spinner-border-sm ms-1" /> : <i className="fas fa-rotate-right" />} تحديث
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Mobile (same look as Users via .m-menu & .m-btn) */}
                        {isMobile && (
                          <div className="m-stack">
                            <input
                              className="form-control form-control-sm search-input"
                              type="search"
                              placeholder="بحث..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <div className="m-toolbar">
                              {/* Sort */}
                              <Dropdown align="start">
                                <Dropdown.Toggle size="sm" variant="outline-secondary" className="m-btn">
                                  <i className="fas fa-sort ms-1" /> فرز
                                </Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount popperConfig={dropdownPopper} className="m-menu">
                                  <Dropdown.Header>الاسم</Dropdown.Header>
                                  <Dropdown.Item onClick={() => setSort('name','asc')}  active={sortKey==='name' && sortDir==='asc'}>اسم الجهة (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('name','desc')} active={sortKey==='name' && sortDir==='desc'}>اسم الجهة (ي-أ)</Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Header>المبنى</Dropdown.Header>
                                  <Dropdown.Item onClick={() => setSort('building','asc')}  active={sortKey==='building' && sortDir==='asc'}>رقم المبنى (تصاعدي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('building','desc')} active={sortKey==='building' && sortDir==='desc'}>رقم المبنى (تنازلي)</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>

                              {/* Filter */}
                              <Dropdown autoClose="outside" align="start">
                                <Dropdown.Toggle size="sm" variant="outline-secondary" className="m-btn">
                                  <i className="fas fa-filter ms-1" /> تصفية
                                </Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount popperConfig={dropdownPopper} className="m-menu">
                                  <Dropdown.Header>رقم المبنى</Dropdown.Header>
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
                                  {!uniqueBuildings.length && <div className="dropdown-item text-muted small">لا توجد أرقام مبانٍ</div>}
                                </Dropdown.Menu>
                              </Dropdown>

                              {/* Actions */}
                              <Dropdown align="start">
                                <Dropdown.Toggle size="sm" variant="outline-secondary" className="m-btn">
                                  <i className="fas fa-wand-magic-sparkles ms-1" /> إجراءات
                                </Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount popperConfig={dropdownPopper} className="m-menu">
                                  <Dropdown.Item as={Link} to="/departments_create"><i className="fas fa-building-circle-check ms-1" /> إضافة جهة</Dropdown.Item>
                                  {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                                    <>
                                      <Dropdown.Item onClick={exportToExcel} disabled={exportDisabled}><i className="fas fa-file-excel ms-1" /> تصدير Excel</Dropdown.Item>
                                      <Dropdown.Item onClick={() => fileInputRef.current?.click()} disabled={importing}><i className="fas fa-file-upload ms-1" /> {importing ? 'جارِ الاستيراد…' : 'استيراد Excel'}</Dropdown.Item>
                                      <Dropdown.Item onClick={downloadTemplateExcel}><i className="fas fa-download ms-1" /> تحميل القالب</Dropdown.Item>
                                    </>
                                  )}
                                </Dropdown.Menu>
                              </Dropdown>
                            </div>

                            <div className="meta-row">
                              {(!loading || !useSkeleton) ? (
                                <small className="text-muted">النتائج: {sortedData.length.toLocaleString('ar-SA')}</small>
                              ) : <span className="skel skel-line" style={{ width: 80 }} />}
                              <button className="btn btn-outline-primary btn-sm" onClick={refreshData} disabled={loading} aria-busy={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm ms-1" /> : <i className="fas fa-rotate-right" />} تحديث
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      {isMobile ? (
                        <div className="mobile-list">
                          {skeletonMode ? (
                            Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} idx={i} />)
                          ) : hasPageData ? (
                            paginatedData.map(item => <MobileCard key={item.department_id} item={item} />)
                          ) : (
                            <div className="text-muted text-center py-3">لا توجد نتائج</div>
                          )}
                        </div>
                      ) : (
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
                              {skeletonMode ? (
                                Array.from({ length: skeletonCount }).map((_, i) => <SkeletonRow key={i} idx={i} />)
                              ) : hasPageData ? (
                                paginatedData.map((item) => (
                                  <tr key={item.department_id}>
                                    <td className="text-primary">{item.department_name}</td>
                                    <td>{item.building_number}</td>
                                    {!isViewer && (
                                      <>
                                        <td>
                                          <button
                                            className="btn btn-link p-0 text-success"
                                            onClick={() => navigate(`/departments_edit/${item.department_id}`)}
                                          >
                                            <i className="fas fa-pen" />
                                          </button>
                                        </td>
                                        <td>
                                          <button
                                            className="btn btn-link p-0 text-danger"
                                            onClick={() => handleDeleteClick(item.department_id, item.department_name)}
                                            title="حذف"
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

                              {!skeletonMode && renderFillerRows(fillerCount)}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="foot-flat d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div className="d-inline-flex align-items-center gap-2">
                          <Dropdown align="start" flip={isMobile}>
                            <Dropdown.Toggle size="sm" variant="outline-secondary" data-bs-display="static">
                              عدد الصفوف: {isAll ? 'الكل' : pageSize}
                            </Dropdown.Toggle>
                            <Dropdown.Menu renderOnMount popperConfig={dropdownPopper} style={{ maxWidth: 'calc(100vw - 2rem)' }}>
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

      {/* Hidden input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        style={{ display: 'none' }}
        onChange={(e) => handleExcelImport(e.target.files?.[0])}
      />

      <DeleteModal
        show={showDelete}
        onHide={() => setShowDelete(false)}
        onConfirm={confirmDelete}
        subject={`«${deleteName || 'هذه الجهة'}»`}
        cascadeNote="سيتم حذف جميع المعايير والمستخدمين المرتبطين بهذه الجهة "
        requireText={deleteName}
      />
    </>
  );
}
