import React from 'react';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Footer = () => {
  return (
    <>
      <style>{`
        /* Footer base */
        .app-footer {
          background: #0f172a;   /* footer bg */
          color: #ddddddff;
        }

        /* Paint the iOS home-indicator safe area with the SAME bg */
        .app-footer::after {
          content: "";
          display: block;
          height: env(safe-area-inset-bottom, 0px);
          /* inherits background from .app-footer, so it looks seamless */
        }

        /* Keep normal padding but include safe-area on iOS */
        @supports (padding: max(0px)) {
          .app-footer {
            padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0px));
          }
        }

        .footer-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 16px;
        }
        @media (max-width: 576px) {
          .footer-text { font-size: 13px !important; }
        }
      `}</style>

      {/* Use a custom class so the styles above apply */}
      <nav className="navbar app-footer py-3 px-4 text-center" role="contentinfo" dir="rtl">
        <div className="container-fluid d-flex align-items-center justify-content-center">
          <h6 className="fw-light mt-1 mb-1 footer-text">
            جميع الحقوق محفوظة للهيئة الملكية للجبيل وينبع 2025م
          </h6>
        </div>
      </nav>
    </>
  );
};

export default Footer;