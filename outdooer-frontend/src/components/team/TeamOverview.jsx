// src/components/team/TeamOverview.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';

const TeamOverview = ({ team, members }) => {
  const [activities, setActivities] = useState([]);
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch team activities and expeditions
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch activities and expeditions
        const [activitiesResponse, expeditionsResponse] = await Promise.all([
          api.get(`/activities/team/${team.team_id}`),
          api.get(`/expeditions/team/${team.team_id}`)
        ]);

        setActivities(activitiesResponse.data.activities || []);
        setExpeditions(expeditionsResponse.data.expeditions || []);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team activities and expeditions.');
      } finally {
        setLoading(false);
      }
    };

    if (team?.team_id) {
      fetchTeamData();
    }
  }, [team]);

  // Get recent activities
  const recentActivities = activities
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  // Get upcoming expeditions
  const upcomingExpeditions = expeditions
    .filter(exp => new Date(exp.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 3);

  // Get members by role
  const masterGuides = members.filter(m => m.role_level === 1);
  const tacticalGuides = members.filter(m => m.role_level === 2);
  const technicalGuides = members.filter(m => m.role_level === 3);
  const baseGuides = members.filter(m => m.role_level === 4);

  // Get role names
  const getRoleName = (level) => {
    return team.role_config?.[`level_${level}_name`] || `Level ${level}`;
  };

  return (
    <div className="team-overview">
      <h3 className="mb-4">Team Overview</h3>

      {/* Team Stats and Members Summary */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Team Stats</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-6">
                    <div className="stat-card p-3 bg-light rounded">
                      <h6 className="text-muted">Total Activities</h6>
                      <p className="mb-0 fs-4">{activities.length}</p>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="stat-card p-3 bg-light rounded">
                      <h6 className="text-muted">Total Expeditions</h6>
                      <p className="mb-0 fs-4">{expeditions.length}</p>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="stat-card p-3 bg-light rounded">
                      <h6 className="text-muted">Team Members</h6>
                      <p className="mb-0 fs-4">{members.length}</p>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="stat-card p-3 bg-light rounded">
                      <h6 className="text-muted">Created</h6>
                      <p className="mb-0">{new Date(team.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Team Members</h5>
            </div>
            <div className="card-body">
              <div className="members-summary">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6>{getRoleName(1)}</h6>
                    <p className="mb-0 small text-muted">Team leader with full permissions</p>
                  </div>
                  <span className="badge bg-primary">{masterGuides.length}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6>{getRoleName(2)}</h6>
                    <p className="mb-0 small text-muted">Can manage activities and members</p>
                  </div>
                  <span className="badge bg-info">{tacticalGuides.length}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6>{getRoleName(3)}</h6>
                    <p className="mb-0 small text-muted">Can create and lead activities</p>
                  </div>
                  <span className="badge bg-success">{technicalGuides.length}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6>{getRoleName(4)}</h6>
                    <p className="mb-0 small text-muted">Basic guide permissions</p>
                  </div>
                  <span className="badge bg-secondary">{baseGuides.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities and Upcoming Expeditions */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Activities</h5>
              <a href={`/activities?team=${team.team_id}`} className="btn btn-sm btn-outline-primary">
                View All
              </a>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : recentActivities.length > 0 ? (
                <div className="list-group">
                  {recentActivities.map(activity => (
                    <a 
                      key={activity.activity_id} 
                      href={`/activities/${activity.activity_id}`} 
                      className="list-group-item list-group-item-action"
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{activity.title}</h6>
                        <span className={`badge bg-${
                          activity.activity_status === 'active' ? 'success' :
                          activity.activity_status === 'draft' ? 'secondary' :
                          'danger'
                        }`}>
                          {activity.activity_status}
                        </span>
                      </div>
                      <p className="mb-1 text-truncate small">{activity.description}</p>
                      <small className="d-flex justify-content-between">
                        <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                        <span>${activity.price}</span>
                      </small>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No activities yet</p>
                  {team.user_role_level <= 2 && (
                    <a 
                      href={`/create-activity?team=${team.team_id}`} 
                      className="btn btn-sm btn-outline-primary mt-2"
                    >
                      Create an activity
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Upcoming Expeditions</h5>
              <a href={`/expeditions?team=${team.team_id}`} className="btn btn-sm btn-outline-primary">
                View All
              </a>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : upcomingExpeditions.length > 0 ? (
                <div className="list-group">
                  {upcomingExpeditions.map(expedition => (
                    <a 
                      key={expedition.expedition_id} 
                      href={`/expeditions/${expedition.expedition_id}`} 
                      className="list-group-item list-group-item-action"
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{expedition.title}</h6>
                        <span className={`badge bg-${
                          expedition.expedition_status === 'active' ? 'success' :
                          expedition.expedition_status === 'draft' ? 'secondary' :
                          'danger'
                        }`}>
                          {expedition.expedition_status}
                        </span>
                      </div>
                      <p className="mb-1 text-truncate small">{expedition.description}</p>
                      <small className="d-flex justify-content-between">
                        <span>
                          {new Date(expedition.start_date).toLocaleDateString()} - {new Date(expedition.end_date).toLocaleDateString()}
                        </span>
                        <span>${expedition.price}</span>
                      </small>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No upcoming expeditions</p>
                  {team.user_role_level <= 2 && (
                    <a 
                      href={`/create-expedition?team=${team.team_id}`} 
                      className="btn btn-sm btn-outline-primary mt-2"
                    >
                      Create an expedition
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamOverview;