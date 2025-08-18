import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
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
  const [isAnimating, setIsAnimating] = useState(false); // micro scale for button
  const [showLogoutModal, setShowLogoutModal] = useState(false); // NEW: modal state
  const location = useLocation();
  const sidebarRef = useRef(null);

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
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', isLogout: true },
    ];
  } else if (role === 'user') {
    navItems = [
      { href: '/home', icon: faHome, label: 'الرئيسية' },
      { href: '/standards', icon: faList, label: 'معايير التحول' },
      { href: '/profile', icon: faUser, label: 'الملف الشخصي' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', isLogout: true },
    ];
  } else if (role === 'management') {
    navItems = [
      { href: '/home', icon: faHome, label: 'الرئيسية' },
      { href: '/reports', icon: faChartPie, label: 'الإحصائيات' },
      { href: '/profile', icon: faUser, label: 'الملف الشخصي' },
      { href: '/', icon: faArrowRightFromBracket, label: 'تسجيل خروج', isLogout: true },
    ];
  }

  // Interruptible: no gating; reversing mid-transition is smooth
  const toggleSidebar = () => {
    setIsAnimating(true);
    setSidebarVisible(v => !v);
  };

  // Modal handlers
  const openLogoutModal = (e) => {
    if (e) e.preventDefault();
    setShowLogoutModal(true);
  };
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    window.dispatchEvent(new Event('cmr:logout'));
  };
  const handleLogoutCancel = () => setShowLogoutModal(false);

  // Relax button micro-scale when slide ends
  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const onEnd = (e) => {
      if (e.propertyName === 'transform') setIsAnimating(false);
    };
    el.addEventListener('transitionend', onEnd);
    return () => el.removeEventListener('transitionend', onEnd);
  }, []);

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
    transition: `transform ${TRANSFORM_MS}ms ${EASING}, box-shadow ${TRANSFORM_MS}ms ${EASING}, background ${TRANSFORM_MS}ms ${EASING}, border ${TRANSFORM_MS}ms ${EASING}`,
    transform: isAnimating ? 'scale(0.985)' : 'scale(1)',
    willChange: 'transform'
  };

  const barColor = sidebarVisible ? '#fff' : '#495057';

  return (
    <>
      {/* Mobile Overlay (always mounted; fades; pointer toggles) */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-md-none"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1020,
          backdropFilter: 'blur(2px)',
          transition: `opacity ${OVERLAY_MS}ms ${EASING}`,
          opacity: sidebarVisible ? 1 : 0,
          pointerEvents: sidebarVisible ? 'auto' : 'none',
        }}
        onClick={toggleSidebar}
      />

      {/* Hamburger Button */}
      <button
        type="button"
        className="position-fixed top-0 start-0 m-3 d-md-none"
        style={buttonStyles}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        aria-expanded={sidebarVisible}
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
              transition: `background-color ${TRANSFORM_MS}ms ${EASING}`,
            }}
          />
        ))}
      </button>

      {/* Mobile Sidebar */}
      <div
        ref={sidebarRef}
        className="text-white position-fixed top-0 start-0 h-100 d-md-none"
        style={{
          width: '240px',
          background: 'linear-gradient(180deg, #0f172aff 0%, #1e293b 100%)',
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          transition: `transform ${TRANSFORM_MS}ms ${EASING}, box-shadow ${Math.max(TRANSFORM_MS - 60, 200)}ms ${EASING}`,
          zIndex: 1025,
          boxShadow: sidebarVisible ? '6px 0 24px rgba(0,0,0,0.28)' : 'none',
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* inner wrapper for subtle scale/opacity ease (no overshoot) */}
        <div
          style={{
            height: '100%',
            transform: sidebarVisible ? 'scale(1)' : 'scale(0.985)',
            opacity: sidebarVisible ? 1 : 0.96,
            transition: `transform ${Math.max(TRANSFORM_MS - 80, 220)}ms ${EASING}, opacity ${Math.max(TRANSFORM_MS - 80, 220)}ms ${EASING}`,
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
                  style={{
                    opacity: sidebarVisible ? 1 : 0,
                    transform: sidebarVisible ? 'translateX(0)' : `translateX(-${ITEM_OFFSET}px)`,
                    transition: `transform ${TRANSFORM_MS}ms ${EASING} ${idx * ITEM_STAGGER}ms, opacity ${TRANSFORM_MS}ms ${EASING} ${idx * ITEM_STAGGER}ms`,
                    willChange: 'transform, opacity'
                  }}
                >
                  <Link
                    className={`sidebar-link ${isActive ? 'active' : ''} ${item.isLogout ? 'logout' : ''}`}
                    to={item.href}
                    onClick={(e) => {
                      if (item.isLogout) {
                        openLogoutModal(e);         // open modal, don't toggle or navigate
                      } else {
                        toggleSidebar();            // reversible mid-way
                      }
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
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="container-fluid d-flex flex-column p-0 ">
          <hr className="my-0 sidebar-divider" />
          <ul className="navbar-nav text-light mt-4 w-100" id="accordionSidebar">
            {navItems.map((item, idx) => {
              const isActive =
                item.href !== '/' && location.pathname.startsWith(item.href)
                  ? true
                  : location.pathname === item.href;

              return (
                <li className="nav-item" key={idx}>
                  <Link
                    className={`nav-link d-flex align-items-center sidebar-link ${isActive ? 'active' : ''} ${item.isLogout ? 'logout' : ''}`}
                    to={item.href}
                    onClick={(e) => {
                      if (item.isLogout) {
                        openLogoutModal(e); // open modal on desktop too
                      }
                    }}
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

      {/* Logout Confirmation Modal */}
      <Modal
        show={showLogoutModal}
        onHide={handleLogoutCancel}
        centered
        dir="rtl"
        aria-labelledby="logout-modal-title"
        backdrop="static"
      >
        <Modal.Header >
          <Modal.Title id="logout-modal-title">تأكيد تسجيل الخروج</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          هل تريد تسجيل الخروج؟
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button variant="secondary" onClick={handleLogoutCancel}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={handleLogoutConfirm}>
            تسجيل الخروج
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Styles */}
      <style>{`
.sidebar-link {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  position: relative;
  transition: background ${TRANSFORM_MS}ms ${EASING}, color ${TRANSFORM_MS}ms ${EASING};
  white-space: nowrap;
  text-decoration: none;
}

.sidebar-link:hover {
  text-decoration: none;
  background: rgba(255, 255, 255, 0.10);
}

.sidebar-link.active {
  background: #7e90c64d;
  color: #fff !important;
}

.sidebar-link.logout {
  color: #ef4444 !important;
}

.sidebar-link.logout:hover {
  background: rgba(239, 68, 68, 0.12);
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
      `}</style>
    </>
  );
}
