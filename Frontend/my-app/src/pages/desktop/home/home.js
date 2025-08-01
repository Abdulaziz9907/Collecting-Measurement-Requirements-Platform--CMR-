import React, { useEffect, useState } from 'react';
import "./assets/bootstrap/css/bootstrap.min.css";
import "./assets/fonts/fontawesome-all.min.css";
import "./assets/css/bss-overrides.css";
import Header from '../../../components/Header.jsx';
import Sidebar from '../../../components/Sidebar.jsx';



export default function Standards_menu() {
  const [sidebarVisible, setSidebarVisible] = useState(false); // Mobile sidebar


  return (
    <div dir="rtl" style={{ fontFamily: 'Noto Sans Arabic' }}>
      <Header />



      {/* Alerts */}
 

      {/* Main Layout */}
      <div id="wrapper">

<Sidebar
  sidebarVisible={sidebarVisible}
  setSidebarVisible={setSidebarVisible}
/>
        {/* Content Wrapper */}
        <div className="d-flex flex-column" id="content-wrapper">
          <div id="content">
            <div className="container-fluid">
              <div className="row p-4">
                <div className="col-md-12">
                  <h4>الرئيسية / إدارة المعايير</h4>
                </div>
              </div>
              <div className="row">
                <div className="col-md-1 col-xl-2" />
                <div className="col-md-10 col-xl-8 p-4 my-3 bg-white" style={{ borderTop: "3px solid #4F7689", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                  {/* Form */}
                  
                </div>
                <div className="col-md-1 col-xl-2" />
              </div>
            </div>
          </div>

          <footer className="bg-white sticky-footer">
            <div className="container my-auto">
              <div className="text-center my-auto">
                <span>© RCJY 2025</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
