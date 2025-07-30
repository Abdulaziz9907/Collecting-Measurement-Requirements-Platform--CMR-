import React from 'react';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Example notification count
const notificationCount = 22;

const Header = () => {

  // Shared button styles
  const navButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#010B38',
    fontSize: '1.1rem',
    fontWeight: 500,
    padding: '6px 12px',
    transition: 'background 0.2s, color 0.2s',
    borderRadius: '6px',
  };
  const navButtonHoverStyle = {
    backgroundColor: '#f3f0fa',
  };

  return (
    <nav className="navbar py-3 px-4" style={{ backgroundColor: '#F5F5F5' }} dir="rtl">
      <div className="container-fluid d-flex align-items-center justify-content-between">

        {/* Logo + Title */}
        <div className="d-flex align-items-center gap-4 flex-shrink-0">
          <img
            src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/NJfVaftABi/3w0hbwu4_expires_30_days.png"
            alt="Logo"
            className="img-fluid d-lg-block"
            style={{ width: '170px', objectFit: 'fill' }}
          />
          <h5 style={{ color: '#010B38' }}>
            منصة التحول الرقمي  
          </h5>
        </div>

 

      </div>
    </nav>
  );
};

export default Header;
