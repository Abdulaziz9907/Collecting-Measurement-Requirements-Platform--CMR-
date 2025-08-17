import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, OverlayTrigger, Popover } from 'react-bootstrap';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import * as XLSX from 'xlsx';
import Footer from '../../../components/Footer.jsx';
import { getStoredUser } from '../../../utils/auth';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Report() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [monthlyProgress, setMonthlyProgress] = useState([]);
  const [users, setUsers] = useState([]);
  const [standardsRaw, setStandardsRaw] = useState([]);

  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  const [progressMode, setProgressMode] = useState('completedPlusApproved');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [totals, setTotals] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    underWork: 0,
    notStarted: 0,
  });

  const [sortKey, setSortKey] = useState('progressRate');
  const [sortDir, setSortDir] = useState('desc');

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const USERS_ENDPOINT = `${API_BASE}/api/users`;
  const user = useMemo(() => getStoredUser(), []);
  const abortRef = useRef(null);

  const LOAD_MIN_MS = 450;
  const loadSeqRef = useRef(0);

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
      .surface { background: var(--surface); border: 1px solid var(--stroke); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
      .surface.allow-overflow { overflow: visible; }
      .head-flat {
        padding: 12px 16px; background: var(--surface-muted); border-bottom: 1px solid var(--stroke);
        color: var(--text); font-weight: 700; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
        border-top-left-radius: var(--radius); border-top-right-radius: var(--radius);
      }
      .head-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
      .body-flat { padding: 16px; }
      .muted { color: var(--text-muted); }

      .grid-cards { display:grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap:12px; }
      @media (max-width:1200px){ .grid-cards{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      @media (max-width:576px){ .grid-cards{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      .stat-card { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px 12px; border-radius: calc(var(--radius) - 2px); color:#fff; text-align:center; min-height:92px; box-shadow: 0 8px 18px rgba(0,0,0,.08); }
      .stat-value { margin:0 0 4px; font-weight:800; font-size:1.35rem; letter-spacing:.2px; }
      .stat-title { font-size:.9rem; opacity:.95; }

      .skeleton { position:relative; overflow:hidden; background:var(--skeleton-bg); border-radius: calc(var(--radius) - 2px); }
      .skeleton::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%); animation:shimmer var(--skeleton-speed) infinite; }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .skeleton::after { animation: none; } }
      .skeleton-card { height:92px; }
      .skeleton-block { height: 280px; }

      .chart-wrap-md { height: 280px; }
      .chart-wrap-lg { height: 300px; }
      .chart-wrap-taller { height: 340px; } /* taller for pie/users cards */

      .legend-inline { position:absolute; top:8px; inset-inline-start:12px; display:flex; gap:8px; flex-wrap:wrap; }
      .legend-chip { display:inline-flex; align-items:center; gap:6px; font-size:.72rem; color: var(--text); }
      .legend-chip .dot { width:8px; height:8px; border-radius:999px; display:inline-block; }

      .stats-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:12px; }
      @media (max-width:576px){ .stats-grid{ grid-template-columns: 1fr; } }
      .mini-stat { border:1px solid var(--stroke); border-radius:12px; padding:12px; background:#fff; display:flex; align-items:center; gap:10px; height:100%; }
      .mini-icon { width:36px; height:36px; border-radius:8px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#0b2440; }

      .table-card { background: var(--surface); border:1px solid var(--stroke); border-radius: var(--radius); box-shadow: var(--shadow); overflow:hidden; }
      .table-card .head { padding:12px 16px; border-bottom:1px solid var(--stroke); background: var(--surface-muted); display:flex; justify-content:space-between; align-items:center; font-weight:700; }
      .table-card .body { padding: 16px 16px 0; }
      .table thead th { cursor: pointer; white-space: nowrap; }

      .dropdown-menu { --bs-dropdown-link-hover-bg: #f1f5f9; --bs-dropdown-link-active-bg: #e2e8f0; }
      .dropdown-item { color: var(--text) !important; }
      .dropdown-item:hover, .dropdown-item:focus, .dropdown-item:active, .dropdown-item.active { color: var(--text) !important; }

      .popover { border-radius: 14px; border: 1px solid var(--stroke); box-shadow: 0 14px 32px rgba(16,24,40,.14); max-width: 320px; }
      .popover-header { background: linear-gradient(180deg, #fbfdff 0%, #f6f8fb 100%); border-bottom: 1px solid var(--stroke); font-weight: 800; color: var(--text); }
      .popover-body { color: var(--text); }
    `}</style>
  );

  const normalizeStr = (v) => (v ?? '').toString().trim().toLowerCase();
  const statusToKey = (raw) => {
    const s = normalizeStr(raw);
    if (['مكتمل', 'مكتملة', 'completed', 'complete', 'done'].includes(s)) return 'completed';
    if (['معتمد', 'معتمدة', 'approved', 'approve'].includes(s)) return 'approved';
    if (['غير معتمد', 'غير معتمدة', 'rejected', 'not approved', 'declined', 'رفض'].includes(s)) return 'rejected';
    if (['تحت العمل', 'قيد العمل', 'under work', 'in progress', 'ongoing', 'progress'].includes(s)) return 'underWork';
    if (['لم يبدأ', 'لم تبدا', 'not started', 'new', 'pending'].includes(s)) return 'notStarted';
    return null;
  };
  const STATUS_LABEL = {
    completed: 'مكتمل',
    approved: 'معتمد',
    rejected: 'غير معتمد',
    underWork: 'تحت العمل',
    notStarted: 'لم يبدأ',
  };
  const STATUS_COLOR = {
    completed: '#17a2b8',
    approved: '#198754',
    rejected: '#dc3545',
    underWork: '#ffc107',
    notStarted: '#6c757d',
  };
  const KPI_COLOR = { total: '#0d6efd', ...STATUS_COLOR };
  const fmt = (n) => Number(n || 0).toLocaleString('ar-SA');

  const hijriFormat = (date) => {
    if (!date) return '';
    const primary = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      dateStyle: 'long',
      timeStyle: 'short',
      hour12: true,
      timeZone: 'Asia/Riyadh',
    });
    const cal = primary.resolvedOptions().calendar || '';
    const fmtDt = cal.includes('islamic-umalqura')
      ? primary
      : new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
          dateStyle: 'long',
          timeStyle: 'short',
          hour12: true,
          timeZone: 'Asia/Riyadh',
        });
    return fmtDt.format(date);
  };

  const depIdToName = useMemo(() => {
    const m = new Map();
    (departments || []).forEach((d) => m.set(Number(d.department_id), d.department_name));
    return m;
  }, [departments]);

  const getRole = (u) =>
    (u?.role ?? u?.user_role ?? u?.account_type ?? u?.type ?? '').toString().trim();

  const isManagementAccount = (u) => getRole(u).toLowerCase() === 'management';
  const isUserAccount = (u) => getRole(u).toLowerCase() === 'user';

  const loadData = async () => {
    loadSeqRef.current += 1;
    const seq = loadSeqRef.current;

    setLoading(true);
    setError('');
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const t0 = performance.now();

    try {
      const [standardsRes, depsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/standards`, { signal: abortRef.current.signal }),
        fetch(`${API_BASE}/api/departments`, { signal: abortRef.current.signal }),
        fetch(USERS_ENDPOINT, { signal: abortRef.current.signal }).catch(() => ({ ok: false })),
      ]);
      if (!standardsRes.ok || !depsRes.ok) throw new Error('HTTP error');

      const standards = await standardsRes.json();
      const deps = await depsRes.json();
      const usersJson = usersRes && usersRes.ok ? await usersRes.json() : [];

      setDepartments(deps || []);
      setUsers(Array.isArray(usersJson) ? usersJson : []);

      const filtered = (standards || []).filter((s) =>
        user?.role?.toLowerCase() === 'user'
          ? Number(s.assigned_department_id) === Number(user.department_id)
          : true
      );
      setStandardsRaw(filtered);

      const totalCounts = { approved: 0, rejected: 0, completed: 0, underWork: 0, notStarted: 0 };

      const perDept = (deps || []).map((dep) => {
        const depId = Number(dep.department_id);
        const rows = filtered.filter((s) => Number(s.assigned_department_id) === depId);
        const counts = { approved: 0, rejected: 0, completed: 0, underWork: 0, notStarted: 0 };
        for (const s of rows) {
          const key = statusToKey(s.status);
          if (key && counts[key] !== undefined) counts[key] += 1;
        }
        const total = rows.length;
        const numerator =
          progressMode === 'approvedOnly'
            ? counts.approved
            : counts.completed + counts.approved;
        const progressRate = total > 0 ? Math.round((numerator / total) * 100) : 0;
        for (const k of Object.keys(counts)) totalCounts[k] += counts[k];

        return {
          department: dep.department_name?.trim() || `الإدارة #${depId}`,
          department_id: depId,
          total,
          progressRate,
          remaining: Math.max(0, total - (counts.completed + counts.approved)),
          ...counts,
        };
      });

      setTotals({ total: filtered.length, ...totalCounts });

      const monthly = {};
      for (const s of filtered) {
        const created = new Date(s.created_at);
        if (isNaN(created)) continue;
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = (monthly[key] || 0) + 1;
      }
      const sortedKeys = Object.keys(monthly).sort();
      setMonthlyProgress(sortedKeys.map((m) => ({ month: m, count: monthly[m] })));

      setDeptStats(perDept);
      setLastUpdated(new Date());
      setHasLoadedOnce(true);
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError('تعذر تحميل البيانات. حاول مرة أخرى.');
        setHasLoadedOnce(true);
      }
    } finally {
      const elapsed = performance.now() - t0;
      const finish = () => {
        if (loadSeqRef.current === seq) setLoading(false);
      };
      if (elapsed < LOAD_MIN_MS) setTimeout(finish, LOAD_MIN_MS - elapsed);
      else finish();
    }
  };

  useEffect(() => {
    loadData();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE, progressMode]);

  const visibleDeptList = useMemo(() => {
    const q = deptSearch.trim().toLowerCase();
    const base = (departments || []).map((d) => d.department_name);
    if (!q) return base;
    return base.filter((name) => name?.toLowerCase().includes(q));
  }, [departments, deptSearch]);

  const filteredStats =
    selectedDepartments.length === 0
      ? deptStats
      : deptStats.filter((d) => selectedDepartments.includes(d.department));

  const sortedStats = useMemo(() => {
    const list = [...filteredStats];
    list.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va === vb) return 0;
      const cmp = va > vb ? 1 : -1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredStats, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const summaryData = useMemo(() => {
    if (selectedDepartments.length === 0) {
      return [
        { key: 'total', title: 'مجموع المعايير', value: totals.total },
        { key: 'completed', title: 'معايير مكتملة', value: totals.completed },
        { key: 'approved', title: 'معايير معتمدة', value: totals.approved },
        { key: 'rejected', title: 'معايير غير معتمدة', value: totals.rejected },
        { key: 'underWork', title: 'تحت العمل', value: totals.underWork },
        { key: 'notStarted', title: 'لم يبدأ', value: totals.notStarted },
      ];
    }
    const combined = { total: 0, completed: 0, approved: 0, rejected: 0, underWork: 0, notStarted: 0 };
    filteredStats.forEach((d) => {
      combined.total += d.total;
      combined.completed += d.completed;
      combined.approved += d.approved;
      combined.rejected += d.rejected;
      combined.underWork += d.underWork;
      combined.notStarted += d.notStarted;
    });
    return [
      { key: 'total', title: 'مجموع المعايير', value: combined.total },
      { key: 'completed', title: 'معايير مكتملة', value: combined.completed },
      { key: 'approved', title: 'معايير معتمدة', value: combined.approved },
      { key: 'rejected', title: 'معايير غير معتمدة', value: combined.rejected },
      { key: 'underWork', title: 'تحت العمل', value: combined.underWork },
      { key: 'notStarted', title: 'لم يبدأ', value: combined.notStarted },
    ];
  }, [totals, filteredStats, selectedDepartments.length]);

  const statusPieData = useMemo(() => {
    const items = summaryData.filter((s) => s.key !== 'total');
    return {
      labels: items.map((s) => s.title),
      datasets: [{ data: items.map((s) => s.value), backgroundColor: items.map((s) => KPI_COLOR[s.key]), borderWidth: 0 }],
    };
  }, [summaryData]);

  const progressBarData = {
    labels: sortedStats.map((d) => d.department),
    datasets: [{ label: 'نسبة الإنجاز', data: sortedStats.map((d) => d.progressRate), backgroundColor: '#4F7689', borderWidth: 0 }],
  };
  const stackedData = {
    labels: sortedStats.map((d) => d.department),
    datasets: ['completed', 'approved', 'underWork', 'notStarted', 'rejected'].map((k) => ({
      label: STATUS_LABEL[k],
      data: sortedStats.map((d) => d[k]),
      backgroundColor: STATUS_COLOR[k],
      borderWidth: 0,
      stack: 'status',
    })),
  };
  const lineChartData = {
    labels: monthlyProgress.map((p) => p.month),
    datasets: [{ label: 'المعايير المُضافة شهرياً', data: monthlyProgress.map((p) => p.count), fill: true, borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.12)', tension: 0.35 }],
  };

  const usersByDept = useMemo(() => {
    const map = new Map();
    for (const u of users || []) {
      const depId = Number(u?.department_id ?? u?.dept_id ?? u?.departmentId ?? -1);
      if (!map.has(depId)) map.set(depId, 0);
      map.set(depId, map.get(depId) + 1);
    }
    return map;
  }, [users]);

  const totalUsers = users?.length || 0;
  const totalDepartments = (departments || []).length || 0;
  const managementAccountsCount = (users || []).filter(isManagementAccount).length;
  const usersAccountsCount = (users || []).filter(isUserAccount).length;

  const excelCol = (n) => {
    let s = '';
    n++;
    while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
    return s;
  };

  const riyadhNow = () => new Date();
  const formatGregorian = (d) =>
    new Intl.DateTimeFormat('ar-SA', { dateStyle: 'full', timeStyle: 'medium', hour12: true, timeZone: 'Asia/Riyadh' }).format(d);
  const formatGregorianFile = (d) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(d).reduce((a, p) => (a[p.type] = p.value, a), {});
    const yyyy = parts.year, MM = parts.month, DD = parts.day, HH = parts.hour, mm = parts.minute, ss = parts.second;
    return `${yyyy}-${MM}-${DD}_${HH}-${mm}-${ss}`;
  };

  const exportToExcel = () => {
    if (loading) return;

    const now = riyadhNow();
    const gDate = formatGregorian(now);
    const hDate = hijriFormat(now);
    const selectedDeptsLabel = selectedDepartments.length === 0 ? 'كل الإدارات' : selectedDepartments.join(', ');
    const progressModeLabel = progressMode === 'approvedOnly' ? 'معتمد فقط' : 'مكتمل + معتمد';

    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: 'تقرير الإدارات',
      Subject: 'لوحة التقارير',
      Author: (user && (user.fullName || user.name || user.username)) || 'CMR',
      CreatedDate: now
    };

    const metaAOA = [
      ['تقرير الإدارات'],
      ['تاريخ ووقت التصدير (ميلادي)', gDate],
      ['تاريخ ووقت التصدير (هجري)', hDate],
      ['وضع حساب التقدم', progressModeLabel],
      ['الإدارات المُختارة', selectedDeptsLabel],
      ['آخر تحديث للبيانات داخل النظام', lastUpdated ? formatGregorian(lastUpdated) : '—'],
      ['إجمالي المعايير', totals.total],
      ['مكتمل', totals.completed],
      ['معتمد', totals.approved],
      ['تحت العمل', totals.underWork],
      ['لم يبدأ', totals.notStarted],
      ['غير معتمد', totals.rejected],
    ];
    const wsMeta = XLSX.utils.aoa_to_sheet(metaAOA);
    wsMeta['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    wsMeta['!cols'] = [{ wch: 28 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsMeta, 'تفاصيل التصدير');

    const deptHeader = ['الإدارة','المجموع','مكتمل','معتمد','تحت العمل','لم يبدأ','غير معتمد','المتبقي','نسبة التقدم (%)'];
    const deptAOA = [deptHeader];
    sortedStats.forEach((d, i) => {
      const r = i + 2;
      deptAOA.push([
        d.department,
        d.total,
        d.completed,
        d.approved,
        d.underWork,
        d.notStarted,
        { f: `MAX(0,B${r}-(C${r}+D${r}))`, t: 'n' },
        { f: `IF(B${r}=0,0,ROUND(((C${r}+D${r})/B${r})*100,0))`, t: 'n' },
      ]);
    });
    const wsDept = XLSX.utils.aoa_to_sheet(deptAOA);
    wsDept['!cols'] = [{ wch: 36 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 18 }];
    wsDept['!autofilter'] = { ref: `A1:${excelCol(deptHeader.length - 1)}${deptAOA.length}` };
    XLSX.utils.book_append_sheet(wb, wsDept, 'الإدارات (تفصيلي)');

    const headersStd = [
      'ID','العنوان/الاسم','الحالة (أصلي)','الحالة (موحدة)','الإدارة (ID)','الإدارة',
      'تاريخ الإنشاء (UTC)','تاريخ الإنشاء (الرياض)','آخر تحديث (UTC)','آخر تحديث (الرياض)','الوصف'
    ];
    const isDeptSelected = selectedDepartments.length > 0;
    const stdRows = [];
    for (const s of standardsRaw) {
      const depId = Number(s.assigned_department_id);
      const depName = depIdToName.get(depId) || `الإدارة #${depId}`;
      if (isDeptSelected && !selectedDepartments.includes(depName)) continue;

      const id = s.standard_id ?? s.id ?? s.standardId ?? '';
      const title = s.title ?? s.name ?? s.standard_title ?? s.standard_name ?? '';
      const statusOriginal = s.status ?? '';
      const key = statusToKey(statusOriginal);
      const statusUnified = key ? STATUS_LABEL[key] : '';
      const createdUTC = s.created_at ? new Date(s.created_at) : null;
      const updatedUTC = s.updated_at ? new Date(s.updated_at) : null;
      const createdRiyadh = createdUTC ? formatGregorian(createdUTC) : '';
      const updatedRiyadh = updatedUTC ? formatGregorian(updatedUTC) : '';
      const desc = s.description ?? s.notes ?? '';

      stdRows.push([
        id, title, statusOriginal, statusUnified, depId, depName,
        createdUTC ? new Date(createdUTC).toISOString() : '',
        createdRiyadh,
        updatedUTC ? new Date(updatedUTC).toISOString() : '',
        updatedRiyadh,
        desc
      ]);
    }
    const wsStd = XLSX.utils.aoa_to_sheet([headersStd, ...stdRows]);
    wsStd['!cols'] = [
      { wch: 10 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 28 },
      { wch: 24 }, { wch: 28 }, { wch: 24 }, { wch: 28 }, { wch: 50 }
    ];
    wsStd['!autofilter'] = { ref: `A1:${excelCol(headersStd.length - 1)}${stdRows.length + 1}` };
    XLSX.utils.book_append_sheet(wb, wsStd, 'المعايير (كاملة)');

    const headersUsers = ['ID','الاسم','اسم المستخدم','البريد','الدور','الإدارة (ID)','الإدارة'];
    const userRows = (users || []).map((u) => {
      const depId = Number(u?.department_id ?? u?.dept_id ?? u?.departmentId ?? -1);
      const depName = depIdToName.get(depId) || (depId > 0 ? `الإدارة #${depId}` : '');
      return [
        u.user_id ?? u.id ?? '',
        u.fullName ?? u.name ?? '',
        u.username ?? '',
        u.email ?? u.mail ?? '',
        getRole(u),
        depId > 0 ? depId : '',
        depName
      ];
    });
    const wsUsers = XLSX.utils.aoa_to_sheet([headersUsers, ...userRows]);
    wsUsers['!cols'] = [{ wch: 10 }, { wch: 26 }, { wch: 20 }, { wch: 32 }, { wch: 18 }, { wch: 12 }, { wch: 28 }];
    wsUsers['!autofilter'] = { ref: `A1:${excelCol(headersUsers.length - 1)}${userRows.length + 1}` };
    XLSX.utils.book_append_sheet(wb, wsUsers, 'المستخدمون (كامل)');

    const headersMonthly = ['الشهر (YYYY-MM)', 'عدد المعايير المُضافة'];
    const monthlyRows = (monthlyProgress || []).map((m) => [m.month, m.count]);
    const wsMonthly = XLSX.utils.aoa_to_sheet([headersMonthly, ...monthlyRows]);
    wsMonthly['!cols'] = [{ wch: 18 }, { wch: 20 }];
    wsMonthly['!autofilter'] = { ref: `A1:${excelCol(headersMonthly.length - 1)}${monthlyRows.length + 1}` };
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'الزمن الشهري');

    const fileTs = formatGregorianFile(now);
    XLSX.writeFile(wb, `تقرير_الإدارات_${fileTs}.xlsx`);
  };

  const popApprovedOnly = (
    <Popover id="pop-approved-only" dir="rtl">
      <Popover.Header as="h6">وضع “معتمد فقط”</Popover.Header>
      <Popover.Body>
        <div className="small text-muted mb-2">
          الصيغة: <code>نسبة التقدم = (عدد المعايير المعتمدة ÷ إجمالي المعايير) × 100</code>
        </div>
        <ul className="mb-0 ps-3">
          <li>يُحتسب فقط ما تم اعتماده رسميًا.</li>
          <li>المعايير المكتملة لا تُحتسب ضمن النسبة.</li>
          <li>مفيد لرصد الإنجاز الفعلي.</li>
        </ul>
      </Popover.Body>
    </Popover>
  );

  const popCompletedPlusApproved = (
    <Popover id="pop-completed-plus-approved" dir="rtl">
      <Popover.Header as="h6">وضع “مكتمل + معتمد”</Popover.Header>
      <Popover.Body>
        <div className="small text-muted mb-2">
          الصيغة: <code>نسبة التقدم = ((المكتملة + المعتمدة) ÷ إجمالي المعايير) × 100</code>
        </div>
        <ul className="mb-0 ps-3">
          <li>يشمل المعايير المكتملة حتى لو لم تُعتمد بعد.</li>
          <li>مفيد لرصد الإنجاز المتوقع قبل الاعتماد الرسمي.</li>
        </ul>
      </Popover.Body>
    </Popover>
  );

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
                  <div className="col-12">
                    <Breadcrumbs />
                  </div>
                </div>

                <div className="row justify-content-center">
                  <div className="col-12 col-xl-10">
                    <div className="surface allow-overflow mb-4" aria-busy={loading}>
                      <div className="head-flat">
                        <div className="d-flex flex-column">
                          <span>لوحة التقارير</span>
                          <small className="muted">
                            {lastUpdated ? ` آخر تحديث: ${hijriFormat(lastUpdated)}` : 'جاري التحميل...'}
                          </small>
                        </div>

                        <div className="head-actions">
                          <Dropdown autoClose="outside" align="end" flip={false}>
                            <Dropdown.Toggle variant="outline-secondary" size="sm">
                              {selectedDepartments.length === 0
                                ? 'كل الإدارات'
                                : `الإدارات المختارة: ${selectedDepartments.length}`}
                            </Dropdown.Toggle>
                            <Dropdown.Menu
                              style={{ minWidth: 320 }}
                              renderOnMount
                              popperConfig={{ strategy: 'fixed', modifiers: [{ name: 'offset', options: { offset: [0, 8] } }, { name: 'flip', enabled: false }] }}
                            >
                              <li className="px-3 pt-2 pb-1">
                                <input
                                  type="search"
                                  className="form-control form-control-sm"
                                  placeholder="بحث عن إدارة..."
                                  value={deptSearch}
                                  onChange={(e) => setDeptSearch(e.target.value)}
                                />
                              </li>
                              <li className="d-flex justify-content-between px-3 pb-2">
                                <button className="btn btn-link p-0" onClick={() => setSelectedDepartments(visibleDeptList)}>تحديد الكل</button>
                                <button className="btn btn-link p-0" onClick={() => setSelectedDepartments([])}>مسح الاختيار</button>
                              </li>
                              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                <Dropdown.Item as="button" className="d-flex align-items-center gap-2" onClick={() => setSelectedDepartments([])}>
                                  <input className="form-check-input ms-2" type="checkbox" checked={selectedDepartments.length === 0} readOnly />
                                  <span>كل الإدارات</span>
                                </Dropdown.Item>
                                {visibleDeptList.map((name) => {
                                  const checked = selectedDepartments.includes(name);
                                  return (
                                    <Dropdown.Item
                                      key={name}
                                      as="button"
                                      className="d-flex align-items-center gap-2"
                                      onClick={() => {
                                        setSelectedDepartments(prev => checked ? prev.filter(d => d !== name) : [...prev, name]);
                                      }}
                                    >
                                      <input className="form-check-input ms-2" type="checkbox" checked={checked} readOnly />
                                      <span>{name}</span>
                                    </Dropdown.Item>
                                  );
                                })}
                              </div>
                            </Dropdown.Menu>
                          </Dropdown>

                          <div className="d-inline-flex align-items-center gap-2">
                            <OverlayTrigger placement="bottom" delay={{ show: 120, hide: 80 }} overlay={popApprovedOnly}>
                              <button
                                type="button"
                                className={`btn btn-outline-secondary btn-sm ${progressMode === 'approvedOnly' ? 'active' : ''}`}
                                onClick={() => setProgressMode('approvedOnly')}
                              >
                                معتمد فقط
                              </button>
                            </OverlayTrigger>
                            <OverlayTrigger placement="bottom" delay={{ show: 120, hide: 80 }} overlay={popCompletedPlusApproved}>
                              <button
                                type="button"
                                className={`btn btn-outline-secondary btn-sm ${progressMode === 'completedPlusApproved' ? 'active' : ''}`}
                                onClick={() => setProgressMode('completedPlusApproved')}
                              >
                                مكتمل + معتمد
                              </button>
                            </OverlayTrigger>
                          </div>

                          {['admin', 'administrator'].includes(user?.role?.toLowerCase?.()) && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={exportToExcel}
                              title="تصدير Excel (XLSX)"
                              disabled={loading}
                              aria-disabled={loading}
                            >
                              <i className="fas fa-file-excel ms-1" /> تصدير Excel
                            </button>
                          )}
                          <button
                            className="btn btn-outline-primary btn-sm btn-update"
                            onClick={loadData}
                            title="تحديث البيانات"
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

                      <div className="body-flat">
                        {loading ? (
                          <div className="grid-cards mb-3" aria-hidden={!loading}>
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="skeleton skeleton-card" />
                            ))}
                          </div>
                        ) : error ? null : (
                          <div className="grid-cards mb-3">
                            {summaryData.map((kpi) => (
                              <div key={kpi.key} className="stat-card" style={{ backgroundColor: KPI_COLOR[kpi.key] }}>
                                <h5 className="stat-value">{fmt(kpi.value)}</h5>
                                <div className="stat-title">{kpi.title}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row justify-content-center g-4">
                  <div className="col-12 col-xl-5">
                    <div className="surface" aria-busy={loading}>
                      <div className="head-flat">نسبة تقدم الإدارات</div>
                      <div className="body-flat position-relative">
                        {loading ? (
                          <div className="skeleton skeleton-block" />
                        ) : error ? (
                          <div className="text-center py-4 text-danger">{error}</div>
                        ) : (
                          <div className="chart-wrap-md">
                            <Bar
                              data={progressBarData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                indexAxis: 'y',
                                scales: {
                                  x: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` }, grid: { display: false }, title: { display: true, text: 'نسبة التقدم (%)' } },
                                  y: { grid: { display: false } },
                                },
                                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.x}%` } } },
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-xl-5">
                    <div className="surface" aria-busy={loading}>
                      <div className="head-flat">توزيع الحالات حسب الإدارة</div>
                      <div className="body-flat position-relative">
                        {loading ? (
                          <div className="skeleton skeleton-block" />
                        ) : error ? (
                          <div className="text-center py-4 text-danger">{error}</div>
                        ) : (
                          <>
                            <div className="legend-inline">
                              {Object.entries(STATUS_LABEL).map(([k, label]) => (
                                <span key={k} className="legend-chip">
                                  <span className="dot" style={{ backgroundColor: STATUS_COLOR[k] }} />
                                  {label}
                                </span>
                              ))}
                            </div>
                            <div className="chart-wrap-md">
                              <Bar
                                data={stackedData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  indexAxis: 'y',
                                  scales: {
                                    x: { stacked: true, grid: { display: false } },
                                    y: { stacked: true, grid: { display: false } },
                                  },
                                  plugins: { legend: { display: false } },
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row justify-content-center g-4 mt-1">
                  <div className="col-12 col-xl-10">
                    <div className="surface" aria-busy={loading}>
                      <div className="head-flat">المعايير المُضافة شهرياً</div>
                      <div className="body-flat">
                        {loading ? (
                          <div className="skeleton skeleton-block" style={{ height: 300 }} />
                        ) : error ? (
                          <div className="text-center py-4 text-danger">{error}</div>
                        ) : (
                          <div className="chart-wrap-lg">
                            <Line
                              data={lineChartData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { drawBorder: false } } },
                                plugins: { legend: { display: false } },
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row justify-content-center g-4 mt-1">
                  <div className="col-12 col-xl-5">
                    <div className="surface" aria-busy={loading}>
                      <div className="head-flat">توزيع حالات المعايير</div>
                      <div className="body-flat">
                        {loading ? (
                          <div className="skeleton skeleton-block" style={{ height: 340 }} />
                        ) : error ? (
                          <div className="text-center py-4 text-danger">{error}</div>
                        ) : (
                          <div className="chart-wrap-md chart-wrap-taller">
                            <Pie
                              data={statusPieData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom' } },
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-xl-5">
                    <div className="surface" aria-busy={loading}>
                      <div className="head-flat">إحصائيات المستخدمين والإدارات</div>
                      <div className="body-flat">
                        {loading ? (
                          <div className="skeleton skeleton-block" style={{ height: 340 }} />
                        ) : (
                          <div className="chart-wrap-md chart-wrap-taller d-flex align-items-center">
                            <div className="w-100">
                              <div className="stats-grid">
                                <div className="mini-stat">
                                  <div className="mini-icon"><i className="fas fa-users" /></div>
                                  <div>
                                    <div className="fw-bold">إجمالي المستخدمين</div>
                                    <div className="text-muted">{fmt(totalUsers)}</div>
                                  </div>
                                </div>
                                <div className="mini-stat">
                                  <div className="mini-icon"><i className="fas fa-sitemap" /></div>
                                  <div>
                                    <div className="fw-bold">إجمالي الإدارات</div>
                                    <div className="text-muted">{fmt(totalDepartments)}</div>
                                  </div>
                                </div>
                                <div className="mini-stat">
                                  <div className="mini-icon"><i className="fas fa-user-shield" /></div>
                                  <div>
                                    <div className="fw-bold">إجمالي حسابات ممثلين الإدارات</div>
                                    <div className="text-muted">{fmt(usersAccountsCount)}</div>
                                  </div>
                                </div>
                                <div className="mini-stat">
                                  <div className="mini-icon"><i className="fas fa-crown" /></div>
                                  <div>
                                    <div className="fw-bold">إجمالي حسابات الإدارة العليا</div>
                                    <div className="text-muted">{fmt(managementAccountsCount)}</div>
                                  </div>
                                </div>
                              </div>
                              {users.length === 0 && (
                                <small className="text-muted d-block mt-2">* لم يتم العثور على بيانات مستخدمين. تأكد من مسار API.</small>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row justify-content-center g-4 mt-1 mb-5">
                  <div className="col-12 col-xl-10">
                    <div className="table-card" aria-busy={loading}>
                      <div className="head-flat">
                        <div>ملخص </div>
                      </div>
                      <div className="body">
                        {loading ? (
                          <div className="p-3" aria-hidden={!loading}>
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div key={i} className="skeleton skeleton-table-row" />
                            ))}
                          </div>
                        ) : error ? (
                          <div className="text-center py-4 text-danger">{error}</div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                              <thead>
                                <tr>
                                  <th onClick={() => toggleSort('department')}>الإدارة</th>
                                  <th onClick={() => toggleSort('total')}>المجموع</th>
                                  <th onClick={() => toggleSort('completed')}>{STATUS_LABEL.completed}</th>
                                  <th onClick={() => toggleSort('approved')}>{STATUS_LABEL.approved}</th>
                                  <th onClick={() => toggleSort('underWork')}>{STATUS_LABEL.underWork}</th>
                                  <th onClick={() => toggleSort('notStarted')}>{STATUS_LABEL.notStarted}</th>
                                  <th onClick={() => toggleSort('rejected')}>{STATUS_LABEL.rejected}</th>
                                  <th onClick={() => toggleSort('progressRate')}>نسبة التقدم</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedStats.length > 0 ? (
                                  sortedStats.map((d) => (
                                    <tr key={d.department}>
                                      <td>{d.department}</td>
                                      <td>{fmt(d.total)}</td>
                                      <td>{fmt(d.completed)}</td>
                                      <td>{fmt(d.approved)}</td>
                                      <td>{fmt(d.underWork)}</td>
                                      <td>{fmt(d.notStarted)}</td>
                                      <td>{fmt(d.rejected)}</td>
                                      <td style={{ minWidth: 160 }}>
                                        <div className="d-flex align-items-center gap-2">
                                          <div className="progress flex-grow-1" style={{ height: 8 }}>
                                            <div
                                              className="progress-bar"
                                              role="progressbar"
                                              style={{ width: `${Math.min(100, d.progressRate)}%`, backgroundColor: '#4F7689' }}
                                              aria-valuenow={d.progressRate}
                                              aria-valuemin="0"
                                              aria-valuemax="100"
                                            />
                                          </div>
                                          <small className="text-nowrap">{d.progressRate}%</small>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  hasLoadedOnce && (
                                    <tr>
                                      <td colSpan={8} className="text-center py-4 text-muted">
                                        لا توجد بيانات للإدارات المختارة.
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
