import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Mapping for breadcrumb labels and hierarchy
const map = {
  standards: { label: 'إدارة المعايير' },
  standards_create: { label: 'إنشاء معيار', parent: 'standards' },
  standards_edit: { label: 'تعديل بطاقة معيار', parent: 'standards' },
  departments: { label: 'الجهات' },
  reports: { label: 'الإحصائيات' }
};

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = [{ path: '/', label: 'الرئيسية' }];

  const mainSeg = segments.find(seg => !/^\d+$/.test(seg));
  if (mainSeg) {
    const info = map[mainSeg];
    if (info && info.parent) {
      const parentInfo = map[info.parent];
      breadcrumbs.push({ path: '/' + info.parent, label: parentInfo ? parentInfo.label : info.parent });
    } else if (mainSeg !== 'standards') {
      // if mapping not found and segment isn't "standards", include parent from URL
      // not needed currently but kept for extensibility
    }
    if (info) {
      breadcrumbs.push({ path: '/' + mainSeg, label: info.label });
    }
  }

  return (
    <nav aria-label="breadcrumb" dir="rtl">
      <ol className="breadcrumb mb-0">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <li
              key={idx}
              className={`breadcrumb-item${isLast ? ' active' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {isLast ? (
                crumb.label
              ) : (
                <Link to={crumb.path}>{crumb.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

