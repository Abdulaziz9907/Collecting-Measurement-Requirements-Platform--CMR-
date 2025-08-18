import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, OverlayTrigger, Popover } from 'react-bootstrap';
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
import { getStoredUser } from '../../../utils/auth';

export default function Standards() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useSkeleton, setUseSkeleton] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Mobile detection (mobile-only changes; desktop unchanged)
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

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  // Bulk delete
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Sorting
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('none');

  // Import/Export + banner
  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState({ type: null, text: '' });
  const fileInputRef = useRef(null);

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const user = useMemo(() => getStoredUser(), []);
  const navigate = useNavigate();

  // Pagination
  const PAGE_OPTIONS = [15, 25, 50, 'all'];
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Anti-flicker + concurrency
  const LOAD_MIN_MS = 450;
  const abortRef = useRef(null);
  const loadSeqRef = useRef(0);

  // Header checkbox + shift-selection
  const headerCbRef = useRef(null);
  const lastPageIndexRef = useRef(null);

  /* ========== Local Theme (mobile tweak added: .m-toolbar.cols-2) ========== */
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

      .table-card { background: var(--surface); border:1px solid var(--stroke); border-radius: var(--radius); box-shadow: var(--shadow); overflow:hidden; margin-bottom: 56px; }
      .head-flat { padding: 10px 12px; background: var(--surface-muted); border-bottom: 1px solid var(--stroke); color: var(--text); }
      .head-row { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
      .controls-inline { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
      .search-block { flex:1 1 320px; min-width:240px; }
      .search-input { width:100%; max-width: 460px; margin:0 !important; }

      .table thead th { white-space:nowrap; color:#6c757d; font-weight:600; }
      .th-select { width: 42px; text-align:center; }
      .td-select { width: 42px; text-align:center; }
      .th-num    { min-width: 96px; }
      .th-name   { min-width: 220px; }
      .th-dept   { min-width: 160px; }
      .th-status { min-width: 110px; }
      .th-date   { min-width: 140px; }
      .th-icon   { width: 60px; }

      .th-sort { background:transparent; border:0; padding:0; color:#6c757d; font-weight:600; cursor:pointer; }
      .th-sort:focus{ outline:none; text-decoration:underline; }

      .table-card .table, .table-card .table-responsive { margin: 0 !important; }

      .foot-flat { padding:10px 14px; border-top:1px solid var(--stroke); background: var(--surface-muted); }
      .page-spacer { height: 160px; }
      @media (max-width: 576px) {
        .page-spacer { height: 24px; }
      }

      /* Skeleton */
      .skel { position:relative; overflow:hidden; background:var(--skeleton-bg); display:inline-block; border-radius:6px; }
      .skel::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%); animation:shimmer var(--skeleton-speed) infinite; }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .skel::after { animation:none; } }

      .skel-line  { height: 12px; }
      .skel-badge { height: 22px; width: 72px; border-radius: 999px; }
      .skel-icon  { height: 16px; width: 16px; border-radius: 4px; }
      .skel-chip  { height: 28px; width: 100%; border-radius: 999px; }

      .table-empty-row td { height:44px; padding:0; border-color:#eef2f7 !important; background:#fff; }

      /* Desktop dropdown (unchanged) */
      .dropdown-menu { --bs-dropdown-link-hover-bg:#f1f5f9; --bs-dropdown-link-active-bg:#e2e8f0; max-height: 50vh; overflow:auto; min-width: 220px; }
      .dropdown-item { color:var(--text) !important; }
      .dropdown-item:hover, .dropdown-item:focus, .dropdown-item:active, .dropdown-item.active { color:var(--text) !important; }

      /* Selection bar */
      .selection-bar { border-top:1px dashed var(--stroke); border-bottom:1px dashed var(--stroke); background: linear-gradient(180deg, #f9fbff 0%, #f5f8fc 100%); padding: 8px 12px; }

      .th-select .form-check-input,
      .td-select .form-check-input { float: none; margin: 0; position: static; transform: none; }

      /* ===== Mobile unified header/control sizing ===== */
      @media (max-width: 576px) {
        .head-row { display:none; }
        .m-stack { display:grid; grid-template-columns: 1fr; row-gap:6px; margin:0; padding:0; }
        .m-toolbar { display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin:0; padding:0; }
        /* NEW: when we only have two controls (فرز + تصفية), stretch them 2-up */
        .m-toolbar.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .m-btn.btn { padding: 5px 8px; min-height: 32px; font-size: .85rem; border-radius: 10px; font-weight:600; width: 100%; }
        .search-input { max-width: 100%; height: 36px; line-height: 36px; }
        .meta-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      }

      /* ===== Mobile dropdowns same as Users ===== */
      .m-menu { width: min(92vw, 360px); max-width: 92vw; }
      .m-menu .dropdown-item { padding: 10px 12px; font-size: .95rem; }
      .m-menu .dropdown-header { font-size: .9rem; }

      /* ===== Mobile cards ===== */
      .mobile-list { padding: 10px 12px; display: grid; grid-template-columns: 1fr; gap: 10px; }
      .mobile-card { border: 1px solid var(--stroke); border-radius: 12px; background: #fff; box-shadow: var(--shadow); padding: 10px 12px; }
      .mobile-card-header { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
      .mobile-title { font-weight: 700; color: var(--text); font-size: 0.95rem; line-height: 1.3; }
      .mobile-subtle { color: var(--text-muted); font-size: .85rem; }
      .mobile-row { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:4px; }
      .mobile-chip { display:inline-flex; align-items:center; gap:6px; padding: 3px 8px; border-radius: 999px; border:1px solid var(--stroke); font-size:.8rem; background: #f8fafc; }

      /* Two action buttons like Users/Departments on mobile only */
      .s-actions { display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-top:10px; }
      .s-btn { min-height: 30px; padding: 5px 8px; font-size: .82rem; border-radius: 10px; font-weight:700; }
      .s-btn i { font-size: .85rem; }
    `}</style>
  );

  /* === Popover help for template === */
  const popTemplateHelp = (
    <Popover id="pop-template-help" dir="rtl">
      <Popover.Header as="h6">طريقة استخدام قالب المعايير</Popover.Header>
      <Popover.Body>
        <div className="small text-muted mb-2">
          الأعمدة المطلوبة: <code>رقم المعيار، اسم المعيار، الهدف، متطلبات التطبيق، الجهة، مستندات الإثبات</code>
        </div>
        <ul className="mb-0 ps-3">
          <li>حمّل القالب وافتحه في Excel ثم املأ كل الأعمدة.</li>
          <li>صيغة رقم المعيار: <code>XX.XX.XX</code> (مثال: <code>01.12.03</code>).</li>
          <li>افصل مستندات الإثبات بفاصلة عربية/إنجليزية (<code>،</code> أو <code>,</code>).</li>
          <li>اكتب اسم الجهة مطابقًا تمامًا لاسم الإدارة في النظام.</li>
          <li>احفظ الملف بصيغة Excel ثم استخدم زر «استيراد Excel» لرفعه.</li>
        </ul>
      </Popover.Body>
    </Popover>
  );

  // Auto hide banner
  useEffect(() => {
    if (!banner.type) return;
    const t = setTimeout(() => setBanner({ type: null, text: '' }), 10000);
    return () => clearTimeout(t);
  }, [banner.type]);

  // Dropdown popper config
  const dropdownPopper = useMemo(() => ({
    strategy: 'fixed',
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      { name: 'flip', enabled: true, options: { fallbackPlacements: ['bottom', 'top', 'left', 'right'] } },
      { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8, altAxis: true, tether: true } },
    ],
  }), []);

  // === Refresh data with skeleton every time ===
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
      const [standardsRes, depsRes] = await Promise.all([
        fetch(`${API_BASE}/api/standards`, { signal }),
        fetch(`${API_BASE}/api/departments`, { signal }),
      ]);
      if (!standardsRes.ok || !depsRes.ok) throw new Error('HTTP error');

      let standards = await standardsRes.json();
      let deps = await depsRes.json();

      if ((user?.role || '').toLowerCase() === 'user') {
        standards = (standards || []).filter(s => Number(s.assigned_department_id) === Number(user.department_id));
        deps = (deps || []).filter(d => Number(d.department_id) === Number(user.department_id));
      }

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

  /* ===== Helpers for import / validation ===== */
  const stripHidden = (s='') =>
    String(s).replace(/\u200f|\u200e|\ufeff/g, '').replace(/\u00A0/g, ' ').trim();

  const normalizeHeaderKey = (k='') => stripHidden(k);

  const HEADER_ALIASES = {
    'رقم المعيار': ['رقم المعيار','رقم','المعيار','standard number','standard no','std no','standard_number'],
    'اسم المعيار': ['اسم المعيار','اسم','standard name','standard_name','name'],
    'الهدف': ['الهدف','هدف','goal'],
    'متطلبات التطبيق': ['متطلبات التطبيق','متطلبات','requirements','reqs','standard requirements'],
    'الجهة': ['الجهة','الإدارة','القسم','department','assigned department'],
    'مستندات الإثبات': ['مستندات الإثبات','الاثباتات','أدلة','proofs','evidence','attachments']
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
      if (foundIndex !== -1) lookup.set(canon, originalKeys[foundIndex]);
    }
    return lookup;
  };

  const getCell = (row, headerMap, canonKey) => {
    const actual = headerMap.get(canonKey);
    return stripHidden(row[actual] ?? '');
  };

  const normalizeDigits = (str = '') => {
    const map = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'8','۸':'8','۹':'9' };
    return String(str).replace(/[٠-٩۰-۹]/g, ch => map[ch] || ch);
  };
  const normalizeStandardNumber = (raw = '') => normalizeDigits(raw).replace(/[٫۔]/g, '.').replace(/\s+/g, '');
  const STD_RE = /^[0-9\u0660-\u0669\u06F0-\u06F9]+[.\u066B\u06D4][0-9\u0660-\u0669\u06F0-\u06F9]+[.\u066B\u06D4][0-9\u0660-\u0669\u06F9]+$/u;

  const parseProofs = (raw = '') => {
    const txt = String(raw).replace(/،/g, ',');
    const parts = txt.match(/(?:\\.|[^,])+/g) || [];
    return parts.map(s => s.replace(/\\,/g, ',').trim()).filter(Boolean);
  };

  const escapeCommas = (str) => String(str).replace(/[,،]/g, '\\,');

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

  // Sorting
  const sortedData = useMemo(() => {
    if (sortDir === 'none' || !sortKey) return filteredData;
    const val = (item) => {
      if (sortKey === 'department')     return (item?.department?.department_name || '').toLowerCase();
      if (sortKey === 'created_at')     return new Date(item?.created_at || 0).getTime();
      if (sortKey === 'standard_number')return (item?.standard_number || '').toLowerCase();
      if (sortKey === 'standard_name')  return (item?.standard_name || '').toLowerCase();
      if (sortKey === 'status')         return (item?.status || '').toLowerCase();
      return '';
    };
    const dir = sortDir === 'asc' ? 1 : -1;
    const copy = [...filteredData];
    copy.sort((a,b)=>{
      const av = val(a), bv = val(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return (a.__i ?? 0) - (b.__i ?? 0);
    });
    return copy;
  }, [filteredData, sortKey, sortDir]);

  const setSort = (key, dir='asc') => { setSortKey(key); setSortDir(dir); };
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

  const isViewer = user?.role?.toLowerCase?.() === 'user';
  const showActions = !isViewer; // <— if false, expand the two buttons

  // Columns
  const colCount = isViewer ? 6 : 8;

  // Pagination
  const isAll = pageSize === 'all';
  const numericPageSize = isAll ? (sortedData.length || 0) : Number(pageSize);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(sortedData.length / numericPageSize));
  const paginatedData = isAll
    ? sortedData
    : sortedData.slice((currentPage - 1) * numericPageSize, currentPage * numericPageSize);

  const hasPageData = paginatedData.length > 0;

  // Skeleton
  const skeletonMode = loading && useSkeleton;
  const skeletonCount = isAll ? 15 : numericPageSize;

  // Filler
  const baseRowsCount = hasPageData ? paginatedData.length : 1;
  const fillerCount = isAll ? 0 : Math.max(0, numericPageSize - baseRowsCount);

  const renderFillerRows = (count) =>
    Array.from({ length: count }).map((_, r) => (
      <tr key={`filler-${r}`} className="table-empty-row">
        {Array.from({ length: colCount }).map((__, c) => <td key={`f-${r}-${c}`} />)}
      </tr>
    ));

  // Skeleton rows/cards
  const SkeletonRow = ({ idx }) => (
    <tr key={`sk-${idx}`}>
      {!isViewer && (
        <td className="td-select">
          <span className="skel skel-icon" />
        </td>
      )}
      <td><span className="skel skel-line" style={{ width: '60%' }} /></td>
      <td><span className="skel skel-line" style={{ width: '85%' }} /></td>
      <td><span className="skel skel-line" style={{ width: '70%' }} /></td>
      <td><span className="skel skel-badge" /></td>
      <td><span className="skel skel-line" style={{ width: '40%' }} /></td>
      <td><span className="skel skel-line" style={{ width: '55%' }} /></td>
      {!isViewer && (<td><span className="skel skel-icon" /></td>)}
    </tr>
  );

  const SkeletonCard = ({ idx }) => (
    <div className="mobile-card" key={`msc-${idx}`}>
      <div className="mobile-card-header">
        <span className="skel skel-line" style={{ width: '65%' }} />
        <span className="skel skel-badge" />
      </div>
      <div className="mobile-row">
        <span className="mobile-subtle">الإدارة</span>
        <span className="skel skel-line" style={{ width: '40%' }} />
      </div>
      <div className="mobile-row">
        <span className="mobile-subtle">رقم المعيار</span>
        <span className="skel skel-line" style={{ width: '30%' }} />
      </div>
      <div className="mobile-row">
        <span className="mobile-subtle">تاريخ الإنشاء</span>
        <span className="skel skel-line" style={{ width: '30%' }} />
      </div>
      {!isViewer && (
        <div className="mobile-row" style={{ marginTop: 8 }}>
          <span className="skel skel-chip" style={{ width: '40%' }} />
          <span className="skel skel-chip" style={{ width: '30%' }} />
        </div>
      )}
    </div>
  );

  const goToPreviousPage = () => { if (!isAll && currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (!isAll && currentPage < totalPages) setCurrentPage(currentPage + 1); };

  // Export
  const exportDisabled = loading || skeletonMode || !hasLoadedOnce || filteredData.length === 0;
  const exportToExcel = () => {
    if (exportDisabled) return;
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

  const downloadTemplateExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['رقم المعيار', 'اسم المعيار', 'الهدف', 'متطلبات التطبيق', 'الجهة', 'مستندات الإثبات'],
    ]);
    ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 28 }, { wch: 28 }, { wch: 20 }, { wch: 24 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب المعايير');
    XLSX.writeFile(wb, 'قالب_المعايير.xlsx');
  };

  // Import
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
      const required = ['رقم المعيار','اسم المعيار','الهدف','متطلبات التطبيق','الجهة','مستندات الإثبات'];
      const missing = required.filter(k => !headerMap.get(k));
      if (missing.length) {
        setBanner({
          type: 'danger',
          text: `الأعمدة المطلوبة مفقودة أو غير متطابقة: ${missing.join('، ')}. تأكد من صحة العناوين أو استخدم "تحميل القالب".`
        });
        return;
      }

      const normalizeName = (name = '') => {
        const diacritics = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
        const tatweel = /\u0640/g;
        return String(name).replace(diacritics, '').replace(tatweel, '').replace(/\س+/g, ' ').trim().toLowerCase();
      };

      const deptMap = new Map(
        (departments || []).map(d => [normalizeName(d.department_name), d.department_id])
      );

      const existingNumbers = new Set(
        (data || []).map(s => normalizeStandardNumber(s.standard_number || ''))
      );
      const batchSeen = new Set();

      let ok = 0, dup = 0, fail = 0, skipped = 0;
      let unknownDeptCount = 0;
      const unknownDeptNames = new Set();

      for (const r of rows) {
        const get = (canon) => {
          const actual = headerMap.get(canon);
          return stripHidden(r[actual] ?? '');
        };

        const rawNum   = get('رقم المعيار');
        const name     = get('اسم المعيار');
        const goal     = get('الهدف');
        const reqs     = get('متطلبات التطبيق');
        const depRaw   = get('الجهة');
        const proofsRaw= get('مستندات الإثبات');

        const proofsList = parseProofs(proofsRaw);
        if (!rawNum || !name || !goal || !reqs || !depRaw || proofsList.length === 0) { skipped++; continue; }

        const isStdValid = STD_RE.test(rawNum) || STD_RE.test(rawNum.replace(/\./g, '٫'));
        const stdNumNorm = normalizeStandardNumber(rawNum);
        if (!isStdValid || !stdNumNorm) { skipped++; continue; }

        const depId = deptMap.get(normalizeName(depRaw));
        if (!Number.isInteger(depId)) { fail++; unknownDeptCount++; unknownDeptNames.add(depRaw); continue; }

        if (existingNumbers.has(stdNumNorm) || batchSeen.has(stdNumNorm)) { dup++; continue; }

        const payload = {
          standard_number: stdNumNorm,
          standard_name: name,
          standard_goal: goal,
          standard_requirments: reqs,
          assigned_department_id: depId,
          proof_required: proofsList.map(p => escapeCommas(p)).join(','),
          status: 'لم يبدأ'
        };

        const tryCreate = async () => {
          let res = await fetch(`${API_BASE}/api/standards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            const { status, ...rest } = payload;
            res = await fetch(`${API_BASE}/api/standards`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(rest)
            });
          }
          return res.ok;
        };

        try {
          const okRes = await tryCreate();
          if (okRes) { ok++; batchSeen.add(stdNumNorm); existingNumbers.add(stdNumNorm); }
          else { fail++; }
        } catch { fail++; }
      }

      let msg = `تمت المعالجة: ${ok} مضافة، ${dup} مكررة، ${skipped} غير مكتملة/غير صالحة، ${fail} فشلت`;
      if (unknownDeptCount > 0) {
        const examples = Array.from(unknownDeptNames).slice(0, 3).join('، ');
        msg += ` (جهة غير معروفة: ${unknownDeptCount}${examples ? ` — مثل: ${examples}` : ''})`;
      }
      msg += '.';

      setBanner({ type: 'success', text: msg });
      await refreshData();
    } catch {
      setBanner({
        type: 'danger',
        text: 'تعذر قراءة الملف. تأكد من أن البيانات في الورقة الأولى وأن الأعمدة مسماة بشكل صحيح. جرّب "تحميل القالب".'
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ===== Selection / Bulk delete ===== */
  const pageIds = useMemo(() => paginatedData.map(r => r?.standard_id).filter(Boolean), [paginatedData]);
  const pageSelectedCount = pageIds.reduce((acc, id) => acc + (selectedIds.has(id) ? 1 : 0), 0);
  const pageAllSelected = !loading && pageIds.length > 0 && pageSelectedCount === pageIds.length;
  const anySelected = selectedIds.size > 0;

  useEffect(() => {
    if (headerCbRef.current) {
      headerCbRef.current.indeterminate = pageSelectedCount > 0 && !pageAllSelected;
    }
  }, [pageSelectedCount, pageAllSelected]);

  const setSelectForIds = (ids, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => { if (checked) next.add(id); else next.delete(id); });
      return next;
    });
  };

  const togglePageAll = (checked) => setSelectForIds(pageIds, checked);

  const toggleOne = (id, pageIndex, e) => {
    const checked = e.target.checked;
    if (e.shiftKey && lastPageIndexRef.current != null) {
      const a = Math.min(lastPageIndexRef.current, pageIndex);
      const b = Math.max(lastPageIndexRef.current, pageIndex);
      const idsInRange = paginatedData.slice(a, b + 1).map(r => r?.standard_id).filter(Boolean);
      setSelectForIds(idsInRange, checked);
    } else {
      setSelectForIds([id], checked);
    }
    lastPageIndexRef.current = pageIndex;
  };

  const selectAllResults = () => {
    const all = sortedData.map(r => r?.standard_id).filter(Boolean);
    setSelectedIds(new Set(all));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const openBulkDelete = () => setShowBulkDelete(true);
  const closeBulkDelete = () => setShowBulkDelete(false);

  const tryBatchEndpoint = async (ids) => {
    try {
      const res = await fetch(`${API_BASE}/api/standards/batch-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      return res.ok;
    } catch { return false; }
  };

  const deleteManyFallback = async (ids) => {
    const CONCURRENCY = 6;
    let cursor = 0;
    let ok = 0, failed = 0;

    const worker = async () => {
      while (cursor < ids.length) {
        const id = ids[cursor++];
        try {
          const res = await fetch(`${API_BASE}/api/standards/${id}`, { method: 'DELETE' });
          if (res.ok) ok++; else failed++;
        } catch { failed++; }
      }
    };

    const jobs = Array.from({ length: Math.min(CONCURRENCY, ids.length) }, () => worker());
    await Promise.all(jobs);
    return { ok, failed };
  };

  const performBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const batchOk = await tryBatchEndpoint(ids);
    if (batchOk) {
      setBanner({ type: 'success', text: `تم حذف ${ids.length} معيارًا بنجاح.` });
      closeBulkDelete();
      clearSelection();
      await refreshData();
      return;
    }

    const res = await deleteManyFallback(ids);
    closeBulkDelete();
    clearSelection();
    await refreshData();

    if (res.failed === 0) {
      setBanner({ type: 'success', text: `تم حذف ${ids.length} معيارًا بنجاح.` });
    } else {
      setBanner({ type: 'warning', text: `تم الحذف: ${res.ok} | فشل: ${res.failed}` });
    }
  };

  // Role limits in modal
  const isUserRole = user?.role?.toLowerCase?.() === 'user';

  /* ===== Mobile card ===== */
  const MobileCard = ({ item, idx }) => {
    const id = item.standard_id;
    const checked = selectedIds.has(id);
    return (
      <div className="mobile-card" key={id}>
        <div className="mobile-card-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {!isViewer && (
              <input
                type="checkbox"
                className="form-check-input m-0"
                checked={checked}
                onChange={(e) => toggleOne(id, idx, e)}
                aria-label="تحديد"
              />
            )}
            <div>
              <div className="mobile-title">{item.standard_name}</div>
              <div className="mobile-subtle">رقم: {item.standard_number}</div>
            </div>
          </div>
          <span className={`badge bg-${getStatusClass(item.status)}`} style={{ whiteSpace:'nowrap' }}>
            {item.status}
          </span>
        </div>

        <div className="mobile-row">
          <span className="mobile-subtle">الإدارة</span>
          <span className="mobile-chip">{item.department?.department_name || '—'}</span>
        </div>

        <div className="mobile-row">
          <span className="mobile-subtle">تاريخ الإنشاء</span>
          <span className="mobile-chip">{new Date(item.created_at).toLocaleDateString('ar-SA')}</span>
        </div>

        {/* If only one button for viewer, make it full width (already handled) */}
        <div className="s-actions" style={isViewer ? { gridTemplateColumns: '1fr' } : undefined}>
          <button
            className="btn btn-primary s-btn"
            onClick={(e) => { e.preventDefault(); setModalItem(item); setShowModal(true); }}
            title="إظهار التفاصيل"
            aria-label="إظهار التفاصيل"
          >
            <i className="fas fa-eye ms-1" />
            إظهار
          </button>

          {!isViewer && (
            <button
              className="btn btn-success s-btn"
              onClick={() => navigate(`/standards_edit/${item.standard_id}`)}
              title="تعديل"
              aria-label="تعديل"
            >
              <i className="fas fa-pen ms-1" />
              تعديل
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <LocalTheme />
      <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif', backgroundColor: '#f6f8fb' }} className="min-vh-100 d-flex flex-column">
        <Header />

        {banner.type && (
          <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
            <div className={`alert alert-${banner.type} mb-0`} role="alert">{banner.text}</div>
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
                  <div className="col-12 col-xl-11 d-flex flex-column">
                    <div className="table-card" aria-busy={loading}>
                      {/* ===== Header ===== */}
                      <div className="head-flat">
                        {/* Desktop header (unchanged) */}
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
                              {/* Sort (desktop) */}
                              <Dropdown align="end">
                                <Dropdown.Toggle size="sm" variant="outline-secondary">ترتيب</Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount>
                                  <Dropdown.Header>حسب التاريخ</Dropdown.Header>
                                  <Dropdown.Item onClick={() => setSort('created_at','desc')} active={sortKey==='created_at' && sortDir==='desc'}>الأحدث أولًا</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('created_at','asc')}  active={sortKey==='created_at' && sortDir==='asc'}>الأقدم أولًا</Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Header>حقول أخرى</Dropdown.Header>
                                  <Dropdown.Item onClick={() => setSort('standard_name','asc')}  active={sortKey==='standard_name' && sortDir==='asc'}>الاسم (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('standard_name','desc')} active={sortKey==='standard_name' && sortDir==='desc'}>الاسم (ي-أ)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('standard_number','asc')} active={sortKey==='standard_number' && sortDir==='asc'}>رقم المعيار (تصاعدي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('standard_number','desc')} active={sortKey==='standard_number' && sortDir==='desc'}>رقم المعيار (تنازلي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('department','asc')} active={sortKey==='department' && sortDir==='asc'}>الإدارة (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('department','desc')} active={sortKey==='department' && sortDir==='desc'}>الإدارة (ي-أ)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('status','asc')} active={sortKey==='status' && sortDir==='asc'}>الحالة (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('status','desc')} active={sortKey==='status' && sortDir==='desc'}>الحالة (ي-أ)</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>

                              {/* Filters (desktop) */}
                              <Dropdown autoClose="outside" align="end">
                                <Dropdown.Toggle size="sm" variant="outline-secondary">تصفية</Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount popperConfig={dropdownPopper} style={{ maxHeight: 360, overflowY: 'auto' }}>
                                  <Dropdown.Header>الحالة</Dropdown.Header>
                                  {uniqueStatuses.map((status, idx) => (
                                    <label key={`st-${idx}`} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
                                      <input type="checkbox" className="form-check-input m-0" checked={statusFilter.includes(status)} onChange={() => handleCheckboxFilter(status, statusFilter, setStatusFilter)} />
                                      <span className="form-check-label">{status}</span>
                                    </label>
                                  ))}
                                  <Dropdown.Divider />
                                  <Dropdown.Header>الإدارة</Dropdown.Header>
                                  {uniqueDepartments.map((dep, idx) => (
                                    <label key={`dep-${idx}`} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
                                      <input className="form-check-input m-0" type="checkbox" checked={departmentFilter.includes(dep)} onChange={() => handleCheckboxFilter(dep, departmentFilter, setDepartmentFilter)} />
                                      <span className="form-check-label">{dep}</span>
                                    </label>
                                  ))}
                                  {!uniqueStatuses.length && !uniqueDepartments.length && <div className="dropdown-item text-muted small">لا توجد عوامل تصفية</div>}
                                </Dropdown.Menu>
                              </Dropdown>

                              <Link className="btn btn-outline-success btn-sm" to="/standards_create">إضافة معيار</Link>

                              {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                                <>
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={exportToExcel}
                                    disabled={exportDisabled}
                                    title={exportDisabled ? 'التصدير متاح بعد اكتمال التحميل ووجود نتائج' : 'تصدير Excel'}
                                    aria-disabled={exportDisabled}
                                  >
                                    <i className="fas fa-file-excel ms-1" /> تصدير Excel
                                  </button>

                                  <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                                    {importing ? (<><span className="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true" /> جارِ الاستيراد</>) : (<><i className="fas fa-file-upload ms-1" /> استيراد Excel</>)}
                                  </button>

                                  <OverlayTrigger placement="bottom" delay={{ show: 200, hide: 100 }} overlay={popTemplateHelp} popperConfig={dropdownPopper} trigger={['hover','focus']}>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={downloadTemplateExcel}>
                                      <i className="fas fa-download ms-1" /> تحميل القالب
                                    </button>
                                  </OverlayTrigger>
                                </>
                              )}

                              <div className="d-flex align-items-center gap-2">
                                {!skeletonMode && <small className="text-muted">النتائج: {filteredData.length.toLocaleString('ar-SA')}</small>}
                                <button
                                  className="btn btn-outline-primary btn-sm btn-update"
                                  onClick={refreshData}
                                  title="تحديث"
                                  disabled={loading}
                                  aria-busy={loading}
                                >
                                  {loading ? <span className="spinner-border spinner-border-sm ms-1" /> : <i className="fas fa-rotate-right" />} تحديث
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Mobile header */}
                        {isMobile && (
                          <div className="m-stack">
                            <input
                              className="form-control form-control-sm search-input"
                              type="search"
                              placeholder="بحث..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            {/* NOTE: if showActions === false, use cols-2 to expand the two buttons */}
                            <div className={`m-toolbar ${showActions ? '' : 'cols-2'}`}>
                              {/* Sort */}
                              <Dropdown align="start">
                                <Dropdown.Toggle size="sm" variant="outline-secondary" className="m-btn">
                                  <i className="fas fa-sort ms-1" /> فرز
                                </Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount className="m-menu" popperConfig={dropdownPopper}>
                                  <Dropdown.Header>حسب التاريخ</Dropdown.Header>
                                  <Dropdown.Item onClick={() => setSort('created_at','desc')} active={sortKey==='created_at' && sortDir==='desc'}>الأحدث أولًا</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('created_at','asc')}  active={sortKey==='created_at' && sortDir==='asc'}>الأقدم أولًا</Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Header>حقول أخرى</Dropdown.Header>
                                  <Dropdown.Item onClick={() => setSort('standard_name','asc')}  active={sortKey==='standard_name' && sortDir==='asc'}>الاسم (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('standard_name','desc')} active={sortKey==='standard_name' && sortDir==='desc'}>الاسم (ي-أ)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('standard_number','asc')} active={sortKey==='standard_number' && sortDir==='asc'}>رقم المعيار (تصاعدي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('standard_number','desc')} active={sortKey==='standard_number' && sortDir==='desc'}>رقم المعيار (تنازلي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('department','asc')} active={sortKey==='department' && sortDir==='asc'}>الإدارة (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('department','desc')} active={sortKey==='department' && sortDir==='desc'}>الإدارة (ي-أ)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('status','asc')} active={sortKey==='status' && sortDir==='asc'}>الحالة (أ-ي)</Dropdown.Item>
                                  <Dropdown.Item onClick={() => setSort('status','desc')} active={sortKey==='status' && sortDir==='desc'}>الحالة (ي-أ)</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>

                              {/* Filters */}
                              <Dropdown autoClose="outside" align="start">
                                <Dropdown.Toggle size="sm" variant="outline-secondary" className="m-btn">
                                  <i className="fas fa-filter ms-1" /> تصفية
                                </Dropdown.Toggle>
                                <Dropdown.Menu renderOnMount className="m-menu" popperConfig={dropdownPopper}>
                                  <Dropdown.Header>الحالة</Dropdown.Header>
                                  {uniqueStatuses.map((status, idx) => (
                                    <label key={`mst-${idx}`} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
                                      <input type="checkbox" className="form-check-input m-0" checked={statusFilter.includes(status)} onChange={() => handleCheckboxFilter(status, statusFilter, setStatusFilter)} />
                                      <span className="form-check-label">{status}</span>
                                    </label>
                                  ))}
                                  <Dropdown.Divider />
                                  <Dropdown.Header>الإدارة</Dropdown.Header>
                                  {uniqueDepartments.map((dep, idx) => (
                                    <label key={`mdep-${idx}`} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
                                      <input className="form-check-input m-0" type="checkbox" checked={departmentFilter.includes(dep)} onChange={() => handleCheckboxFilter(dep, departmentFilter, setDepartmentFilter)} />
                                      <span className="form-check-label">{dep}</span>
                                    </label>
                                  ))}
                                  {!uniqueStatuses.length && !uniqueDepartments.length && <div className="dropdown-item text-muted small">لا توجد عوامل تصفية</div>}
                                </Dropdown.Menu>
                              </Dropdown>

                              {/* Actions — HIDDEN for user role on mobile */}
                              {showActions && (
                                <Dropdown align="start">
                                  <Dropdown.Toggle size="sm" variant="outline-secondary" className="m-btn">
                                    <i className="fas fa-wand-magic-sparkles ms-1" /> إجراءات
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu renderOnMount className="m-menu" popperConfig={dropdownPopper}>
                                    <Dropdown.Item as={Link} to="/standards_create"><i className="fas fa-square-plus ms-1" /> إضافة معيار</Dropdown.Item>
                                    {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                                      <>
                                        <Dropdown.Item onClick={exportToExcel} disabled={exportDisabled}><i className="fas fa-file-excel ms-1" /> تصدير Excel</Dropdown.Item>
                                        <Dropdown.Item onClick={() => fileInputRef.current?.click()} disabled={importing}><i className="fas fa-file-upload ms-1" /> {importing ? 'جارِ الاستيراد…' : 'استيراد Excel'}</Dropdown.Item>
                                        <Dropdown.Item onClick={downloadTemplateExcel}><i className="fas fa-download ms-1" /> تحميل القالب</Dropdown.Item>
                                      </>
                                    )}
                                  </Dropdown.Menu>
                                </Dropdown>
                              )}
                            </div>

                            <div className="meta-row">
                              {(!loading || !useSkeleton) ? (
                                <small className="text-muted">النتائج: {filteredData.length.toLocaleString('ar-SA')}</small>
                              ) : <span className="skel skel-line" style={{ width: 80 }} />}
                              <button className="btn btn-outline-primary btn-sm" onClick={refreshData} disabled={loading} aria-busy={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm ms-1" /> : <i className="fas fa-rotate-right" />} تحديث
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Selection bar (unchanged) */}
                      {(!isViewer && anySelected) && (
                        <div className="selection-bar d-flex flex-wrap align-items-center justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <strong>{selectedIds.size.toLocaleString('ar-SA')}</strong>
                            <span className="text-muted">عنصر/عناصر محددة</span>
                            {pageAllSelected && selectedIds.size < sortedData.length && (
                              <button className="btn btn-link p-0" onClick={selectAllResults}>
                                تحديد كل النتائج ({sortedData.length.toLocaleString('ar-SA')})
                              </button>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <button className="btn btn-danger btn-sm" onClick={openBulkDelete}>
                              <i className="fas fa-trash-can ms-1" /> حذف المحدد
                            </button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={clearSelection}>
                              مسح التحديد
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ===== Content: Cards (mobile) / Table (desktop) ===== */}
                      {isMobile ? (
                        <div className="mobile-list">
                          {skeletonMode ? (
                            Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} idx={i} />)
                          ) : hasPageData ? (
                            paginatedData.map((item, idx) => (
                              <MobileCard key={item.standard_id} item={item} idx={idx} />
                            ))
                          ) : (
                            <div className="text-muted text-center py-3">لا توجد نتائج</div>
                          )}
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover text-center align-middle">
                            <thead>
                              <tr>
                                {!isViewer && (
                                  <th className="th-select">
                                    <div className="d-flex justify-content-center align-items-center">
                                      <input
                                        ref={headerCbRef}
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={pageAllSelected}
                                        onChange={(e) => togglePageAll(e.target.checked)}
                                        title="تحديد/إلغاء تحديد عناصر الصفحة"
                                        disabled={skeletonMode}
                                      />
                                    </div>
                                  </th>
                                )}
                                <th className="th-num">
                                  <button type="button" className="th-sort" onClick={() => toggleSort('standard_number')} disabled={skeletonMode}>
                                    رقم المعيار{sortIcon('standard_number')}
                                  </button>
                                </th>
                                <th className="th-name">
                                  <button type="button" className="th-sort" onClick={() => toggleSort('standard_name')} disabled={skeletonMode}>
                                    اسم المعيار{sortIcon('standard_name')}
                                  </button>
                                </th>
                                <th className="th-dept">
                                  <button type="button" className="th-sort" onClick={() => toggleSort('department')} disabled={skeletonMode}>
                                    الإدارة{sortIcon('department')}
                                  </button>
                                </th>
                                <th className="th-status">
                                  <button type="button" className="th-sort" onClick={() => toggleSort('status')} disabled={skeletonMode}>
                                    حالة المعيار{sortIcon('status')}
                                  </button>
                                </th>
                                <th>تفاصيل</th>
                                <th className="th-date">
                                  <button type="button" className="th-sort" onClick={() => toggleSort('created_at')} disabled={skeletonMode}>
                                    تاريخ الإنشاء{sortIcon('created_at')}
                                  </button>
                                </th>
                                {user?.role?.toLowerCase?.() !== 'user' && <th className="th-icon">تعديل</th>}
                              </tr>
                            </thead>

                            <tbody>
                              {skeletonMode ? (
                                Array.from({ length: skeletonCount }).map((_, i) => <SkeletonRow key={i} idx={i} />)
                              ) : hasPageData ? (
                                paginatedData.map((item, idx) => {
                                  const id = item.standard_id;
                                  const checked = selectedIds.has(id);
                                  return (
                                    <tr key={id}>
                                      {!isViewer && (
                                        <td className="td-select">
                                          <div className="form-check d-flex justify-content-center align-items-center m-0" style={{ minHeight: '1.5rem' }}>
                                            <input
                                              type="checkbox"
                                              className="form-check-input"
                                              checked={checked}
                                              onChange={(e) => toggleOne(id, idx, e)}
                                            />
                                          </div>
                                        </td>
                                      )}
                                      <td>{item.standard_number}</td>
                                      <td className="text-primary">{item.standard_name}</td>
                                      <td>{item.department?.department_name}</td>
                                      <td><span className={`badge bg-${getStatusClass(item.status)}`}>{item.status}</span></td>
                                      <td>
                                        <button
                                          className="btn btn-link p-0 text-primary"
                                          onClick={(e) => { e.preventDefault(); setModalItem(item); setShowModal(true); }}
                                        >
                                          إظهار
                                        </button>
                                      </td>
                                      <td>{new Date(item.created_at).toLocaleDateString('ar-SA')}</td>
                                      {user?.role?.toLowerCase?.() !== 'user' && (
                                        <td>
                                          <button
                                            className="btn btn-link p-0 text-success"
                                            onClick={() => navigate(`/standards_edit/${item.standard_id}`)}
                                          >
                                            <i className="fas fa-pen" />
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })
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

                      {/* Footer (unchanged) */}
                      <div className="foot-flat d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div className="d-inline-flex align-items-center gap-2">
                          <Dropdown align="start" flip={isMobile}>
                            <Dropdown.Toggle size="sm" variant="outline-secondary">
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
        style={{ position:'absolute', width:0, height:0, opacity:0, pointerEvents:'none' }}
        onChange={(e) => handleExcelImport(e.target.files?.[0])}
      />

      <StandardModal
        show={showModal}
        onHide={() => setShowModal(false)}
        standardId={modalItem?.standard_id}
        canUpload={!(isUserRole && modalItem?.status === 'معتمد')}
        canDeleteFiles={!(isUserRole && modalItem?.status === 'معتمد')}
        onUpdated={refreshData}
      />

      <DeleteModal
        show={showBulkDelete}
        onHide={closeBulkDelete}
        onConfirm={performBulkDelete}
        subject={`حذف ${selectedIds.size} معيار`}
        requireCount={selectedIds.size}
      />
    </>
  );
}
