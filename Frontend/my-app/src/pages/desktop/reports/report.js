import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import './assets/bootstrap/css/bootstrap.min.css';
import './assets/fonts/fontawesome-all.min.css';
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
import PageContainer from '../../../components/PageContainer.jsx';

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

  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  // 'approvedOnly' | 'completedPlusApproved'
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

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const USERS_ENDPOINT = `${API_BASE}/api/users`;
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);
  const abortRef = useRef(null);

  // ====== Skeleton control (no flicker + race-safe) ======
  const LOAD_MIN_MS = 450;       // minimum time the skeleton stays up
  const loadSeqRef = useRef(0);  // prevents older requests from hiding newer skeletons

  /* ================= theme & styles ================ */
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
      .surface {
        background: var(--surface);
        border: 1px solid var(--stroke);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        overflow: hidden;
      }
      .surface.allow-overflow { overflow: visible; }
      .head-flat {
        padding: 12px 16px;
        background: var(--surface-muted);
        border-bottom: 1px solid var(--stroke);
        color: var(--text);
        font-weight: 700;
        display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
        border-top-left-radius: var(--radius);
        border-top-right-radius: var(--radius);
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

      /* skeletons */
      .skeleton { position:relative; overflow:hidden; background:var(--skeleton-bg); border-radius: calc(var(--radius) - 2px); }
      .skeleton::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--skeleton-sheen) 50%, rgba(255,255,255,0) 100%); animation:shimmer var(--skeleton-speed) infinite; }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) {
        .skeleton::after { animation: none; }
      }
      .skeleton-card { height:92px; }
      .skeleton-block { height: 280px; }
      .skeleton-table-row { height: 44px; margin-bottom: 8px; border-radius: 8px; }

      .chart-wrap-md { height: 280px; }  /* used for both pie and stats to match exactly */
      .chart-wrap-lg { height: 300px; }

      /* smaller legend chips without background */
      .legend-inline { position:absolute; top:8px; inset-inline-start:12px; display:flex; gap:8px; flex-wrap:wrap; }
      .legend-chip { display:inline-flex; align-items:center; gap:6px; font-size:.72rem; color: var(--text); }
      .legend-chip .dot { width:8px; height:8px; border-radius:999px; display:inline-block; }

      /* users/departments widget tiles */
      .stats-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:12px; }
      @media (max-width:576px){ .stats-grid{ grid-template-columns: 1fr; } }
      .mini-stat { border:1px solid var(--stroke); border-radius:12px; padding:12px; background:#fff; display:flex; align-items:center; gap:10px; height:100%; }
      .mini-icon { width:36px; height:36px; border-radius:8px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#0b2440; }

      /* table */
      .table-card { background: var(--surface); border:1px solid var(--stroke); border-radius: var(--radius); box-shadow: var(--shadow); overflow:hidden; }
      .table-card .head { padding:12px 16px; border-bottom:1px solid var(--stroke); background: var(--surface-muted); display:flex; justify-content:space-between; align-items:center; font-weight:700; }
      .table-card .body { padding:0; }
      .table thead th { cursor: pointer; white-space: nowrap; }

      /* bootstrap dropdown polish */
      .dropdown-menu { --bs-dropdown-link-hover-bg: #f1f5f9; --bs-dropdown-link-active-bg: #e2e8f0; }
      .dropdown-item { color: var(--text) !important; }
      .dropdown-item:hover, .dropdown-item:focus, .dropdown-item:active, .dropdown-item.active { color: var(--text) !important; }
    `}</style>
  );

  /* --------- helpers --------- */
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
  const fmt = (n) => Number(n || 0).toLocaleString('ar-SA');

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
  const KPI_COLOR = {
    total: '#0d6efd',
    ...STATUS_COLOR,
  };

const hijriFormat = (date) => {
  if (!date) return '';
  // Prefer islamic-umalqura; fall back to islamic if not available
  const primary = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    dateStyle: 'long',
    timeStyle: 'short',
    hour12: true,
    timeZone: 'Asia/Riyadh',
  });
  const cal = primary.resolvedOptions().calendar || '';
  const fmt = cal.includes('islamic-umalqura')
    ? primary
    : new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        dateStyle: 'long',
        timeStyle: 'short',
        hour12: true,
        timeZone: 'Asia/Riyadh',
      });
  return fmt.format(date);
};


  /* --------- data load --------- */
  const loadData = async () => {
    // bump sequence and start skeleton
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
      if (elapsed < LOAD_MIN_MS) {
        setTimeout(finish, LOAD_MIN_MS - elapsed);
      } else {
        finish();
      }
    }
  };

  useEffect(() => {
    loadData();
    return () => abortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE, progressMode]);

  /* --------- filtering/sorting --------- */
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
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  /* --------- derived visuals --------- */
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
      datasets: [
        {
          data: items.map((s) => s.value),
          backgroundColor: items.map((s) => KPI_COLOR[s.key]),
          borderWidth: 0,
        },
      ],
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
    datasets: [
      {
        label: 'المعايير المُضافة شهرياً',
        data: monthlyProgress.map((p) => p.count),
        fill: true,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.12)',
        tension: 0.35,
      },
    ],
  };

  /* --------- users & departments stats --------- */
  const getRole = (u) =>
    (u?.role ?? u?.user_role ?? u?.account_type ?? u?.type ?? '').toString().trim();

  // EXACTLY "Management" (case-insensitive)
  const isManagementAccount = (u) => getRole(u).toLowerCase() === 'management';

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

  const largestDept = useMemo(() => {
    let best = { depId: null, count: 0, name: '' };
    usersByDept.forEach((count, depId) => {
      if (count > best.count) best = {
        depId,
        count,
        name: (departments.find(d => Number(d.department_id) === depId)?.department_name) || `الإدارة #${depId}`
      };
    });
    return best;
  }, [usersByDept, departments]);

  /* --------- export --------- */
  const exportToExcel = () => {
    const wsDept = XLSX.utils.json_to_sheet(
      sortedStats.map((d) => ({
        'الإدارة': d.department,
        'المجموع': d.total,
        'مكتمل': d.completed,
        'معتمد': d.approved,
        'غير معتمد': d.rejected,
        'تحت العمل': d.underWork,
        'لم يبدأ': d.notStarted,
        'المتبقي': d.remaining,
        'نسبة التقدم': `${d.progressRate}%`,
      }))
    );
    const wsSummary = XLSX.utils.json_to_sheet(
      summaryData.map((s) => ({ البند: s.title, القيمة: s.value }))
    );
    const wsUsers = XLSX.utils.json_to_sheet([
      { البند: 'إجمالي المستخدمين', القيمة: totalUsers },
      { البند: 'إجمالي الإدارات', القيمة: totalDepartments },
      { البند: 'حسابات الإدارة', القيمة: managementAccountsCount },
      { البند: 'أكبر إدارة (عدد المستخدمين)', القيمة: largestDept.name ? `${largestDept.name} (${largestDept.count})` : '—' },
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص');
    XLSX.utils.book_append_sheet(wb, wsDept, 'الإدارات');
    XLSX.utils.book_append_sheet(wb, wsUsers, 'المستخدمون');
    XLSX.writeFile(wb, 'تقرير_الإدارات.xlsx');
  };

  return (
    <PageContainer>
      <LocalTheme />
      <Header />
      <div id="wrapper" style={{ display: 'flex', flexDirection: 'row' }}>
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />

        <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
          <div id="content" className="flex-grow-1">
              <div className="container-fluid">

                {/* Breadcrumbs */}
                <div className="row p-4">
                  <div className="col-12">
                    <Breadcrumbs />
                  </div>
                </div>

                {/* Header card */}
                <div className="row justify-content-center">
                  <div className="col-12 col-xl-10">
                    <div className="surface allow-overflow mb-4" aria-busy={loading}>
                      <div className="head-flat">
                        <div className="d-flex flex-column">
                          <span>لوحة التقارير</span>
                          <small className="muted">
                            {lastUpdated ? `آخر تحديث: ${hijriFormat(lastUpdated)}` : 'جاري التحميل...'}
                          </small>
                        </div>

                        <div className="head-actions">
                          {/* Departments dropdown (plain Bootstrap) */}
                          <Dropdown autoClose="outside" align="end" flip={false}>
                            <Dropdown.Toggle variant="outline-secondary" size="sm">
                              {selectedDepartments.length === 0
                                ? 'كل الإدارات'
                                : `الإدارات المختارة: ${selectedDepartments.length}`}
                            </Dropdown.Toggle>
                            <Dropdown.Menu
                              style={{ minWidth: 320 }}
                              renderOnMount
                              popperConfig={{
                                strategy: 'fixed',
                                modifiers: [
                                  { name: 'offset', options: { offset: [0, 8] } },
                                  { name: 'flip', enabled: false },
                                ],
                              }}
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
                                <Dropdown.Item
                                  as="button"
                                  className="d-flex align-items-center gap-2"
                                  onClick={() => setSelectedDepartments([])}
                                >
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

                          {/* Progress mode toggles (plain bootstrap buttons) */}
                          <div className="d-inline-flex align-items-center gap-2">
                            <button
                              type="button"
                              className={`btn btn-outline-secondary btn-sm ${progressMode === 'approvedOnly' ? 'active' : ''}`}
                              onClick={() => setProgressMode('approvedOnly')}
                              title="معتمد فقط"
                            >
                              معتمد فقط
                            </button>
                            <button
                              type="button"
                              className={`btn btn-outline-secondary btn-sm ${progressMode === 'completedPlusApproved' ? 'active' : ''}`}
                              onClick={() => setProgressMode('completedPlusApproved')}
                              title="مكتمل + معتمد"
                            >
                              مكتمل + معتمد
                            </button>
                          </div>

                          {/* Export + Refresh */}
                          {['admin', 'administrator'].includes(user?.role?.toLowerCase?.()) && (
                            <button className="btn btn-success btn-sm" onClick={exportToExcel} title="تصدير Excel (XLSX)">
                              <i className="fas fa-file-excel ms-1" /> تصدير Excel (XLSX)
                            </button>
                          )}
                          <button className="btn btn-outline-primary btn-sm" onClick={loadData} title="تحديث البيانات">
                            <i className="fas fa-rotate-right" /> تحديث
                          </button>
                        </div>
                      </div>

                      <div className="body-flat">
                        {/* KPIs */}
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

                {/* Charts Row 1 — equal sizes */}
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

                {/* Charts Row 2 */}
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

                {/* Row 3 — Pie + Users/Departments Stats (exact same height via chart-wrap-md) */}
                <div className="row justify-content-center g-4 mt-1">
                  <div className="col-12 col-xl-5">
                    <div className="surface" aria-busy={loading}>
                      <div className="head-flat">توزيع حالات المعايير</div>
                      <div className="body-flat">
                        {loading ? (
                          <div className="skeleton skeleton-block" style={{ height: 300 }} />
                        ) : error ? (
                          <div className="text-center py-4 text-danger">{error}</div>
                        ) : (
                          <div className="chart-wrap-md">
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

                  {/* EXACT MATCH HEIGHT: wrap stats content in chart-wrap-md */}
                  <div className="col-12 col-xl-5">
                    <div className="surface" aria-busy={loading}>
                      <div className="head-flat">إحصائيات المستخدمين والإدارات</div>
                      <div className="body-flat">
                        {loading ? (
                          <div className="skeleton skeleton-block" />
                        ) : (
                          <div className="chart-wrap-md d-flex align-items-center">
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
                                    <div className="fw-bold">حسابات الإدارة</div>
                                    <div className="text-muted">{fmt(managementAccountsCount)}</div>
                                  </div>
                                </div>
                                <div className="mini-stat">
                                  <div className="mini-icon"><i className="fas fa-crown" /></div>
                                  <div>
                                    <div className="fw-bold">أكبر إدارة (مستخدمين)</div>
                                    <div className="text-muted">
                                      {largestDept?.name ? `${largestDept.name} — ${fmt(largestDept.count)}` : '—'}
                                    </div>
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

                {/* Table */}
                <div className="row justify-content-center g-4 mt-1 mb-5">
                  <div className="col-12 col-xl-10">
                    <div className="table-card" aria-busy={loading}>
                      <div className="head-flat">
                        <div>تفاصيل الإدارات</div>
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
          </div>
        </div>
      </div>
      <Footer />
    </PageContainer>
  );
}
