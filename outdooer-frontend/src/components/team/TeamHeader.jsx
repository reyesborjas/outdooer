// src/components/team/TeamHeader.jsx
import React, { useState } from 'react';
import api from '../../api';

const TeamHeader = ({ team, refreshTeam, setSuccessMessage, setError }) => {
  const [editing, setEditing] = useState(false);
  const [teamName, setTeamName] = useState(team?.team_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only master guide can edit team name
  const canEdit = team?.user_role_level === 1;

  const handleEditClick = () => {
    setTeamName(team.team_name);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const handleSaveTeamName = async () => {
    try {
      setIsSubmitting(true);
      
      await api.put(`/teams/${team.team_id}`, {
        team_name: teamName
      });
      
      setSuccessMessage('Team name updated successfully!');
      setEditing(false);
      refreshTeam();
    } catch (error) {
      console.error('Error updating team name:', error);
      setError(error.response?.data?.error || 'Failed to update team name');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {editing ? (
              <div className="d-flex align-items-center">
                <input
                  type="text"
                  className="form-control me-2"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
                <button 
                  className="btn btn-success me-2" 
                  onClick={handleSaveTeamName}
                  disabled={isSubmitting || !teamName}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center">
                <h2 className="mb-0 me-3">{team.team_name}</h2>
                {canEdit && (
                  <button 
                    className="btn btn-sm btn-outline-primary" 
                    onClick={handleEditClick}
                  >
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                )}
              </div>
            )}
            <p className="text-muted mb-0">
              {team.role_config && team.user_role_level ? (
                <>
                  Your role: {team.role_config[`level_${team.user_role_level}_name`] || `Level ${team.user_role_level}`}
                </>
              ) : (
                <>Team Member</>
              )}
            </p>
          </div>
          
          <div className="d-flex">
            {team.user_role_level <= 2 && (
              <a 
                href={`/create-activity?team=${team.team_id}`} 
                className="btn btn-success me-2"
              >
                <i className="bi bi-plus-circle me-1"></i> New Activity
              </a>
            )}
            {team.user_role_level <= 2 && (
              <a 
                href={`/create-expedition?team=${team.team_id}`} 
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-1"></i> New Expedition
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamHeader;