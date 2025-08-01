import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/desktop/login/login';
import Standards_create from './pages/desktop/standards_create/standards_create';
import Standards from './pages/desktop/standards/standards';
import Standards_edit from './pages/desktop/standards_edit/standards_edit';
import Standard_show from './pages/desktop/standard_show/standard_show';
import Departments from './pages/desktop/departments/departments';
import Departments_edit from './pages/desktop/departments_edit/departments_edit';
import Departments_create from './pages/desktop/departments_create/departments_create';
import Users from './pages/desktop/users/users';
import Users_create from './pages/desktop/users_create/users_create';
import Users_edit from './pages/desktop/users_edit/users_edit';
import Reports from './pages/desktop/reports/reports';
import Home from './pages/desktop/home/home'

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const location = useLocation();

  const role = user?.role?.trim().toLowerCase();
  const allow = roles => roles.map(r => r.toLowerCase()).includes(role);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user') || 'null'));
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Login onLogin={setUser} />} />
      <Route path="/home" element={user ? <Home /> : <Navigate to="/" replace />} />
      <Route path="/standards_create" element={user && allow(['admin','administrator']) ? <Standards_create /> : <Navigate to={user ? '/home' : '/'} replace />} />
      <Route path="/standards" element={user && allow(['admin','administrator','user']) ? <Standards /> : <Navigate to={user ? '/home' : '/'} replace />} />
      <Route path="/standards_edit/:id" element={user && allow(['admin','administrator']) ? <Standards_edit /> : <Navigate to={user ? '/home' : '/'} replace />} />
      <Route path="/standards_show/:id" element={user && allow(['admin','administrator','user']) ? <Standard_show /> : <Navigate to={user ? '/home' : '/'} replace />} />
      <Route path="/departments" element={user && allow(['admin','administrator']) ? <Departments /> : <Navigate to={user ? '/home' : '/'} replace />} />
      <Route path="/departments_edit/:id" element={user && allow(['admin','administrator']) ? <Departments_edit /> : <Navigate to={user ? '/home' : '/'} replace />} />
      <Route path="/departments_create" element={user && allow(['admin','administrator']) ? <Departments_create /> : <Navigate to={user ? '/home' : '/'} replace />} />
      <Route path="/users" element={user && allow(['admin','administrator']) ? <Users /> : <Navigate to={user ? '/home' : '/'} replace />} />
      <Route path="/users_create" element={user && allow(['admin','administrator']) ? <Users_create /> : <Navigate to={user ? '/home' : '/'} replace />} />
      <Route path="/users_edit/:id" element={user && allow(['admin','administrator']) ? <Users_edit /> : <Navigate to={user ? '/home' : '/'} replace />} />
      <Route path="/reports" element={user && allow(['admin','administrator','management']) ? <Reports /> : <Navigate to={user ? '/home' : '/'} replace />} />
    </Routes>
  );
}

export default App;
