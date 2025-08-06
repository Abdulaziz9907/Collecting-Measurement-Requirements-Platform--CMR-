import React, { useContext } from 'react';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { ThemeContext } from '../ThemeContext';

const notificationCount = 22;

const Header = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="navbar py-3 px-4" style={{ backgroundColor: 'var(--header-bg)' }} dir="rtl">
      <div className="container-fluid d-flex align-items-center justify-content-between">
        <button
          className="btn btn-outline-secondary"
          onClick={toggleTheme}
          style={{ color: 'var(--text-color)', borderColor: 'var(--text-color)' }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

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
            <h5 className="mb-0" style={{ color: 'var(--text-color)' }}>
              منصة التحول الرقمي
            </h5>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Header;
