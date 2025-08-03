import React, { useEffect, useState } from 'react';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';

export default function Report() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [totals, setTotals] = useState({
    total: 0,
    progressRate: 0,
    completed: 0,
    inProgress: 0,
    underWork: 0,
    notStarted: 0
  });

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5186';

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/standards`).then(res => res.json()),
      fetch(`${API_BASE}/api/departments`).then(res => res.json())
    ])
      .then(([standards, departments]) => {
        setDepartments(departments);
        const statusMap = {
          'مكتمل': 'completed',
          'قيد التنفيذ': 'inProgress',
          'قيد العمل': 'inProgress',
          'تحت العمل': 'underWork',
          'لم يبدأ': 'notStarted'
        };
        const totalCounts = {
          completed: 0,
          inProgress: 0,
          underWork: 0,
          notStarted: 0
        };
        const perDept = departments.map(dep => {
          const deptStandards = standards.filter(s => s.assigned_department_id === dep.department_id);
          const counts = { completed: 0, inProgress: 0, underWork: 0, notStarted: 0 };
          deptStandards.forEach(s => {
            const key = statusMap[s.status];
            if (key) {
              counts[key] += 1;
            }
          });
          const total = deptStandards.length;
          const progressRate = total ? Math.round((counts.completed / total) * 100) : 0;
          totalCounts.completed += counts.completed;
          totalCounts.inProgress += counts.inProgress;
          totalCounts.underWork += counts.underWork;
          totalCounts.notStarted += counts.notStarted;
          return {
            department: dep.department_name,
            total,
            progressRate,
            ...counts
          };
        });
        const totalAll = standards.length;
        const totalProgress = totalAll ? Math.round((totalCounts.completed / totalAll) * 100) : 0;
        setTotals({
          total: totalAll,
          progressRate: totalProgress,
          ...totalCounts
        });
        setDeptStats(perDept);
      })
      .catch(() => {
        setDepartments([]);
        setDeptStats([]);
        setTotals({ total: 0, progressRate: 0, completed: 0, inProgress: 0, underWork: 0, notStarted: 0 });
      });
  }, [API_BASE]);

  const exportPDF = () => {
    if (!window.jspdf || !window.jspdf.jsPDF) return;
    const doc = new window.jspdf.jsPDF('p', 'pt');
    doc.text('تقارير الإحصائيات', 40, 40);
    const body = deptStats.map(d => [
      d.department,
      d.total,
      d.completed,
      d.inProgress,
      d.underWork,
      d.notStarted,
      `${d.progressRate}%`
    ]);
    doc.autoTable({
      head: [['الإدارة', 'الإجمالي', 'مكتمل', 'قيد التنفيذ', 'تحت العمل', 'لم يبدأ', 'نسبة الإنجاز']],
      body,
      startY: 60
    });
    doc.save('report.pdf');
  };

  const exportExcel = () => {
    if (!window.XLSX) return;
    const ws = window.XLSX.utils.json_to_sheet(
      deptStats.map(d => ({
        Department: d.department,
        Total: d.total,
        Completed: d.completed,
        InProgress: d.inProgress,
        UnderWork: d.underWork,
        NotStarted: d.notStarted,
        ProgressRate: d.progressRate
      }))
    );
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Report');
    window.XLSX.writeFile(wb, 'report.xlsx');
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />
      <div id="wrapper">
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
        <div className="d-flex flex-column" id="content-wrapper">
          <div id="content">
            <div className="container-fluid">
              <div className="row p-4">
                <div className="col-md-12">
                  <Breadcrumbs />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-2 col-sm-4 mb-2">
                  <div className="bg-white p-3 border-top" style={{ borderTop: '3px solid #0d6efd', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h6 className="text-secondary">نسبة الإنجاز</h6>
                    <h4>{totals.progressRate}%</h4>
                  </div>
                </div>
                <div className="col-md-2 col-sm-4 mb-2">
                  <div className="bg-white p-3 border-top" style={{ borderTop: '3px solid #4F7689', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h6 className="text-secondary">إجمالي المعايير</h6>
                    <h4>{totals.total}</h4>
                  </div>
                </div>
                <div className="col-md-2 col-sm-4 mb-2">
                  <div className="bg-white p-3 border-top" style={{ borderTop: '3px solid #198754', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h6 className="text-secondary">المكتمل</h6>
                    <h4>{totals.completed}</h4>
                  </div>
                </div>
                <div className="col-md-2 col-sm-4 mb-2">
                  <div className="bg-white p-3 border-top" style={{ borderTop: '3px solid #ffc107', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h6 className="text-secondary">قيد التنفيذ</h6>
                    <h4>{totals.inProgress}</h4>
                  </div>
                </div>
                <div className="col-md-2 col-sm-4 mb-2">
                  <div className="bg-white p-3 border-top" style={{ borderTop: '3px solid #fd7e14', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h6 className="text-secondary">تحت العمل</h6>
                    <h4>{totals.underWork}</h4>
                  </div>
                </div>
                <div className="col-md-2 col-sm-4 mb-2">
                  <div className="bg-white p-3 border-top" style={{ borderTop: '3px solid #6c757d', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <h6 className="text-secondary">لم يبدأ</h6>
                    <h4>{totals.notStarted}</h4>
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-12 text-end">
                  <button className="btn btn-sm btn-outline-primary ms-2" onClick={exportPDF}>تحميل PDF</button>
                  <button className="btn btn-sm btn-outline-success" onClick={exportExcel}>تحميل Excel</button>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <div className="table-responsive bg-white p-3" style={{ borderTop: '3px solid #4F7689', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <table className="table text-center align-middle mb-0">
                      <thead>
                        <tr style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                          <th>الإدارة</th>
                          <th>الإجمالي</th>
                          <th>مكتمل</th>
                          <th>قيد التنفيذ</th>
                          <th>تحت العمل</th>
                          <th>لم يبدأ</th>
                          <th>نسبة الإنجاز</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptStats.map((d, idx) => (
                          <tr key={idx}>
                            <td>{d.department}</td>
                            <td>{d.total}</td>
                            <td>{d.completed}</td>
                            <td>{d.inProgress}</td>
                            <td>{d.underWork}</td>
                            <td>{d.notStarted}</td>
                            <td>{d.progressRate}%</td>
                          </tr>
                        ))}
                        {!deptStats.length && (
                          <tr>
                            <td colSpan="7" className="py-4">لا توجد بيانات</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <footer className="bg-white sticky-footer mt-auto py-3">
            <div className="container my-auto">
              <div className="text-center my-auto"><span>© RCJY 2025</span></div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
