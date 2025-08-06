import React from 'react';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const notificationCount = 22;

const Header = () => {
  return (
    <nav className="navbar py-3 px-4" style={{ backgroundColor: '#F5F5F5' }} dir="rtl">
      <div className="container-fluid d-flex align-items-center justify-content-between">

        {/* Logo + Title */}
        <div className="d-flex align-items-center gap-3">
          <img
            src="/assets/img/logo_color.png"
            alt="Logo"
            className="img-fluid"
            loading="eager"
            fetchpriority="high"
            style={{ width: '170px', objectFit: 'contain' }}
          />
          <div className="d-flex flex-column justify-content-center">
            <h5 className="mb-0" style={{ color: '#010B38' }}>
              منصة التحول الرقمي
            </h5>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Header;
