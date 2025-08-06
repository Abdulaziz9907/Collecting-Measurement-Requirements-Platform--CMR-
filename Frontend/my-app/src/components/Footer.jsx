import React from 'react';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Footer = () => {
  return (
    <nav className="navbar py-3 px-4" style={{ backgroundColor: '#010B38' }} dir="rtl">
      <div className="container-fluid d-flex align-items-center justify-content-between">

        {/* Logo + Title (Right aligned in RTL) */}
        <div className="d-flex align-items-center gap-3">
          <img
            src="/assets/img/logo_white.png"
            alt="Logo"
            className="img-fluid"
            style={{ width: '170px', objectFit: 'contain' }}
          />
          <div className="d-flex flex-column justify-content-center">
            <h5 className="mb-0" style={{ color: '#fff' }}>
              منصة التحول الرقمي
            </h5>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Footer;
