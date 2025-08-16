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

export default function Departments() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState([]); // store building numbers as strings
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useSkeleton, setUseSkeleton] = useState(true); // always show skeleton while loading
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // NEW: detect mobile to adjust dropdown behavior like Standards page
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

  // Delete modal state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState(''); // name to type for confirmation

  // Import state + banner
  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState({ type: null, text: '' });
  const fileInputRef = useRef(null);

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);
  const isViewer = user?.role?.toLowerCase?.() === 'user';
  const navigate = useNavigate();

  // Paging like other pages
  const PAGE_OPTIONS = [15, 25, 50, 'all'];
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Anti-flicker + concurrency safety
  const LOAD_MIN_MS = 450;
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

      .table thead th { white-space:nowrap; color:#6c757d; font-weight:600; }
      .th-name  { min-width: 280px; }
      .th-bnum  { min-width: 140px; }
      .th-icon  { width: 60px; }

      .foot-flat { padding:10px 14px; border-top:1px solid var(--stroke); background: var(--surface-muted); }
      .page-spacer { height: 140px; }

      .table-card .table { margin: 0 !important; }
      .table-card .table-responsive { margin: 0; }

      .skel { position:relative; overflow:hidden; background:var(--skeleton-bg); display:inline-block; border-radius:6px; }
      .skel::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%); animation:shimmer var(--skeleton-speed) infinite; }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .skel::after { animation:none; } }

      .skel-line  { height: 12px; }
      .skel-badge { height: 22px; width: 72px; border-radius: 999px; }
      .skel-link  { height: 12px; width: 48px; }
      .skel-icon  { height: 16px; width: 16px; border-radius: 4px; }

      .table-empty-row td { height:44px; padding:0; border-color:#eef2f7 !important; background:#fff; }

      .dropdown-menu { --bs-dropdown-link-hover-bg:#f1f5f9; --bs-dropdown-link-active-bg:#e2e8f0; }
      .dropdown-item { color:var(--text) !important; }
      .dropdown-item:hover, .dropdown-item:focus, .dropdown-item:active, .dropdown-item.active { color:var(--text) !important; }

      /* --- Mobile-friendly dropdown sizing like Standards --- */
      .dropdown-menu { max-height: 50vh; overflow:auto; min-width: 220px; }
      @media (max-width: 576px) {
        .dropdown-menu { max-width: calc(100vw - 2rem); min-width: auto; }
      }
    `}</style>
  );

  /* ===== Popover: تعليمات استخدام قالب الجهات ===== */
  const popTemplateHelp = (
    <Popover id="pop-dept-template" dir="rtl">
      <Popover.Header as="h6">طريقة استخدام قالب الجهات</Popover.Header>
      <Popover.Body>
        <div className="small text-muted mb-2">
          الأعمدة المطلوبة: <code>اسم الجهة، رقم المبنى</code>
        </div>
        <ul className="mb-0 ps-3">
          <li>حمّل القالب وافتحه في Excel.</li>
          <li>أدخل <code>اسم الجهة</code> بالاسم الرسمي المعتمد.</li>
          <li>اكتب <code>رقم المبنى</code> كعدد صحيح فقط (مثال: <code>312</code>).</li>
          <li>تجنّب التكرار — الصفوف المكررة تُتجاهل تلقائيًا أثناء الاستيراد.</li>
          <li>احفظ الملف ثم استخدم زر «استيراد Excel» لرفعه.</li>
        </ul>
      </Popover.Body>
    </Popover>
  );

  // Popper config shared with Standards (prevents overflow + allows flip)
  const dropdownPopper = useMemo(() => ({
    strategy: 'fixed',
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      { name: 'flip', enabled: true, options: { fallbackPlacements: ['bottom', 'top', 'left', 'right'] } },
      { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8, altAxis: true, tether: true } },
    ],
  }), []);

  // Auto-hide banner after 5s
  useEffect(() => {
    if (!banner.type) return;
    const t = setTimeout(() => setBanner({ type: null, text: '' }), 5000);
    return () => clearTimeout(t);
  }, [banner.type]);

  // === Always show skeleton during refresh ===
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
        if (seq === loadSeqRef.current) {
          setHasLoadedOnce(true);
          setLoading(false);
        }
      };
      if (elapsed < LOAD_MIN_MS) setTimeout(finish, LOAD_MIN_MS - elapsed);
      else finish();
    }
  };

  useEffect(() => {
    refreshData();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line
  }, [API_BASE]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, buildingFilter, pageSize]);

  // Build unique buildings list as strings
  const uniqueBuildings = [...new Set((data || []).map(d => String(d?.building_number ?? '')).filter(Boolean))];

  const handleCheckboxFilter = (value) => {
    setBuildingFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  // Normalize Arabic/Persian digits to ASCII and parse int
  const normalizeInt = (val) => {
    if (val === null || val === undefined) return NaN;
    const map = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
    const s = String(val).replace(/[٠-٩۰-۹]/g, ch => map[ch] || ch).replace(/[^\d-]+/g, '');
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : NaN;
  };

  // Normalize department name for duplicate checks
  const normalizeName = (name = '') => {
    const diacritics = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g; // Arabic diacritics
    const tatweel = /\u0640/g; // Tatweel
    return String(name)
      .replace(diacritics, '')
      .replace(tatweel, '')
      .replace(/\u200f|\u200e|\ufeff/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  const stripHidden = (s='') =>
    String(s)
      .replace(/\u200f|\u200e|\ufeff/g, '')
      .replace(/\u00A0/g, ' ')
      .trim();

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
      for (let i=0; i<keys.length && foundIndex === -1; i++) {
        if (candidates.includes(keys[i])) foundIndex = i;
      }
      if (foundIndex !== -1) {
        lookup.set(canon, originalKeys[foundIndex]);
      }
    }
    return lookup;
  };

  const getCell = (row, headerMap, canonKey) => {
    const actual = headerMap.get(canonKey);
    return stripHidden(row[actual] ?? '');
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

  // Skeleton control: during loading, always show exactly pageSize rows (or 15 if "all")
  const skeletonMode = loading && useSkeleton;
  const skeletonCount = isAll ? 15 : Number(pageSize);

  // Filler rows when NOT loading (to keep exact height = pageSize)
  const baseRowsCount = hasPageData ? paginatedData.length : 1; // one for "no results"
  const fillerCount = isAll ? 0 : Math.max(0, Number(pageSize) - baseRowsCount);

  const goToPreviousPage = () => { if (!isAll && currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (!isAll && currentPage < totalPages) setCurrentPage(currentPage + 1); };

  // Skeleton rows aligned with columns
  const SkeletonRow = ({ idx }) => (
    <tr key={`sk-${idx}`}>
      <td><span className="skel skel-line" style={{ width: '70%' }} /></td>
      <td><span className="skel skel-line" style={{ width: '40%' }} /></td>
      {!isViewer && <td><span className="skel skel-icon" /></td>}
      {!isViewer && <td><span className="skel skel-icon" /></td>}
    </tr>
  );

  // Render filler rows to keep table height consistent
  const renderFillerRows = (count) =>
    Array.from({ length: count }).map((_, r) => (
      <tr key={`filler-${r}`} className="table-empty-row">
        {Array.from({ length: colCount }).map((__, c) => <td key={`f-${r}-${c}`} />)}
      </tr>
    ));

  // --- Check if department has Admin users linked (prevents delete) ---
  const hasAdminInDepartment = async (departmentId) => {
    try {
      let res = await fetch(`${API_BASE}/api/users?departmentId=${departmentId}&role=admin`);
      if (!res.ok) res = await fetch(`${API_BASE}/api/users?departmentId=${departmentId}`);
      if (!res.ok) return false;

      const users = await res.json();
      if (!Array.isArray(users)) return false;

      return users.some(u => String(u?.role || '').toLowerCase() === 'admin' || String(u?.role || '').toLowerCase() === 'administrator');
    } catch {
      return false;
    }
  };

  // Delete handlers
  const handleDeleteClick = async (id, name) => {
    const blocked = await hasAdminInDepartment(id);
    if (blocked) {
      setBanner({
        type: 'danger',
        text: 'لا يمكن حذف الجهة لأنها مرتبطة بمستخدم لديه دور "Admin". يرجى  نقل المستخدم أولاً.'
      });
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
        await refreshData(); // skeleton on refresh
      } else {
        if (res.status === 409 || res.status === 400 || res.status === 422) {
          setShowDelete(false);
          setBanner({
            type: 'danger',
            text: 'تعذّر الحذف: الجهة مرتبطة بمستخدم لديه دور "Admin".'
          });
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

  // Export to Excel (admins) — disabled while loading/not ready/no rows
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

  // Download template
  const downloadTemplateExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([['اسم الجهة', 'رقم المبنى']]);
    ws['!cols'] = [{ wch: 30 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب الجهات');
    XLSX.writeFile(wb, 'قالب_الجهات.xlsx');
  };

  // Import Excel with duplicate-name protection + robust header mapping + counts
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

      if (!rows.length) {
        setBanner({ type: 'danger', text: 'الملف فارغ أو خالي من البيانات.' });
        return;
      }

      const headerMap = buildHeaderMap(rows[0]);
      const missing = ['اسم الجهة','رقم المبنى'].filter(k => !headerMap.get(k));
      if (missing.length) {
        setBanner({
          type: 'danger',
          text: `الأعمدة المطلوبة مفقودة أو غير متطابقة: ${missing.join('، ')}. تأكد من صحة العناوين أو استخدم "تحميل القالب".`
        });
        return;
      }

      const existingNames = new Set((data || []).map(d => normalizeName(d?.department_name)));
      const batchSeen = new Set();

      let ok = 0, fail = 0, dup = 0, skipped = 0;

      for (const r of rows) {
        const nameRaw = getCell(r, headerMap, 'اسم الجهة');
        const bnumRaw = getCell(r, headerMap, 'رقم المبنى');

        const department_name = String(nameRaw).trim();
        const building_number = normalizeInt(bnumRaw);

        if (!department_name || !Number.isFinite(building_number)) {
          skipped++;
          continue;
        }

        const norm = normalizeName(department_name);
        if (!norm) { skipped++; continue; }

        if (existingNames.has(norm) || batchSeen.has(norm)) {
          dup++;
          continue;
        }

        try {
          const res = await fetch(`${API_BASE}/api/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ department_name, building_number }),
          });
          if (res.ok) {
            ok++;
            batchSeen.add(norm);
            existingNames.add(norm);
          } else {
            fail++;
          }
        } catch {
          fail++;
        }
      }

      setBanner({
        type: 'success',
        text: `تمت المعالجة: ${ok} مضافة، ${dup} مكررة (تم تجاهلها)، ${skipped} غير مكتملة/غير صالحة، ${fail} فشلت.`
      });
      await refreshData(); // skeleton on refresh
    } catch (e) {
      setBanner({ type: 'danger', text: 'تعذر قراءة الملف. تأكد من البيانات وأن الأعمدة مسماة بشكل صحيح. جرّب "تحميل القالب".' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportDisabled = loading || skeletonMode || !hasLoadedOnce || !filteredData.length;

  return (
    <>
      <LocalTheme />
      <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif', backgroundColor: '#f6f8fb', minHeight: '100vh' }}>
        <Header />

        {/* Auto-hiding banner */}
        {banner.type && (
          <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
            <div className={`alert alert-${banner.type} mb-0`} role="alert">{banner.text}</div>
          </div>
        )}

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

                          {/* Building filter dropdown — now mobile-friendly like Standards */}
                          <Dropdown autoClose="outside" align={isMobile ? 'start' : 'end'} flip={isMobile}>
                            <Dropdown.Toggle
                              size="sm"
                              variant="outline-secondary"
                              data-bs-display="static"
                            >
                              المبنى
                            </Dropdown.Toggle>
                            <Dropdown.Menu
                              renderOnMount
                              popperConfig={dropdownPopper}
                              style={{
                                maxHeight: isMobile ? '60vh' : 320,
                                overflowY: 'auto',
                                maxWidth: 'calc(100vw - 2rem)'
                              }}
                            >
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
                              {!uniqueBuildings.length && (
                                <div className="dropdown-item text-muted small">لا توجد أرقام مبانٍ</div>
                              )}
                            </Dropdown.Menu>
                          </Dropdown>

                          <Link className="btn btn-outline-success btn-sm" to="/departments_create">إضافة جهة</Link>

                          {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                            <>
                              {/* Export Excel (disabled until fully loaded) */}
                              <button
                                className="btn btn-success btn-sm"
                                onClick={exportToExcel}
                                disabled={exportDisabled}
                                aria-disabled={exportDisabled}
                                title={exportDisabled ? 'انتظر اكتمال التحميل أو لا توجد بيانات' : 'تصدير Excel'}
                              >
                                <i className="fas fa-file-excel ms-1" /> تصدير Excel
                              </button>

                              {/* Import Excel */}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                style={{ display: 'none' }}
                                onChange={(e) => handleExcelImport(e.target.files?.[0])}
                              />
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={importing}
                              >
                                {importing ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true" /> جارِ الاستيراد
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-file-upload ms-1" /> استيراد Excel
                                  </>
                                )}
                              </button>

                              {/* Download template + help popover — click on mobile, hover/focus on desktop */}
                              <OverlayTrigger
                                placement="bottom"
                                delay={{ show: 200, hide: 100 }}
                                overlay={popTemplateHelp}
                                popperConfig={dropdownPopper}
                                trigger={isMobile ? ['click'] : ['hover', 'focus']}
                                rootClose
                              >
                                <button className="btn btn-outline-secondary btn-sm" onClick={downloadTemplateExcel} aria-label="تحميل القالب مع التعليمات">
                                  <i className="fas fa-download ms-1" /> تحميل القالب
                                </button>
                              </OverlayTrigger>
                            </>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          {!skeletonMode && (
                            <small className="text-muted">النتائج: {filteredData.length.toLocaleString('ar-SA')}</small>
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

                            {/* keep height constant after load */}
                            {!skeletonMode && renderFillerRows(fillerCount)}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer: page size + pagination */}
                      <div className="foot-flat d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div className="d-inline-flex align-items-center gap-2">
                          {/* Page size dropdown — now mobile-friendly like Standards */}
                          <Dropdown align="start" flip={isMobile}>
                            <Dropdown.Toggle size="sm" variant="outline-secondary" data-bs-display="static">
                              عدد الصفوف: {isAll ? 'الكل' : pageSize}
                            </Dropdown.Toggle>
                            <Dropdown.Menu
                              renderOnMount
                              popperConfig={dropdownPopper}
                              style={{ maxWidth: 'calc(100vw - 2rem)' }}
                            >
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

      <DeleteModal
        show={showDelete}
        onHide={() => setShowDelete(false)}
        onConfirm={confirmDelete}
        subject={`«${deleteName || 'هذه الجهة'}»`}
        cascadeNote="ملاحظة: لا يمكن حذف الجهة إذا كانت مرتبطة بمستخدم بدور Admin."
        requireText={deleteName}
      />
    </>
  );
}
