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
    total: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    underWork: 0,
    notStarted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
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
    { key: 'completed', title: 'معايير مكتملة' },
    { key: 'approved', title: 'معايير معتمدة' },
    { key: 'rejected', title: 'معايير غير معتمدة' },
    { key: 'underWork', title: 'تحت العمل' },
    { key: 'notStarted', title: 'لم يبدأ' },
  ]), []);

  const summaryCardColors = useMemo(() => ({
    total: '#0d6efd',
    completed: '#17a2b8',
    approved: '#198754',
    rejected: '#dc3545',
    underWork: '#ffc107',
    notStarted: '#6c757d',
  }), []);

  const abortRef = useRef(null);

  // === Smooth skeleton control (race-safe + min display time)
  const LOAD_MIN_MS = 450;
  const loadSeqRef = useRef(0);

  const loadData = async () => {
    // bump sequence to invalidate older calls
    loadSeqRef.current += 1;
    const seq = loadSeqRef.current;

    setLoading(true);
    setError('');

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    try {
      const res = await fetch(`${API_BASE}/api/standards`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const standards = await res.json();

      let data = standards || [];
      if (user?.role?.toLowerCase() === 'user') {
        data = data.filter(s => s.assigned_department_id === user.department_id);
      }

      const counts = { approved: 0, rejected: 0, completed: 0, underWork: 0, notStarted: 0 };
      for (const s of data) {
        const key = statusMap[s.status];
        if (key) counts[key]++;
      }

      setSummary({ total: data.length, ...counts });
      setStandardsRaw(data);
      setLastUpdated(new Date());
      setHasLoadedOnce(true);
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError('تعذر تحميل البيانات. حاول مرة أخرى.');
        setSummary({ total: 0, approved: 0, rejected: 0, completed: 0, underWork: 0, notStarted: 0 });
        setStandardsRaw([]);
        setHasLoadedOnce(true);
      }
    } finally {
      const elapsed = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      const finish = () => { if (loadSeqRef.current === seq) setLoading(false); };
      if (elapsed < LOAD_MIN_MS) setTimeout(finish, LOAD_MIN_MS - elapsed); else finish();
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

  /* ---------- TIME FIX (assume UTC if missing TZ, format in Asia/Riyadh) ---------- */
  const TIMEZONE = 'Asia/Riyadh';
  const ASSUME_UTC_WHEN_MISSING_TZ = true;

  const parseToDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val) ? null : val;
    if (typeof val === 'string') {
      const s = val.trim().replace(' ', 'T');
      const hasTZ = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
      const normalized = hasTZ ? s : (ASSUME_UTC_WHEN_MISSING_TZ ? `${s}Z` : s);
      const d = new Date(normalized);
      return isNaN(d) ? null : d;
    }
    const d = new Date(val);
    return isNaN(d) ? null : d;
  };

  const formatDateTimeAR = (val) => {
    const d = parseToDate(val);
    if (!d) return '';
    return new Intl.DateTimeFormat(ar, {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: true,
      timeZone: TIMEZONE,
    }).format(d);
  };
  /* ------------------------------------------------------------------------------- */

  const getStdNumber = (s) =>
    s?.standard_number ?? s?.standardNo ?? s?.number ?? s?.code ?? s?.ref ?? s?.id ?? null;

  const getStdName = (s) =>
    s?.name ?? s?.title ?? s?.standard_name ?? s?.display_name ?? null;

  const approvalRate = pct(summary.approved, summary.total);
  const completionRate = pct(summary.completed, summary.total);
  const inProgressRate = pct(summary.underWork, summary.total);

  const dateKey = standardsRaw?.[0] && ('updated_at' in standardsRaw[0] ? 'updated_at' :
                                        ('created_at' in standardsRaw[0] ? 'created_at' : null));
  const recentItems = useMemo(() => {
    if (!dateKey) return [];
    return [...standardsRaw]
      .filter(x => x && x[dateKey])
      .sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]))
      .slice(0, 8);
  }, [standardsRaw, dateKey]);

  const legendOrder = [
    { k: 'completed', t: 'مكتمل' },
    { k: 'approved', t: 'معتمد' },
    { k: 'underWork', t: 'تحت العمل' },
    { k: 'notStarted', t: 'لم يبدأ' },
    { k: 'rejected', t: 'غير معتمد' },
  ];

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
      <style>{`
        :root {
          --radius: 14px;
          --shadow: 0 10px 24px rgba(16, 24, 40, 0.08);
          --shadow-hover: 0 12px 28px rgba(16, 24, 40, 0.12);
          --surface: #ffffff;
          --surface-muted: #fbfdff;
          --stroke: #eef2f7;
          --text: #0b2440;
          --text-muted: #6b7280;
          --brand: #4F7689;
        }
        .surface { background: var(--surface); border: 1px solid var(--stroke); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
        .head-flat { padding: 12px 16px; background: var(--surface-muted); border-bottom: 1px solid var(--stroke); color: var(--text); font-weight: 700; }
        .body-flat { padding: 16px; }
        .muted { color: var(--text-muted); }

        .grid-cards { display:grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap:12px; }
        @media (max-width:1200px){ .grid-cards{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width:576px){ .grid-cards{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .stat-card { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px 12px; border-radius: calc(var(--radius) - 2px); color:#fff; text-align:center; min-height:92px; box-shadow: 0 8px 18px rgba(0,0,0,.08); transition: transform .15s ease, box-shadow .2s ease, filter .2s ease; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); filter: brightness(1.02); }
        .stat-value { margin:0 0 4px; font-weight:800; font-size:1.35rem; letter-spacing:.2px; }
        .stat-title { font-size:.9rem; opacity:.95; }

        /* Skeletons */
        .skeleton { position:relative; overflow:hidden; background:#e9edf3; border-radius: calc(var(--radius) - 2px); }
        .skeleton::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%); animation:shimmer 1.4s infinite; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .skeleton-card { height:92px; }
        .line-skel { height:10px; border-radius:999px; background:#e9edf3; position:relative; overflow:hidden; }
        .circle-skel { border-radius:50%; background:#e9edf3; position:relative; overflow:hidden; }

        /* KPI */
        .kpi-grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:12px; }
        @media (max-width:992px){ .kpi-grid { grid-template-columns: 1fr; } }
        .kpi { display:flex; align-items:center; gap:12px; padding:14px; border:1px solid var(--stroke); border-radius: calc(var(--radius) - 2px); background: var(--surface); box-shadow: 0 6px 14px rgba(16,24,40,0.06); }
        .kpi .ring { width:44px; height:44px; }
        .kpi .vals { display:flex; flex-direction:column; }
        .kpi .label { font-size:.95rem; font-weight:700; color:var(--text); }
        .kpi .sub { font-size:.8rem; color: var(--text-muted); }

        /* KPI skeleton */
        .kpi-skeleton { display:flex; align-items:center; gap:12px; padding:14px; border:1px solid var(--stroke); border-radius: calc(var(--radius) - 2px); background: var(--surface); box-shadow: 0 6px 14px rgba(16,24,40,0.06); }
        .kpi-skeleton .ring-skel { width:44px; height:44px; }
        .kpi-skeleton .text-skel { flex:1; display:flex; flex-direction:column; gap:8px; }

        /* Donut + legend */
        .legend-grid { display:grid; grid-template-columns: 1fr 120px 90px; gap:8px; }
        @media (max-width:768px){ .legend-grid { grid-template-columns: 1fr 100px 80px; } }
        .legend-row { display:contents; }
        .legend-label { display:flex; align-items:center; gap:8px; font-weight:700; color: var(--text); }
        .legend-dot { width:12px; height:12px; border-radius:3px; display:inline-block; }
        .legend-count, .legend-pct { text-align:left; color: var(--text-muted); align-self:center; font-variant-numeric: tabular-nums; }

        /* Donut skeleton */
        .donut-skeleton { display:flex; align-items:center; gap:16px; width:100%; }
        .donut-skeleton .donut { width:220px; height:220px; }
        .donut-skeleton .legend { flex:1; display:grid; grid-template-columns: 1fr; gap:10px; }
        .legend-line { display:flex; align-items:center; gap:10px; }

        /* Recent table */
        .table-card { background: var(--surface); border:1px solid var(--stroke); border-radius: var(--radius); box-shadow: var(--shadow); overflow:hidden; }
        .table-card .head { padding:12px 16px; border-bottom:1px solid var(--stroke); background: var(--surface-muted); display:flex; justify-content:space-between; align-items:center; font-weight:700; }
        .table-card .body { padding:6px 0; }
        .table-row { display:grid; grid-template-columns: 1fr 160px 180px; gap:12px; padding:10px 16px; align-items:center; border-bottom:1px solid #f1f4f8; }
        .table-row:last-child { border-bottom:none; }
        @media (max-width:768px){ .table-row { grid-template-columns: 1fr; gap:6px; padding:12px 14px; } }
        .badge-soft { padding:4px 10px; border-radius:999px; font-size:.8rem; border:1px solid; }
        .badge-approved { color:#0f5132; border-color:#badbcc; background:#d1e7dd; }
        .badge-rejected { color:#842029; border-color:#f5c2c7; background:#f8d7da; }
        .badge-completed{ color:#055160; border-color:#b6effb; background:#cff4fc; }
        .badge-underwork{ color:#664d03; border-color:#ffecb5; background:#fff3cd; }
        .badge-notstarted{ color:#383d41; border-color:#d6d8db; background:#e2e3e5; }

        .btn-ghost { border:1px solid var(--stroke); background: #fff; color: var(--text); padding:.35rem .75rem; border-radius: 10px; font-size:.9rem; transition: transform .15s ease, background .2s ease, box-shadow .2s ease; }
        .btn-ghost:hover { transform: translateY(-1px); background:#f7f9fc; box-shadow: 0 6px 12px rgba(16,24,40,0.06); }

        .table-card.compact .head { padding: 12px 18px; }
        .table-card.compact .body { padding: 4px; }
        .table-row.compact { grid-template-columns: 1fr 128px 116px; gap: 12px; padding: 16px; }
        @media (max-width: 992px) { .table-row.compact { grid-template-columns: 1fr 120px 100px; } }
        @media (max-width: 576px) { .table-row.compact { grid-template-columns: 1fr; padding: 12px 14px; gap: 8px; } }

        .cell-title { min-width: 0; display: flex; align-items: center; gap: 8px; }
        .cell-title i { font-size: 14px; opacity: .9; }
        .cell-title .name { font-weight: 700; font-size: 0.98rem; }
        .cell-title .sep { margin: 0 4px; opacity: .5; }
        .cell-title .truncate { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .cell-date { font-size: .85rem; color: var(--text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; text-align: start; }
        .cell-status { text-align: end; }

        .cell-meta { display: none; }
        @media (max-width: 576px) {
          .cell-date, .cell-status { display: none; }
          .cell-meta { display:flex; align-items:center; justify-content:space-between; gap:10px; }
          .cell-meta .date { font-size: .82rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
          .cell-meta .badge-soft { padding: 3px 8px; font-size: .72rem; }
        }

        .row-skeleton { padding: 16px; border-bottom:1px solid #f1f4f8; }
        .row-skeleton:last-child { border-bottom:none; }
        .row-skeleton .top { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
        .row-skeleton .bottom { display:flex; justify-content:space-between; gap:12px; }
        .badge-skel { width:90px; height:22px; border-radius:999px; }
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

              {/* Summary */}
              <div className="row justify-content-center">
                <div className="col-12 col-xl-10">
                  <div className="surface mb-4" aria-busy={loading}>
                    <div className="head-flat d-flex align-items-center justify-content-between">
                      <div className="d-flex flex-column">
                        <span>نظرة عامة على المعايير</span>
                        <small className="muted">
                          {lastUpdated
                            ? `آخر تحديث: ${new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Riyadh' }).format(lastUpdated)}`
                            : 'جاري التحميل...'}
                        </small>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
                          onClick={loadData}
                          disabled={loading}
                          aria-label="تحديث"
                          aria-busy={loading}
                        >
                          {loading ? (
                            <>
                              <Spinner size="sm" animation="border" role="status" className="ms-2" />
                              جاري التحديث...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-rotate-right" />
                              تحديث
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="body-flat">
                      {loading && (
                        <div className="grid-cards" aria-hidden={!loading}>
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

                      {!loading && hasLoadedOnce && !error && summary.total === 0 && (
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

              {/* KPIs */}
              <div className="row justify-content-center">
                <div className="col-12 col-xl-10 mb-4">
                  <div className="surface" aria-busy={loading}>
                    <div className="head-flat">مؤشرات سريعة</div>
                    <div className="body-flat">
                      {loading ? (
                        <div className="kpi-grid" aria-hidden={!loading}>
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="kpi-skeleton">
                              <div className="circle-skel ring-skel"></div>
                              <div className="text-skel">
                                <div className="line-skel" style={{ width: '120px' }} />
                                <div className="line-skel" style={{ width: '180px' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (!error && summary.total > 0) && (
                        <div className="kpi-grid">
                          <KPI label="نسبة الاعتماد" value={approvalRate} sub={`${fmt(summary.approved)} / ${fmt(summary.total)}`} />
                          <KPI label="نسبة الإكمال" value={completionRate} sub={`${fmt(summary.completed)} / ${fmt(summary.total)}`} />
                          <KPI label="نسبة تحت العمل" value={inProgressRate} sub={`${fmt(summary.underWork)} / ${fmt(summary.total)}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribution (donut + legend) */}
              <div className="row justify-content-center">
                <div className="col-12 col-xl-10 mb-4">
                  <div className="surface" aria-busy={loading}>
                    <div className="head-flat">توزيع الحالات</div>
                    <div className="body-flat d-flex flex-column flex-lg-row align-items-center gap-4">
                      {loading ? (
                        <div className="donut-skeleton" aria-hidden={!loading}>
                          <div className="circle-skel donut"></div>
                          <div className="legend">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div className="legend-line" key={i}>
                                <div className="circle-skel" style={{ width: 12, height: 12 }}></div>
                                <div className="line-skel" style={{ width: '40%' }}></div>
                                <div className="line-skel" style={{ width: '18%' }}></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (!error && summary.total > 0) && (
                        <>
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
                            <div className="legend-grid">
                              {[
                                { k: 'completed', t: 'مكتمل' },
                                { k: 'approved', t: 'معتمد' },
                                { k: 'underWork', t: 'تحت العمل' },
                                { k: 'notStarted', t: 'لم يبدأ' },
                                { k: 'rejected', t: 'غير معتمد' },
                              ].map(({ k, t }) => (
                                <div className="legend-row" key={k}>
                                  <div className="legend-label">
                                    <span className="legend-dot" style={{ backgroundColor: summaryCardColors[k] }} />
                                    {t}
                                  </div>
                                  <div className="legend-pct">{pct(summary[k], summary.total)}%</div>
                                  <div className="legend-count"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent updates */}
              <div className="row justify-content-center">
                <div className="col-12 col-xl-10 mb-5">
                  <div className="table-card compact" aria-busy={loading}>
                    <div className="head-flat">أخر التحديثات</div>
                    <div className="body">
                      {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="row-skeleton" aria-hidden={!loading}>
                            <div className="top">
                              <div className="circle-skel" style={{ width: 16, height: 16 }}></div>
                              <div className="line-skel" style={{ width: '60%' }}></div>
                            </div>
                            <div className="bottom">
                              <div className="line-skel" style={{ width: '30%' }}></div>
                              <div className="skeleton badge-skel"></div>
                            </div>
                          </div>
                        ))
                      ) : (!error && hasLoadedOnce && recentItems.length > 0) ? (
                        recentItems.map((it, idx) => {
                          const num = getStdNumber(it);
                          const name = getStdName(it);
                          const titleAttr = [num ? `معيار ${num}` : 'معيار', name].filter(Boolean).join(' — ');
                          const statusClass =
                            it.status === 'معتمد' ? 'badge-approved' :
                            it.status === 'غير معتمد' ? 'badge-rejected' :
                            it.status === 'مكتمل' ? 'badge-completed' :
                            it.status === 'تحت العمل' ? 'badge-underwork' :
                            'badge-notstarted';

                          return (
                            <div key={idx} className="table-row compact" title={titleAttr}>
                              <div className="cell-title text-truncate">
                                <i className="fas fa-file-lines" />
                                <span className="name">{num ? `معيار ${num}` : 'معيار'}</span>
                                {name ? <span className="sep">—</span> : null}
                                {name ? <span className="truncate">{name}</span> : null}
                              </div>
                              <div className="cell-date">{formatDateTimeAR(it[dateKey])}</div>
                              <div className="cell-status">
                                <span className={`badge-soft ${statusClass}`}>{it.status || 'غير محدد'}</span>
                              </div>
                              <div className="cell-meta">
                                <span className="date">{formatDateTimeAR(it[dateKey])}</span>
                                <span className={`badge-soft ${statusClass}`}>{it.status || 'غير محدد'}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (!error && hasLoadedOnce && !loading && recentItems.length === 0) ? (
                        <div className="text-center py-4 muted">لا توجد تحديثات حديثة.</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* helpers */
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
        {/* center labels */}
        <circle r={r - 28} fill="#fff" />
        <text x="0" y="-4" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0b2440">{total}</text>
        <text x="0" y="16" textAnchor="middle" fontSize="11" fill="#6b7280">الإجمالي</text>
      </g>
    </svg>
  );
}
