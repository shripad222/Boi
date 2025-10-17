import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          Smart Health
        </Link>

        <ul className="navbar-nav">
          <li>
            <Link 
              to="/home" 
              className={isActive('/home') ? 'active' : ''}
            >
              Home
            </Link>
          </li>
          
          <li>
            <Link 
              to="/awareness" 
              className={isActive('/awareness') ? 'active' : ''}
            >
              Health Awareness
            </Link>
          </li>

          {isAuthenticated && (
            <>
              <li>
                <Link 
                  to="/dashboard" 
                  className={isActive('/dashboard') ? 'active' : ''}
                >
                  {t('navigation.dashboard')}
                </Link>
              </li>
              
              {user?.role === 'doctor' && (
                <li>
                  <Link 
                    to="/health-form" 
                    className={isActive('/health-form') ? 'active' : ''}
                  >
                    {t('navigation.healthForm')}
                  </Link>
                </li>
              )}
              
              <li>
                <Link 
                  to="/queue" 
                  className={isActive('/queue') ? 'active' : ''}
                >
                  {t('navigation.queue')}
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/reports" 
                  className={isActive('/reports') ? 'active' : ''}
                >
                  {t('navigation.reports')}
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/healthcare-map" 
                  className={isActive('/healthcare-map') ? 'active' : ''}
                >
                  {t('navigation.map')}
                </Link>
              </li>
            </>
          )}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Theme Toggle */}
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? 'Light' : 'Dark'}
          </button>

          {/* Language Selector */}
          <div className="language-selector">
            <select 
              value={i18n.language} 
              onChange={(e) => changeLanguage(e.target.value)}
              className="language-select"
            >
              <option value="en">EN</option>
              <option value="hi">हिं</option>
              <option value="mr">मर</option>
            </select>
          </div>

          {isAuthenticated ? (
            <div className="user-menu">
              <button 
                className="user-menu-toggle"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {user?.name} ▼
              </button>
              
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <Link 
                    to="/settings" 
                    onClick={() => setShowUserMenu(false)}
                  >
                    {t('navigation.settings')}
                  </Link>
                  
                  <button onClick={handleLogout}>
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
              <Link to="/register" className="btn">
                Register
              </Link>
            </div>
          )}
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          ☰
        </button>
      </div>
    </nav>
  );
};

export default Navbar;