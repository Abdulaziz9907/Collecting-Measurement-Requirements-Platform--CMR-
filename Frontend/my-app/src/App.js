import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/desktop/login/login';
import Standards_create from './pages/desktop/standards_create/standards_create';
import Standards from './pages/desktop/standards/standards';
import Standards_edit from './pages/desktop/standards_edit/standards_edit';
import Departments from './pages/desktop/departments/departments';
import Departments_edit from './pages/desktop/departments_edit/departments_edit';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/standards_create" element={<Standards_create />} />
      <Route path="/standards" element={<Standards />} />
      <Route path="/standards_edit/:id" element={<Standards_edit />} />
      <Route path="/departments" element={<Departments />} />
      <Route path="/departments_edit/:id" element={<Departments_edit />} />
    </Routes>
  );
}

export default App;
