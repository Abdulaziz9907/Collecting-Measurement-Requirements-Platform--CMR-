import React from 'react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import Breadcrumbs from './Breadcrumbs.jsx';
import Footer from './Footer.jsx';

export default function PageShell({ sidebarVisible, setSidebarVisible, children }) {
  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />
      <div id="wrapper">
        <Sidebar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
        <div className="d-flex flex-column flex-grow-1" id="content-wrapper">
          <div id="content">
            <div className="container-fluid py-3">
              <div className="row p-2">
                <div className="col-12">
                  <Breadcrumbs />
                </div>
              </div>
              {children}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
