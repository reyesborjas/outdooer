// src/components/team/TeamSettingsTab.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api';

const MAX_ROLE_NAME_LENGTH = 30;
const MIN_ROLE_NAME_LENGTH = 3;

const TeamSettingsTab = ({ team, refreshTeam, setSuccessMessage, setError }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleConfig, setRoleConfig] = useState({
    level_1_name: team.role_config?.level_1_name || 'Master Guide',
    level_2_name: team.role_config?.level_2_name || 'Tactical Guide',
    level_3_name: team.role_config?.level_3_name || 'Technical Guide',
    level_4_name: team.role_config?.level_4_name || 'Base Guide'
  });
  const [roleNameErrors, setRoleNameErrors] = useState({
    level_1_name: '',
    level_2_name: '',
    level_3_name: '',
    level_4_name: ''
  });
  const [roleNameWarnings, setRoleNameWarnings] = useState([]);
  const [teamStatus, setTeamStatus] = useState(team.team_status || 'active');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [changeHistory, setChangeHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Only master guide can access settings
  const isMasterGuide = team?.user_role_level === 1;
  // Tactical guides can view but not edit
  const isTacticalGuide = team?.user_role_level === 2;

  // Fetch change history
  useEffect(() => {
    const fetchChangeHistory = async () => {
      try {
        // This would be an actual API call in production
        // For now, we'll use mock data
        const mockHistory = [
          {
            id: 1,
            user_name: 'John Doe',
            change_date: '2025-04-20T14:30:00Z',
            setting_changed: 'Role Names',
            old_value: 'Trail Leader',
            new_value: 'Technical Guide',
            user_role: 'Master Guide'
          },
          {
            id: 2,
            user_name: 'Jane Smith',
            change_date: '2025-04-18T09:15:00Z',
            setting_changed: 'Team Status',
            old_value: 'inactive',
            new_value: 'active',
            user_role: 'Master Guide'
          }
        ];
        setChangeHistory(mockHistory);
      } catch (error) {
        console.error('Error fetching change history:', error);
      }
    };

    if (showHistory) {
      fetchChangeHistory();
    }
  }, [showHistory]);

  // Validate role names for similarity
  useEffect(() => {
    const warnings = [];
    const roleNames = [
      roleConfig.level_1_name.toLowerCase(),
      roleConfig.level_2_name.toLowerCase(),
      roleConfig.level_3_name.toLowerCase(),
      roleConfig.level_4_name.toLowerCase()
    ];

    // Check for very similar names (simple check for now)
    for (let i = 0; i < roleNames.length; i++) {
      for (let j = i + 1; j < roleNames.length; j++) {
        if (roleNames[i] === roleNames[j]) {
          warnings.push(`Role names for Level ${i + 1} and Level ${j + 1} are identical.`);
        } else if (roleNames[i].includes(roleNames[j]) || roleNames[j].includes(roleNames[i])) {
          warnings.push(`Role names for Level ${i + 1} and Level ${j + 1} are very similar.`);
        }
      }
    }

    setRoleNameWarnings(warnings);
  }, [roleConfig]);

  if (!isMasterGuide && !isTacticalGuide) {
    return (
      <div className="alert alert-warning">
        <h5>Access Restricted</h5>
        <p className="mb-0">Only the Master Guide can access team settings.</p>
      </div>
    );
  }

  // View-only mode for Tactical Guides
  const isViewOnly = isTacticalGuide;

  // Handle role name changes
  const handleRoleNameChange = (level, value) => {
    setRoleConfig({
      ...roleConfig,
      [`level_${level}_name`]: value
    });
    
    validateRoleName(level, value);
  };
  
  // Validate role name
  const validateRoleName = (level, value) => {
    const errors = { ...roleNameErrors };
    
    if (!value.trim()) {
      errors[`level_${level}_name`] = 'Role name cannot be empty';
    } else if (value.length < MIN_ROLE_NAME_LENGTH) {
      errors[`level_${level}_name`] = `Role name must be at least ${MIN_ROLE_NAME_LENGTH} characters`;
    } else if (value.length > MAX_ROLE_NAME_LENGTH) {
      errors[`level_${level}_name`] = `Role name cannot exceed ${MAX_ROLE_NAME_LENGTH} characters`;
    } else {
      errors[`level_${level}_name`] = '';
    }
    
    setRoleNameErrors(errors);
  };
  
  // Check if form is valid
  const isFormValid = () => {
    // Check for any validation errors
    const hasErrors = Object.values(roleNameErrors).some(error => error !== '');
    // Check if all role names are filled
    const allFilled = Object.values(roleConfig).every(name => name.trim() !== '');
    
    return !hasErrors && allFilled;
  };

  // Update role configurations
  const handleUpdateRoleConfig = async () => {
    if (!isFormValid()) {
      setError('Please fix the validation errors before saving.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await api.put(`/api/teams/${team.team_id}/role-config`, roleConfig);
      
      // Clear any existing errors
      setError(null);
      
      // Show success message with icon
      setSuccessMessage(
        <>
          <i className="bi bi-check-circle-fill text-success me-2"></i>
          Team role configuration updated successfully!
        </>
      );
      
      refreshTeam();
    } catch (error) {
      console.error('Error updating role configuration:', error);
      setError(
        <>
          <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
          {error.response?.data?.error || 'Failed to update role configuration'}
        </>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update team status
  const handleUpdateTeamStatus = async (status) => {
    try {
      setIsSubmitting(true);
      
      await api.put(`/api/teams/${team.team_id}`, {
        team_status: status
      });
      
      setSuccessMessage(
        <>
          <i className="bi bi-check-circle-fill text-success me-2"></i>
          Team {status === 'active' ? 'activated' : 'deactivated'} successfully!
        </>
      );
      
      setTeamStatus(status);
      setShowDeactivateModal(false);
      refreshTeam();
    } catch (error) {
      console.error('Error updating team status:', error);
      setError(
        <>
          <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
          {error.response?.data?.error || 'Failed to update team status'}
        </>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete team (soft delete)
  const handleDeleteTeam = async () => {
    try {
      setIsSubmitting(true);
      
      await api.delete(`/api/teams/${team.team_id}`);
      
      setSuccessMessage(
        <>
          <i className="bi bi-check-circle-fill text-success me-2"></i>
          Team deleted successfully!
        </>
      );
      
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error deleting team:', error);
      setError(
        <>
          <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
          {error.response?.data?.error || 'Failed to delete team'}
        </>
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="team-settings-tab">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Team Settings</h3>
        {isViewOnly && (
          <div className="badge bg-info px-3 py-2">
            <i className="bi bi-eye me-2"></i>
            View Only Mode
          </div>
        )}
      </div>
      
      {/* Team Role Names Section */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Role Names</h5>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setShowHistory(!showHistory)}
          >
            <i className="bi bi-clock-history me-1"></i>
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>
        <div className="card-body">
          {showHistory && (
            <div className="mb-4">
              <h6 className="mb-3">Change History</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Changed By</th>
                      <th>Date</th>
                      <th>Setting</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changeHistory.length > 0 ? (
                      changeHistory.map(entry => (
                        <tr key={entry.id}>
                          <td>{entry.user_name} <small>({entry.user_role})</small></td>
                          <td>{new Date(entry.change_date).toLocaleString()}</td>
                          <td>{entry.setting_changed}</td>
                          <td>{entry.old_value}</td>
                          <td>{entry.new_value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">No change history available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <p className="text-muted mb-3">
            Customize the names of guide roles for your team. These names will be displayed throughout the platform.
          </p>
          
          {roleNameWarnings.length > 0 && (
            <div className="alert alert-warning mb-3">
              <h6 className="alert-heading">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Warning
              </h6>
              <ul className="mb-0">
                {roleNameWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mb-3">
            <label htmlFor="level1Name" className="form-label">Level 1 (Master Guide)</label>
            <input
              type="text"
              className={`form-control ${roleNameErrors.level_1_name ? 'is-invalid' : ''}`}
              id="level1Name"
              value={roleConfig.level_1_name}
              onChange={(e) => handleRoleNameChange(1, e.target.value)}
              placeholder="Master Guide"
              disabled={isViewOnly}
              maxLength={MAX_ROLE_NAME_LENGTH}
            />
            {roleNameErrors.level_1_name && (
              <div className="invalid-feedback">
                {roleNameErrors.level_1_name}
              </div>
            )}
            <div className="form-text d-flex justify-content-between">
              <span>The team owner and highest authority level.</span>
              <span className={roleConfig.level_1_name.length > MAX_ROLE_NAME_LENGTH - 10 ? 'text-danger' : ''}>
                {roleConfig.level_1_name.length}/{MAX_ROLE_NAME_LENGTH}
              </span>
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="level2Name" className="form-label">Level 2 (Tactical Guide)</label>
            <input
              type="text"
              className={`form-control ${roleNameErrors.level_2_name ? 'is-invalid' : ''}`}
              id="level2Name"
              value={roleConfig.level_2_name}
              onChange={(e) => handleRoleNameChange(2, e.target.value)}
              placeholder="Tactical Guide"
              disabled={isViewOnly}
              maxLength={MAX_ROLE_NAME_LENGTH}
            />
            {roleNameErrors.level_2_name && (
              <div className="invalid-feedback">
                {roleNameErrors.level_2_name}
              </div>
            )}
            <div className="form-text d-flex justify-content-between">
              <span>Can help manage the team and create activities/expeditions.</span>
              <span className={roleConfig.level_2_name.length > MAX_ROLE_NAME_LENGTH - 10 ? 'text-danger' : ''}>
                {roleConfig.level_2_name.length}/{MAX_ROLE_NAME_LENGTH}
              </span>
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="level3Name" className="form-label">Level 3 (Technical Guide)</label>
            <input
              type="text"
              className={`form-control ${roleNameErrors.level_3_name ? 'is-invalid' : ''}`}
              id="level3Name"
              value={roleConfig.level_3_name}
              onChange={(e) => handleRoleNameChange(3, e.target.value)}
              placeholder="Technical Guide"
              disabled={isViewOnly}
              maxLength={MAX_ROLE_NAME_LENGTH}
            />
            {roleNameErrors.level_3_name && (
              <div className="invalid-feedback">
                {roleNameErrors.level_3_name}
              </div>
            )}
            <div className="form-text d-flex justify-content-between">
              <span>Can create and lead activities.</span>
              <span className={roleConfig.level_3_name.length > MAX_ROLE_NAME_LENGTH - 10 ? 'text-danger' : ''}>
                {roleConfig.level_3_name.length}/{MAX_ROLE_NAME_LENGTH}
              </span>
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="level4Name" className="form-label">Level 4 (Base Guide)</label>
            <input
              type="text"
              className={`form-control ${roleNameErrors.level_4_name ? 'is-invalid' : ''}`}
              id="level4Name"
              value={roleConfig.level_4_name}
              onChange={(e) => handleRoleNameChange(4, e.target.value)}
              placeholder="Base Guide"
              disabled={isViewOnly}
              maxLength={MAX_ROLE_NAME_LENGTH}
            />
            {roleNameErrors.level_4_name && (
              <div className="invalid-feedback">
                {roleNameErrors.level_4_name}
              </div>
            )}
            <div className="form-text d-flex justify-content-between">
              <span>Basic guide with limited permissions.</span>
              <span className={roleConfig.level_4_name.length > MAX_ROLE_NAME_LENGTH - 10 ? 'text-danger' : ''}>
                {roleConfig.level_4_name.length}/{MAX_ROLE_NAME_LENGTH}
              </span>
            </div>
          </div>
          
          {!isViewOnly && (
            <button
              className="btn btn-primary"
              onClick={handleUpdateRoleConfig}
              disabled={isSubmitting || !isFormValid()}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2"></i>
                  Save Role Names
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Team Status Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Team Status</h5>
        </div>
        <div className="card-body">
          <p className="mb-3">
            Current Status: 
            <span className={`badge ms-2 ${teamStatus === 'active' ? 'bg-success' : 'bg-danger'}`}>
              <i className={`bi bi-${teamStatus === 'active' ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
              {teamStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
          </p>
          
          <p className="text-muted">
            {teamStatus === 'active' 
              ? 'Your team is currently active. Team members can view and join activities and expeditions.'
              : 'Your team is currently inactive. Activities and expeditions will not be visible to explorers.'}
          </p>
          
          {!isViewOnly && (
            teamStatus === 'active' ? (
              <button
                className="btn btn-warning"
                onClick={() => setShowDeactivateModal(true)}
              >
                <i className="bi bi-pause-circle me-2"></i>
                Deactivate Team
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={() => handleUpdateTeamStatus('active')}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Activating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-circle me-2"></i>
                    Activate Team
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
      
      {/* Danger Zone Section - Only for Master Guide */}
      {isMasterGuide && (
        <div className="card border-danger">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Danger Zone
            </h5>
          </div>
          <div className="card-body">
            <p className="text-danger fw-bold">Warning: These actions cannot be undone!</p>
            
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6>Delete Team</h6>
                <p className="text-muted mb-0">
                  Permanently delete this team and all associated data. All activities and expeditions will be removed.
                </p>
              </div>
              <button
                className="btn btn-outline-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="bi bi-trash3 me-2"></i>
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Deactivate Team Modal */}
      {showDeactivateModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pause-circle me-2"></i>
                  Deactivate Team
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeactivateModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Are you sure you want to deactivate your team?
                </div>
                <p>While deactivated:</p>
                <ul>
                  <li>Your team's activities and expeditions will be hidden from explorers</li>
                  <li>Team members will still have access to the team dashboard</li>
                  <li>You can reactivate the team at any time</li>
                </ul>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowDeactivateModal(false)}
                  disabled={isSubmitting}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning"
                  onClick={() => handleUpdateTeamStatus('inactive')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-pause-circle me-2"></i>
                      Deactivate Team
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Team Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-trash3 me-2"></i>
                  Delete Team
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConfirmDelete('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <h6>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Warning: This action cannot be undone!
                  </h6>
                  <p className="mb-0">
                    Deleting your team will permanently remove all associated data, including:
                  </p>
                </div>
                <ul>
                  <li>All team activities and expeditions</li>
                  <li>All member associations</li>
                  <li>All reservations and bookings</li>
                </ul>
                <p>
                  To confirm, please type <strong>{team.team_name}</strong> in the field below:
                </p>
                <input
                  type="text"
                  className={`form-control ${confirmDelete === team.team_name ? 'is-valid' : 'is-invalid'}`}
                  placeholder={`Type "${team.team_name}" to confirm`}
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                />
                {confirmDelete !== team.team_name && confirmDelete !== '' && (
                  <div className="invalid-feedback d-block">
                    Text does not match team name exactly.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConfirmDelete('');
                  }}
                  disabled={isSubmitting}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleDeleteTeam}
                  disabled={isSubmitting || confirmDelete !== team.team_name}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash3 me-2"></i>
                      Delete Team Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSettingsTab;