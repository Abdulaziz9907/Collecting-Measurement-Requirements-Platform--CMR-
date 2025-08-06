import React, { useEffect, useState } from 'react';
import { Dropdown, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
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
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import * as XLSX from 'xlsx';
import Footer from '../../../components/Footer.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Report() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [standardsData, setStandardsData] = useState([]);
  const [monthlyProgress, setMonthlyProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [totals, setTotals] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    underWork: 0,
    notStarted: 0
  });

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/standards`).then((res) => res.json()),
      fetch(`${API_BASE}/api/departments`).then((res) => res.json())
    ])
      .then(([standards, departments]) => {
        setStandardsData(standards);
        setDepartments(departments);

        const statusMap = {
          'معتمد': 'approved',
          'غير معتمد': 'rejected',
          'مكتمل': 'completed',
          'تحت العمل': 'underWork',
          'لم يبدأ': 'notStarted'
        };

        const totalCounts = {
          approved: 0,
          rejected: 0,
          completed: 0,
          underWork: 0,
          notStarted: 0
        };

        const perDept = departments.map((dep) => {
          const deptStandards = standards.filter(
            (s) => s.assigned_department_id === dep.department_id
          );
          const counts = {
            approved: 0,
            rejected: 0,
            completed: 0,
            underWork: 0,
            notStarted: 0
          };
          deptStandards.forEach((s) => {
            const key = statusMap[s.status];
            if (key) counts[key] += 1;
          });
          const total = deptStandards.length;
          const progressRate = total
            ? Math.round((counts.completed / total) * 100)
            : 0;
          Object.keys(counts).forEach((k) => (totalCounts[k] += counts[k]));
          return {
            department: dep.department_name,
            total,
            progressRate,
            ...counts
          };
        });

        setTotals({
          total: standards.length,
          ...totalCounts
        });

        setDeptStats(perDept);

        const monthly = {};
        standards.forEach((s) => {
          const created = new Date(s.created_at);
          const key = `${created.getFullYear()}-${String(
            created.getMonth() + 1
          ).padStart(2, '0')}`;
          if (!monthly[key]) monthly[key] = 0;
          monthly[key]++;
        });
        const sortedKeys = Object.keys(monthly).sort();
        setMonthlyProgress(
          sortedKeys.map((m) => ({ month: m, count: monthly[m] }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredStats =
    selectedDepartments.length === 0
      ? deptStats
      : deptStats.filter((d) => selectedDepartments.includes(d.department));

  function getSummaryData(selected, totals, _, filteredStats) {
    if (selected === 'all') {
      return [
        { key: 'total', title: 'مجموع المعايير', value: totals.total },
        { key: 'completed', title: 'معايير مكتملة', value: totals.completed },
        { key: 'approved', title: 'معايير معتمدة', value: totals.approved },
        { key: 'rejected', title: 'معايير غير معتمدة', value: totals.rejected },
        { key: 'underWork', title: 'تحت العمل', value: totals.underWork },
        { key: 'notStarted', title: 'لم يبدأ', value: totals.notStarted }
      ];
    }
    const combined = {
      total: 0,
      completed: 0,
      approved: 0,
      rejected: 0,
      underWork: 0,
      notStarted: 0
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
      { key: 'notStarted', title: 'لم يبدأ', value: combined.notStarted }
    ];
  }

  const summaryData = getSummaryData(
    selectedDepartments.length === 0 ? 'all' : 'custom',
    totals,
    totals,
    filteredStats
  );

  const statusColors = {
    completed: '#17a2b8',
    approved: '#198754',
    rejected: '#dc3545',
    underWork: '#ffc107',
    notStarted: '#6c757d'
  };
  const summaryCardColors = {
    total: '#0d6efd',
    completed: statusColors.completed,
    approved: statusColors.approved,
    rejected: statusColors.rejected,
    underWork: statusColors.underWork,
    notStarted: statusColors.notStarted
  };

  const pieData = {
    labels: summaryData.filter((s) => s.key !== 'total').map((s) => s.title),
    datasets: [
      {
        data: summaryData
          .filter((s) => s.key !== 'total')
          .map((s) => s.value),
        backgroundColor: summaryData
          .filter((s) => s.key !== 'total')
          .map((s) => summaryCardColors[s.key] || '#ccc'),
        borderWidth: 1
      }
    ]
  };

  const barChartData = {
    labels: filteredStats.map((d) => d.department),
    datasets: [
      {
        label: 'نسبة الإنجاز',
        data: filteredStats.map((d) => d.progressRate),
        backgroundColor: '#4F7689'
      }
    ]
  };

  const lineChartData = {
    labels: monthlyProgress.map((p) => p.month),
    datasets: [
      {
        label: 'مقدار التقدم الشهري',
        data: monthlyProgress.map((p) => p.count),
        fill: true,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.4
      }
    ]
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredStats.map((d) => ({
        'الإدارة': d.department,
        'المجموع': d.total,
        'مكتمل': d.completed,
        'معتمد': d.approved,
        'غير معتمد': d.rejected,
        'تحت العمل': d.underWork,
        'لم يبدأ': d.notStarted,
        'نسبة التقدم': `${d.progressRate}%`
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير الإدارات');
    XLSX.writeFile(workbook, 'تقرير_الإدارات.xlsx');
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />
      <div id="wrapper">
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
        <div className="container px-3 px-md-4 py-4 mx-auto" style={{ maxWidth: '100%' }}>
          <Breadcrumbs />
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              {/* Export + Filter Dropdown */}
              <div className="mb-3 d-flex flex-wrap gap-2">
                {['admin', 'administrator'].includes(user?.role?.toLowerCase()) && (
                  <button className="btn btn-outline-success" onClick={exportToExcel}>
                    <i className="fas fa-file-excel ms-1"></i> تصدير Excel
                  </button>
                )}
              </div>

              <div className="row mb-3">
                
                <div className="col-md-6">
                  <Dropdown show={dropdownOpen} onToggle={() => setDropdownOpen(!dropdownOpen)}>
                    <Dropdown.Toggle className="text-end" variant="outline-secondary">
                      {selectedDepartments.length === 0
                        ? 'كل الإدارات'
                        : `عدد الإدارات المختارة: ${selectedDepartments.length}`}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="p-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
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
                      {departments.map((dep) => (
                        <div className="form-check" key={dep.department_id}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`dep-${dep.department_id}`}
                            checked={selectedDepartments.includes(dep.department_name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDepartments((prev) => [...prev, dep.department_name]);
                              } else {
                                setSelectedDepartments((prev) =>
                                  prev.filter((d) => d !== dep.department_name)
                                );
                              }
                            }}
                          />
                          <label className="form-check-label" htmlFor={`dep-${dep.department_id}`}>
                            {dep.department_name}
                          </label>
                        </div>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="row g-3 mb-4 justify-content-center">
                {summaryData.map((b, i) => (
                  <div className="col-lg-2 col-md-4 col-6" key={i}>
                    <div className="p-3 rounded text-white text-center shadow-sm h-100" style={{ backgroundColor: summaryCardColors[b.key] }}>
                      <h5 className="fw-bold mb-1">{b.value.toLocaleString()}</h5>
                      <small>{b.title}</small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="row g-4 mb-4 justify-content-center">
                <div className="col-md-6">
                  <div className="bg-white p-3 rounded shadow-sm h-100">
                    <h6 className="mb-3">نسبة تقدم الإدارات</h6>
                    <div style={{ height: '250px' }}>
                      <Bar
                        data={barChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          scales: {
                            x: {
                              min: 0,
                              max: 100,
                              title: { display: true, text: 'نسبة التقدم (%)' },
                              grid: { display: false }
                            },
                            y: { grid: { display: false } }
                          },
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (ctx) => `${ctx.parsed.x}%`
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="bg-white p-3 rounded shadow-sm h-100">
                    <h6 className="mb-3 text-center">توزيع الحالات</h6>
                    <div style={{ height: '250px' }} className="mx-auto">
                      <Pie
                        data={pieData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom' }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-12">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h6 className="mb-3">مقدار التقدم الشهري</h6>
                    <div style={{ height: '300px' }}>
                      <Line
                        data={lineChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            x: { grid: { display: false } },
                            y: { beginAtZero: true, grid: { drawBorder: false } }
                          },
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (ctx) => `${ctx.parsed.y}`
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />

      <style>{`
        @media (min-width: 600px) and (max-width: 1650px) {
          #wrapper .container {
            max-width: 70% !important;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
