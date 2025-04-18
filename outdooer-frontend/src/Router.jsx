// src/Router.jsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Activities from './pages/Activities';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './components/Dashboard';
import ActivityDetails from './pages/ActivityDetails';
// Import additional pages when you create them

const Router = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Semi-public routes (viewable by anyone) */}
      <Route path="/activities" element={<Activities />} />
      <Route path="/activities/:activityId" element={<ActivityDetails />} />
      <Route path="/expeditions" element={<div>Expeditions Page (Coming Soon)</div>} />
      <Route path="/teams" element={<div>Teams Page (Coming Soon)</div>} />
      
      {/* Protected routes (require authentication) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<div>Profile (Coming Soon)</div>} />
        <Route path="/settings" element={<div>Settings (Coming Soon)</div>} />
      </Route>
      
      {/* Explorer routes */}
      <Route element={<ProtectedRoute requiredRoles={['explorer']} />}>
        <Route path="/my-reservations" element={<div>My Reservations (Coming Soon)</div>} />
        <Route path="/my-trips" element={<div>My Trips (Coming Soon)</div>} />
      </Route>
      
      {/* Guide routes */}
      <Route element={<ProtectedRoute requiredRoles={['guide', 'master_guide']} />}>
        <Route path="/create-activity" element={<div>Create Activity (Coming Soon)</div>} />
        <Route path="/create-expedition" element={<div>Create Expedition (Coming Soon)</div>} />
        <Route path="/my-activities" element={<div>My Activities (Coming Soon)</div>} />
        <Route path="/my-expeditions" element={<div>My Expeditions (Coming Soon)</div>} />
      </Route>
      
      {/* Master Guide routes */}
      <Route element={<ProtectedRoute requiredRoles={['master_guide']} />}>
        <Route path="/team-management" element={<div>Team Management (Coming Soon)</div>} />
        <Route path="/earnings" element={<div>Earnings (Coming Soon)</div>} />
        <Route path="/team-reports" element={<div>Team Reports (Coming Soon)</div>} />
      </Route>
      
      {/* Admin routes */}
      <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
        <Route path="/admin" element={<div>Admin Dashboard (Coming Soon)</div>} />
        <Route path="/admin/users" element={<div>User Management (Coming Soon)</div>} />
        <Route path="/admin/teams" element={<div>Team Management (Coming Soon)</div>} />
        <Route path="/admin/reports" element={<div>Admin Reports (Coming Soon)</div>} />
      </Route>
      
      {/* Catch-all route for 404 */}
      <Route path="*" element={<div>Page not found</div>} />
    </Routes>
  );
};

export default Router;