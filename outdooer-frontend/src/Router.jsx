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

// Activity Management Pages
import NewActivity from './pages/NewActivity';
import EditActivity from './pages/EditActivity';
import ActivityDates from './pages/ActivityDates';
import MyActivities from './pages/MyActivities';

// Expedition Management Pages
import NewExpedition from './pages/NewExpedition';
import EditExpedition from './pages/EditExpedition';
import MyExpeditions from './pages/MyExpeditions';
import ExpeditionParticipants from './pages/ExpeditionParticipants';

// Team Management Pages
import TeamManagement from './pages/TeamManagement';
import TeamDashboard from './pages/TeamDashboard';

// Team Related Components
import TeamInvitationsTab from './components/team/TeamInvitationsTab';
import TeamExpeditionsTab from './components/team/TeamExpeditionsTab';
import TeamActivitiesTab from './components/team/TeamActivitiesTab';
import TeamMembersTab from './components/team/TeamMembersTab';

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
        {/* Activity Management */}
        <Route path="/create-activity" element={<NewActivity />} />
        <Route path="/activities/:activityId/edit" element={<EditActivity />} />
        <Route path="/activities/:activityId/dates" element={<ActivityDates />} />
        <Route path="/my-activities" element={<MyActivities />} />
        
        {/* Expedition Management */}
        <Route path="/create-expedition" element={<NewExpedition />} />
        <Route path="/expeditions/:expeditionId/edit" element={<EditExpedition />} />
        <Route path="/expeditions/:expeditionId/participants" element={<ExpeditionParticipants />} />
        <Route path="/my-expeditions" element={<MyExpeditions />} />
      </Route>
      
      {/* Master Guide routes */}
      <Route element={<ProtectedRoute requiredRoles={['master_guide']} />}>
        <Route path="/team-management" element={<TeamManagement />} />
        <Route path="/team-management/:teamId" element={<TeamManagement />} />
        <Route path="/team-dashboard" element={<TeamDashboard />} />
        <Route path="/team-dashboard/:teamId" element={<TeamDashboard />} />
        
        {/* Team-related specific routes */}
        <Route path="/team-management/:teamId" element={<TeamInvitationsTab />} />
        <Route path="/team-management/:teamId/members" element={<TeamMembersTab />} />
        <Route path="/team-management/:teamId/activities" element={<TeamActivitiesTab />} />
        <Route path="/team-management/:teamId/expeditions" element={<TeamExpeditionsTab />} />
        
        {/* Admin-like routes for Master Guide */}
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