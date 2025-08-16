import React from 'react';
import useTranslation from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const t = useTranslation();
  const { language } = useLanguage();
  return (
    <nav className="navbar py-3 px-4 text-center" style={{ backgroundColor: '#0f172a' }}>
      <div className="container-fluid d-flex align-items-center justify-content-center">

<<<<<<< HEAD
      <nav className="navbar py-3 px-4 text-center" style={{ backgroundColor: '#0f172a' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="container-fluid d-flex align-items-center justify-content-center">
          <h6
            className="fw-light mt-1 mb-1 footer-text"
            style={{ color: '#ddddddff', fontSize: '16px' }}
          >
            {t('footerRights')}
          </h6>
        </div>
      </nav>
    </>
=======
        
            <h6 className=" fw-light mt-1 mb-1 " style={{ color: '#ddddddff' ,fontSize: '16px'}}>
جميع الحقوق محفوظة للهيئة الملكية للجبيل وينبع 2025م
            </h6>

      </div>
    </nav>
>>>>>>> parent of 4d8be48 (UI improments)
  );
};

export default Footer;
