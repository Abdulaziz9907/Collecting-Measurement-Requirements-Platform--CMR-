import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const map = {
  standards: { label: ' معايير التحول' },
  standards_create: { label: 'إضافة معيار جديد', parent: 'standards' },
  standards_edit: { label: 'تعديل معيار', parent: 'standards' },
  departments: { label: 'إدارة الجهات' },
  departments_create: { label: 'إنشاء جهة جديدة', parent: 'departments' },
  departments_edit: { label: 'تعديل جهة', parent: 'departments' },
  reports: { label: 'تقارير الإحصائيات' },
  users: { label: 'إدارة المستخدمين' },
  users_create: { label: 'إنشاء مستخدم ', parent: 'users' },
  users_edit: { label: 'تعديل مستخدم ', parent: 'users' },
  profile: { label: 'الملف الشخصي ' }
};

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = [{ path: '/home', label: 'الرئيسية' }];

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
    <nav aria-label="breadcrumb" dir="rtl" className="breadcrumbs-nav">
      {/* تصغير الحجم على الموبايل فقط */}
      <style>{`
        /* ديسكتوب (تقريبًا مثل h5) */
        @media (min-width: 992px) {
          .breadcrumbs-nav { font-size: 1.25rem; }
        }
        /* تابلت */
        @media (min-width: 576px) and (max-width: 991.98px) {
          .breadcrumbs-nav { font-size: 1rem; }
        }
        /* موبايل */
        @media (max-width: 575.98px) {
          .breadcrumbs-nav { font-size: 0.99rem; }
          .breadcrumbs-nav .breadcrumb { padding-top: .125rem !important; padding-bottom: .125rem !important; }
          .breadcrumbs-nav .breadcrumb .sep { margin: 0 .25rem !important; }
          .breadcrumbs-nav .crumb-label {
            display: inline-block;
            max-width: 42vw;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            vertical-align: bottom;
          }
        }
      `}</style>

      <ol className="breadcrumb custom-breadcrumb px-0 py-1 text-muted m-0">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <li
              key={idx}
              className={`d-flex align-items-center ${isLast ? 'fw-semibold text-dark' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {!isLast ? (
                <Link to={crumb.path} className="text-decoration-none text-muted crumb-label">
                  {crumb.label}
                </Link>
              ) : (
                <span className="crumb-label">{crumb.label}</span>
              )}
              {!isLast && <span className="mx-2 text-muted sep">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
