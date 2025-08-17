import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Header = () => {
  const navigate = useNavigate();
  const goHome = () => navigate('/home');

  return (
    <nav
      className="navbar py-3 ps-2 ps-md-4 pe-3"
      style={{ backgroundColor: '#F5F5F5' }}
      dir="rtl"
    >
      <style>{`
        .brand-btn {
          padding: 0;
          border: 0;
          background: transparent;
          line-height: 0;
          cursor: pointer;
        }
        .brand-img {
          display: block;
          object-fit: contain;
          transition: transform 180ms cubic-bezier(.2,.7,.3,1), filter 180ms ease;
          will-change: transform;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .brand-btn:hover .brand-img,
        .brand-btn:focus-visible .brand-img {
          transform: translateY(-1px) scale(1.03);
          filter: drop-shadow(0 1px 2px rgba(0,0,0,.06));
        }
        .brand-btn:active .brand-img {
          transform: scale(0.96);
          transition: transform 120ms cubic-bezier(.3,.7,.4,1);
        }
        .brand-btn:focus-visible {
          outline: 2px solid #0ea5e9; /* sky-500 */
          outline-offset: 4px;
          border-radius: 10px;
        }

        /* ---- Mobile: center the title ---- */
        @media (max-width: 767.98px) {
          .header-row { position: relative; }
          .header-title {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 70vw;              /* keeps it neat on small screens */
            text-align: center;
            pointer-events: none;     /* don't block taps on the logo */
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .brand-img { transition: none; }
          .brand-btn:hover .brand-img,
          .brand-btn:focus-visible .brand-img,
          .brand-btn:active .brand-img { transform: none; }
        }
      `}</style>

      <div className="container-fluid ps-0 pe-0 pe-md-3">
        <div className="d-flex w-100 align-items-center justify-content-start header-row">
          <div className="d-flex align-items-center gap-2 gap-md-3 text-start">
            {/* Mobile (xs–sm): logo-only */}
            <button
              type="button"
              onClick={goHome}
              className="brand-btn d-block d-md-none"
              aria-label="العودة إلى الصفحة الرئيسية"
              title="العودة إلى الصفحة الرئيسية"
            >
              <img
                src="/assets/img/logo-only.png"
                alt="شعار المنصة"
                className="brand-img img-fluid d-block d-md-none"
                width="56"
                height="56"
                loading="eager"
              />
            </button>

            <button
              type="button"
              onClick={goHome}
              className="brand-btn d-none d-md-block"
              aria-label="العودة إلى الصفحة الرئيسية"
              title="العودة إلى الصفحة الرئيسية"
            >
              <img
                src="/assets/img/logo_color.png"
                alt="شعار المنصة"
                className="brand-img img-fluid d-none d-md-block"
                width="170"
                height="60"
                loading="lazy"
              />
            </button>

            <h5 className="mb-0 text-nowrap header-title" style={{ color: '#010B38' }}>
              منصة التحول الرقمي
            </h5>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
