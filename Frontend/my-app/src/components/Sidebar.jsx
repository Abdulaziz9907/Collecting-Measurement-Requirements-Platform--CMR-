import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faChartPie,
  faUsers,
  faSitemap,
  faArrowRightFromBracket,
  faHome
} from '@fortawesome/free-solid-svg-icons';

export default function Sidebar() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = user?.role?.toLowerCase();
  let navItems = [];

  if (role === 'admin' || role === 'administrator') {
    navItems = [
      { href: '/standards', icon: faHome, label: 'الرئيسية' },
      { href: '/standards', icon: faList, label: 'معايير التحول' },
      { href: '/reports', icon: faChartPie, label: 'الإحصائيات' },
      { href: '/users', icon: faUsers, label: 'ادارة المستخدمين' },
      { href: '/departments', icon: faSitemap, label: 'ادارة الجهات' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', onClick: () => localStorage.removeItem('user') },
    ];
  } else if (role === 'user') {
    navItems = [
      { href: '/standards', icon: faHome, label: 'الرئيسية' },
      { href: '/standards', icon: faList, label: 'معايير التحول' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', onClick: () => localStorage.removeItem('user') },
    ];
  } else if (role === 'senior management') {
    navItems = [
      { href: '/reports', icon: faHome, label: 'الرئيسية' },
      { href: '/reports', icon: faChartPie, label: 'الإحصائيات' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', onClick: () => localStorage.removeItem('user') },
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
        onClick={() => setSidebarVisible((prev) => !prev)}
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
          width: '240px',
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          opacity: sidebarVisible ? 1 : 0,
          pointerEvents: sidebarVisible ? 'auto' : 'none',
          transition: 'transform 0.4s ease, opacity 0.4s ease',
          zIndex: 1025,
          boxShadow: sidebarVisible ? '4px 0 12px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        <ul className="navbar-nav mt-5 p-0 mt-5 w-100 ">
          {navItems.map((item, idx) => {
            const isActive =
              location.pathname.startsWith(item.href) && item.href !== '/'
                ? true
                : location.pathname === item.href;

            return (
              <li className="nav-item p-0 m-0 " key={idx}>
                <a
                  className={`sidebar-link-mobile ${isActive ? 'active' : ''} `}
                  href={item.href}
                  onClick={() => {
                    setSidebarVisible(false);
                    item.onClick && item.onClick();
                  }}
                >
                  <FontAwesomeIcon icon={item.icon} className="me-2" style={{ fontSize: '1.2rem' }} />
                  <span className="me-2">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop Sidebar */}
      <nav
        className="navbar align-items-start p-0 sidebar sidebar-dark accordion navbar-dark d-none d-md-block"
        style={{ background: '#061736' }}
      >
        <div className="container-fluid d-flex flex-column p-0">
          <hr className="my-0 sidebar-divider" />
          <ul className="navbar-nav text-light mt-4 w-100" id="accordionSidebar">
            {navItems.map((item, idx) => {
              const isActive =
                location.pathname.startsWith(item.href) && item.href !== '/'
                  ? true
                  : location.pathname === item.href;

              return (
                <li className="nav-item" key={idx}>
                  <a
                    className={`nav-link d-flex align-items-center sidebar-link ${
                      isActive ? 'active' : ''
                    }`}
                    href={item.href}
                    onClick={() => item.onClick && item.onClick()}
                  >
                    <FontAwesomeIcon icon={item.icon} className="me-2" style={{ fontSize: '1.2rem' }} />
                    <span className="me-2" style={{ fontSize: '15px' }}>{item.label}</span>
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
          padding: 10px 20px;
          position: relative;
          display: block;
          width: 100%;
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

        /* Mobile Sidebar Style Fix */
        .sidebar-link-mobile {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px 20px;
          color: #fff;
          text-decoration: none;
          position: relative;
          transition: background-color 0.2s ease;
        }

        .sidebar-link-mobile:hover {
          background-color: rgba(255, 255, 255, 0.15);
        }

        .sidebar-link-mobile.active {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .sidebar-link-mobile.active::after {
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
