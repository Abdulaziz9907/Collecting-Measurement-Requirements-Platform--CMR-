import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/fonts/fontawesome-all.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';
import Footer from '../../../components/Footer.jsx';
import { getStoredUser } from '../../../utils/auth';

export default function Home() {
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
  const [departmentsMap, setDepartmentsMap] = useState(new Map());
  const [deptLoading, setDeptLoading] = useState(false);

  const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(new RegExp('/+$'), '');
  const user = useMemo(() => getStoredUser(), []);

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
  const LOAD_MIN_MS = 450;
  const loadSeqRef = useRef(0);

  const loadData = async () => {
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
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const elapsed = now - t0;
      const finish = () => { if (loadSeqRef.current === seq) setLoading(false); };
      if (elapsed < LOAD_MIN_MS) setTimeout(finish, LOAD_MIN_MS - elapsed); else finish();
    }
  };

  useEffect(() => {
    loadData();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [API_BASE]);
  useEffect(() => {
    let ac = new AbortController();
    (async () => {
      try {
        setDeptLoading(true);
        const res = await fetch(`${API_BASE}/api/departments`, { signal: ac.signal });
        if (!res.ok) throw new Error('dept fetch failed');
        const arr = await res.json();
        const map = new Map(
          (arr || []).map(d => {
            const id = d?.id ?? d?.department_id;
            const name = d?.name ?? d?.department_name ?? d?.title ?? `إدارة (${id ?? 'غير معروف'})`;
            return [id, name];
          })
        );
        setDepartmentsMap(map);
      } catch (_) {
      } finally {
        setDeptLoading(false);
      }
    })();
    return () => ac.abort();
  }, [API_BASE]);

  const ar = 'ar-SA';
  const fmt = (n) => Number(n || 0).toLocaleString(ar);
  const pct = (num, den) => {
    const p = den > 0 ? Math.round((num / den) * 100) : 0;
    return Math.max(0, Math.min(100, p));
  };

  
  const TIMEZONE = 'Asia/Riyadh';
  const parseToDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val) ? null : val;
    if (typeof val === 'string') {
      const s = val.trim().replace(' ', 'T');
      const hasTZ = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
      const normalized = hasTZ ? s : `${s}Z`;
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

  const getStdNumber = (s) =>
    s?.standard_number ?? s?.standardNo ?? s?.number ?? s?.code ?? s?.ref ?? s?.id ?? null;

  const getStdName = (s) =>
    s?.name ?? s?.title ?? s?.standard_name ?? s?.display_name ?? null;

  const dateKey = standardsRaw?.[0] && ('updated_at' in standardsRaw[0] ? 'updated_at' :
                                        ('created_at' in standardsRaw[0] ? 'created_at' : null));

  const recentAll = useMemo(() => {
    if (!dateKey) return [];
    return [...standardsRaw]
      .filter(x => x && x[dateKey])
      .sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]));
  }, [standardsRaw, dateKey]);
  const role = (user?.role || '').toString().toLowerCase();
  const isManagement = role === 'management' || role === 'managment';
  const isUsersRole = role === 'user';

  const recentItems = useMemo(() => recentAll.slice(0, 5), [recentAll]);

  const distItems = useMemo(() => ([
    { key: 'completed',  label: 'مكتمل',     value: summary.completed,  color: summaryCardColors.completed,  pct: pct(summary.completed, summary.total) },
    { key: 'approved',   label: 'معتمد',     value: summary.approved,   color: summaryCardColors.approved,   pct: pct(summary.approved,  summary.total) },
    { key: 'underWork',  label: 'تحت العمل', value: summary.underWork,  color: summaryCardColors.underWork,  pct: pct(summary.underWork, summary.total) },
    { key: 'notStarted', label: 'لم يبدأ',   value: summary.notStarted, color: summaryCardColors.notStarted, pct: pct(summary.notStarted, summary.total) },
    { key: 'rejected',   label: 'غير معتمد', value: summary.rejected,   color: summaryCardColors.rejected,   pct: pct(summary.rejected,  summary.total) },
  ]), [summary, summaryCardColors]);
  const representedLabel =
    departmentsMap.get(user?.department_id) ||
    user?.department_name ||
    user?.department?.name ||
    (user?.department_id ? `إدارة (${user.department_id})` : 'غير محدد');

  return (
    <div
      dir="rtl"
      className="min-vh-100 d-flex flex-column"
      style={{
        fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
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
        .stat-value { margin:0 0 4px; font-weight:800; font-size:1.35rem; }
        .stat-title { font-size:.9rem; opacity:.95; }

        
        .skeleton { position:relative; overflow:hidden; background:#e9edf3; border-radius: calc(var(--radius) - 2px); }
        .skeleton::after { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%); animation:shimmer 1.4s infinite; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .skeleton-card { height:92px; }
        .line-skel { height:10px; border-radius:999px; background:#e9edf3; position:relative; overflow:hidden; }
        .circle-skel { border-radius:50%; background:#e9edf3; position:relative; overflow:hidden; }

        
        .dist-wrap { display:flex; flex-direction:column; align-items:center; gap:14px; }
        .donut-wrap { display:flex; justify-content:center; }
        .legend-grid {
          display: grid;
          grid-template-columns: max-content max-content;
          justify-content: center;
          align-items: center;
          column-gap: 16px;
          row-gap: 8px;
        }
        .legend-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          justify-self: end;
          font-weight: 800;
          color: var(--text);
          font-size: 1rem;
        }
        .legend-dot { width: 14px; height: 14px; border-radius: 4px; display: inline-block; box-shadow: inset 0 0 0 1px rgba(0,0,0,.05); }
        .legend-pct {
          justify-self: start;
          padding: 3px 8px;
          border-radius: 8px;
          background:#f1f5f9;
          color:#0b2440;
          font-variant-numeric: tabular-nums;
          font-size:.9rem;
          font-weight: 800;
          min-width: 44px;
          text-align: center;
        }

        
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

        .cell-title { min-width: 0; display:flex; align-items:center; gap:8px; }
        .cell-title i { font-size:14px; opacity:.9; }
        .cell-title .name { font-weight:700; font-size:.98rem; }
        .cell-title .sep { margin:0 4px; opacity:.5; }
        .cell-title .truncate { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        .cell-date { font-size:.85rem; color:var(--text-muted); white-space:nowrap; font-variant-numeric:tabular-nums; text-align:start; }
        .cell-status { text-align:end; }

        .cell-meta { display:none; }
        @media (max-width:576px) {
          .cell-date, .cell-status { display:none; }
          .cell-meta { display:flex; align-items:center; justify-content:space-between; gap:10px; }
          .cell-meta .date { font-size:.82rem; color:var(--text-muted); font-variant-numeric:tabular-nums; }
          .cell-meta .badge-soft { padding:3px 8px; font-size:.72rem; }
        }

        .row-skeleton { padding:16px; border-bottom:1px solid #f1f4f8; }
        .row-skeleton:last-child { border-bottom:none; }
        .row-skeleton .top { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
        .row-skeleton .bottom { display:flex; justify-content:space-between; gap:12px; }
        .badge-skel { width:90px; height:22px; border-radius:999px; }

        
        .rep-chip{
          display:inline-flex; align-items:center; gap:8px;
          padding:4px 10px; border-radius:999px;
          background:#eef6ff; border:1px solid #dbeafe;
          font-size:.82rem; font-weight:700; color:#0b2440;
        }
        .rep-chip .muted{ color:#6b7280; font-weight:600; }
        .rep-chip i{ font-size:14px; opacity:.9; }

        
        @media (max-width: 576px) {
          .rep-chip{
            padding: 2px 8px;
            gap: 6px;
            font-size: .72rem;
            white-space: nowrap;
          }
          .rep-chip i{
            font-size: 12px;
          }
          .rep-chip .muted{
            display: none;
          }
          .rep-chip strong{
            display: inline-block;
            max-width: 60vw;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 800;
          }
          .rep-chip .spinner-border{
            width: .9rem;
            height: .9rem;
            border-width: .12rem;
          }
        }

        
      .page-spacer { height:200px; }
      `}</style>

      <Header />

      
      <div id="wrapper" style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />

        <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
          
          <div id="content" className="flex-grow-1 d-flex">
            <div className="container-fluid d-flex flex-column">

              
              <div className="row p-4">
                <div className="col-12">
                  <Breadcrumbs />
                </div>
              </div>

              
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

                        
                        {isUsersRole && (
                          <div className="rep-chip mt-2" role="status" aria-live="polite">
                            <i className="fas fa-building" aria-hidden="true" />
                            <span className="muted">تمثيل الإدارة:</span>

                            {(loading || deptLoading) ? (
                              <span className="d-inline-flex align-items-center">
                                <Spinner size="sm" animation="border" role="status" className="ms-1" />
                                <span className="ms-2">جارِ التحميل…</span>
                              </span>
                            ) : (
                              <strong>{representedLabel}</strong>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm btn-update"
                          onClick={loadData}
                          disabled={loading}
                          aria-label="تحديث"
                          aria-busy={loading}
                        >
                          {loading ? (
                            <>
                              <Spinner size="sm" animation="border" role="status" className="ms-2" />
                               تحديث
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
                          <div className="muted mb-3">يرجى إضافة معايير جديدة للبدأ.</div>
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

              
              <div className="row justify-content-center">
                <div className="col-12 col-xl-10 mb-4">
                  <div className="surface" aria-busy={loading}>
                    <div className="head-flat">توزيع الحالات</div>
                    <div className="body-flat">
                      {loading ? (
                        <div className="dist-wrap" aria-hidden={!loading}>
                          <div className="donut-wrap">
                            <div className="circle-skel" style={{ width: 260, height: 260, borderRadius: '50%' }}></div>
                          </div>
                          <div className="legend-grid" style={{ width: '100%' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <React.Fragment key={i}>
                                <div className="legend-label">
                                  <span className="circle-skel" style={{ width: 14, height: 14, borderRadius: 4 }}></span>
                                  <div className="line-skel" style={{ width: '120px', height: 12 }}></div>
                                </div>
                                <div className="legend-pct">
                                  <div className="line-skel" style={{ width: '40px', height: 12 }}></div>
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ) : (!error && summary.total > 0) && (
                        <div className="dist-wrap">
                          <div className="donut-wrap">
                            <Donut
                              size={260}
                              thickness={22}
                              items={distItems.map(d => ({ label: d.label, value: d.value, color: d.color, pct: d.pct }))}
                              centerTop={fmt(summary.total)}
                              centerBottom="الإجمالي"
                            />
                          </div>

                          <div className="legend-grid">
                            {distItems.map(({ key, label, pct: p, color }) => (
                              <React.Fragment key={key}>
                                <div className="legend-label">
                                  <span className="legend-dot" style={{ backgroundColor: color }} />
                                  <span className="legend-text">{label}</span>
                                </div>
                                <div className="legend-pct">{p}%</div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              
              {!(role === 'management' || role === 'managment') && (
                <div className="row justify-content-center">
                  <div className="col-12 col-xl-10 mb-4">
                    <div className="table-card compact" aria-busy={loading}>
                      <div className="head-flat">أخر التحديثات</div>
                      <div className="body">
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => (
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
                          <div className="text-center py-4 muted">لا توجد تحديثات.</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              
              <div className="page-spacer" />
            </div>
          </div>

          
          <Footer />
        </div>
      </div>
    </div>
  );
}


function Donut({ size = 260, thickness = 22, items = [], centerTop, centerBottom }) {
  const total = items.reduce((a, b) => a + (b.value || 0), 0);
  const r = size / 2 - thickness;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="توزيع الحالات">
      <g transform={`translate(${center}, ${center})`}>
        <circle r={r} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
        {items.map((it, i) => {
          const raw = total ? (it.value / total) : 0;
          const len = raw * c;
          const dash = `${len} ${c - len}`;
          const arc = (
            <circle
              key={i}
              r={r}
              fill="none"
              stroke={it.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90)"
              strokeLinecap="butt"
            >
              <title>{`${it.label} — ${Math.round(raw * 100)}%`}</title>
            </circle>
          );
          offset += len;
          return arc;
        })}
        {(centerTop || centerBottom) && (
          <>
            <circle r={r - thickness} fill="#fff" />
            {centerTop && (
              <text x="0" y="-4" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0b2440">{centerTop}</text>
            )}
            {centerBottom && (
              <text x="0" y="18" textAnchor="middle" fontSize="12" fill="#6b7280">{centerBottom}</text>
            )}
          </>
        )}
      </g>
    </svg>
  );
}
