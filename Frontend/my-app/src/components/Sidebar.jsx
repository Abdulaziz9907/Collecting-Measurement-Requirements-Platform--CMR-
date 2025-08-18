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
import { getStoredUser } from '../utils/auth';

export default function Sidebar() {
  // Smooth, non-bouncy timings
  const TRANSFORM_MS = 340;                 // sidebar slide duration
  const OVERLAY_MS = 240;                   // overlay fade
  const EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)'; // classic ease-in-out (no overshoot)
  const ITEM_STAGGER = 0;                   // per-item delay (ms) — removed stagger
  const ITEM_OFFSET  = 22;                  // list item slide distance (px)

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const location = useLocation();

  const user = getStoredUser();
  const role = user?.role?.trim().toLowerCase();
  let navItems = [];

  if (role === 'admin' || role === 'administrator') {
    navItems = [
      { href: '/home', icon: faHome, label: 'الرئيسية' },
      { href: '/standards', icon: faList, label: 'معايير التحول' },
      { href: '/reports', icon: faChartPie, label: 'الإحصائيات' },
      { href: '/users', icon: faUsers, label: 'ادارة المستخدمين' },
      { href: '/departments', icon: faSitemap, label: 'ادارة الجهات' },
      { href: '/profile', icon: faUser, label: 'الملف الشخصي' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', onClick: () => window.dispatchEvent(new Event('cmr:logout')), isLogout: true },
    ];
  } else if (role === 'user') {
    navItems = [
      { href: '/home', icon: faHome, label: 'الرئيسية' },
      { href: '/standards', icon: faList, label: 'معايير التحول' },
      { href: '/profile', icon: faUser, label: 'الملف الشخصي' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', onClick: () => window.dispatchEvent(new Event('cmr:logout')), isLogout: true },
    ];
  } else if (role === 'management') {
    navItems = [
      { href: '/home', icon: faHome, label: 'الرئيسية' },
      { href: '/reports', icon: faChartPie, label: 'الإحصائيات' },
      { href: '/profile', icon: faUser, label: 'الملف الشخصي' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', onClick: () => window.dispatchEvent(new Event('cmr:logout')), isLogout: true },
    ];
  }

  // Faster, more responsive toggle
  const toggleSidebar = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setSidebarVisible(prev => !prev);
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  // Close at desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && sidebarVisible) {
        setSidebarVisible(false);
        setIsAnimating(false);
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
      ? '0 8px 24px rgba(43, 43, 43, 0.35)'
      : '0 2px 8px rgba(0,0,0,0.12)',
    transition: `transform 160ms ${SLIDE_EASING}, box-shadow ${TRANSFORM_MS}ms ${SLIDE_EASING}, background ${TRANSFORM_MS}ms ${SLIDE_EASING}, border ${TRANSFORM_MS}ms ${SLIDE_EASING}`,
    transform: isAnimating ? 'scale(0.92)' : 'scale(1)',
    willChange: 'transform'
  };

  const barColor = sidebarVisible ? '#fff' : '#495057';

  return (
    <>
      {/* Mobile Overlay with faster fade */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-md-none"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1020,
          backdropFilter: 'blur(2px)',
          transition: `opacity ${OVERLAY_MS}ms ${SLIDE_EASING}`,
          opacity: sidebarVisible ? 1 : 0,
          pointerEvents: sidebarVisible ? 'auto' : 'none',
        }}
        onClick={toggleSidebar}
      />

      {/* Hamburger Button with enhanced animation */}
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
              transition: `background-color ${TRANSFORM_MS}ms ${SLIDE_EASING}, transform 180ms ${SLIDE_EASING}`,
              transform: sidebarVisible && i === 1 ? 'scaleX(0.8)' : 'scaleX(1)',
            }}
          />
        ))}
      </button>

      {/* Mobile Sidebar with improved animations */}
      <div
        className="text-white position-fixed top-0 start-0 h-100 d-md-none"
        style={{
          width: '240px',
          background: 'linear-gradient(180deg, #0f172aff 0%, #1e293b 100%)', 
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          transition: `transform ${TRANSFORM_MS}ms ${SLIDE_EASING}, box-shadow ${TRANSFORM_MS - 40}ms ${SLIDE_EASING}`,
          zIndex: 1025,
          boxShadow: sidebarVisible ? '4px 0 20px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        {/* Keep container motion if you like; items won't slide individually */}
        <div
          style={{
            height: '100%',
            transform: sidebarVisible ? 'scale(1) translateX(0)' : 'scale(0.98) translateX(-12px)',
            opacity: sidebarVisible ? 1 : 0,
            transition: `transform ${TRANSFORM_MS - 20}ms ${SLIDE_EASING} 40ms, opacity ${TRANSFORM_MS - 60}ms ${SLIDE_EASING} 20ms`,
            transformOrigin: 'left center',
          }}
        >
          <ul className="navbar-nav p-0 mt-5 pt-4 w-100">
            {navItems.map((item, idx) => {
              const isActive =
                item.href !== '/' && location.pathname.startsWith(item.href)
                  ? true
                  : location.pathname === item.href;

              return (
                <li
                  className="nav-item p-0 m-0"
                  key={idx}
                  // ✅ Removed per-item slide & stagger (no translate/scale, no delays)
                  style={{
                    opacity: 1,
                    transform: 'none',
                    transition: 'none'
                  }}
                >
                  <Link
                    className={`sidebar-link ${isActive ? 'active' : ''} ${item.isLogout ? 'logout' : ''}`}
                    to={item.href}
                    onClick={() => {
                      toggleSidebar();
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

      {/* Enhanced Styles */}
      <style>{`
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sidebar-link {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  position: relative;
  transition: background 200ms ${SLIDE_EASING}, color 200ms ${SLIDE_EASING}, transform 160ms ${SLIDE_EASING};
  white-space: nowrap;
  text-decoration: none;
}

.sidebar-link:hover {
  text-decoration: none;
  background: rgba(255, 255, 255, 0.10);
  transform: translateX(2px);
}

.sidebar-link.active {
  background: #778fc24d;
  color: #fff !important;
}

.sidebar-link.logout {
  color: #ef4444 !important;
}

.sidebar-link.logout:hover {
  background: rgba(239, 68, 68, 0.12);
  transform: translateX(2px);
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
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: translateY(-50%) scale(1); opacity: 1; }
  50% { transform: translateY(-50%) scale(1.15); opacity: 0.8; }
  100% { transform: translateY(-50%) scale(1); opacity: 1; }
}

.sidebar-divider {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  height: 1px;
  border: none;
  margin: 0 24px;
}
      `}</style>
    </>
  );
}