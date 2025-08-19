import React from 'react';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Footer = () => {
  return (
    <nav
      className="navbar py-3 px-4 text-center"
      style={{
        backgroundColor: '#0f172a',
      }}
    >
      <div className="container-fluid d-flex align-items-center justify-content-center">
        <h6
          className="fw-light mt-1 mb-1 footer-text"
          style={{ color: '#ddddddff', fontSize: 16 }}
        >
          جميع الحقوق محفوظة للهيئة الملكية للجبيل وينبع 2025م
        </h6>
      </div>
    </nav>
  );
};

export default Footer;
