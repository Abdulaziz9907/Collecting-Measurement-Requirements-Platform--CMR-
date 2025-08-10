import React from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

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
            width="170"
            height="60"
            style={{
              objectFit: 'contain',
              display: 'block'
            }}
            loading="auto"
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
