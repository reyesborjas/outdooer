// src/components/Sidebar.jsx
import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  FaHome, 
  FaMapMarkedAlt, 
  FaMountain, 
  FaUsers, 
  FaCalendarAlt, 
  FaCog, 
  FaUserCircle, 
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import '../styles/Sidebar.css';
import logo from '../assets/images/logo.png'; // Make sure to add your logo

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [userRole, setUserRole] = useState('explorer'); // Default role

  useEffect(() => {
    // Determine user role from authenticated user data
    if (user?.roles?.includes('guide')) {
      setUserRole('guide');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Common menu items for all users
  const menuItems = [
    { 
      path: '/dashboard', 
      name: 'Dashboard', 
      icon: <FaHome /> 
    },
    { 
      path: '/expeditions', 
      name: 'Expeditions', 
      icon: <FaMapMarkedAlt /> 
    },
    { 
      path: '/activities', 
      name: 'Activities', 
      icon: <FaMountain /> 
    },
    { 
      path: '/teams', 
      name: 'Guide Teams', 
      icon: <FaUsers /> 
    }
  ];

  // Additional menu items for guides
  const guideMenuItems = [
    { 
      path: '/my-expeditions', 
      name: 'My Expeditions', 
      icon: <FaCalendarAlt /> 
    }
  ];

  // Get the appropriate menu items based on user role
  const visibleMenuItems = userRole === 'guide' 
    ? [...menuItems, ...guideMenuItems] 
    : menuItems;

  return (
    <>
      {/* Overlay for mobile view */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
        onClick={toggleSidebar}
      />

      {/* Sidebar container */}
      <div className={`sidebar ${isOpen ? 'show' : ''}`}>
        {/* Mobile close button */}
        <button className="sidebar-close-btn" onClick={toggleSidebar}>
          <FaTimes />
        </button>

        {/* Logo and branding */}
        <div className="sidebar-header">
          <img src={logo} alt="Outdooer" className="sidebar-logo" />
          <h3>Outdooer</h3>
        </div>

        {/* User profile section */}
        {isAuthenticated && (
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.profile_image_url ? (
                <img src={user.profile_image_url} alt={user.first_name} />
              ) : (
                <FaUserCircle size={40} />
              )}
            </div>
            <div className="user-info">
              <h5>{user?.first_name} {user?.last_name}</h5>
              <span className="user-role">{userRole === 'guide' ? 'Guide' : 'Explorer'}</span>
            </div>
          </div>
        )}

        {/* Create expedition/activity buttons for guides */}
        {userRole === 'guide' && (
          <div className="sidebar-actions">
            <button className="create-btn" onClick={() => navigate('/create-expedition')}>
              + New Expedition
            </button>
            <button className="create-btn secondary" onClick={() => navigate('/create-activity')}>
              + New Activity
            </button>
          </div>
        )}

        {/* Navigation menu */}
        <nav className="sidebar-nav">
          <ul>
            {visibleMenuItems.map((item, index) => (
              <li key={index}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => isActive ? "active" : ""}
                >
                  <span className="icon">{item.icon}</span>
                  <span className="label">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom section with settings and logout */}
        <div className="sidebar-footer">
          <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>
            <span className="icon"><FaCog /></span>
            <span className="label">Settings</span>
          </NavLink>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="icon"><FaSignOutAlt /></span>
            <span className="label">Logout</span>
          </button>
        </div>
      </div>

      {/* Toggle button for mobile */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <FaBars />
      </button>
    </>
  );
};

export default Sidebar;