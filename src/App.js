import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route - jab user website kholega */}
        <Route path="/" element={<Home />} />
        
        {/* Login page */}
        <Route path="/login" element={<Login />} />
        
        {/* Signup page */}
        <Route path="/signup" element={<Signup />} />
        
        {/* Dashboard (login ke baad) */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Agar koi galat URL dale toh home par bhej do */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;