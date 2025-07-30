import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const map = {
  standards: { label: ' معايير التحول' },
  standards_create: { label: 'إضافة معيار جديد', parent: 'standards' },
  standards_edit: { label: 'تعديل بيانات المعيار', parent: 'standards' },
  departments: { label: 'إدارة الجهات' },
  reports: { label: 'تقارير الإحصائيات' }
};

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = [{ path: '/', label: 'الرئيسية' }];

  const mainSeg = segments.find(seg => !/^\d+$/.test(seg));
  if (mainSeg) {
    const info = map[mainSeg];
    if (info?.parent) {
      const parentInfo = map[info.parent];
      breadcrumbs.push({ path: '/' + info.parent, label: parentInfo?.label || info.parent });
    }
    if (info) {
      breadcrumbs.push({ path: '/' + mainSeg, label: info.label });
    }
  }

  return (
    <nav aria-label="breadcrumb" dir="rtl" className="h4">
      <ol className="breadcrumb custom-breadcrumb px-0 py-1 small text-muted m-0">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <li
              key={idx}
              className={`d-flex align-items-center ${isLast ? 'fw-semibold text-dark' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {!isLast ? (
                <Link to={crumb.path} className="text-decoration-none text-muted">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {!isLast && <span className="mx-2 text-muted">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
