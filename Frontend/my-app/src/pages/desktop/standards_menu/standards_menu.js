import React, { useState } from 'react';
import Navigation from './Navigation';

<Navigation />

export default function Standards_menu() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const navItems = [
    { href: '/index.html', icon: <i className="fas fa-home me-2" />, label: 'الرئيسية' },
    { href: '/table.html', icon: <i className="fas fa-list me-2" />, label: 'معايير التحول' },
    { href: '/login.html', icon: <i className="fas fa-sitemap me-2" />, label: 'الجهات' },
    { href: '/login.html', icon: <i className="fas fa-chart-pie me-2" />, label: 'الإحصائيات' },
  ];

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button
        type="button"
        className="position-fixed top-0 start-0 m-3 z-1030 d-md-none"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #ccc',
          padding: '8px 10px',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '42px',
          height: '42px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        }}
        onClick={() => setSidebarVisible((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        <div style={{ width: '22px', height: '2px', backgroundColor: '#222', margin: '3px 0' }} />
        <div style={{ width: '22px', height: '2px', backgroundColor: '#222', margin: '3px 0' }} />
        <div style={{ width: '22px', height: '2px', backgroundColor: '#222', margin: '3px 0' }} />
      </button>

      {/* Mobile Sidebar */}
      <div
        className="bg-dark text-white position-fixed top-0 start-0 h-100 d-md-none"
        style={{
          width: '320px',
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          opacity: sidebarVisible ? 1 : 0,
          transition: 'transform 0.4s ease, opacity 0.3s ease',
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
      <nav className="navbar align-items-start p-0 sidebar sidebar-dark accordion bg-gradient-primary navbar-dark d-none d-md-block" style={{ background: "#061736" }}>
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
