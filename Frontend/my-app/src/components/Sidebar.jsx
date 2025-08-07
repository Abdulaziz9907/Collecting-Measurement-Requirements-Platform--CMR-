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
      {
        href: '/',
        icon: faArrowRightFromBracket,
        label: 'تسجيل خروج',
        onClick: () => localStorage.removeItem('user'),
        isLogout: true,
      },
    ];
  } else if (role === 'user') {
    navItems = [
      { href: '/home', icon: faHome, label: 'الرئيسية' },
      { href: '/standards', icon: faList, label: 'معايير التحول' },
      {
        href: '/',
        icon: faArrowRightFromBracket,
        label: 'تسجيل خروج',
        onClick: () => localStorage.removeItem('user'),
        isLogout: true,
      },
    ];
  } else if (role === 'management') {
    navItems = [
      { href: '/home', icon: faHome, label: 'الرئيسية' },
      { href: '/reports', icon: faChartPie, label: 'الإحصائيات' },
      {
        href: '/',
        icon: faArrowRightFromBracket,
        label: 'تسجيل خروج',
        onClick: () => localStorage.removeItem('user'),
        isLogout: true,
      },
    ];
  }

  // Collapse on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && sidebarVisible) {
        setSidebarVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible]);

  // Hamburger styles
  const buttonStyles = {
    zIndex: 1040,
    background: sidebarVisible
      ? 'linear-gradient(135deg, #5a5a5aff 0%, #4e4e4eff 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    border: sidebarVisible ? '1px solid #535353ff' : '1px solid #dee2e6',
    padding: '8px 10px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '42px',
    height: '42px',
    boxShadow: sidebarVisible
      ? '0 4px 15px rgba(58, 58, 58, 0.3)'
      : '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
  };

  const barColor = sidebarVisible ? '#fff' : '#495057';

  return (
    <>
      {sidebarVisible && (
        <div
          className="position-fixed top-0 start-0 d-md-none"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1020,
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setSidebarVisible(false)}
        />
      )}

      <button
        type="button"
        className="position-fixed top-0 start-0 m-3 d-md-none"
        style={buttonStyles}
        onClick={() => setSidebarVisible(prev => !prev)}
        aria-label="Toggle sidebar"
        onMouseEnter={e => {
          if (!sidebarVisible) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }
        }}
        onMouseLeave={e => {
          if (!sidebarVisible) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '22px',
              height: '2px',
              backgroundColor: barColor,
              margin: '3px 0',
              borderRadius: '1px',
              transition: '0.3s',
            }}
          />
        ))}
      </button>

      {/* Mobile Sidebar */}
      <div
        className="text-white position-fixed top-0 start-0 h-100 d-md-none"
        style={{
          width: '240px',
          background: 'linear-gradient(180deg, #444444ff 0%, #414141ff 100%)',
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          opacity: sidebarVisible ? 1 : 0,
          pointerEvents: sidebarVisible ? 'auto' : 'none',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1025,
          boxShadow: sidebarVisible ? '4px 0 20px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        <ul className="navbar-nav p-0 mt-5 pt-4 w-100">
          {navItems.map((item, idx) => {
            const isActive =
              (location.pathname.startsWith(item.href) && item.href !== '/') ||
              location.pathname === item.href;
            return (
              <li className="nav-item p-0 m-0" key={idx}>
                <Link
                  className={`sidebar-link-mobile ${isActive ? 'active' : ''} ${
                    item.isLogout ? 'logout' : ''
                  }`}
                  to={item.href}
                  onClick={() => {
                    setSidebarVisible(false);
                    item.onClick?.();
                  }}
                >
                  <FontAwesomeIcon icon={item.icon} className="me-2" style={{ fontSize: '1.2rem' }} />
                  <span className="me-2">{item.label}</span>
                  {isActive && <div className="active-dot" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop Sidebar */}
      <nav
        className="navbar align-items-start p-0 sidebar sidebar-dark accordion navbar-dark d-none d-md-block"
        style={{
          width: '240px',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div className="container-fluid d-flex flex-column p-0">
          <hr className="my-0 sidebar-divider" />
          <ul className="navbar-nav text-light mt-4 w-100" id="accordionSidebar">
            {navItems.map((item, idx) => {
              const isActive =
                (location.pathname.startsWith(item.href) && item.href !== '/') ||
                location.pathname === item.href;
              return (
                <li className="nav-item" key={idx}>
                  <Link
                    className={`nav-link d-flex align-items-center sidebar-link ${
                      isActive ? 'active' : ''
                    } ${item.isLogout ? 'logout' : ''}`}
                    to={item.href}
                    onClick={() => item.onClick?.()}
                  >
                    <FontAwesomeIcon icon={item.icon} className="me-2" style={{ fontSize: '1.2rem' }} />
                    <span className="me-2" style={{ fontSize: '15px' }}>{item.label}</span>
                    {isActive && <div className="active-dot" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Styles */}
      <style>{`
  .sidebar-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease, box-shadow 0.3s ease;
    padding: 12px 24px;
    border-radius: 12px;
    margin: 4px auto;
    font-size: 15px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
  }

  .sidebar-link:hover {
    background: rgba(255, 255, 255, 0.16);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
    transform: none;
  }

  .sidebar-link.active {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #fff !important;
    box-shadow: 0 6px 14px rgba(59, 130, 246, 0.3);
    transform: none;
  }

  .sidebar-link.logout {
    color: #ef4444 !important;
  }

  .sidebar-link.logout:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626 !important;
  }

  .sidebar-link-mobile {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    position: relative;
    transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
    border-radius: 12px;
    margin: 4px 16px;
  }

  .sidebar-link-mobile:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: none;
  }

  .sidebar-link-mobile.active {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: none;
  }

  .sidebar-link-mobile.logout {
    color: #ff6b6b;
  }

  .sidebar-link-mobile.logout:hover {
    background: rgba(255, 107, 107, 0.1);
    color: #ff5252;
  }

  .active-dot {
    width: 8px;
    height: 8px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
    animation: pulse 1s infinite ease-in-out;
  }

  @keyframes pulse {
    0% { transform: translateY(-50%) scale(1); }
    50% { transform: translateY(-50%) scale(1.2); }
    100% { transform: translateY(-50%) scale(1); }
  }

  .sidebar-divider {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    height: 1px;
    border: none;
    margin: 0 24px;
  }

  .navbar-nav::-webkit-scrollbar {
    width: 6px;
  }
  .navbar-nav::-webkit-scrollbar-track {
    background: transparent;
  }
  .navbar-nav::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  .navbar-nav::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 767px) {
    .sidebar-link-mobile {
      margin: 3px 12px;
      padding: 10px 18px;
    }
  }
`}</style>
    </>
  );
}
