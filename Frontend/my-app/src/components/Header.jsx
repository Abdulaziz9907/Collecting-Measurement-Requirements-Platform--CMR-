import React from 'react';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Header = () => {
  return (
    <nav
      className="navbar py-3 ps-2 ps-md-4 pe-3"  // start=right in RTL
      style={{ backgroundColor: '#F5F5F5' }}
      dir="rtl"
    >
      <div className="container-fluid ps-0 pe-0 pe-md-3">
        {/* Mobile: RIGHT (start in RTL), md+: start */}
        <div className="d-flex w-100 align-items-center justify-content-start">
          {/* Brand group */}
          <div className="d-flex align-items-center gap-2 gap-md-3 text-start">
            {/* Mobile (xs–sm): logo-only */}
            <img
              src="/assets/img/logo-only.png"
              alt="Logo"
              className="img-fluid d-block d-md-none"
              width="56"
              height="56"
              style={{ objectFit: 'contain', display: 'block' }}
              loading="eager"
            />
            {/* Desktop (md+): full-color logo */}
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
              منصة التحول الرقمي
            </h5>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
