// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Router from './Router';
import Sidebar from './components/Sidebar';
import './styles/App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          <main className="main-content">
            <Router />
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;