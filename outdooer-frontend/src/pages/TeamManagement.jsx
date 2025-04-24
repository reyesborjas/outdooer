// src/pages/TeamManagement.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TeamMembersTab from '../components/team/TeamMembersTab';
import TeamInvitationsTab from '../components/team/TeamInvitationsTab';
import TeamSettingsTab from '../components/team/TeamSettingsTab';
import TeamActivitiesTab from '../components/team/TeamActivitiesTab';
import TeamExpeditionsTab from '../components/team/TeamExpeditionsTab';
import TeamOverview from '../components/team/TeamOverview';
import TeamHeader from '../components/team/TeamHeader';
import api from '../api';

const TeamManagement = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isMasterGuide } = useContext(AuthContext);
  
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [successMessage, setSuccessMessage] = useState(null);
  const [teamName, setTeamName] = useState('');

  // Check if user is authenticated and has appropriate role
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Fetch team data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get team ID from URL or user data if not provided
        const currentTeamId = teamId || user?.teams?.find(t => t.is_master_guide)?.team_id;

        if (!currentTeamId) {
          setError("No team found. Please create a team or join one first.");
          setLoading(false);
          return;
        }

        // Fetch team details
        const teamResponse = await api.get(`/teams/${currentTeamId}`);
        setTeam(teamResponse.data.team);
        
        // Fetch team members
        const membersResponse = await api.get(`/teams/${currentTeamId}/members`);
        setMembers(membersResponse.data.members || []);

        // If user is master guide or tactical guide, fetch invitations
        if (teamResponse.data.team.user_role_level <= 2) {
          const invitationsResponse = await api.get(`/teams/${currentTeamId}/invitations`);
          setInvitations(invitationsResponse.data.invitations || []);
        }
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchTeamData();
    }
  }, [isAuthenticated, user, teamId]);

  // Handle team refresh (after updates)
  const refreshTeam = async () => {
    try {
      if (!team) return;
      
      setLoading(true);
      const teamResponse = await api.get(`/teams/${team.team_id}`);
      setTeam(teamResponse.data.team);
      
      const membersResponse = await api.get(`/teams/${team.team_id}/members`);
      setMembers(membersResponse.data.members || []);
      
      if (team.user_role_level <= 2) {
        const invitationsResponse = await api.get(`/teams/${team.team_id}/invitations`);
        setInvitations(invitationsResponse.data.invitations || []);
      }
    } catch (err) {
      console.error('Error refreshing team data:', err);
      setError('Failed to refresh team data.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new team
  const handleCreateTeam = async (teamName) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/api/teams', { team_name: teamName });
      
      setSuccessMessage('Team created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Navigate to the new team
      navigate(`/team-management/${response.data.team.team_id}`);
    } catch (err) {
      console.error('Error creating team:', err);
      setError(err.response?.data?.error || 'Failed to create team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading team data...</p>
      </div>
    );
  }

  // Show team creation form if no team exists
  if (!team && !error) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm">
          <div className="card-header">
            <h2>Create Your Guide Team</h2>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            
            <p>You don't have a team yet. As a guide, you can create your own team to manage activities and expeditions.</p>
            
            <div className="mb-3">
              <label htmlFor="teamName" className="form-label">Team Name</label>
              <input 
                type="text" 
                className="form-control" 
                id="teamName" 
                placeholder="Enter team name" 
                value={teamName} 
                onChange={(e) => setTeamName(e.target.value)} 
              />
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={() => handleCreateTeam(teamName)}
              disabled={loading || !teamName}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4 team-management">
      {/* Success message for actions */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMessage}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccessMessage(null)}
            aria-label="Close"
          ></button>
        </div>
      )}
      
      {/* Team header with basic info and actions */}
      <TeamHeader 
        team={team} 
        refreshTeam={refreshTeam} 
        setSuccessMessage={setSuccessMessage} 
        setError={setError}
      />
      
      {/* Team management tabs */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card shadow-sm mb-4">
            <div className="card-header">
              <h5 className="mb-0">Team Management</h5>
            </div>
            <div className="card-body p-0">
              <div className="nav flex-column nav-pills">
                <button 
                  className={`nav-link rounded-0 text-start ${activeTab === 'overview' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`nav-link rounded-0 text-start ${activeTab === 'members' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('members')}
                >
                  Members
                </button>
                {team.user_role_level <= 2 && (
                  <button 
                    className={`nav-link rounded-0 text-start ${activeTab === 'invitations' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('invitations')}
                  >
                    Invitations
                  </button>
                )}
                <button 
                  className={`nav-link rounded-0 text-start ${activeTab === 'activities' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('activities')}
                >
                  Activities
                </button>
                <button 
                  className={`nav-link rounded-0 text-start ${activeTab === 'expeditions' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('expeditions')}
                >
                  Expeditions
                </button>
                {team.user_role_level === 1 && (
                  <button 
                    className={`nav-link rounded-0 text-start ${activeTab === 'settings' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('settings')}
                  >
                    Team Settings
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Team stats card */}
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Team Stats</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6 className="text-muted">Members</h6>
                <p className="mb-0 fs-5">{team.total_members}</p>
              </div>
              <div className="mb-3">
                <h6 className="text-muted">Master Guide</h6>
                <p className="mb-0">{team.master_guide_name || 'None'}</p>
              </div>
              <div>
                <h6 className="text-muted">Created On</h6>
                <p className="mb-0">{new Date(team.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-9">
          <div className="card shadow-sm">
            <div className="card-body">
              {activeTab === 'overview' && (
                <TeamOverview 
                  team={team} 
                  members={members} 
                />
              )}
              
              {activeTab === 'members' && (
                <TeamMembersTab 
                  team={team} 
                  members={members} 
                  refreshTeam={refreshTeam}
                  setSuccessMessage={setSuccessMessage}
                  setError={setError}
                />
              )}
              
              {activeTab === 'invitations' && team.user_role_level <= 2 && (
                <TeamInvitationsTab 
                  team={team} 
                  invitations={invitations} 
                  refreshTeam={refreshTeam}
                  setSuccessMessage={setSuccessMessage}
                  setError={setError}
                />
              )}
              
              {activeTab === 'activities' && (
                <TeamActivitiesTab teamId={team.team_id} />
              )}
              
              {activeTab === 'expeditions' && (
                <TeamExpeditionsTab teamId={team.team_id} />
              )}
              
              {activeTab === 'settings' && team.user_role_level === 1 && (
                <TeamSettingsTab 
                  team={team} 
                  refreshTeam={refreshTeam}
                  setSuccessMessage={setSuccessMessage}
                  setError={setError}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;