import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/custom.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to POS Software</h1>
        <p>Your complete Point of Sale solution</p>
        
        <div className="home-buttons">
          <button 
            className="btn-primary" 
            onClick={() => navigate('/signup')}
          >
            Get Started
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
        
        <div className="features">
          <div className="feature-card">
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '50px', height: '50px', margin: '0 auto 20px', color: '#3182ce'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3>Easy Sales</h3>
            <p>Quick and simple checkout process</p>
          </div>
          <div className="feature-card">
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '50px', height: '50px', margin: '0 auto 20px', color: '#3182ce'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3>Analytics</h3>
            <p>Track your business performance</p>
          </div>
          <div className="feature-card">
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '50px', height: '50px', margin: '0 auto 20px', color: '#3182ce'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3>Inventory</h3>
            <p>Manage your products efficiently</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;