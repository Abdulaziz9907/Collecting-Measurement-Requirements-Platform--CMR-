import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/desktop/login/login';
import Standards_create from './pages/desktop/standards_create/standards_create';
import Standards from './pages/desktop/standards/standards';
import Standards_edit from './pages/desktop/standards_edit/standards_edit';
import Departments from './pages/desktop/departments/departments';
import Departments_edit from './pages/desktop/departments_edit/departments_edit';
import Departments_create from './pages/desktop/departments_create/departments_create';
import Users from './pages/desktop/users/users';
import Users_create from './pages/desktop/users_create/users_create';
import Users_edit from './pages/desktop/users_edit/users_edit';
import Reports from './pages/desktop/reports/reports';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const location = useLocation();

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user') || 'null'));
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Login onLogin={setUser} />} />
      <Route path="/standards_create" element={user ? <Standards_create /> : <Navigate to="/" replace />} />
      <Route path="/standards" element={user ? <Standards /> : <Navigate to="/" replace />} />
      <Route path="/standards_edit/:id" element={user ? <Standards_edit /> : <Navigate to="/" replace />} />
      <Route path="/departments" element={user ? <Departments /> : <Navigate to="/" replace />} />
      <Route path="/departments_edit/:id" element={user ? <Departments_edit /> : <Navigate to="/" replace />} />
      <Route path="/departments_create" element={user ? <Departments_create /> : <Navigate to="/" replace />} />
      <Route path="/users" element={user ? <Users /> : <Navigate to="/" replace />} />
      <Route path="/users_create" element={user ? <Users_create /> : <Navigate to="/" replace />} />
      <Route path="/users_edit/:id" element={user ? <Users_edit /> : <Navigate to="/" replace />} />
      <Route path="/reports" element={user ? <Reports /> : <Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
