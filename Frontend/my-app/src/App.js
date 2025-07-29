import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/desktop/login/login';
import Standards_create from './pages/desktop/standards_create/standards_create';
import Standards from './pages/desktop/standards/standards';
import Standards_edit from './pages/desktop/standards_edit/standards_edit';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/standards_create" element={<Standards_create />} />
      <Route path="/standards" element={<Standards />} />
      <Route path="/standards_edit/:id" element={<Standards_edit />} />
    </Routes>
  );
}

export default App;
