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
import TeamPermissionSettings from './components/team/TeamPermissionSettings';

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
      
      {/* Guide routes with permission checks */}
      <Route element={<ProtectedRoute requiredRoles={['guide', 'master_guide']} />}>
        {/* Activity Management */}
        <Route path="/my-activities" element={<MyActivities />} />
      </Route>
      
      {/* Create Activity (requires create_activity permission) */}
      <Route 
        element={
          <ProtectedRoute 
            requiredRoles={['guide', 'master_guide']} 
            requiredPermission="create_activity"
          />
        }
      >
        <Route path="/create-activity" element={<NewActivity />} />
      </Route>
      
      {/* Edit Activity (requires update_activity permission) */}
      <Route 
        element={
          <ProtectedRoute 
            requiredRoles={['guide', 'master_guide']} 
            requiredPermission="update_activity"
            resourceIdParam="activityId"
          />
        }
      >
        <Route path="/activities/:activityId/edit" element={<EditActivity />} />
      </Route>
      
      {/* Manage Activity Dates (requires update_activity permission) */}
      <Route 
        element={
          <ProtectedRoute 
            requiredRoles={['guide', 'master_guide']} 
            requiredPermission="update_activity"
            resourceIdParam="activityId"
          />
        }
      >
        <Route path="/activities/:activityId/dates" element={<ActivityDates />} />
      </Route>
      
      {/* Expedition Management */}
      <Route element={<ProtectedRoute requiredRoles={['guide', 'master_guide']} />}>
        <Route path="/my-expeditions" element={<MyExpeditions />} />
      </Route>
      
      {/* Create Expedition (requires create_expedition permission) */}
      <Route 
        element={
          <ProtectedRoute 
            requiredRoles={['guide', 'master_guide']} 
            requiredPermission="create_expedition"
          />
        }
      >
        <Route path="/create-expedition" element={<NewExpedition />} />
      </Route>
      
      {/* Edit Expedition (requires update_expedition permission) */}
      <Route 
        element={
          <ProtectedRoute 
            requiredRoles={['guide', 'master_guide']} 
            requiredPermission="update_expedition"
            resourceIdParam="expeditionId"
          />
        }
      >
        <Route path="/expeditions/:expeditionId/edit" element={<EditExpedition />} />
      </Route>
      
      {/* Manage Expedition Participants (requires update_expedition permission) */}
      <Route 
        element={
          <ProtectedRoute 
            requiredRoles={['guide', 'master_guide']} 
            requiredPermission="update_expedition"
            resourceIdParam="expeditionId"
          />
        }
      >
        <Route path="/expeditions/:expeditionId/participants" element={<ExpeditionParticipants />} />
      </Route>
      
      {/* Team Management (requires master_guide or tactical_guide role) */}
      <Route element={<ProtectedRoute requiredRoles={['guide']} requiredLevel={2} />}>
        <Route path="/team-management" element={<TeamManagement />} />
        <Route path="/team-management/:teamId" element={<TeamManagement />} />
        <Route path="/team-dashboard" element={<TeamDashboard />} />
        <Route path="/team-dashboard/:teamId" element={<TeamDashboard />} />
      </Route>
      
      {/* Team Management specific tabs (require specific permissions) */}
      <Route 
        element={
          <ProtectedRoute 
            requiredRoles={['guide']} 
            requiredPermission="create_invitation"
            teamIdParam="teamId"
          />
        }
      >
        <Route path="/team-management/:teamId/invitations" element={<TeamInvitationsTab />} />
      </Route>
      
      <Route 
        element={
          <ProtectedRoute 
            requiredRoles={['guide']} 
            requiredPermission="manage_team_members"
            teamIdParam="teamId"
          />
        }
      >
        <Route path="/team-management/:teamId/members" element={<TeamMembersTab />} />
      </Route>
      
      <Route 
        element={
          <ProtectedRoute 
            requiredRoles={['guide']} 
            requiredLevel={1}
            teamIdParam="teamId"
          />
        }
      >
        <Route path="/team-management/:teamId/permissions" element={<TeamPermissionSettings />} />
      </Route>
      
      <Route element={<ProtectedRoute requiredRoles={['guide']} />}>
        <Route path="/team-management/:teamId/activities" element={<TeamActivitiesTab />} />
        <Route path="/team-management/:teamId/expeditions" element={<TeamExpeditionsTab />} />
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