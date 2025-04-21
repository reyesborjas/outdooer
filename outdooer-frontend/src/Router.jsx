// src/Router.jsx - Updated with new routes
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Activities from './pages/Activities';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './components/Dashboard';
import ActivityDetails from './pages/ActivityDetails';

// New components for activity and expedition management
import NewActivity from './pages/NewActivity';
import EditActivity from './pages/EditActivity';
import ActivityDates from './pages/ActivityDates';
import MyActivities from './pages/MyActivities';
import NewExpedition from './pages/NewExpedition';
import EditExpedition from './pages/EditExpedition';
import MyExpeditions from './pages/MyExpeditions';

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
        <Route path="/activities/:activityId/edit" element={<EditActivity />} />
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
        {/* Activity Management */}
        <Route path="/create-activity" element={<NewActivity />} />
        <Route path="/edit-activity/:activityId" element={<EditActivity />} />
        <Route path="/activity-dates/:activityId" element={<ActivityDates />} />
        <Route path="/my-activities" element={<MyActivities />} />
        
        {/* Expedition Management */}
        <Route path="/create-expedition" element={<NewExpedition />} />
        <Route path="/edit-expedition/:expeditionId" element={<EditExpedition />} />
        <Route path="/my-expeditions" element={<MyExpeditions />} />
        <Route path="/expedition-participants/:expeditionId" element={<div>Expedition Participants (Coming Soon)</div>} />
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