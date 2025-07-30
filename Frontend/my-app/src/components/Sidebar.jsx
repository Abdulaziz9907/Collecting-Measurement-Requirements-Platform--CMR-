import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function Sidebar() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const location = useLocation();

  const navItems = [
    { href: '/', icon: 'fas fa-home', label: 'الرئيسية' },
    { href: '/standards', icon: 'fas fa-list', label: 'معايير التحول' },
    { href: '/reports', icon: 'fas fa-chart-pie', label: 'الإحصائيات' },
    { href: '/users', icon: 'fa fa-users', label: 'ادارة المستخدمين' },
    { href: '/departments', icon: 'fas fa-sitemap', label: 'ادارة الجهات' },
    { href: '/', icon: 'fas fa-sign-out-alt', label: 'تسجيل خروج' },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && sidebarVisible) {
        setSidebarVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible]);

  const buttonStyles = {
    zIndex: 1040,
    backgroundColor: sidebarVisible ? '#222' : '#ffffff',
    border: sidebarVisible ? '1px solid #222' : '1px solid #ccc',
    padding: '8px 10px',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '42px',
    height: '42px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
    transition: 'background-color 0.3s, border 0.3s',
  };

  const barColor = sidebarVisible ? '#fff' : '#222';

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        className="position-fixed top-0 start-0 m-3 d-md-none"
        style={buttonStyles}
        onClick={() => setSidebarVisible(prev => !prev)}
        aria-label="Toggle sidebar"
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '22px',
              height: '2px',
              backgroundColor: barColor,
              margin: '3px 0',
              transition: '0.3s',
            }}
          />
        ))}
      </button>

      {/* Mobile Sidebar */}
      <div
        className="bg-dark text-white position-fixed top-0 start-0 h-100 d-md-none"
        style={{
          width: '200px',
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          opacity: sidebarVisible ? 1 : 0,
          pointerEvents: sidebarVisible ? 'auto' : 'none',
          transition: 'transform 0.4s ease, opacity 0.4s ease',
          zIndex: 1025,
          boxShadow: sidebarVisible ? '4px 0 12px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        <div className="p-3">
          <ul className="navbar-nav mt-5">
            {navItems.map((item, idx) => {
              const isActive = location.pathname.startsWith(item.href) && item.href !== '/'
                ? true
                : location.pathname === item.href;

              return (
                <li className="nav-item" key={idx}>
                  <a
                    className={`nav-link text-white d-flex align-items-center mt-4 sidebar-link ${
                      isActive ? 'active' : ''
                    }`}
                    href={item.href}
                    onClick={() => setSidebarVisible(false)}
                  >
                    <i className={`${item.icon} me-2`} style={{ fontSize: '1.25rem' }}></i>
                    <span className="me-2">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <nav
        className="navbar align-items-start p-0 sidebar sidebar-dark accordion navbar-dark d-none d-md-block"
        style={{ background: '#061736' }}
      >
        <div className="container-fluid d-flex flex-column p-0">
          <hr className="my-0 sidebar-divider" />
          <ul className="navbar-nav text-light mt-4" id="accordionSidebar">
            {navItems.map((item, idx) => {
              const isActive = location.pathname.startsWith(item.href) && item.href !== '/'
                ? true
                : location.pathname === item.href;

              return (
                <li className="nav-item" key={idx}>
                  <a
                    className={`nav-link d-flex align-items-center sidebar-link ${
                      isActive ? 'active' : ''
                    }`}
                    href={item.href}
                  >
                    <i className={`${item.icon} me-2`} style={{ fontSize: '15px' }}></i>
                    <span className="me-2" style={{ fontSize: 15 }}>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Sidebar Styles */}
      <style>{`
        .sidebar-link {
          transition: background-color 0.2s ease;
          padding: 10px 15px;
          position: relative;
        }

        .sidebar-link:hover {
          background-color: rgba(255, 255, 255, 0.15);
        }

        .sidebar-link.active {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .sidebar-link.active::after {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background-color: #fff;
        }
      `}</style>
    </>
  );
}
