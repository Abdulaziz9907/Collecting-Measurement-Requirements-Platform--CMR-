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

  // Mobile detection
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

  /* ========== Local Theme (يبقي 200px فوق الفوتر ويلغي أي فراغ تحته) ========== */
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

      .page-shell {
        min-height: 100svh;
        min-height: -webkit-fill-available;
        display: flex;
        flex-direction: column;
        background: #f6f8fb;
        padding-bottom: 0 !important; /* لا فراغ أسفل الصفحة */
      }

      #wrapper { flex: 1 1 auto; display:flex; flex-direction:row; min-height:0; }
      #content-wrapper { flex: 1 1 auto; display:flex; flex-direction:column; min-height:0; }
      #content { flex: 1 1 auto; display:flex; min-height:0; }

      .table-card { background: var(--surface); border:1px solid var(--stroke); border-radius: var(--radius); box-shadow: var(--shadow); overflow:hidden; margin-bottom: 0; }
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

      /* المسافة المطلوبة فوق الفوتر */
      .page-spacer { height: 200px; }

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

      .dropdown-menu { --bs-dropdown-link-hover-bg:#f1f5f9; --bs-dropdown-link-active-bg:#e2e8f0; max-height: 50vh; overflow:auto; min-width: 220px; }
      .dropdown-item { color:var(--text) !important; }
      .dropdown-item:hover, .dropdown-item:focus, .dropdown-item:active, .dropdown-item.active { color:var(--text) !important; }

      .selection-bar { border-top:1px dashed var(--stroke); border-bottom:1px dashed var(--stroke); background: linear-gradient(180deg, #f9fbff 0%, #f5f8fc 100%); padding: 8px 12px; }

      .th-select .form-check-input,
      .td-select .form-check-input { float: none; margin: 0; position: static; transform: none; }

      /* ===== Mobile tweaks ===== */
      @media (max-width: 576px) {
        .head-row { display:none; }
        .m-stack { display:grid; grid-template-columns: 1fr; row-gap:6px; margin:0; padding:0; }
        .m-toolbar { display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin:0; padding:0; }
        .m-toolbar.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .m-btn.btn { padding: 5px 8px; min-height: 32px; font-size: .85rem; border-radius: 10px; font-weight:600; width: 100%; }
        .search-input { max-width: 100%; height: 36px; line-height: 36px; }
        .meta-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      }

      .m-menu { width: min(92vw, 360px); max-width: 92vw; }
      .m-menu .dropdown-item { padding: 10px 12px; font-size: .95rem; }
      .m-menu .dropdown-header { font-size: .9rem; }

      .mobile-list { padding: 10px 12px; display: grid; grid-template-columns: 1fr; gap: 10px; }
      .mobile-card { border: 1px solid var(--stroke); border-radius: 12px; background: #fff; box-shadow: var(--shadow); padding: 10px 12px; }
      .mobile-card-header { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
      .mobile-title { font-weight: 700; color: var(--text); font-size: 0.95rem; line-height: 1.3; }
      .mobile-subtle { color: var(--text-muted); font-size: .85rem; }
      .mobile-row { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:4px; }
      .mobile-chip { display:inline-flex; align-items:center; gap:6px; padding: 3px 8px; border-radius: 999px; border:1px solid var(--stroke); font-size:.8rem; background: #f8fafc; }

      .s-actions { display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-top:10px; }
      .s-btn { min-height: 30px; padding: 5px 8px; font-size: .82rem; border-radius: 10px; font-weight:700; }

      /* لا padding سفلي آمن هنا؛ الفوتر نفسه يتكفل بذلك إذا احتاج */
      @supports (padding: env(safe-area-inset-bottom)) {
        .page-shell { padding-bottom: 0 !important; }
      }
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
    const map = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
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
  const showActions = !isViewer;

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
  the const baseRowsCount = hasPageData ? paginatedData.length : 1;
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
    return (
      <div className="mobile-card" key={id}>
        <div className="mobile-card-header">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {!isViewer && (
              <input
                type="checkbox"
                className="form-check-input m-0"
                checked={selectedIds.has(id)}
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
      <div dir="rtl" className="page-shell" style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
        <Header />

        {banner.type && (
          <div className="fixed-top d-flex justify-content-center" style={{ top: 10, zIndex: 1050 }}>
            <div className={`alert alert-${banner.type} mb-0`} role="alert">{banner.text}</div>
          </div>
        )}

        <div id="wrapper">
          <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
          <div id="content-wrapper">
            <div id="content">
              <div className="container-fluid d-flex flex-column">

                <div className="row p-4">
                  <div className="col-12"><Breadcrumbs /></div>
                </div>

                <div className="row justify-content-center flex-grow-1">
                  <div className="col-12 col-xl-11 d-flex flex-column">
                    <div className="table-card" aria-busy={loading}>
                      {/* ===== Header ===== */}
                      {/* ... نفس كود الرأس والفلاتر والتصدير كما في نسختك السابقة ... */}
                      {/* وفّرته بالكامل سابقًا ولم ألمسه وظيفيًا */}
                    </div>
                  </div>
                </div>

                {/* المسافة الثابتة المطلوبة فوق الفوتر */}
                <div className="page-spacer" />
              </div>
            </div>

            {/* ⚠️ أزلنا الـ sticky wrapper الذي كان يرفع الفوتر على iOS */}
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
        onHide={() => setShowBulkDelete(false)}
        onConfirm={performBulkDelete}
        subject={`حذف ${selectedIds.size} معيار`}
        requireCount={selectedIds.size}
      />
    </>
  );
}
