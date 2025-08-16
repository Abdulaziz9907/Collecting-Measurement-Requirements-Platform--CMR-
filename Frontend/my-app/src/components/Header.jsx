import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import useTranslation from '../hooks/useTranslation';

const Header = () => {
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslation();

  return (
    <nav
<<<<<<< HEAD
      className="navbar py-3 ps-2 ps-md-4 pe-3"
      style={{ backgroundColor: 'var(--header-bg)' }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="container-fluid ps-0 pe-0 pe-md-3">
        <div className="d-flex w-100 align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 gap-md-3 text-start">
=======
      className="navbar py-3 px-3 px-md-4"
      style={{ backgroundColor: '#F5F5F5' }}
      dir="rtl"
    >
      <div className="container-fluid">
        {/* Flex row: center on mobile, start on md+ */}
        <div className="d-flex w-100 align-items-center justify-content-center justify-content-md-start">
          {/* Brand group */}
          <div className="d-flex align-items-center gap-2 gap-md-3 mx-auto mx-md-0 text-center text-md-start">
            {/* Mobile (xs–sm): logo-only */}
>>>>>>> parent of 4d8be48 (UI improments)
            <img
              src="/assets/img/logo-only.png"
              alt="Logo"
              className="img-fluid d-block d-md-none"
              width="56"
              height="56"
              style={{ objectFit: 'contain', display: 'block' }}
              loading="eager"
            />
            <img
              src="/assets/img/logo_color.png"
              alt="Logo"
              className="img-fluid d-none d-md-block"
              width="170"
              height="60"
              style={{ objectFit: 'contain', display: 'block' }}
              loading="lazy"
            />
            <h5 className="mb-0 text-nowrap" style={{ color: '#010B38' }}>
              {t('title')}
            </h5>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={toggleTheme}>
              {theme === 'light' ? t('toggleDark') : t('toggleLight')}
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={toggleLanguage}>
              {t('toggleLang')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
