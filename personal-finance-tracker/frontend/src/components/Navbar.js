import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActiveLink = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard" className="brand-link">
          <i className="fas fa-wallet"></i>
          <span>FinanceTracker</span>
        </Link>
      </div>

      <div className="navbar-nav">
        <Link to="/dashboard" className={isActiveLink('/dashboard')}>
          <i className="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </Link>
        
        <Link to="/expenses" className={isActiveLink('/expenses')}>
          <i className="fas fa-receipt"></i>
          <span>Expenses</span>
        </Link>
        
        <Link to="/goals" className={isActiveLink('/goals')}>
          <i className="fas fa-bullseye"></i>
          <span>Goals</span>
        </Link>
        
        <Link to="/reports" className={isActiveLink('/reports')}>
          <i className="fas fa-chart-bar"></i>
          <span>Reports</span>
        </Link>
      </div>

      <div className="navbar-user">
        <div className="user-menu">
          <button 
            className="user-menu-button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user?.name}</span>
            <i className={`fas fa-chevron-${isUserMenuOpen ? 'up' : 'down'}`}></i>
          </button>

          {isUserMenuOpen && (
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-name-full">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <Link 
                to="/profile" 
                className="dropdown-item"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <i className="fas fa-user"></i>
                Profile
              </Link>
              
              <button 
                className="dropdown-item logout-button"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;