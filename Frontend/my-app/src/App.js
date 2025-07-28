import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/desktop/login/login';
import Standards from './pages/desktop/standards/standards';
import Standards_menu from './pages/desktop/standards_menu/standards_menu';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/standards" element={<Standards />} />
      <Route path="/standards-menu" element={<Standards_menu />} />
    </Routes>
  );
}

export default App;
