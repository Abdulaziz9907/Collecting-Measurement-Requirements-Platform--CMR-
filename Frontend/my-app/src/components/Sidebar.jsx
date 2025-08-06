import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faChartPie,
  faUsers,
  faSitemap,
  faArrowRightFromBracket,
  faHome,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

export default function Sidebar() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = user?.role?.trim().toLowerCase();
  let navItems = [];

  if (role === 'admin' || role === 'administrator') {
    navItems = [
      { href: '/home', icon: faHome, label: 'الرئيسية' },
      { href: '/standards', icon: faList, label: 'معايير التحول' },
      { href: '/reports', icon: faChartPie, label: 'الإحصائيات' },
      { href: '/users', icon: faUsers, label: 'ادارة المستخدمين' },
      { href: '/departments', icon: faSitemap, label: 'ادارة الجهات' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', onClick: () => localStorage.removeItem('user'), isLogout: true },
    ];
  } else if (role === 'user') {
    navItems = [
      { href: '/home', icon: faHome, label: 'الرئيسية' },
      { href: '/standards', icon: faList, label: 'معايير التحول' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', onClick: () => localStorage.removeItem('user'), isLogout: true },
    ];
  } else if (role === 'management') {
    navItems = [
      { href: '/home', icon: faHome, label: 'الرئيسية' },
      { href: '/reports', icon: faChartPie, label: 'الإحصائيات' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', onClick: () => localStorage.removeItem('user'), isLogout: true },
    ];
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && sidebarVisible) {
        setSidebarVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible]);

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarVisible && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-md-none"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1020,
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setSidebarVisible(false)}
        />
      )}

      {/* Hamburger Button */}
      <button
        type="button"
        className="position-fixed top-0 start-0 m-3 d-md-none hamburger-btn"
        onClick={() => setSidebarVisible((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        <div className={`hamburger ${sidebarVisible ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Mobile Sidebar */}
      <div
        className={`mobile-sidebar ${sidebarVisible ? 'visible' : ''} d-md-none`}
      >
        {/* Mobile Header */}
        <div className="mobile-sidebar-header">
          <div className="d-flex align-items-center">
            <div className="user-avatar">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'مستخدم'}</div>
              <div className="user-role">{role === 'admin' ? 'مدير النظام' : role === 'management' ? 'إدارة' : 'مستخدم'}</div>
            </div>
          </div>
          <button
            className="close-btn"
            onClick={() => setSidebarVisible(false)}
            aria-label="Close sidebar"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="mobile-sidebar-divider"></div>

        <ul className="mobile-nav-list">
          {navItems.map((item, idx) => {
            const isActive =
              location.pathname.startsWith(item.href) && item.href !== '/'
                ? true
                : location.pathname === item.href;

            return (
              <li key={idx} className="mobile-nav-item">
                <Link
                  className={`mobile-nav-link ${isActive ? 'active' : ''} ${item.isLogout ? 'logout' : ''}`}
                  to={item.href}
                  onClick={() => {
                    setSidebarVisible(false);
                    item.onClick && item.onClick();
                  }}
                >
                  <div className="nav-icon">
                    <FontAwesomeIcon icon={item.icon} />
                  </div>
                  <span className="nav-text">{item.label}</span>
                  {isActive && <div className="active-indicator"></div>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop Sidebar */}
      <nav className="desktop-sidebar d-none d-md-block">
        <div className="sidebar-container">
          {/* Desktop Header */}
          <div className="desktop-sidebar-header">
            <div className="brand-logo">
              <div className="logo-icon">
                <FontAwesomeIcon icon={faHome} />
              </div>
              <div className="brand-text">نظام التحول</div>
            </div>
          </div>

          <div className="sidebar-divider"></div>

          <ul className="desktop-nav-list">
            {navItems.map((item, idx) => {
              const isActive =
                location.pathname.startsWith(item.href) && item.href !== '/'
                  ? true
                  : location.pathname === item.href;

              return (
                <li key={idx} className="desktop-nav-item">
                  <Link
                    className={`desktop-nav-link ${isActive ? 'active' : ''} ${item.isLogout ? 'logout' : ''}`}
                    to={item.href}
                    onClick={() => item.onClick && item.onClick()}
                  >
                    <div className="nav-icon">
                      <FontAwesomeIcon icon={item.icon} />
                    </div>
                    <span className="nav-text">{item.label}</span>
                    {isActive && <div className="active-indicator"></div>}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* User Info at Bottom */}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar-small">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <div className="user-details">
                <div className="user-name-small">{user?.name || 'مستخدم'}</div>
                <div className="user-role-small">{role === 'admin' ? 'مدير النظام' : role === 'management' ? 'إدارة' : 'مستخدم'}</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Styles */}
      <style>{`
        /* Hamburger Button Styles */
        .hamburger-btn {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          z-index: 1040;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;
        }

        .hamburger-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 24px;
          height: 18px;
        }

        .hamburger span {
          display: block;
          width: 20px;
          height: 2px;
          background-color: #fff;
          border-radius: 2px;
          transition: all 0.3s ease;
          margin: 2px 0;
        }

        .hamburger.active span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger.active span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.active span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        /* Mobile Sidebar Styles */
        .mobile-sidebar {
          position: fixed;
          top: 0;
          right: 0;
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
          transform: translateX(100%);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1030;
          box-shadow: -5px 0 25px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .mobile-sidebar.visible {
          transform: translateX(0);
        }

        .mobile-sidebar-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-avatar {
          width: 45px;
          height: 45px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          margin-left: 12px;
        }

        .user-info .user-name {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .user-info .user-role {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
        }

        .close-btn {
          width: 35px;
          height: 35px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .mobile-sidebar-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          margin: 0 20px;
        }

        .mobile-nav-list {
          list-style: none;
          padding: 0;
          margin: 20px 0 0 0;
          flex: 1;
        }

        .mobile-nav-item {
          margin: 0;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          position: relative;
          transition: all 0.3s ease;
        }

        .mobile-nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          transform: translateX(-5px);
        }

        .mobile-nav-link.active {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        .mobile-nav-link.logout {
          color: #ff6b6b;
          margin-top: auto;
        }

        .mobile-nav-link.logout:hover {
          background: rgba(255, 107, 107, 0.1);
          color: #ff5252;
        }

        /* Desktop Sidebar Styles */
        .desktop-sidebar {
          position: fixed;
          top: 0;
          right: 0;
          width: 260px;
          height: 100vh;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          box-shadow: -2px 0 20px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }

        .sidebar-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0;
        }

        .desktop-sidebar-header {
          padding: 25px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .brand-logo {
          display: flex;
          align-items: center;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          margin-left: 12px;
        }

        .brand-text {
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }

        .sidebar-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          margin: 0 20px;
        }

        .desktop-nav-list {
          list-style: none;
          padding: 0;
          margin: 25px 0 0 0;
          flex: 1;
        }

        .desktop-nav-item {
          margin: 0 15px 8px 15px;
        }

        .desktop-nav-link {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          border-radius: 12px;
          position: relative;
          transition: all 0.3s ease;
          font-size: 15px;
        }

        .desktop-nav-link:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          transform: translateX(-3px);
        }

        .desktop-nav-link.active {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: #fff;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .desktop-nav-link.logout {
          color: #ef4444;
        }

        .desktop-nav-link.logout:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .nav-icon {
          width: 20px;
          display: flex;
          justify-content: center;
          margin-left: 12px;
          font-size: 16px;
        }

        .nav-text {
          flex: 1;
          font-weight: 500;
        }

        .active-indicator {
          width: 4px;
          height: 20px;
          background: #fff;
          border-radius: 2px;
          position: absolute;
          right: -16px;
          top: 50%;
          transform: translateY(-50%);
        }

        .mobile-nav-link .active-indicator {
          right: 0;
        }

        /* Sidebar Footer */
        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: auto;
        }

        .user-card {
          display: flex;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .user-card:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .user-avatar-small {
          width: 35px;
          height: 35px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 14px;
          margin-left: 10px;
        }

        .user-name-small {
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .user-role-small {
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
        }

        /* Responsive Adjustments */
        @media (max-width: 767px) {
          .desktop-sidebar {
            display: none;
          }
        }

        /* Smooth Transitions */
        * {
          box-sizing: border-box;
        }

        /* RTL Support */
        [dir="rtl"] .active-indicator {
          right: auto;
          left: -16px;
        }

        [dir="rtl"] .mobile-nav-link .active-indicator {
          right: auto;
          left: 0;
        }

        /* Custom Scrollbar */
        .mobile-nav-list::-webkit-scrollbar,
        .desktop-nav-list::-webkit-scrollbar {
          width: 6px;
        }

        .mobile-nav-list::-webkit-scrollbar-track,
        .desktop-nav-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .mobile-nav-list::-webkit-scrollbar-thumb,
        .desktop-nav-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .mobile-nav-list::-webkit-scrollbar-thumb:hover,
        .desktop-nav-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}
