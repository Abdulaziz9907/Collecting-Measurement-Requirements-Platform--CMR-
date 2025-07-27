import React from 'react';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Navigation items
const items = ['الرئيسية', 'عن المنصة', 'للتواصل'];
// Example notification count
const notificationCount = 22;

const Header = () => {
  // Cap at 99+
  const displayCount = notificationCount > 99 ? '99+' : notificationCount;

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
            className="img-fluid d-none d-lg-block"
            style={{ width: '233px', height: '65px', objectFit: 'fill' }}
          />
          <span className="fw-bold" style={{ color: '#010B38', fontSize: '14px' }}>
            منصة جمع متطلبات قياس
          </span>
        </div>

        {/* Nav items + Bell badge */}
        <div className="d-flex align-items-center gap-4 flex-shrink-0">
          {/* Inline menu for ≥lg */}
          <div className="d-none d-lg-flex align-items-center gap-4">
            {items.map((label, idx) => (
              <button
                key={idx}
                className="btn"
                style={navButtonStyle}
                onMouseOver={e => Object.assign(e.currentTarget.style, navButtonHoverStyle)}
                onMouseOut={e => Object.assign(e.currentTarget.style, navButtonStyle)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Dropdown for <lg */}
          <div className="dropdown d-flex d-lg-none">
            <button
              className="btn dropdown-toggle"
              type="button"
              id="itemsDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={navButtonStyle}
              onMouseOver={e => Object.assign(e.currentTarget.style, navButtonHoverStyle)}
              onMouseOut={e => Object.assign(e.currentTarget.style, navButtonStyle)}
            >
              القائمة
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow dropdown-menu-end animated--grow-in" aria-labelledby="itemsDropdown">
              {items.map((label, idx) => (
                <li key={idx}>
                  <button className="dropdown-item" type="button">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Bell icon with capped, auto‑sizing badge */}
          <button
            type="button"
            className="btn position-relative"
            style={navButtonStyle}
            onMouseOver={e => Object.assign(e.currentTarget.style, navButtonHoverStyle)}
            onMouseOut={e => Object.assign(e.currentTarget.style, navButtonStyle)}
            aria-label={`${displayCount} تنبيهات جديدة`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              className="bi bi-bell"
              viewBox="0 0 16 16"
            >
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m0-14.082l-.797.161A4
                4 0 0 0 4 6c0 .628-.134 2.197-.459
                3.742-.16.767-.376 1.566-.663
                2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134
                8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22
                12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68
                10.2 3 6.88 3 6c0-2.42 1.72-4.44
                4.005-4.901a1 1 0 1 1 1.99
                0A5 5 0 0 1 13 6c0 .88.32 4.2
                1.22 6"/>
            </svg>
            <span
              className="position-absolute top-0 end-0 badge rounded-pill bg-danger"
              style={{
                padding: '0.15em 0.35em',
                fontSize: '0.72rem',
                lineHeight: 1,
                textAlign: 'center',
                transform: 'translate(-25%, -50%)'
              }}
            >
              {displayCount}
              <span className="visually-hidden">{displayCount} تنبيهات جديدة</span>
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
