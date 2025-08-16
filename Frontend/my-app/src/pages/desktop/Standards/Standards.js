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

export default function Standards() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useSkeleton, setUseSkeleton] = useState(true); // ← نبقيه true في كل refresh
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // NEW: تحسّس عرض الشاشة لضبط سلوك القوائم على الجوال
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

  // Modal (تفاصيل + سياسة رفع/حذف المرفقات)
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  // حذف جماعي فقط (تم إزالة الحذف الفردي)
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // فرز
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('none');

  // استيراد/تنزيل القالب + بانر
  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState({ type: null, text: '' });
  const fileInputRef = useRef(null);

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);
  const navigate = useNavigate();

  // الصفحة
  const PAGE_OPTIONS = [15, 25, 50, 'all'];
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // حماية من الوميض + تزامن
  const LOAD_MIN_MS = 450;
  const SPINNER_MIN_MS = 200; // محجوز لو احتجته لاحقًا
  const abortRef = useRef(null);
  const loadSeqRef = useRef(0);

  // اختيار صفحة + مدى Shift
  const headerCbRef = useRef(null);
  const lastPageIndexRef = useRef(null);

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
      .th-select { width: 42px; text-align:center; }
      .td-select { width: 42px; text-align:center; }

      .th-num    { min-width: 96px; }
      .th-name   { min-width: 220px; }
      .th-dept   { min-width: 160px; }
      .th-status { min-width: 110px; }
      .th-det    { min-width: 90px;  }
      .th-date   { min-width: 140px; }
      .th-icon   { width: 60px; }

      .table td, .table th { vertical-align: middle; }

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

      .selection-bar{
        border-top:1px dashed var(--stroke);
        border-bottom:1px dashed var(--stroke);
        background: linear-gradient(180deg, #f9fbff 0%, #f5f8fc 100%);
        padding: 8px 12px;
      }

      .th-select .form-check-input,
      .td-select .form-check-input {
        float: none;
        margin: 0;
        position: static;
        transform: none;
      }
    `}</style>
  );

  /* === Popover يشبه الأمثلة المطلوبة === */
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

  // إخفاء البانر تلقائيًا
  useEffect(() => {
    if (!banner.type) return;
    const t = setTimeout(() => setBanner({ type: null, text: '' }), 10000);
    return () => clearTimeout(t);
  }, [banner.type]);

  // Popper config للقوائم المنسدلة/Popover — يسمح بالـ flip ويمنع الخروج عن الشاشة
  const dropdownPopper = useMemo(() => ({
    strategy: 'fixed',
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      { name: 'flip', enabled: true, options: { fallbackPlacements: ['bottom', 'top', 'left', 'right'] } },
      { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8, altAxis: true, tether: true } },
    ],
  }), []);

  // === refreshData: نظهر السكيلتون في كل refresh ===
  const refreshData = async (mode = 'skeleton') => {
    setUseSkeleton(true);          // نظهر السكيلتون دائمًا أثناء التحميل
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
      const minWait = LOAD_MIN_MS; 
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

  useEffect(() => {
    refreshData('skeleton');
    return () => abortRef.current?.abort();
    // eslint-disable-next-line
  }, [API_BASE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, pageSize, sortKey, sortDir]);

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
    String(s)
      .replace(/\u200f|\u200e|\ufeff/g, '')
      .replace(/\u00A0/g, ' ')
      .trim();

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

  const normalizeDigits = (str = '') => {
    const map = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
    return String(str).replace(/[٠-٩۰-۹]/g, ch => map[ch] || ch);
  };
  const normalizeStandardNumber = (raw = '') => normalizeDigits(raw).replace(/[٫۔]/g, '.').replace(/\s+/g, '');
  const STD_RE = /^[0-9\u0660-\u0669\u06F0-\u06F9]+[.\u066B\u06D4][0-9\u0660-\u0669\u06F0-\u06F9]+[.\u066B\u06D4][0-9\u0660-\u0669\u06F9]+$/u;

  const normalizeName = (name = '') => {
    const diacritics = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
    const tatweel = /\u0640/g;
    return String(name).replace(diacritics, '').replace(tatweel, '').replace(/\s+/g, ' ').trim().toLowerCase();
  };

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

  const isViewer = user?.role?.toLowerCase?.() === 'user';

  // عدد الأعمدة بعد إزالة عمود الحذف
  const colCount = isViewer ? 6 : 8;

  const isAll = pageSize === 'all';
  const numericPageSize = isAll ? (sortedData.length || 0) : Number(pageSize);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(sortedData.length / numericPageSize));
  const paginatedData = isAll
    ? sortedData
    : sortedData.slice((currentPage - 1) * numericPageSize, currentPage * numericPageSize);

  const hasPageData = paginatedData.length > 0;

  // === Skeleton control
  const skeletonMode = loading && useSkeleton;
  const skeletonCount = isAll ? 15 : numericPageSize;

  // === Filler rows when NOT loading
  const baseRowsCount = hasPageData ? paginatedData.length : 1; // واحد لصف "لا توجد نتائج"
  const fillerCount = isAll ? 0 : Math.max(0, numericPageSize - baseRowsCount);

  const renderFillerRows = (count) =>
    Array.from({ length: count }).map((_, r) => (
      <tr key={`filler-${r}`} className="table-empty-row">
        {Array.from({ length: colCount }).map((__, c) => <td key={`f-${r}-${c}`} />)}
      </tr>
    ));

  // skeleton row
  const SkeletonRow = ({ idx }) => (
    <tr key={`sk-${idx}`}>
      {!isViewer && <td className="td-select"><span className="skel skel-icon" /></td>}
      <td><span className="skel skel-line" style={{ width: '60%' }} /></td>
      <td><span className="skel skel-line" style={{ width: '85%' }} /></td>
      <td><span className="skel skel-line" style={{ width: '70%' }} /></td>
      <td><span className="skel skel-badge" /></td>
      <td><span className="skel skel-link" /></td>
      <td><span className="skel skel-line" style={{ width: '55%' }} /></td>
      {!isViewer && <td><span className="skel skel-icon" /></td>}
    </tr>
  );

  const goToPreviousPage = () => { if (!isAll && currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (!isAll && currentPage < totalPages) setCurrentPage(currentPage + 1); };

  // PREVENT EXPORT WHILE LOADING
  const exportToExcel = () => {
    if (loading) return; // حراسة إضافية
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

  const downloadTemplateExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['رقم المعيار', 'اسم المعيار', 'الهدف', 'متطلبات التطبيق', 'الجهة', 'مستندات الإثبات'],
    ]);
    ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 28 }, { wch: 28 }, { wch: 20 }, { wch: 24 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب المعايير');
    XLSX.writeFile(wb, 'قالب_المعايير.xlsx');
  };

  /* ===== Import ===== */
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
        const rawNum   = getCell(r, headerMap, 'رقم المعيار');
        const name     = getCell(r, headerMap, 'اسم المعيار');
        const goal     = getCell(r, headerMap, 'الهدف');
        const reqs     = getCell(r, headerMap, 'متطلبات التطبيق');
        const depRaw   = getCell(r, headerMap, 'الجهة');
        const proofsRaw= getCell(r, headerMap, 'مستندات الإثبات');

        const proofsList = parseProofs(proofsRaw);
        if (!rawNum || !name || !goal || !reqs || !depRaw || proofsList.length === 0) {
          skipped++;
          continue;
        }

        const isStdValid = STD_RE.test(rawNum) || STD_RE.test(rawNum.replace(/\./g, '٫'));
        const stdNumNorm = normalizeStandardNumber(rawNum);
        if (!isStdValid || !stdNumNorm) { skipped++; continue; }

        const depId = deptMap.get(normalizeName(depRaw));
        if (!Number.isInteger(depId)) {
          fail++;
          unknownDeptCount++;
          unknownDeptNames.add(depRaw);
          continue;
        }

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
          if (okRes) {
            ok++;
            batchSeen.add(stdNumNorm);
            existingNumbers.add(stdNumNorm);
          } else {
            fail++;
          }
        } catch {
          fail++;
        }
      }

      let msg = `تمت المعالجة: ${ok} مضافة، ${dup} مكررة، ${skipped} غير مكتملة/غير صالحة، ${fail} فشلت`;
      if (unknownDeptCount > 0) {
        const examples = Array.from(unknownDeptNames).slice(0, 3).join('، ');
        msg += ` (جهة غير معروفة: ${unknownDeptCount}${examples ? ` — مثل: ${examples}` : ''})`;
      }
      msg += '.';

      setBanner({ type: 'success', text: msg });
      await refreshData('skeleton'); // ← سكيلتون بعد الاستيراد
    } catch (e) {
      setBanner({
        type: 'danger',
        text: 'تعذر قراءة الملف. تأكد من أن البيانات في الورقة الأولى وأن الأعمدة مسماة بشكل صحيح. جرّب "تحميل القالب".'
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ===== اختيار جماعي وحذف جماعي ===== */
  const pageIds = useMemo(() => paginatedData.map(r => r?.standard_id).filter(Boolean), [paginatedData]);
  const pageSelectedCount = pageIds.reduce((acc, id) => acc + (selectedIds.has(id) ? 1 : 0), 0);
  const pageAllSelected = !loading && pageIds.length > 0 && pageSelectedCount === pageIds.length;
  const anySelected = selectedIds.size > 0;

  // header checkbox indeterminate
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
      await refreshData('skeleton'); // ← سكيلتون بعد الحذف
      return;
    }

    const res = await deleteManyFallback(ids);
    closeBulkDelete();
    clearSelection();
    await refreshData('skeleton'); // ← سكيلتون بعد الحذف

    if (res.failed === 0) {
      setBanner({ type: 'success', text: `تم حذف ${ids.length} معيارًا بنجاح.` });
    } else {
      setBanner({ type: 'warning', text: `تم الحذف: ${res.ok} | فشل: ${res.failed}` });
    }
  };

  // حساب صلاحية رفع/حذف المرفقات داخل المودال (USER + حالة معتمد = ممنوع)
  const isUserRole = user?.role?.toLowerCase?.() === 'user';
  const modalUploadsAllowed = !(isUserRole && modalItem?.status === 'معتمد');

  return (
    <>
      <LocalTheme />
      <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif', backgroundColor: '#f6f8fb', minHeight: '100vh' }}>
        <Header />

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
                  <div className="col-12 col-xl-11">
                    <div className="table-card" aria-busy={loading}>
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
                              {/* الحالة */}
                              <Dropdown autoClose="outside" align={isMobile ? 'start' : 'end'} flip={isMobile}>
                                <Dropdown.Toggle size="sm" variant="outline-secondary">الحالة</Dropdown.Toggle>
                                <Dropdown.Menu
                                  renderOnMount
                                  popperConfig={dropdownPopper}
                                  style={{ maxWidth: 'calc(100vw - 2rem)' }}
                                >
                                  {uniqueStatuses.map((status, idx) => (
                                    <label key={idx} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
                                      <input type="checkbox" className="form-check-input m-0" checked={statusFilter.includes(status)} onChange={() => handleCheckboxFilter(status, statusFilter, setStatusFilter)} />
                                      <span className="form-check-label">{status}</span>
                                    </label>
                                  ))}
                                </Dropdown.Menu>
                              </Dropdown>

                              {/* الإدارة */}
                              <Dropdown autoClose="outside" align={isMobile ? 'start' : 'end'} flip={isMobile}>
                                <Dropdown.Toggle size="sm" variant="outline-secondary">الإدارة</Dropdown.Toggle>
                                <Dropdown.Menu
                                  renderOnMount
                                  popperConfig={dropdownPopper}
                                  style={{
                                    maxHeight: isMobile ? '60vh' : 320,
                                    overflowY: 'auto',
                                    maxWidth: 'calc(100vw - 2rem)'
                                  }}
                                >
                                  {uniqueDepartments.map((dep, idx) => (
                                    <label key={idx} className="dropdown-item d-flex align-items-center gap-2 m-0" onClick={(e) => e.stopPropagation()}>
                                      <input className="form-check-input m-0" type="checkbox" checked={departmentFilter.includes(dep)} onChange={() => handleCheckboxFilter(dep, departmentFilter, setDepartmentFilter)} />
                                      <span className="form-check-label">{dep}</span>
                                    </label>
                                  ))}
                                </Dropdown.Menu>
                              </Dropdown>

                              <Link className="btn btn-outline-success btn-sm" to="/standards_create">إضافة معيار</Link>

                              {/* تصدير Excel — مع تعطيل أثناء التحميل */}
                              {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={exportToExcel}
                                  disabled={loading || skeletonMode}
                                  title={loading ? 'جاري التحميل… انتظر حتى يكتمل لتمكين التصدير' : 'تصدير Excel'}
                                  aria-disabled={loading || skeletonMode}
                                >
                                  <i className="fas fa-file-excel ms-1" /> تصدير Excel
                                </button>
                              )}

                              {['admin','administrator'].includes(user?.role?.toLowerCase?.()) && (
                                <>
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

                                  {/* زر تحميل القالب مع Popover — على الجوال يعمل بالنقر */}
                                  <OverlayTrigger
                                    placement="bottom"
                                    delay={{ show: 200, hide: 100 }}
                                    overlay={popTemplateHelp}
                                    popperConfig={dropdownPopper}
                                    trigger={isMobile ? ['click'] : ['hover', 'focus']}
                                  >
                                    <button className="btn btn-outline-secondary btn-sm" onClick={downloadTemplateExcel}>
                                      <i className="fas fa-download ms-1" /> تحميل القالب
                                    </button>
                                  </OverlayTrigger>
                                </>
                              )}
                            </>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          {(!loading || !useSkeleton) && (
                            <small className="text-muted">النتائج: {filteredData.length.toLocaleString('ar-SA')}</small>
                          )}
                          <button
                            className="btn btn-outline-primary btn-sm btn-update"
                            onClick={() => refreshData('skeleton')}
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

                      {/* شريط التحديد */}
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
                              <th className="th-det">تفاصيل</th>
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

                            {/* صفوف الحشو — فقط عند عدم التحميل */}
                            {!skeletonMode && renderFillerRows(fillerCount)}
                          </tbody>
                        </table>
                      </div>

                      <div className="foot-flat d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div className="d-inline-flex align-items-center gap-2">
                          <Dropdown align="start" flip={isMobile}>
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

      {/* تفاصيل المعيار — نمرر onUpdated ليعمل refresh مع سكيلتون */}
      <StandardModal
        show={showModal}
        onHide={() => setShowModal(false)}
        standardId={modalItem?.standard_id}
        canUpload={!(user?.role?.toLowerCase?.() === 'user' && modalItem?.status === 'معتمد')}
        canDeleteFiles={!(user?.role?.toLowerCase?.() === 'user' && modalItem?.status === 'معتمد')}
        onUpdated={() => refreshData('skeleton')}
      />

      {/* حذف جماعي فقط + يتطلب كتابة عدد العناصر المحددة */}
      <DeleteModal
        show={showBulkDelete}
        onHide={closeBulkDelete}
        onConfirm={performBulkDelete}
        subject={`حذف ${selectedIds.size} معيار`}
        requireCount={selectedIds.size}   // يدعم الأرقام العربية
      />
    </>
  );
}
