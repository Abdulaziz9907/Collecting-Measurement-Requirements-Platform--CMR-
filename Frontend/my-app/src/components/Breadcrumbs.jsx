import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useTranslation from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';

export default function Breadcrumbs() {
  const location = useLocation();
  const t = useTranslation();
  const { language } = useLanguage();
  const map = {
    standards: { label: t('standards') },
    standards_create: { label: t('addStandard'), parent: 'standards' },
    standards_edit: { label: t('editStandard'), parent: 'standards' },
    departments: { label: t('departments') },
    departments_create: { label: t('addDepartment'), parent: 'departments' },
    departments_edit: { label: t('editDepartment'), parent: 'departments' },
    reports: { label: t('reports') },
    users: { label: t('users') },
    users_create: { label: t('addUser'), parent: 'users' },
    users_edit: { label: t('editUser'), parent: 'users' },
    profile: { label: t('profile') }
  };
  const segments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = [{ path: '/home', label: t('home') }];

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
    <nav aria-label="breadcrumb" dir={language === 'ar' ? 'rtl' : 'ltr'} className="breadcrumbs-nav">
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
