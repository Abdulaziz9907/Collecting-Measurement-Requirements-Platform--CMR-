import React from 'react';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Footer = () => {
  return (
    <nav
      className="navbar py-3 px-4 shadow-sm"
      style={{
        background: 'linear-gradient(90deg, var(--secondary-bg) 0%, var(--primary-bg) 100%)',
        color: '#fff'
      }}
      dir="rtl"
    >
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
            <h5 className="mb-0">منصة التحول الرقمي</h5>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Footer;
