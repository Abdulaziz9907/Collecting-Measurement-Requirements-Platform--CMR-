import React from 'react';
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';
import Breadcrumbs from '../../../components/Breadcrumbs.jsx';

export default function Reports() {
  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />
      <div id="wrapper">
        <Sidebar />
        <div className="d-flex flex-column" id="content-wrapper">
          <div id="content">
            <div className="container-fluid">
              <div className="row p-4">
                <div className="col-md-12">
                  <Breadcrumbs />
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 text-center py-5 bg-white">
                  <h4>صفحة الإحصائيات</h4>
                </div>
              </div>
            </div>
          </div>
          <footer className="bg-white sticky-footer mt-auto py-3">
            <div className="container my-auto">
              <div className="text-center my-auto"><span>© RCJY 2025</span></div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
