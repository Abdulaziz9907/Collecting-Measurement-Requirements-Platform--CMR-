import React, { useEffect, useState } from 'react';

export default function Sidebar() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const navItems = [
    { href: '/', icon: <i className="fas fa-home me-2" />, label: 'الرئيسية' },
    { href: '/standards', icon: <i className="fas fa-list me-2" />, label: 'معايير التحول' },
    { href: '/departments', icon: <i className="fas fa-sitemap me-2" />, label: 'الجهات' },
    { href: '/reports', icon: <i className="fas fa-chart-pie me-2" />, label: 'الإحصائيات' },
  ];

  // Close sidebar when resizing to desktop
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
        <div style={{ width: '22px', height: '2px', backgroundColor: barColor, margin: '3px 0', transition: '0.3s' }} />
        <div style={{ width: '22px', height: '2px', backgroundColor: barColor, margin: '3px 0', transition: '0.3s' }} />
        <div style={{ width: '22px', height: '2px', backgroundColor: barColor, margin: '3px 0', transition: '0.3s' }} />
      </button>

      {/* Mobile Sidebar */}
      <div
        className="bg-dark text-white position-fixed top-0 start-0 h-100 d-md-none"
        style={{
          width: '320px',
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          opacity: sidebarVisible ? 1 : 0,
          pointerEvents: sidebarVisible ? 'auto' : 'none',
          transition: 'transform 0.4s ease, opacity 0.4s ease',
          zIndex: 1025,
          boxShadow: sidebarVisible ? '4px 0 12px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        <div className="p-3">
          <ul className="navbar-nav">
            {navItems.map((item, idx) => (
              <li className="nav-item" key={idx}>
                <a
                  className="nav-link text-white d-flex align-items-center"
                  href={item.href}
                  onClick={() => setSidebarVisible(false)}
                >
                  {item.icon}
                  <span className="me-2">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <nav
        className="navbar align-items-start p-0 sidebar sidebar-dark accordion bg-gradient-primary navbar-dark d-none d-md-block"
        style={{ background: "#061736" }}
      >
        <div className="container-fluid d-flex flex-column p-0">
          <hr className="my-0 sidebar-divider" />
          <ul className="navbar-nav text-light" id="accordionSidebar">
            {navItems.map((item, idx) => (
              <li className="nav-item" key={idx}>
                <a className="nav-link d-flex justify-content-start" href={item.href}>
                  {item.icon}
                  <span className="me-2" style={{ fontSize: 17 }}>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
