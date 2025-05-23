// src/components/Sidebar.jsx
import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  FaTimes,
  FaClipboardCheck,
  FaChartLine,
  FaShieldAlt
} from 'react-icons/fa';
import '../styles/Sidebar.css';
import logo from '../assets/images/logo.png'; // Make sure to add your logo

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const { 
    user, 
    logout, 
    isAuthenticated, 
    isAdmin,
    isGuide,
    isMasterGuide
  } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Common menu items for all authenticated users
  const commonMenuItems = [
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
  ];

  // Guide-specific menu items
  const guideMenuItems = [
    { 
      path: '/my-expeditions', 
      name: 'My Expeditions', 
      icon: <FaCalendarAlt />,
      show: isGuide()
    },
    { 
      path: '/my-activities', 
      name: 'My Activities', 
      icon: <FaClipboardCheck />,
      show: isGuide()
    },
    { 
      path: '/teams', 
      name: 'Guide Teams', 
      icon: <FaUsers />,
      show: isGuide()
    }
  ];

  // Master Guide specific items
  const masterGuideItems = [
    { 
      path: '/team-management', 
      name: 'Team Management', 
      icon: <FaUsers />,
      show: isMasterGuide()
    },
    { 
      path: '/earnings', 
      name: 'Earnings', 
      icon: <FaChartLine />,
      show: isMasterGuide()
    }
  ];

  // Admin specific items
  const adminItems = [
    { 
      path: '/admin', 
      name: 'Admin Panel', 
      icon: <FaShieldAlt />,
      show: isAdmin()
    }
  ];

  // Get the appropriate menu items based on user roles
  let menuItems = [...commonMenuItems];
  
  // Only add items that should be shown (based on role checks)
  const roleBasedItems = [...guideMenuItems, ...masterGuideItems, ...adminItems]
    .filter(item => item.show);
  
  menuItems = [...menuItems, ...roleBasedItems];

  // Get appropriate role display
  const getRoleDisplay = () => {
    if (isAdmin()) return 'Admin';
    if (isMasterGuide()) return 'Master Guide';
    if (isGuide()) return 'Guide';
    return 'Explorer';
  };

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
        {isAuthenticated() && (
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
              <span className="user-role">{getRoleDisplay()}</span>
            </div>
          </div>
        )}

        {/* Create expedition/activity buttons for guides */}
        {isGuide() && (
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
            {menuItems.map((item, index) => (
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
          {isAuthenticated() && (
            <>
              <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>
                <span className="icon"><FaCog /></span>
                <span className="label">Settings</span>
              </NavLink>
              <button className="logout-btn" onClick={handleLogout}>
                <span className="icon"><FaSignOutAlt /></span>
                <span className="label">Logout</span>
              </button>
            </>
          )}
          {!isAuthenticated() && (
            <>
              <NavLink to="/login" className={({ isActive }) => isActive ? "active" : ""}>
                <span className="icon"><FaUserCircle /></span>
                <span className="label">Login</span>
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => isActive ? "active" : ""}>
                <span className="icon"><FaUserCircle /></span>
                <span className="label">Register</span>
              </NavLink>
            </>
          )}
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