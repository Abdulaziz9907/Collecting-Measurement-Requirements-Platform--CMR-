import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/fonts/fontawesome-all.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';

export default function Standards_menu() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [summary, setSummary] = useState({
    departments: 0,
    total: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    underWork: 0,
    notStarted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // keep raw standards for widgets (recent updates)
  const [standardsRaw, setStandardsRaw] = useState([]);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null'), []);

  const statusMap = useMemo(() => ({
    'معتمد': 'approved',
    'غير معتمد': 'rejected',
    'مكتمل': 'completed',
    'تحت العمل': 'underWork',
    'لم يبدأ': 'notStarted',
  }), []);

  const summaryCards = useMemo(() => ([
    { key: 'total', title: 'مجموع المعايير' },
    { key: 'departments', title: 'عدد الإدارات' },
    { key: 'completed', title: 'معايير مكتملة' },
    { key: 'approved', title: 'معايير معتمدة' },
    { key: 'rejected', title: 'معايير غير معتمدة' },
    { key: 'underWork', title: 'تحت العمل' },
    { key: 'notStarted', title: 'لم يبدأ' },
  ]), []);

  const summaryCardColors = useMemo(() => ({
    total: '#0d6efd',
    departments: '#4F7689',
    completed: '#17a2b8',
    approved: '#198754',
    rejected: '#dc3545',
    underWork: '#ffc107',
    notStarted: '#6c757d',
  }), []);

  const abortRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const [standardsRes, departmentsRes] = await Promise.all([
        fetch(`${API_BASE}/api/standards`, { signal: abortRef.current.signal }),
        fetch(`${API_BASE}/api/departments`, { signal: abortRef.current.signal })
      ]);
      if (!standardsRes.ok || !departmentsRes.ok) throw new Error('HTTP error');
      const standards = await standardsRes.json();
      const departments = await departmentsRes.json();

      let data = standards || [];
      if (user?.role?.toLowerCase() === 'user') {
        data = data.filter(s => s.assigned_department_id === user.department_id);
      }

      const counts = {
        approved: 0,
        rejected: 0,
        completed: 0,
        underWork: 0,
        notStarted: 0,
      };
      for (const s of data) {
        const key = statusMap[s.status];
        if (key) counts[key]++;
      }

      setSummary({ total: data.length, departments: departments.length, ...counts });
      setStandardsRaw(data);
      setLastUpdated(new Date());
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError('تعذر تحميل البيانات. حاول مرة أخرى.');
        setSummary({
          departments: 0,
          total: 0, approved: 0, rejected: 0, completed: 0, underWork: 0, notStarted: 0
        });
        setStandardsRaw([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => { if (abortRef.current) abortRef.current.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  const ar = 'ar-SA';
  const fmt = (n) => Number(n || 0).toLocaleString(ar);
  const pct = (num, den) => {
    const p = den > 0 ? Math.round((num / den) * 100) : 0;
    return Math.max(0, Math.min(100, p));
  };
  const formatDateTimeAR = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d)) return '';
      return new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    } catch { return ''; }
  };

  // --- Derived KPIs ---
  const approvalRate = pct(summary.approved, summary.total);
  const completionRate = pct(summary.completed, summary.total);
  const inProgressRate = pct(summary.underWork, summary.total);

  // Recent updates (if dates available)
  const dateKey = standardsRaw?.[0] && ('updated_at' in standardsRaw[0] ? 'updated_at' :
                                        ('created_at' in standardsRaw[0] ? 'created_at' : null));
  const recentItems = useMemo(() => {
    if (!dateKey) return [];
    return [...standardsRaw]
      .filter(x => x && x[dateKey])
      .sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]))
      .slice(0, 8);
  }, [standardsRaw, dateKey]);

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f6f8fb',
      }}
    >
      {/* local styles */}
      <style>{`
        :root {
          --panel-border: #4F7689;
          --panel-shadow: 0 10px 24px rgba(16, 24, 40, 0.08);
          --hover-shadow: 0 12px 28px rgba(16, 24, 40, 0.12);
        }
        .panel { position: relative; border-top: 3px solid var(--panel-border); box-shadow: var(--panel-shadow); border-radius: 14px; overflow: hidden; background: #fff; }
        .panel-header {
          position: relative; color: #fff; padding: 1.1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,.18);
          background: linear-gradient(120deg, #667eea, #4F7689, #667eea); background-size: 220% 220%; animation: wave 7s ease-in-out infinite;
        }
        @keyframes wave { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .panel-tools { display:flex; gap:.5rem; align-items:center; }
        .btn-soft { border:1px solid rgba(255,255,255,.45); background:rgba(255,255,255,.12); color:#fff; padding:.35rem .75rem; border-radius:10px; font-size:.9rem; transition:transform .15s ease, background .2s ease; backdrop-filter: blur(6px); }
        .btn-soft:hover { transform: translateY(-1px); background: rgba(255,255,255,.18); }
        .muted { color:#6b7280; }
        .grid-cards { display:grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap:12px; }
        @media (max-width:1200px){ .grid-cards{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width:576px){ .grid-cards{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .stat-card { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px 12px; border-radius:12px; color:#fff; text-align:center; min-height:92px; box-shadow:0 8px 18px rgba(0,0,0,.08); transition: transform .15s ease, box-shadow .2s ease, filter .2s ease; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: var(--hover-shadow); filter: brightness(1.02); }
        .stat-value { margin:0 0 4px; font-weight:800; font-size:1.35rem; letter-spacing:.2px; }
        .stat-title { font-size:.9rem; opacity:.95; }
        .skeleton { position:relative; overflow:hidden; background:#e9edf3; border-radius:10px; }
        .skeleton::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%); animation:shimmer 1.4s infinite; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .skeleton-card { height:92px; }
        /* KPIs */
        .kpi { display:flex; align-items:center; gap:12px; padding:12px; border:1px solid #eef2f7; border-radius:12px; background:#fff; }
        .kpi .ring { width:44px; height:44px; }
        .kpi .vals { display:flex; flex-direction:column; }
        .kpi .label { font-size:.95rem; font-weight:700; }
        .kpi .sub { font-size:.8rem; color:#6b7280; }
        .kpi-grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:12px; }
        @media (max-width:992px){ .kpi-grid { grid-template-columns: 1fr; } }
        /* Quick links */
        .quick-link { display:flex; align-items:center; gap:10px; padding:12px 14px; border:1px dashed #d6dee9; border-radius:12px; background:#f9fbff; transition: background .15s ease, transform .15s ease; text-decoration:none; color:#0b2440; }
        .quick-link:hover { background:#eef5ff; transform: translateY(-1px); text-decoration:none; }
        .quick-grid { display:grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap:10px; }
        @media (max-width:1200px){ .quick-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width:576px){ .quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        /* Recent table */
        .table-card { border:1px solid #eef2f7; border-radius:14px; overflow:hidden; background:#fff; }
        .table-card .head { padding:12px 16px; border-bottom:1px solid #eef2f7; display:flex; justify-content:space-between; align-items:center; background:#fbfdff; }
        .table-card .body { padding:6px 0; }
        .table-row { display:grid; grid-template-columns: 1fr 160px 180px; gap:12px; padding:10px 16px; align-items:center; border-bottom:1px solid #f1f4f8; }
        .table-row:last-child { border-bottom:none; }
        @media (max-width:768px){ .table-row { grid-template-columns: 1fr; gap:4px; } }
        .badge-soft { padding:4px 10px; border-radius:999px; font-size:.8rem; border:1px solid; }
        .badge-approved { color:#0f5132; border-color:#badbcc; background:#d1e7dd; }
        .badge-rejected { color:#842029; border-color:#f5c2c7; background:#f8d7da; }
        .badge-completed{ color:#055160; border-color:#b6effb; background:#cff4fc; }
        .badge-underwork{ color:#664d03; border-color:#ffecb5; background:#fff3cd; }
        .badge-notstarted{ color:#383d41; border-color:#d6d8db; background:#e2e3e5; }
      `}</style>

      <Header />

      <div id="wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
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

              {/* Summary Panel */}
              <div className="row justify-content-center">
                <div className="col-12 col-xl-10">
                  <div className="panel mb-4">
                    <div className="panel-header d-flex align-items-center justify-content-between">
                      <div className="d-flex flex-column">
                        <strong style={{ fontSize: '1.05rem' }}>نظرة عامة على المعايير</strong>
                        <small className="opacity-75">
                          {lastUpdated ? `آخر تحديث: ${new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(lastUpdated)}`
                                       : 'جاري التحميل...'}
                        </small>
                      </div>
                      <div className="panel-tools">
                        <button className="btn-soft" type="button" onClick={loadData} aria-label="تحديث">
                          <i className="fas fa-rotate-right" /> تحديث
                        </button>
                      </div>
                    </div>

                    <div className="p-3 p-sm-4">
                      {loading && (
                        <div className="grid-cards">
                          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
                        </div>
                      )}

                      {!loading && error && (
                        <div className="d-flex flex-column align-items-center justify-content-center py-5">
                          <div className="mb-3">
                            <i className="fas fa-triangle-exclamation" style={{ color: '#dc3545', fontSize: 28 }} />
                          </div>
                          <div className="mb-3" style={{ fontWeight: 700 }}>{error}</div>
                          <button className="btn btn-primary" onClick={loadData}>إعادة المحاولة</button>
                        </div>
                      )}

                      {!loading && !error && summary.total === 0 && (
                        <div className="text-center py-5">
                          <div className="mb-2" style={{ fontSize: '1.15rem', fontWeight: 700 }}>لا توجد معايير حتى الآن</div>
                          <div className="muted mb-3">أضف معايير جديدة أو غيّر عوامل التصفية للحساب الحالي.</div>
                          <button className="btn btn-outline-primary" onClick={loadData}>تحديث</button>
                        </div>
                      )}

                      {!loading && !error && summary.total > 0 && (
                        <div className="grid-cards">
                          {summaryCards.map((c) => (
                            <div key={c.key} className="stat-card" style={{ backgroundColor: summaryCardColors[c.key] }}>
                              <h5 className="stat-value">{fmt(summary[c.key])}</h5>
                              <div className="stat-title">{c.title}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* --- New Widgets --- */}

              {/* KPIs Row */}
              {!loading && !error && summary.total > 0 && (
                <div className="row justify-content-center">
                  <div className="col-12 col-xl-10 mb-4">
                    <div className="kpi-grid">
                      {/* KPI helper: ring (pure SVG) */}
                      <KPI label="نسبة الاعتماد" value={approvalRate} sub={`${fmt(summary.approved)} / ${fmt(summary.total)}`} />
                      <KPI label="نسبة الإكمال" value={completionRate} sub={`${fmt(summary.completed)} / ${fmt(summary.total)}`} />
                      <KPI label="نسبة تحت العمل" value={inProgressRate} sub={`${fmt(summary.underWork)} / ${fmt(summary.total)}`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Distribution (SVG Donut) */}
              {!loading && !error && summary.total > 0 && (
                <div className="row justify-content-center">
                  <div className="col-12 col-xl-10 mb-4">
                    <div className="panel">
                      <div className="panel-header d-flex align-items-center justify-content-between">
                        <strong>توزيع الحالات</strong>
                        <small className="opacity-75">نظرة سريعة على نسب كل حالة</small>
                      </div>
                      <div className="p-3 p-sm-4 d-flex flex-column flex-lg-row align-items-center gap-4">
                        <Donut
                          size={220}
                          items={[
                            { label: 'مكتمل', value: summary.completed, color: summaryCardColors.completed },
                            { label: 'معتمد', value: summary.approved, color: summaryCardColors.approved },
                            { label: 'غير معتمد', value: summary.rejected, color: summaryCardColors.rejected },
                            { label: 'تحت العمل', value: summary.underWork, color: summaryCardColors.underWork },
                            { label: 'لم يبدأ', value: summary.notStarted, color: summaryCardColors.notStarted },
                          ]}
                        />
                        <div className="flex-grow-1 w-100">
                          <div className="row g-2">
                            {[
                              { k: 'completed', t: 'مكتمل' },
                              { k: 'approved', t: 'معتمد' },
                              { k: 'rejected', t: 'غير معتمد' },
                              { k: 'underWork', t: 'تحت العمل' },
                              { k: 'notStarted', t: 'لم يبدأ' },
                            ].map(({ k, t }) => (
                              <div key={k} className="col-6 col-md-4 col-lg-3">
                                <div className="d-flex align-items-center gap-2">
                                  <span style={{
                                    display: 'inline-block',
                                    width: 12, height: 12, borderRadius: 3,
                                    backgroundColor: summaryCardColors[k]
                                  }} />
                                  <div className="fw-bold">{t}</div>
                                  <div className="ms-auto muted">{pct(summary[k], summary.total)}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              {!loading && !error && (
                <div className="row justify-content-center">
                  <div className="col-12 col-xl-10 mb-4">
                    <div className="panel">
                      <div className="panel-header d-flex align-items-center justify-content-between">
                        <strong>روابط سريعة</strong>
                        <small className="opacity-75">تنقل سريع إلى أشهر الفلاتر</small>
                      </div>
                      <div className="p-3 p-sm-4">
                        <div className="quick-grid">
                          <QuickLink href="/standards?status=completed" icon="fa-circle-check" text="المكتملة" />
                          <QuickLink href="/standards?status=approved" icon="fa-badge-check" text="المعتمدة" />
                          <QuickLink href="/standards?status=rejected" icon="fa-circle-xmark" text="غير المعتمدة" />
                          <QuickLink href="/standards?status=underWork" icon="fa-person-digging" text="تحت العمل" />
                          <QuickLink href="/standards?status=notStarted" icon="fa-hourglass-start" text="لم يبدأ" />
                          <QuickLink href="/standards" icon="fa-table-list" text="كل المعايير" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Updates (if timestamps exist) */}
              {!loading && !error && recentItems.length > 0 && (
                <div className="row justify-content-center">
                  <div className="col-12 col-xl-10 mb-5">
                    <div className="table-card">
                      <div className="head">
                        <strong>أحدث التحديثات</strong>
                        <small className="muted">يعتمد على {dateKey === 'updated_at' ? 'آخر تعديل' : 'تاريخ الإضافة'}</small>
                      </div>
                      <div className="body">
                        {recentItems.map((it, idx) => (
                          <div key={idx} className="table-row">
                            <div className="text-truncate" title={it.title || it.name || `#${it.id}`}>
                              <i className="fas fa-file-lines ms-2" />
                              {it.title || it.name || (it.code ? `معيار ${it.code}` : `معيار #${it.id}`)}
                            </div>
                            <div className="muted">{formatDateTimeAR(it[dateKey])}</div>
                            <div className="text-end">
                              <span className={
                                `badge-soft ${
                                  it.status === 'معتمد' ? 'badge-approved' :
                                  it.status === 'غير معتمد' ? 'badge-rejected' :
                                  it.status === 'مكتمل' ? 'badge-completed' :
                                  it.status === 'تحت العمل' ? 'badge-underwork' :
                                  'badge-notstarted'
                                }`
                              }>
                                {it.status || 'غير محدد'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* ---------- Small helper components (inline) ---------- */

function KPI({ label, value, sub }) {
  const radius = 20;
  const stroke = 6;
  const c = 2 * Math.PI * radius;
  const dash = (value / 100) * c;

  return (
    <div className="kpi">
      <svg className="ring" viewBox="0 0 52 52" aria-label={`${label} ${value}%`}>
        <circle cx="26" cy="26" r={radius} stroke="#eef2f7" strokeWidth={stroke} fill="none" />
        <circle
          cx="26" cy="26" r={radius}
          stroke="#4F7689" strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 26 26)"
          strokeLinecap="round"
        />
        <text x="26" y="30" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0b2440">{value}%</text>
      </svg>
      <div className="vals">
        <div className="label">{label}</div>
        <div className="sub">{sub}</div>
      </div>
    </div>
  );
}

function Donut({ size = 220, items = [] }) {
  const total = items.reduce((a, b) => a + (b.value || 0), 0);
  const r = size / 2 - 18;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="توزيع الحالات">
      <g transform={`translate(${center}, ${center})`}>
        {/* track */}
        <circle r={r} fill="none" stroke="#eef2f7" strokeWidth="18" />
        {/* arcs */}
        {items.map((it, i) => {
          const val = total ? (it.value / total) : 0;
          const len = val * c;
          const dash = `${len} ${c - len}`;
          const arc = (
            <circle
              key={i}
              r={r}
              fill="none"
              stroke={it.color}
              strokeWidth="18"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90)"
              strokeLinecap="butt"
            />
          );
          offset += len;
          return arc;
        })}
        {/* center label */}
        <circle r={r - 28} fill="#fff" />
        <text x="0" y="-4" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0b2440">
          {total}
        </text>
        <text x="0" y="16" textAnchor="middle" fontSize="11" fill="#6b7280">
          إجمالي العناصر
        </text>
      </g>
    </svg>
  );
}

function QuickLink({ href, icon, text }) {
  // map FA icon names to classes; fallback to fa-arrow-left
  const iconClass = icon ? `fa-solid ${icon}` : 'fa-solid fa-arrow-left';
  return (
    <a className="quick-link" href={href}>
      <i className={iconClass} />
      <span className="fw-bold">{text}</span>
    </a>
  );
}
