import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/bss-overrides.css';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import { Line, Bar } from 'react-chartjs-2';
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
} from 'chart.js';
import * as XLSX from 'xlsx';
import Footer from '../../../components/Footer.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Report() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [monthlyProgress, setMonthlyProgress] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [progressMode, setProgressMode] = useState('completedPlusApproved'); // 'completedOnly' | 'completedPlusApproved'
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
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);
  const abortRef = useRef(null);

  // --------- helpers ---------
  const normalizeStr = (v) => (v ?? '').toString().trim().toLowerCase();
  const statusToKey = (raw) => {
    const s = normalizeStr(raw);
    if (['مكتمل', 'مكتملة', 'completed', 'complete', 'done'].includes(s)) return 'completed';
    if (['معتمد', 'معتمدة', 'approved', 'approve'].includes(s)) return 'approved';
    if (['غير معتمد', 'غير معتمدة', 'rejected', 'not approved', 'declined', 'رفض'].includes(s))
      return 'rejected';
    if (['تحت العمل', 'قيد العمل', 'under work', 'in progress', 'ongoing', 'progress'].includes(s))
      return 'underWork';
    if (['لم يبدأ', 'لم تبدا', 'not started', 'new', 'pending'].includes(s)) return 'notStarted';
    return null;
  };
  const ar = 'ar-SA';
  const fmt = (n) => Number(n || 0).toLocaleString(ar);

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

  // --------- data load ---------
  const loadData = async () => {
    setLoading(true);
    setError('');
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const [standardsRes, depsRes] = await Promise.all([
        fetch(`${API_BASE}/api/standards`, { signal: abortRef.current.signal }),
        fetch(`${API_BASE}/api/departments`, { signal: abortRef.current.signal }),
      ]);
      if (!standardsRes.ok || !depsRes.ok) throw new Error('HTTP error');

      const standards = await standardsRes.json();
      const deps = await depsRes.json();

      // departments
      setDepartments(deps || []);

      // filter by user dept if role is regular user
      const filtered = (standards || []).filter((s) =>
        user?.role?.toLowerCase() === 'user'
          ? Number(s.assigned_department_id) === Number(user.department_id)
          : true
      );

      // totals
      const totalCounts = {
        approved: 0,
        rejected: 0,
        completed: 0,
        underWork: 0,
        notStarted: 0,
      };

      const perDept = deps.map((dep) => {
        const depId = Number(dep.department_id);
        const rows = filtered.filter((s) => Number(s.assigned_department_id) === depId);
        const counts = {
          approved: 0,
          rejected: 0,
          completed: 0,
          underWork: 0,
          notStarted: 0,
        };
        for (const s of rows) {
          const key = statusToKey(s.status);
          if (key && counts[key] !== undefined) counts[key] += 1;
        }
        const total = rows.length;
        const numerator =
          progressMode === 'completedPlusApproved'
            ? counts.completed + counts.approved
            : counts.completed;
        const progressRate = total > 0 ? Math.round((numerator / total) * 100) : 0;

        // add to global totals
        for (const k of Object.keys(counts)) totalCounts[k] += counts[k];

        return {
          department: dep.department_name?.trim() || `الإدارة #${depId}`,
          total,
          progressRate,
          ...counts,
        };
      });

      setTotals({ total: filtered.length, ...totalCounts });

      // monthly trend by created_at
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
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError('تعذر تحميل البيانات. حاول مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE, progressMode]);

  // --------- filtering/sorting ---------
  const visibleDeptList = useMemo(() => {
    const q = deptSearch.trim();
    const base = departments.map((d) => d.department_name);
    if (!q) return base;
    return base.filter((name) => name?.toLowerCase().includes(q.toLowerCase()));
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

  // --------- derived visuals ---------
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
    const combined = {
      total: 0,
      completed: 0,
      approved: 0,
      rejected: 0,
      underWork: 0,
      notStarted: 0,
    };
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

  // bar: progress 0..100 per department (horizontal)
  const progressBarData = {
    labels: sortedStats.map((d) => d.department),
    datasets: [
      {
        label: 'نسبة الإنجاز',
        data: sortedStats.map((d) => d.progressRate),
        backgroundColor: '#4F7689',
        borderWidth: 0,
      },
    ],
  };

  // stacked bar: per department status breakdown
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

  // line: monthly trend
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

  // --------- export ---------
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
        'نسبة التقدم': `${d.progressRate}%`,
      }))
    );
    const wsSummary = XLSX.utils.json_to_sheet(
      summaryData.map((s) => ({ البند: s.title, القيمة: s.value }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص');
    XLSX.utils.book_append_sheet(wb, wsDept, 'الإدارات');
    XLSX.writeFile(wb, 'تقرير_الإدارات.xlsx');
  };

  // --------- local styles ---------
  const LocalStyles = () => (
    <style>{`
      :root{
        --panel-border:#4F7689;
        --panel-shadow:0 10px 24px rgba(16,24,40,.08);
      }
      .panel{border-top:3px solid var(--panel-border); box-shadow:var(--panel-shadow); border-radius:14px; background:#fff;}
      .panel-header{
        background:linear-gradient(120deg,#667eea,#4F7689,#667eea);
        background-size:220% 220%; color:#fff; padding:1rem 1.25rem; animation:wave 7s ease-in-out infinite;
        display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.18)
      }
      @keyframes wave{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
      .btn-soft{
        border:1px solid rgba(255,255,255,.45); background:rgba(255,255,255,.12); color:#fff;
        padding:.35rem .75rem; border-radius:10px; font-size:.9rem; transition:transform .15s ease, background .2s ease; backdrop-filter:blur(6px)
      }
      .btn-soft:hover{transform:translateY(-1px); background:rgba(255,255,255,.18)}
      .kpi{display:flex; align-items:center; justify-content:center; flex-direction:column; padding:14px 10px; min-height:92px; color:#fff; border-radius:12px; text-align:center; box-shadow:0 8px 18px rgba(0,0,0,.08); transition:transform .15s ease, box-shadow .2s ease}
      .kpi:hover{transform:translateY(-3px)}
      .kpi-val{margin:0 0 4px 0; font-weight:800; font-size:1.25rem}
      .skeleton{position:relative; overflow:hidden; background:#e9edf3; border-radius:10px}
      .skeleton::after{content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg,rgba(255,255,255,0) 0%, rgba(255,255,255,.55) 50%, rgba(255,255,255,0) 100%); animation:shimmer 1.3s infinite}
      @keyframes shimmer{100%{transform:translateX(100%)}}
      .table thead th{cursor:pointer}
      .badge-dot{display:inline-flex; align-items:center; gap:8px}
      .dot{width:10px; height:10px; border-radius:999px; display:inline-block}
    `}</style>
  );

  return (
    <>
      <LocalStyles />
      <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic, system-ui' }}>
        <Header />
        <div id="wrapper">
          <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
          <div className="d-flex flex-column" id="content-wrapper">
            <div id="content">
              <div className="container-fluid">
                {/* Breadcrumbs */}
                <div className="row p-4">
                  <div className="col-md-12">
                    <Breadcrumbs />
                  </div>
                </div>

                {/* Panel */}
                <div className="row">
                  <div className="col-xl-1" />
                  <div className="col-xl-10">
                    <div className="panel mb-4">
                      <div className="panel-header">
                        <div className="d-flex flex-column">
                          <strong>لوحة التقارير</strong>
                          <small className="opacity-75">
                            {lastUpdated
                              ? `آخر تحديث: ${new Intl.DateTimeFormat('ar-SA', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                }).format(lastUpdated)}`
                              : 'جاري التحميل...'}
                          </small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="btn-group" role="group" aria-label="وضع حساب التقدم">
                            <button
                              type="button"
                              className={`btn-soft ${progressMode === 'completedOnly' ? 'active' : ''}`}
                              onClick={() => setProgressMode('completedOnly')}
                              title="المكتمل فقط"
                            >
                              مكتمل فقط
                            </button>
                            <button
                              type="button"
                              className={`btn-soft ${progressMode === 'completedPlusApproved' ? 'active' : ''}`}
                              onClick={() => setProgressMode('completedPlusApproved')}
                              title="مكتمل + معتمد"
                            >
                              مكتمل + معتمد
                            </button>
                          </div>
                          {['admin', 'administrator'].includes(user?.role?.toLowerCase?.()) && (
                            <button className="btn-soft" onClick={exportToExcel}>
                              <i className="fas fa-file-excel ms-1" /> تصدير
                            </button>
                          )}
                          <button className="btn-soft" onClick={loadData}>
                            <i className="fas fa-rotate-right" /> تحديث
                          </button>
                        </div>
                      </div>

                      <div className="p-3 p-sm-4">
                        {/* Controls */}
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                          <Dropdown show={dropdownOpen} onToggle={() => setDropdownOpen(!dropdownOpen)}>
                            <Dropdown.Toggle size="sm" variant="outline-secondary">
                              {selectedDepartments.length === 0
                                ? 'كل الإدارات'
                                : `الإدارات المختارة: ${selectedDepartments.length}`}
                            </Dropdown.Toggle>
                            <Dropdown.Menu style={{ minWidth: 280 }}>
                              <div className="px-3 py-2">
                                <input
                                  type="search"
                                  className="form-control form-control-sm"
                                  placeholder="بحث عن إدارة..."
                                  value={deptSearch}
                                  onChange={(e) => setDeptSearch(e.target.value)}
                                />
                              </div>
                              <div className="px-3 d-flex justify-content-between pb-2">
                                <button
                                  className="btn btn-link p-0"
                                  onClick={() => setSelectedDepartments(visibleDeptList)}
                                >
                                  تحديد الكل
                                </button>
                                <button className="btn btn-link p-0" onClick={() => setSelectedDepartments([])}>
                                  مسح الاختيار
                                </button>
                              </div>
                              <div style={{ maxHeight: 260, overflowY: 'auto' }} className="px-3 pb-2">
                                <div className="form-check mb-1">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="allDepartments"
                                    checked={selectedDepartments.length === 0}
                                    onChange={() => setSelectedDepartments([])}
                                  />
                                  <label className="form-check-label" htmlFor="allDepartments">
                                    كل الإدارات
                                  </label>
                                </div>
                                {visibleDeptList.map((name) => (
                                  <div className="form-check" key={name}>
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`dep-${name}`}
                                      checked={selectedDepartments.includes(name)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedDepartments((prev) => [...prev, name]);
                                        } else {
                                          setSelectedDepartments((prev) => prev.filter((d) => d !== name));
                                        }
                                      }}
                                    />
                                    <label className="form-check-label" htmlFor={`dep-${name}`}>
                                      {name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>

                        {/* Loading / Error */}
                        {loading && (
                          <div className="d-flex flex-column gap-3">
                            <div className="skeleton" style={{ height: 92 }} />
                            <div className="skeleton" style={{ height: 280 }} />
                            <div className="skeleton" style={{ height: 280 }} />
                            <div className="skeleton" style={{ height: 320 }} />
                          </div>
                        )}

                        {!loading && error && (
                          <div className="text-center py-5">
                            <div className="mb-3">
                              <i className="fas fa-triangle-exclamation" style={{ color: '#dc3545', fontSize: 28 }} />
                            </div>
                            <div className="mb-3" style={{ fontWeight: 700 }}>{error}</div>
                            <button className="btn btn-primary" onClick={loadData}>
                              إعادة المحاولة
                            </button>
                          </div>
                        )}

                        {!loading && !error && (
                          <>
                            {/* KPIs */}
                            <div className="row g-3 mb-4 justify-content-center">
                              {[
                                { key: 'total', title: 'مجموع المعايير', value: totals.total },
                                { key: 'completed', title: STATUS_LABEL.completed, value: totals.completed },
                                { key: 'approved', title: STATUS_LABEL.approved, value: totals.approved },
                                { key: 'rejected', title: STATUS_LABEL.rejected, value: totals.rejected },
                                { key: 'underWork', title: STATUS_LABEL.underWork, value: totals.underWork },
                                { key: 'notStarted', title: STATUS_LABEL.notStarted, value: totals.notStarted },
                              ].map((kpi) => (
                                <div className="col-lg-2 col-md-4 col-6" key={kpi.key}>
                                  <div className="kpi" style={{ backgroundColor: KPI_COLOR[kpi.key] }}>
                                    <div className="kpi-val">{fmt(kpi.value)}</div>
                                    <small>{kpi.title}</small>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Charts row 1: Progress + Stacked Status */}
                            <div className="row g-4 mb-4">
                              <div className="col-md-6">
                                <div className="bg-white p-3 rounded shadow-sm h-100">
                                  <h6 className="mb-3">نسبة تقدم الإدارات</h6>
                                  <div style={{ height: 260 }}>
                                    <Bar
                                      data={progressBarData}
                                      options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        indexAxis: 'y',
                                        scales: {
                                          x: {
                                            min: 0,
                                            max: 100,
                                            ticks: { callback: (v) => `${v}%` },
                                            grid: { display: false },
                                            title: { display: true, text: 'نسبة التقدم (%)' },
                                          },
                                          y: { grid: { display: false } },
                                        },
                                        plugins: {
                                          legend: { display: false },
                                          tooltip: {
                                            callbacks: { label: (ctx) => `${ctx.parsed.x}%` },
                                          },
                                        },
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="bg-white p-3 rounded shadow-sm h-100">
                                  <h6 className="mb-1">توزيع الحالات حسب الإدارة</h6>
                                  <div className="mb-2 small">
                                    {Object.entries(STATUS_LABEL).map(([k, label]) => (
                                      <span key={k} className="badge-dot me-3">
                                        <span className="dot" style={{ backgroundColor: STATUS_COLOR[k] }} />
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ height: 260 }}>
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
                                        plugins: {
                                          legend: { display: false },
                                        },
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Charts row 2: Monthly Trend */}
                            <div className="row g-4 mb-4">
                              <div className="col-12">
                                <div className="bg-white p-3 rounded shadow-sm">
                                  <h6 className="mb-3">المعايير المُضافة شهرياً</h6>
                                  <div style={{ height: 300 }}>
                                    <Line
                                      data={lineChartData}
                                      options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                          x: { grid: { display: false } },
                                          y: { beginAtZero: true, grid: { drawBorder: false } },
                                        },
                                        plugins: {
                                          legend: { display: false },
                                        },
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Table */}
                            <div className="row g-4 mb-2">
                              <div className="col-12">
                                <div className="bg-white p-3 rounded shadow-sm">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <h6 className="mb-0">تفاصيل الإدارات</h6>
                                    <small className="text-muted">
                                      {selectedDepartments.length === 0
                                        ? 'تعرض جميع الإدارات'
                                        : `إدارات مختارة: ${selectedDepartments.length}`}
                                    </small>
                                  </div>
                                  <div className="table-responsive">
                                    <table className="table table-hover align-middle">
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
                                        {sortedStats.map((d) => (
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
                                        ))}
                                        {sortedStats.length === 0 && (
                                          <tr>
                                            <td colSpan={8} className="text-center py-4 text-muted">
                                              لا توجد بيانات للإدارات المختارة.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
