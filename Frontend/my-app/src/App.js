import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/desktop/login/login';
import Standards_create from './pages/desktop/standards_create/standards_create';
import Standards from './pages/desktop/standards/standards';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/standards_add" element={<Standards_create />} />
      <Route path="/standards" element={<Standards />} />
    </Routes>
  );
}

export default App;
