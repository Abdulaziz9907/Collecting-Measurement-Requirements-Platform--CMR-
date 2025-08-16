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
  faUser
} from '@fortawesome/free-solid-svg-icons';
import useTranslation from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const location = useLocation();
  const t = useTranslation();
  const { language } = useLanguage();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = user?.role?.trim().toLowerCase();
  let navItems = [];

  if (role === 'admin' || role === 'administrator') {
    navItems = [
      { href: '/home', icon: faHome, label: t('home') },
      { href: '/standards', icon: faList, label: t('standards') },
      { href: '/reports', icon: faChartPie, label: t('reports') },
      { href: '/users', icon: faUsers, label: t('users') },
      { href: '/departments', icon: faSitemap, label: t('departments') },
      { href: '/profile', icon: faUser, label: t('profile') },
      { href: '/', icon: faArrowRightFromBracket, label: t('logout'), onClick: () => localStorage.removeItem('user'), isLogout: true },
    ];
  } else if (role === 'user') {
    navItems = [
      { href: '/home', icon: faHome, label: t('home') },
      { href: '/standards', icon: faList, label: t('standards') },
      { href: '/profile', icon: faUser, label: t('profile') },
      { href: '/', icon: faArrowRightFromBracket, label: t('logout'), onClick: () => localStorage.removeItem('user'), isLogout: true },
    ];
  } else if (role === 'management') {
    navItems = [
      { href: '/home', icon: faHome, label: t('home') },
      { href: '/reports', icon: faChartPie, label: t('reports') },
      { href: '/profile', icon: faUser, label: t('profile') },
      { href: '/', icon: faArrowRightFromBracket, label: t('logout'), onClick: () => localStorage.removeItem('user'), isLogout: true },
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
    background: sidebarVisible 
      ? 'linear-gradient(135deg, #333333ff 0%, #2c2c2cff 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    border: sidebarVisible ? '1px solid #313131ff' : '1px solid #dee2e6',
    padding: '8px 10px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '42px',
    height: '42px',
    boxShadow: sidebarVisible 
      ? '0 4px 15px rgba(43, 43, 43, 0.3)' 
      : '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
  };

  const barColor = sidebarVisible ? '#fff' : '#495057';

  return (
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
              borderRadius: '1px',
              transition: '0.3s',
            }}
          />
        ))}
      </button>

      {/* Mobile Sidebar (same look as desktop) */}
      <div
        className="text-white position-fixed top-0 start-0 h-100 d-md-none"
        style={{
          width: '240px',
          background: 'linear-gradient(180deg, #0f172aff 0%, #1e293b 100%)', 
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
              location.pathname.startsWith(item.href) && item.href !== '/'
                ? true
                : location.pathname === item.href;

            return (
              <li className="nav-item p-0 m-0" key={idx}>
                <Link
                  className={`sidebar-link ${isActive ? 'active' : ''} ${item.isLogout ? 'logout' : ''}`}
                  to={item.href}
                  onClick={() => {
                    setSidebarVisible(false);
                    item.onClick && item.onClick();
                  }}
                >
                  <FontAwesomeIcon icon={item.icon} className="me-2" style={{ fontSize: '1.2rem' }} />
                  <span className="me-2">{item.label}</span>
                  {isActive && <div className="active-dot"></div>}
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
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div className="container-fluid d-flex flex-column p-0 ">
          <hr className="my-0 sidebar-divider" />
          <ul className="navbar-nav text-light mt-4 w-100" id="accordionSidebar">
            {navItems.map((item, idx) => {
              const isActive =
                location.pathname.startsWith(item.href) && item.href !== '/'
                  ? true
                  : location.pathname === item.href;

              return (
                <li className="nav-item" key={idx}>
                  <Link
                    className={`nav-link d-flex align-items-center sidebar-link ${isActive ? 'active' : ''} ${item.isLogout ? 'logout' : ''}`}
                    to={item.href}
                    onClick={() => item.onClick && item.onClick()}
                  >
                    <FontAwesomeIcon icon={item.icon} className="me-2" style={{ fontSize: '1.2rem' }} />
                    <span className="me-2" style={{ fontSize: '15px' }}>{item.label}</span>
                    {isActive && <div className="active-dot"></div>}
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
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  position: relative;
  transition: all 0.3s ease;
  white-space: nowrap;
  text-decoration: none; /* remove underline */
}

.sidebar-link:hover {
  text-decoration: none; /* prevent underline on hover */
  background: rgba(255, 255, 255, 0.08);
}

.sidebar-link.active {
  background: #778fc24d;
  color: #fff !important;
}

.sidebar-link.logout {
  color: #ef4444 !important;
}

.sidebar-link.logout:hover {
  background: rgba(239, 68, 68, 0.1);
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

        }
      `}</style>
    </div>
  );
}
